/**
 * One-off operational script: promote an existing account to super_admin.
 *
 * Needed for databases created before the super_admin tier existed: the
 * bootstrap flow only provisions a super admin when the DB is completely empty,
 * and no API path can ever assign the super_admin role. Run this once to crown
 * an existing account.
 *
 * Usage:
 *   pnpm tsx src/scripts/promote-super-admin.ts <email>
 */
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import User, { UserRole } from "../models/user.model.js";

async function main(): Promise<void> {
  const email = process.argv[2]?.toLowerCase().trim();
  if (!email) {
    console.error("Usage: tsx src/scripts/promote-super-admin.ts <email>");
    process.exit(1);
  }

  await connectDatabase();

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No account found with email "${email}".`);
    await mongoose.disconnect();
    process.exit(1);
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    console.log(`"${email}" is already a super admin. Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const previousRole = user.role;
  user.role = UserRole.SUPER_ADMIN;
  await user.save();

  console.log(
    `Promoted "${email}" from ${previousRole} to super_admin (id: ${user._id.toString()}).`
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Failed to promote super admin:", err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
