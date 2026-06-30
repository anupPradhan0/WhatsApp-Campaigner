import mongoose, { type ClientSession } from "mongoose";
import type { IUser } from "../models/user.model.js";
import type { ITransaction } from "../models/transaction.model.js";
import {
  findUserById,
  adjustUserBalance,
  updateOneUser,
} from "../repositories/user.repository.js";
import {
  createTransactions,
  createTransaction,
} from "../repositories/transaction.repository.js";
import {
  canManageAccounts,
  isSuperAdmin,
} from "../utils/role-hierarchy.utils.js";

/**
 * Admins and resellers may only move credits to/from accounts in their own
 * downline (the users and sub-resellers they created). Only the super admin is
 * unrestricted. Without this check any manager could credit or drain any
 * account by id.
 */
function managesAccount(
  sender: IUser,
  targetId: mongoose.Types.ObjectId
): boolean {
  const inUsers = sender.allUsers?.some((id) => id.equals(targetId)) ?? false;
  const inResellers =
    sender.allReseller?.some((id) => id.equals(targetId)) ?? false;
  return inUsers || inResellers;
}

export interface CreditBalanceResult {
  sender: IUser;
  receiver: IUser;
  debitTransaction: ITransaction;
  creditTransaction: ITransaction;
}

export interface DebitBalanceResult {
  sender: IUser;
  receiver: IUser;
  creditTransaction: ITransaction;
  debitTransaction: ITransaction;
}

