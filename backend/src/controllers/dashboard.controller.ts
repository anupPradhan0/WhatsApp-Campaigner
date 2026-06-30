import type { Request, Response } from "express";
import type { IUser } from "../models/user.model.js";
import { UserRole, UserStatus } from "../models/user.model.js";
import {
  canManageAccounts,
  isSuperAdmin,
} from "../utils/role-hierarchy.utils.js";

// Cap unbounded super-admin global listings so a very large tenant base can't
// load the entire collection into one response.
const GLOBAL_LIST_LIMIT = 1000;
import mongoose from "mongoose";
import Campaign, {
  CampaignStats,
  DeliveryStatus,
} from "../models/campaign.model.js";
import { pathParam } from "../utils/route-params.utils.js";
import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import News from "../models/news.model.js";
import Complaint from "../models/complaint.model.js";

interface SupportResponse {
  companyName: string;
  email: string;
  number: number;
  role: UserRole;
  status: string;
  image?: string;
}
interface UserDocument {
  companyName: string;
  email: string;
  number: number;
  image?: string;
  role: UserRole;
  status: string;
  createdAt: Date;
}

const businessDetails = (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        companyName: user.companyName,
        userID: user.userID,
        email: user.email,
        image: user.image,
        number: user.number,
        role: user.role,
        balance: user.balance,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Error in businessDetails controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
    });
  }
};

