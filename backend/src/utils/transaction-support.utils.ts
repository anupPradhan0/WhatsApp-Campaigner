import mongoose from "mongoose";

/**
 * MongoDB multi-document transactions require a replica set (or a sharded
 * cluster). On a standalone `mongod` any write inside a session that has
 * `startTransaction()` active throws:
 *   "Transaction numbers are only allowed on a replica set member or mongos".
 *
 * That silently broke every credit/debit and campaign send on standalone
 * deployments. We detect support once (cached) so callers can fall back to
 * running the same operations WITHOUT a session — losing cross-document
 * atomicity, but keeping the feature working. Each balance change is still a
 * single guarded atomic `$inc`, so the worst case is a ledger row that doesn't
 * perfectly line up with a balance update — not a lost or negative balance.
 */
let transactionSupport: boolean | null = null;

export async function supportsTransactions(): Promise<boolean> {
  if (transactionSupport !== null) return transactionSupport;
  try {
    const db = mongoose.connection.db;
    if (!db) return false; // not connected yet — don't cache
    const info = await db.admin().command({ hello: 1 });
    transactionSupport = Boolean(info.setName) || info.msg === "isdbgrid";
  } catch {
    transactionSupport = false;
  }
  return transactionSupport;
}

/** Test-only: reset the cached detection result. */
export function __resetTransactionSupportCache(): void {
  transactionSupport = null;
}
