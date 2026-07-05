import mongoose from "mongoose";
import type { IUser } from "../models/user.model.js";
import User from "../models/user.model.js";
import { canManageAccounts, isSuperAdmin } from "./role-hierarchy.utils.js";
import { collectDownlineIds } from "./downline.utils.js";

/**
 * Whether `user` is allowed to view/act on a campaign.
 *
 *  - super admin: every campaign in the system
 *  - any user: campaigns they own (present in their `allCampaign`)
 *  - admin / reseller: campaigns created anywhere in their downline — not just
 *    direct children, but a reseller's users, sub-resellers, and so on (matching
 *    the All-Campaigns listing scope)
 */
export async function userCanViewCampaign(
  user: IUser,
  campaignId: string,
  campaignCreatedBy: { toString(): string }
): Promise<boolean> {
  if (isSuperAdmin(user.role)) return true;

  const currentUser = await User.findById(user._id)
    .select("allCampaign")
    .lean();
  const owns = currentUser?.allCampaign?.some(
    (cId) => cId.toString() === campaignId
  );
  if (owns) return true;

  if (canManageAccounts(user.role)) {
    const downline = await collectDownlineIds(
      new mongoose.Types.ObjectId(user._id)
    );
    const target = campaignCreatedBy.toString();
    if (downline.some((id) => id.toString() === target)) return true;
  }

  return false;
}
