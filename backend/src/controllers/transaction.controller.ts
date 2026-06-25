import type { Request, Response, NextFunction } from "express";
import {
  creditBalanceService,
  debitBalanceService,
} from "../services/transaction.service.js";
import type {
  CreditBalanceBody,
  DebitBalanceBody,
} from "../validation/transaction.schemas.js";

export async function creditBalance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as CreditBalanceBody;
    const senderId = req.user?._id;

    if (!senderId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const result = await creditBalanceService(
      senderId.toString(),
      body.receiverId,
      body.amount
    );

    res.status(200).json({
      success: true,
      message: "Balance credited successfully",
      data: {
        senderBalance: result.sender.balance,
        receiverBalance: result.receiver.balance,
        transaction: {
          id: result.creditTransaction._id,
          amount: result.creditTransaction.amount,
          type: result.creditTransaction.type,
          status: result.creditTransaction.status,
          date: result.creditTransaction.transactionDate,
        },
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        error.message === "Sender not found" ||
        error.message === "Receiver not found"
      ) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }
      if (error.message === "Insufficient balance") {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
      if (
        error.message === "Only admin or reseller can credit balance" ||
        error.message === "You can only credit accounts that you manage"
      ) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }
    next(error);
  }
}

export async function debitBalance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as DebitBalanceBody;
    const senderId = req.user?._id;

    if (!senderId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const result = await debitBalanceService(
      senderId.toString(),
      body.userId,
      body.amount
    );

    res.status(200).json({
      success: true,
      message: "Balance debited successfully",
      data: {
        senderBalance: result.sender.balance,
        receiverBalance: result.receiver.balance,
        transaction: {
          id: result.debitTransaction._id,
          amount: result.debitTransaction.amount,
          type: result.debitTransaction.type,
          status: result.debitTransaction.status,
          date: result.debitTransaction.transactionDate,
        },
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        error.message === "Sender not found" ||
        error.message === "Receiver not found"
      ) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }
      if (error.message === "Insufficient balance in receiver account") {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
      if (
        error.message === "Only admin or reseller can debit balance" ||
        error.message === "You can only debit accounts that you manage"
      ) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }
    next(error);
  }
}
