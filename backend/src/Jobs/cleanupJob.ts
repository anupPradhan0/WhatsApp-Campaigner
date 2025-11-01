import schedule from "node-schedule";
import Campaign from "../Models/Campaign.model.js";
import Transaction from "../Models/transaction.Model.js";
import Complaint from "../Models/complaints.Model.js";
import User, { UserRole } from "../Models/user.Model.js";
import { v2 as cloudinary } from "cloudinary";

// 🧩 Helper: Delete Cloudinary Image
const deleteCloudinaryImage = async (imageUrl: string): Promise<void> => {
  try {
    if (!imageUrl || !imageUrl.includes("cloudinary")) return;

    const urlParts = imageUrl.split("/");
    const filename = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const publicId = `${folder}/${filename.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting Cloudinary image:", error);
  }
};

// 🧹 Main Cleanup Job
export const startCleanupJob = (): void => {
  // Run every day at 2 AM
  schedule.scheduleJob("0 2 * * *", async () => {
    console.log("Starting automatic cleanup job...");

    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // ✅ Find all non-admin users created more than 3 months ago
      const users = await User.find({
        role: { $in: [UserRole.USER, UserRole.RESELLER] },
        createdAt: { $lt: threeMonthsAgo },
      });

      const stats = {
        campaignsDeleted: 0,
        transactionsDeleted: 0,
        complaintsDeleted: 0,
        cloudinaryDeleted: 0,
      };

      for (const user of users) {
        // -----------------------------
        // 🧩 Delete Old Campaigns
        // -----------------------------
        const oldCampaigns = await Campaign.find({
          _id: { $in: user.allCampaign },
          createdAt: { $lt: threeMonthsAgo },
        });

        for (const campaign of oldCampaigns) {
          if (campaign.media) {
            await deleteCloudinaryImage(campaign.media);
            stats.cloudinaryDeleted++;
          }
        }

        const campaignDeleteResult = await Campaign.deleteMany({
          _id: { $in: user.allCampaign },
          createdAt: { $lt: threeMonthsAgo },
        });
        stats.campaignsDeleted += campaignDeleteResult.deletedCount || 0;

        // -----------------------------
        // 💳 Delete Old Transactions
        // -----------------------------
        const transDeleteResult = await Transaction.deleteMany({
          _id: { $in: user.allTransaction },
          createdAt: { $lt: threeMonthsAgo },
        });
        stats.transactionsDeleted += transDeleteResult.deletedCount || 0;

        // -----------------------------
        // 📞 Delete Old Complaints
        // -----------------------------
        const complaintDeleteResult = await Complaint.deleteMany({
          _id: { $in: user.allComplaint },
          createdAt: { $lt: threeMonthsAgo },
        });
        stats.complaintsDeleted += complaintDeleteResult.deletedCount || 0;

        // -----------------------------
        // 🧾 Clean up user's arrays
        // -----------------------------
        await User.updateOne(
          { _id: user._id },
          {
            $pull: {
              allCampaign: { $in: oldCampaigns.map((c) => c._id) },
              allTransaction: {
                $in: user.allTransaction,
              },
              allComplaint: {
                $in: user.allComplaint,
              },
            },
          }
        );
      }

      console.log("Cleanup completed successfully:", stats);
    } catch (error) {
      console.error("Cleanup job error:", error);
    }
  });

  console.log("Cleanup job scheduled for 2 AM daily");
};
