import type { IUser } from "../models/user.model.js";
import User from "../models/user.model.js";
import { canManageAccounts, isSuperAdmin } from "./role-hierarchy.utils.js";

/**
 * Whether `user` is allowed to view/export a campaign.
 *
 *  - super admin: every campaign in the system
 *  - any user: campaigns they own (present in their `allCampaign`)
 *  - admin / reseller: campaigns created by their direct downline
 *    (`allReseller` + `allUsers`), matching the All-Campaigns listing scope
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
    const directChildren = [...user.allReseller, ...user.allUsers].map((id) =>
      id.toString()
    );
    if (directChildren.includes(campaignCreatedBy.toString())) return true;
  }

  return false;
}
