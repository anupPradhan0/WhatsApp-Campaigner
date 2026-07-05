import mongoose from "mongoose";
import User from "../models/user.model.js";

/**
 * Collect the full transitive downline of a manager — every descendant account
 * (their resellers, those resellers' users, sub-resellers, and so on), not just
 * direct children. Used so an admin can see/act on anything beneath them,
 * including a reseller's users. Excludes the manager themselves.
 */
export async function collectDownlineIds(
  rootId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> {
  const seen = new Set<string>();
  const result: mongoose.Types.ObjectId[] = [];
  let frontier: mongoose.Types.ObjectId[] = [rootId];

  while (frontier.length > 0) {
    const docs = await User.find({ _id: { $in: frontier } })
      .select("allAdmin allReseller allUsers")
      .lean();
    const next: mongoose.Types.ObjectId[] = [];
    for (const doc of docs) {
      const children = [
        ...(doc.allAdmin ?? []),
        ...(doc.allReseller ?? []),
        ...(doc.allUsers ?? []),
      ] as mongoose.Types.ObjectId[];
      for (const childId of children) {
        const key = childId.toString();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(childId);
          next.push(childId);
        }
      }
    }
    frontier = next;
  }
  return result;
}