const dashboard = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    const userId = new mongoose.Types.ObjectId(user._id);
    const currentYear = new Date().getFullYear();

    // Super admin (God mode) sees system-wide campaign stats; everyone else is
    // scoped to the campaigns they created.
    const globalView = isSuperAdmin(user.role);
    const campaignMatch: Record<string, unknown> = globalView
      ? {}
      : { createdBy: userId };

    const totalMessagesAgg = await Campaign.aggregate([
      { $match: campaignMatch },
      { $group: { _id: null, totalMessages: { $sum: "$numberCount" } } },
    ]);
    const totalMessages = totalMessagesAgg[0]?.totalMessages || 0;

    // -------------------- Last 2 months weekly stats - FIXED --------------------
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Last 2 months

    // Get all campaigns for this user in the date range
    const allCampaigns = await Campaign.find({
      ...campaignMatch,
      createdAt: {
        $gte: twoMonthsAgo,
        $lte: now,
      },
    })
      .select("createdAt numberCount")
      .lean();

    // Helper function to get Monday of week
    const getMondayOfWeek = (date: Date) => {
      const d = new Date(date);
      const day = d.getUTCDay();
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
      d.setUTCDate(diff);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    };

    // Helper function to format week range
    const formatWeekRange = (startDate: Date) => {
      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 6);

      const startMonth = startDate.toLocaleString("en-US", { month: "short" });
      const endMonth = endDate.toLocaleString("en-US", { month: "short" });
      const startDay = startDate.getUTCDate();
      const endDay = endDate.getUTCDate();

      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}`;
      } else {
        return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
      }
    };

    // Generate all weeks
    const weeks: Array<{
      weekStart: Date;
      weekRange: string;
      startDate: Date;
      endDate: Date;
    }> = [];

    let currentMonday = getMondayOfWeek(twoMonthsAgo);

    while (currentMonday <= now) {
      const weekEnd = new Date(currentMonday);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      weekEnd.setUTCHours(23, 59, 59, 999);

      weeks.push({
        weekStart: new Date(currentMonday),
        weekRange: formatWeekRange(new Date(currentMonday)),
        startDate: new Date(currentMonday),
        endDate: new Date(weekEnd),
      });

      currentMonday.setUTCDate(currentMonday.getUTCDate() + 7);
    }

    // Calculate weekly stats by directly matching campaigns to weeks
    const weeklyStatsWithRange = weeks.map((week) => {
      let totalCampaigns = 0;
      let totalMessages = 0;

      allCampaigns.forEach((campaign) => {
        const campaignDate = new Date(campaign.createdAt);
        if (campaignDate >= week.startDate && campaignDate <= week.endDate) {
          totalCampaigns += 1;
          totalMessages += campaign.numberCount || 0;
        }
      });

      return {
        weekRange: week.weekRange,
        totalCampaigns: totalCampaigns,
        totalMessages: totalMessages,
      };
    });

    // -------------------- Top 5 campaigns in the current year --------------------
    const topFiveCampaigns = await Campaign.find({
      ...campaignMatch,
      createdAt: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
      },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("campaignName numberCount createdAt status")
      .lean();

    // ✅ LATEST NEWS
    let latestNews = await News.findOne({
      status: { $regex: /^active$/i },
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "companyName")
      .select("title description status createdAt createdBy")
      .lean();

    if (!latestNews) {
      latestNews = await News.findOne({})
        .sort({ createdAt: -1 })
        .populate("createdBy", "companyName")
        .select("title description status createdAt createdBy")
        .lean();
    }

    const formattedLatestNews = latestNews
      ? {
          title: latestNews.title,
          description: latestNews.description,
          status: latestNews.status,
          createdAt: latestNews.createdAt,
        }
      : null;

    // For the super admin the downline counts are system-wide totals; for
    // everyone else they come straight off their own account document.
    const [totalReseller, totalUsers, totalCampaigns] = globalView
      ? await Promise.all([
          User.countDocuments({ role: UserRole.RESELLER }),
          User.countDocuments({ role: UserRole.USER }),
          Campaign.countDocuments({}),
        ])
      : [user.allReseller.length, user.allUsers.length, user.totalCampaigns];

    // -------------------- Return response --------------------
    return res.status(200).json({
      success: true,
      data: {
        companyName: user.companyName,
        image: user.image,
        role: user.role,
        balance: user.balance,
        totalReseller,
        totalUsers,
        totalCampaigns,
        totalMessages: totalMessages,
        weeklyStats: weeklyStatsWithRange,
        topFiveCampaigns: topFiveCampaigns,
        latestNews: formattedLatestNews,
      },
    });
  } catch (error: unknown) {
    console.error("Error in dashboard controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred in Dashboard controller.",
    });
  }
};

const transaction = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    const userId = user._id.toString();

    const currentUser = await User.findById(userId).select(
      "balance companyName allTransaction"
    );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Super admin (God mode) sees every transaction in the system; everyone
    // else sees only the transactions linked to their own account.
    const transactionFilter = isSuperAdmin(user.role)
      ? {}
      : { _id: { $in: currentUser.allTransaction } };

    const transactions = await Transaction.find(transactionFilter)
      .sort({ transactionDate: -1 })
      .limit(100)
      .populate("senderId", "companyName")
      .populate("receiverId", "companyName")
      .populate("campaignId", "campaignName")
      .lean();

    const formattedTransactions = transactions.map((transaction: any) => {
      const transactionType = transaction.type;

      let userOrCampaign = "";
      let createdBy = "";
      let displayType = "";

      if (transactionType === "credit") {
        displayType = "credit";
        userOrCampaign = transaction.senderId?.companyName || "Unknown";
        createdBy = transaction.receiverId?.companyName || "Unknown";
      } else if (transactionType === "debit") {
        displayType = "debit";

        if (transaction.campaignId) {
          userOrCampaign = transaction.campaignId.campaignName || "Campaign";
          createdBy = currentUser.companyName;
        } else {
          const senderId = transaction.senderId?._id?.toString();

          if (senderId === userId) {
            userOrCampaign = transaction.receiverId?.companyName || "Unknown";
            createdBy = currentUser.companyName;
          } else {
            userOrCampaign = transaction.senderId?.companyName || "System";
            createdBy = transaction.receiverId?.companyName || "System";
          }
        }
      }

      return {
        transactionId: transaction._id,
        userOrCampaign,
        amount: transaction.amount,
        type: displayType,
        createdBy,
        createdAt: transaction.transactionDate,
        status: transaction.status,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        currentBalance: currentUser.balance,
        totalTransactions: formattedTransactions.length,
        transactions: formattedTransactions,
      },
    });
  } catch (error: unknown) {
    console.error("Error in transaction controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred in transaction controller.",
    });
  }
};

const news = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    // Fetch last 50 news items (both ACTIVE and INACTIVE)
    const allNews = await News.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("createdBy", "companyName")
      .lean();

    // Format news for frontend
    const formattedNews = allNews.map((newsItem: any) => ({
      id: newsItem._id,
      title: newsItem.title,
      description: newsItem.description,
      status: newsItem.status,
      createdBy: newsItem.createdBy?.companyName || "Unknown",
      createdAt: newsItem.createdAt,
      updatedAt: newsItem.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      message: "News fetched successfully.",
      data: {
        totalNews: formattedNews.length,
        news: formattedNews,
      },
    });
  } catch (error) {
    console.error("Error in news controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred in news controller.",
    });
  }
};

const complaints = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    const userId = user._id;
    const userRole = user.role;

    // Scope complaints by role so users cannot read each other's tickets:
    // - Super admin: every complaint in the system (global, no restriction)
    // - Admin / Reseller: their own plus complaints raised by accounts they manage
    // - User: only their own
    let queryFilter: Record<string, unknown>;
    if (isSuperAdmin(userRole)) {
      queryFilter = {};
    } else if (
      userRole === UserRole.ADMIN ||
      userRole === UserRole.RESELLER
    ) {
      const downlineIds = [
        userId,
        ...(user.allUsers ?? []),
        ...(user.allReseller ?? []),
      ];
      queryFilter = { createdBy: { $in: downlineIds } };
    } else {
      queryFilter = { createdBy: userId };
    }

    // Fetch complaints
    const allComplaints = await Complaint.find(queryFilter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("createdBy", "companyName")
      .populate("resolvedBy", "companyName")
      .lean();

    // Format complaints for frontend
    const formattedComplaints = allComplaints.map((complaint: any) => ({
      complaintId: complaint._id,
      subject: complaint.subject,
      description: complaint.description,
      status: complaint.status,
      createdBy: complaint.createdBy?.companyName || "Unknown User",
      createdAt: complaint.createdAt,
      adminResponse: complaint.adminResponse || null,
      resolvedBy: complaint.resolvedBy?.companyName || null,
      resolvedAt: complaint.resolvedAt || null,
      updatedAt: complaint.updatedAt,
    }));

    // Calculate status breakdown
    const statusBreakdown = {
      pending: formattedComplaints.filter((c) => c.status === "pending").length,
      inProgress: formattedComplaints.filter((c) => c.status === "in-progress")
        .length,
      resolved: formattedComplaints.filter((c) => c.status === "resolved")
        .length,
      closed: formattedComplaints.filter((c) => c.status === "closed").length,
    };

    return res.status(200).json({
      success: true,
      message: "Complaints fetched successfully.",
      data: {
        totalComplaints: formattedComplaints.length,
        statusBreakdown,
        complaints: formattedComplaints,
      },
    });
  } catch (error: unknown) {
    console.error("Error in complaints controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred in complaints controller.",
    });
  }
};

const manageReseller = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    const userId = user._id;
    const userRole = user.role;

    // Only account managers (super_admin / admin / reseller) may list resellers.
    if (!canManageAccounts(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Only admin and reseller can access this section.",
      });
    }

    // Super admin sees every reseller in the system; admins and resellers see
    // only the resellers they personally created.
    let resellers: any[];
    if (isSuperAdmin(userRole)) {
      resellers = await User.find({
        role: UserRole.RESELLER,
        status: { $ne: UserStatus.DELETED },
      })
        .limit(GLOBAL_LIST_LIMIT)
        .lean();
    } else {
      const currentUser = await User.findById(userId)
        .populate("allReseller")
        .lean();

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      resellers = currentUser.allReseller as any[];
    }

    // Hide soft-deleted accounts from the list.
    resellers = resellers.filter(
      (r: any) => r.status !== UserStatus.DELETED
    );

    // Format reseller data
    const formattedResellers = resellers.map((reseller: any) => ({
      id: reseller._id,
      companyName: reseller.companyName,
      email: reseller.email,
      image: reseller.image,
      number: reseller.number,
      role: reseller.role,
      resellerCount: reseller.allReseller?.length || 0,
      userCount: reseller.allUsers?.length || 0,
      totalCampaigns: reseller.totalCampaigns || 0,
      balance: reseller.balance || 0,
      status: reseller.status,
      createdAt: reseller.createdAt,
    }));

    // Sort by most recent first
    formattedResellers.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.status(200).json({
      success: true,
      message: "Resellers fetched successfully.",
      data: {
        totalResellers: formattedResellers.length,
        resellers: formattedResellers,
      },
    });
  } catch (error: unknown) {
    console.error("Error in manageReseller controller:", error);
    return res.status(500).json({
      success: false,
      message:
        "An internal server error occurred in manageReseller controller.",
    });
  }
};

const manageUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    const userId = user._id;
    const userRole = user.role;

    // Only account managers (super_admin / admin / reseller) may list users.
    if (!canManageAccounts(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Only admin and reseller can access this section.",
      });
    }

    // Super admin sees every end-user in the system; admins and resellers see
    // only the users they personally created.
    let users: any[];
    if (isSuperAdmin(userRole)) {
      users = await User.find({
        role: UserRole.USER,
        status: { $ne: UserStatus.DELETED },
      })
        .limit(GLOBAL_LIST_LIMIT)
        .lean();
    } else {
      const currentUser = await User.findById(userId)
        .populate("allUsers")
        .lean();

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      users = currentUser.allUsers as any[];
    }

    // Hide soft-deleted accounts from the list.
    users = users.filter((u: any) => u.status !== UserStatus.DELETED);

    // Format user data
    const formattedUsers = users.map((user: any) => ({
      id: user._id,
      companyName: user.companyName,
      email: user.email,
      number: user.number,
      image: user.image,
      role: user.role,
      resellerCount: user.allReseller?.length || 0,
      userCount: user.allUsers?.length || 0,
      totalCampaigns: user.totalCampaigns || 0,
      balance: user.balance || 0,
      status: user.status,
      createdAt: user.createdAt,
    }));

    // Sort by most recent first
    formattedUsers.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      data: {
        totalUsers: formattedUsers.length,
        users: formattedUsers,
      },
    });
  } catch (error: unknown) {
    console.error("Error in manageUser controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred in manageUser controller.",
    });
  }
};

// Super admin only: list every admin in the system so the top of the hierarchy
// can manage the admins it created. Admins/resellers have no admins to manage.
const manageAdmin = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    if (!isSuperAdmin(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only the super admin can access this section.",
      });
    }

    const admins = await User.find({
      role: UserRole.ADMIN,
      status: { $ne: UserStatus.DELETED },
    })
      .limit(GLOBAL_LIST_LIMIT)
      .lean();

    const formattedAdmins = admins.map((admin: any) => ({
      id: admin._id,
      companyName: admin.companyName,
      email: admin.email,
      number: admin.number,
      image: admin.image,
      role: admin.role,
      resellerCount: admin.allReseller?.length || 0,
      userCount: admin.allUsers?.length || 0,
      totalCampaigns: admin.totalCampaigns || 0,
      balance: admin.balance || 0,
      status: admin.status,
      createdAt: admin.createdAt,
    }));

    formattedAdmins.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.status(200).json({
      success: true,
      message: "Admins fetched successfully.",
      data: {
        totalAdmins: formattedAdmins.length,
        admins: formattedAdmins,
      },
    });
  } catch (error: unknown) {
    console.error("Error in manageAdmin controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred in manageAdmin controller.",
    });
  }
};

const treeView = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    const userId = user._id;

    // Recursive function to build tree (max 3 levels)
    const buildTree = async (
      userId: string,
      currentLevel: number
    ): Promise<any> => {
      // Stop at level 3
      if (currentLevel > 3) {
        return null;
      }

      // Fetch user data
      const user = await User.findById(userId)
        .select(
          "companyName email number role balance totalCampaigns status allAdmin allReseller allUsers createdAt"
        )
        .lean();

      if (!user) {
        return null;
      }

      // Get admins, resellers and users (limit each, no sorting for performance)
      const adminIds = user.allAdmin?.slice(0, 10) || [];
      const resellerIds = user.allReseller?.slice(0, 10) || [];
      const userIds = user.allUsers?.slice(0, 10) || [];

      // Build node data
      const node: any = {
        id: user._id,
        companyName: user.companyName,
        email: user.email,
        number: user.number,
        role: user.role,
        balance: user.balance,
        totalCampaigns: user.totalCampaigns,
        status: user.status,
        directResellers: user.allReseller?.length || 0,
        directUsers: user.allUsers?.length || 0,
        level: currentLevel,
        children: [],
      };

      // Only fetch children if not at max depth
      if (currentLevel < 3) {
        // Fetch admins recursively (super admin's direct children)
        for (const adminId of adminIds) {
          const adminNode = await buildTree(
            adminId.toString(),
            currentLevel + 1
          );
          if (adminNode) {
            node.children.push(adminNode);
          }
        }

        // Fetch resellers recursively
        for (const resellerId of resellerIds) {
          const resellerNode = await buildTree(
            resellerId.toString(),
            currentLevel + 1
          );
          if (resellerNode) {
            node.children.push(resellerNode);
          }
        }

        // Fetch users (users don't have children, so just add their data)
        const users = await User.find({ _id: { $in: userIds } })
          .select("companyName email number role balance totalCampaigns status")
          .limit(20)
          .lean();

        for (const childUser of users) {
          node.children.push({
            id: childUser._id,
            companyName: childUser.companyName,
            email: childUser.email,
            number: childUser.number,
            role: childUser.role,
            balance: childUser.balance,
            totalCampaigns: childUser.totalCampaigns,
            status: childUser.status,
            directResellers: 0,
            directUsers: 0,
            level: currentLevel + 1,
            children: [], // Users can't create others
          });
        }
      }

      return node;
    };

    // Calculate total count recursively
    const calculateTotal = (node: any): number => {
      if (!node) return 0;

      let count = node.children.length; // Direct children

      // Add all descendants
      for (const child of node.children) {
        count += calculateTotal(child);
      }

      return count;
    };

    // Build tree starting from logged-in user
    const tree = await buildTree(userId.toString(), 0);

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Calculate total network size
    const totalCount = calculateTotal(tree);

    return res.status(200).json({
      success: true,
      message: "Tree view fetched successfully.",
      data: {
        totalCount,
        tree,
      },
    });
  } catch (error: unknown) {
    console.error("Error in treeView controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred in treeView controller.",
    });
  }
};

const whatsAppReports = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    const userId = user._id;

    // Get current user to access their campaigns
    const currentUser = await User.findById(userId).select(
      "companyName allCampaign"
    );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Fetch all campaigns created by this user
    const campaigns = await Campaign.find({
      _id: { $in: currentUser.allCampaign },
    })
      .sort({ createdAt: -1 }) // Most recent first
      .populate("createdBy", "companyName") // Get creator's company name
      .lean();

    // Format campaigns for frontend
    const formattedCampaigns = campaigns.map((campaign: any) => ({
      campaignId: campaign._id,
      campaignName: campaign.campaignName,
      message: campaign.message,
      createdBy: campaign.createdBy?.companyName || currentUser.companyName,
      mobileNumberCount: campaign.mobileNumbers?.length || 0,
      createdAt: campaign.createdAt,
      image: campaign.media?.url || campaign.media || null,
      status: campaign.status,
      statusMessage: campaign.statusMessage,
    }));

    return res.status(200).json({
      success: true,
      message: "WhatsApp reports fetched successfully.",
      data: {
        totalCampaigns: formattedCampaigns.length,
        campaigns: formattedCampaigns,
      },
      userData: {
        companyName: user.companyName,
        email: user.email,
        number: user.number,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Error in whatsAppReports controller:", error);
    return res.status(500).json({
      success: false,
      message:
        "An internal server error occurred in whatsAppReports controller.",
    });
  }
};

const allCampaigns = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    // Check if user can manage accounts (super_admin / admin / reseller)
    if (!canManageAccounts(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Reseller privileges required.",
      });
    }

    let filter: any = {};

    // Super admin sees every campaign in the system. Admins and resellers are
    // scoped to their own direct children only.
    if (!isSuperAdmin(user.role)) {
      const directChildrenIds = [...user.allReseller, ...user.allUsers];
      filter = { createdBy: { $in: directChildrenIds } };
    }

    // Fetch latest 50 campaigns
    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("createdBy", "companyName email number role status createdAt")
      .lean();

    // Format campaigns for frontend
    const formattedCampaigns = campaigns.map((campaign: any) => ({
      campaignId: campaign._id,
      campaignName: campaign.campaignName,
      message: campaign.message,
      createdBy: campaign.createdBy?.companyName || "Unknown",
      mobileNumberCount: campaign.mobileNumbers?.length || 0,
      createdAt: campaign.createdAt,
      image: campaign.media?.url || campaign.media || null,
      status: campaign.status,
      statusMessage: campaign.statusMessage,
      userData: {
        companyName: campaign.createdBy?.companyName || "Unknown",
        email: campaign.createdBy?.email || "N/A",
        number: campaign.createdBy?.number || "N/A",
        role: campaign.createdBy?.role || "N/A",
        status: campaign.createdBy?.status || "N/A",
        createdAt: campaign.createdBy?.createdAt || null,
      },
    }));

    return res.status(200).json({
      success: true,
      message: isSuperAdmin(user.role)
        ? "All campaigns fetched successfully."
        : "Downline campaigns fetched successfully.",
      data: {
        totalCampaigns: formattedCampaigns.length,
        campaigns: formattedCampaigns,
      },
    });
  } catch (error: unknown) {
    console.error("Error in allCampaigns controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while fetching campaigns.",
    });
  }
};

const support = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    if (!user.userID) {
      return res.status(200).json({
        success: true,
        message:
          "This account has no parent organization (top-level or self-registered).",
        data: null,
      });
    }

    const creator = await User.findById(user.userID).lean<UserDocument>();

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Creator not found.",
      });
    }

    const responseData: SupportResponse = {
      companyName: creator.companyName,
      email: creator.email,
      number: creator.number,
      role: creator.role,
      status: creator.status,
      image: creator.image,
    };

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully.",
      data: responseData,
    });
  } catch (error: unknown) {
    console.error("Error in support controller:", error);

    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }

    return res.status(500).json({
      success: false,
      message: "An internal server error occurred in support controller.",
    });
  }
};

/**
 * Map a campaign-level status to a per-number status. Used as a best-effort
 * fallback for campaigns sent before per-recipient tracking existed (their
 * deliveryResults array is empty).
 */
function deriveFallbackStatus(campaignStatus?: string): DeliveryStatus {
  if (campaignStatus === CampaignStats.DELIVERED)
    return DeliveryStatus.DELIVERED;
  if (campaignStatus === CampaignStats.FAILED) return DeliveryStatus.FAILED;
  return DeliveryStatus.PENDING;
}

/** GET /api/dashboard/campaign/:campaignId — full details for one campaign. */
const campaignDetails = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    const campaignId = pathParam(req.params.campaignId);
    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID is required.",
      });
    }

    // Ownership: the campaign must belong to the requesting user.
    const currentUser = await User.findById(user._id)
      .select("allCampaign")
      .lean();
    const hasCampaign = currentUser?.allCampaign?.some(
      (cId) => cId.toString() === campaignId
    );
    if (!hasCampaign) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this campaign.",
      });
    }

    // Pull meta + per-status counts without loading the full number list.
    const [details] = await Campaign.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(campaignId) } },
      {
        $project: {
          campaignName: 1,
          message: 1,
          createdAt: 1,
          status: 1,
          statusMessage: 1,
          countryCode: 1,
          mediaType: 1,
          phoneButton: 1,
          linkButton: 1,
          createdBy: 1,
          image: { $ifNull: ["$media.url", "$media"] },
          mobileNumberCount: {
            $cond: [
              { $gt: ["$numberCount", 0] },
              "$numberCount",
              { $size: { $ifNull: ["$mobileNumbers", []] } },
            ],
          },
          delivered: {
            $size: {
              $filter: {
                input: { $ifNull: ["$deliveryResults", []] },
                cond: { $eq: ["$$this.status", DeliveryStatus.DELIVERED] },
              },
            },
          },
          failed: {
            $size: {
              $filter: {
                input: { $ifNull: ["$deliveryResults", []] },
                cond: { $eq: ["$$this.status", DeliveryStatus.FAILED] },
              },
            },
          },
          tracked: { $size: { $ifNull: ["$deliveryResults", []] } },
        },
      },
    ]);

    if (!details) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    const creator = await User.findById(details.createdBy)
      .select("companyName")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Campaign details fetched successfully.",
      data: {
        campaignId: details._id,
        campaignName: details.campaignName,
        message: details.message,
        createdBy: creator?.companyName || user.companyName,
        mobileNumberCount: details.mobileNumberCount,
        createdAt: details.createdAt,
        image: details.image || null,
        mediaType: details.mediaType || null,
        countryCode: details.countryCode,
        status: details.status,
        statusMessage: details.statusMessage,
        phoneButton: details.phoneButton || null,
        linkButton: details.linkButton || null,
        delivery: {
          delivered: details.delivered,
          failed: details.failed,
          tracked: details.tracked,
          total: details.mobileNumberCount,
        },
      },
      userData: {
        companyName: user.companyName,
        email: user.email,
        number: user.number,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Error in campaignDetails controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred in campaignDetails controller.",
    });
  }
};

/**
 * GET /api/dashboard/campaign/:campaignId/numbers?page=&limit=
 * Paginated list of recipient numbers with their per-number delivery status.
 */
const campaignNumbers = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found.",
      });
    }

    const campaignId = pathParam(req.params.campaignId);
    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID is required.",
      });
    }

    const currentUser = await User.findById(user._id)
      .select("allCampaign")
      .lean();
    const hasCampaign = currentUser?.allCampaign?.some(
      (cId) => cId.toString() === campaignId
    );
    if (!hasCampaign) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this campaign.",
      });
    }

    const DEFAULT_LIMIT = 20;
    const pageRaw = parseInt(String(req.query.page ?? "1"), 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limitRaw = parseInt(
      String(req.query.limit ?? String(DEFAULT_LIMIT)),
      10
    );
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0 && limitRaw <= 100
        ? limitRaw
        : DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Slice both arrays server-side so we never pull the full (up to 100k) list.
    const campaign = await Campaign.findById(campaignId, {
      countryCode: 1,
      status: 1,
      numberCount: 1,
      mobileNumbers: { $slice: [skip, limit] },
      deliveryResults: { $slice: [skip, limit] },
    }).lean();

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    const total = campaign.numberCount || campaign.mobileNumbers?.length || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const slicedNumbers = campaign.mobileNumbers ?? [];
    const slicedResults = campaign.deliveryResults ?? [];
    const fallback = deriveFallbackStatus(campaign.status);

    const numbers = slicedNumbers.map((number, i) => {
      const result = slicedResults[i];
      if (result) {
        return {
          serial: skip + i + 1,
          number: result.number ?? number,
          status: result.status,
          error: result.error ?? null,
          sentAt: result.sentAt ?? null,
        };
      }
      return {
        serial: skip + i + 1,
        number,
        status: fallback,
        error: null,
        sentAt: null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Campaign numbers fetched successfully.",
      data: {
        countryCode: campaign.countryCode,
        numbers,
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: unknown) {
    console.error("Error in campaignNumbers controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred in campaignNumbers controller.",
    });
  }
};

export {
  businessDetails,
  dashboard,
  transaction,
  news,
  complaints,
  manageReseller,
  manageUser,
  manageAdmin,
  treeView,
  whatsAppReports,
  allCampaigns,
  campaignDetails,
  campaignNumbers,
  support,
};