export async function creditBalanceService(
  senderId: string,
  receiverId: string,
  amount: number
): Promise<CreditBalanceResult> {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const sender = await findUserById(senderId, { session });
    const receiver = await findUserById(receiverId, { session });

    if (!sender) {
      throw new Error("Sender not found");
    }

    if (!receiver) {
      throw new Error("Receiver not found");
    }

    if (!canManageAccounts(sender.role)) {
      throw new Error("Only admin or reseller can credit balance");
    }

    if (
      !isSuperAdmin(sender.role) &&
      !managesAccount(sender, receiver._id)
    ) {
      throw new Error("You can only credit accounts that you manage");
    }

    let senderBalanceBefore = sender.balance;
    let senderBalanceAfter = sender.balance;

    // Admins and resellers fund the credit from their own balance (atomically,
    // guarded so it cannot go negative). Only the super admin mints brand-new
    // credits without debiting anyone.
    if (!isSuperAdmin(sender.role)) {
      const updatedSender = await adjustUserBalance(sender._id, -amount, {
        minBalance: amount,
        session,
      });
      if (!updatedSender) {
        throw new Error("Insufficient balance");
      }
      senderBalanceAfter = updatedSender.balance;
      senderBalanceBefore = senderBalanceAfter + amount;
      sender.balance = senderBalanceAfter;
    }

    const updatedReceiver = await adjustUserBalance(receiver._id, amount, {
      session,
    });
    if (!updatedReceiver) {
      throw new Error("Receiver not found");
    }
    const receiverBalanceBefore = updatedReceiver.balance - amount;
    const receiverBalanceAfter = updatedReceiver.balance;
    receiver.balance = receiverBalanceAfter;

    const debitTransactionDoc = await createTransactions(
      [
        {
          senderId: sender._id,
          receiverId: receiver._id,
          type: "debit",
          amount,
          balanceBefore: senderBalanceBefore,
          balanceAfter: senderBalanceAfter,
          status: "success",
        },
      ],
      session
    );

    const creditTransactionDoc = await createTransactions(
      [
        {
          senderId: sender._id,
          receiverId: receiver._id,
          type: "credit",
          amount,
          balanceBefore: receiverBalanceBefore,
          balanceAfter: receiverBalanceAfter,
          status: "success",
        },
      ],
      session
    );

    const debitTransaction = debitTransactionDoc[0];
    const creditTransaction = creditTransactionDoc[0];

    // Link the transactions atomically — never re-save the whole user document,
    // which would clobber the atomic balance updates above with a stale value.
    await updateOneUser(
      { _id: sender._id },
      { $push: { allTransaction: debitTransaction._id } },
      { session }
    );
    await updateOneUser(
      { _id: receiver._id },
      { $push: { allTransaction: creditTransaction._id } },
      { session }
    );

    await session.commitTransaction();

    return {
      sender,
      receiver,
      debitTransaction,
      creditTransaction,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function debitBalanceService(
  senderId: string,
  receiverId: string,
  amount: number
): Promise<DebitBalanceResult> {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const sender = await findUserById(senderId, { session });
    const receiver = await findUserById(receiverId, { session });

    if (!sender) {
      throw new Error("Sender not found");
    }

    if (!receiver) {
      throw new Error("Receiver not found");
    }

    if (!canManageAccounts(sender.role)) {
      throw new Error("Only admin or reseller can debit balance");
    }

    if (
      !isSuperAdmin(sender.role) &&
      !managesAccount(sender, receiver._id)
    ) {
      throw new Error("You can only debit accounts that you manage");
    }

    // Remove credits from the receiver atomically, guarded so the balance
    // cannot go negative under concurrent debits.
    const updatedReceiver = await adjustUserBalance(receiver._id, -amount, {
      minBalance: amount,
      session,
    });
    if (!updatedReceiver) {
      throw new Error("Insufficient balance in receiver account");
    }
    const receiverBalanceBefore = updatedReceiver.balance + amount;
    const receiverBalanceAfter = updatedReceiver.balance;
    receiver.balance = receiverBalanceAfter;

    let senderBalanceBefore = sender.balance;
    let senderBalanceAfter = sender.balance;

    // Admins and resellers reclaim the debited credits into their own balance.
    // The super admin simply burns them (no sender balance to return to).
    if (!isSuperAdmin(sender.role)) {
      const updatedSender = await adjustUserBalance(sender._id, amount, {
        session,
      });
      if (!updatedSender) {
        throw new Error("Sender not found");
      }
      senderBalanceAfter = updatedSender.balance;
      senderBalanceBefore = senderBalanceAfter - amount;
      sender.balance = senderBalanceAfter;
    }

    const creditTransactionDoc = await createTransactions(
      [
        {
          senderId: receiver._id,
          receiverId: sender._id,
          type: "credit",
          amount,
          balanceBefore: senderBalanceBefore,
          balanceAfter: senderBalanceAfter,
          status: "success",
        },
      ],
      session
    );

    const debitTransactionDoc = await createTransactions(
      [
        {
          senderId: sender._id,
          receiverId: receiver._id,
          type: "debit",
          amount,
          balanceBefore: receiverBalanceBefore,
          balanceAfter: receiverBalanceAfter,
          status: "success",
        },
      ],
      session
    );

    const creditTransaction = creditTransactionDoc[0];
    const debitTransaction = debitTransactionDoc[0];

    // Link the transactions atomically; do not re-save the user documents,
    // which would clobber the atomic balance updates above.
    await updateOneUser(
      { _id: sender._id },
      { $push: { allTransaction: creditTransaction._id } },
      { session }
    );
    await updateOneUser(
      { _id: receiver._id },
      { $push: { allTransaction: debitTransaction._id } },
      { session }
    );

    await session.commitTransaction();

    return {
      sender,
      receiver,
      creditTransaction,
      debitTransaction,
    };
  } catch (error) {
    await session.abortTransaction();

    try {
      await createTransaction({
        senderId: new mongoose.Types.ObjectId(senderId),
        receiverId: new mongoose.Types.ObjectId(receiverId),
        type: "debit",
        amount,
        balanceBefore: 0,
        balanceAfter: 0,
        status: "failed",
      });
    } catch (logError) {
      console.error("Failed to log transaction:", logError);
    }

    throw error;
  } finally {
    await session.endSession();
  }
}
