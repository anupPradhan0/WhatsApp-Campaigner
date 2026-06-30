import type { Request, Response } from "express";
import ExcelJS from "exceljs";
import Campaign, {
  CampaignStats,
  DeliveryStatus,
} from "../models/campaign.model.js";
import { pathParam } from "../utils/route-params.utils.js";
import { userCanViewCampaign } from "../utils/campaign-access.utils.js";

/** Best-effort per-number status for campaigns sent before per-number tracking. */
function fallbackStatus(campaignStatus?: string): DeliveryStatus {
  if (campaignStatus === CampaignStats.DELIVERED)
    return DeliveryStatus.DELIVERED;
  if (campaignStatus === CampaignStats.FAILED) return DeliveryStatus.FAILED;
  return DeliveryStatus.PENDING;
}

export async function exportCampaignToExcel(
  req: Request,
  res: Response
): Promise<Response | void> {
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

    const campaign = await Campaign.findById(campaignId)
      .populate("createdBy", "companyName")
      .lean();

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    // createdBy is populated to { _id, companyName } here, so authorize on its id.
    const createdByRef = campaign.createdBy as unknown as
      | { _id: { toString(): string } }
      | { toString(): string };
    const creatorId =
      createdByRef &&
      typeof createdByRef === "object" &&
      "_id" in createdByRef
        ? createdByRef._id
        : campaign.createdBy;

    const canView = await userCanViewCampaign(user, campaignId, creatorId);

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to export this campaign.",
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Campaign Data");

    const formatDate = (dateString: string | Date): string => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    type CreatedByPopulated = { companyName?: string };
    const createdByName =
      campaign.createdBy &&
      typeof campaign.createdBy === "object" &&
      "companyName" in campaign.createdBy
        ? (campaign.createdBy as CreatedByPopulated).companyName ?? "Unknown"
        : "Unknown";
    const createdDate = formatDate(campaign.createdAt);

    const deliveryResults = campaign.deliveryResults ?? [];
    const fallback = fallbackStatus(campaign.status);
    const mediaNote = campaign.media
      ? "Please check the All Campaigns or WhatsApp Report section to download media."
      : "";

    // Build every row first, then keep only the columns that have at least one
    // non-empty value — so fields that are empty for the whole campaign (e.g. no
    // phone button, no link button, no media) are dropped from the sheet.
    const rows: Record<string, string>[] = campaign.mobileNumbers.map(
      (phoneNumber, i) => {
        const result = deliveryResults[i];
        const deliveryStatus = (result?.status ?? fallback).toUpperCase();
        return {
          campaignName: campaign.campaignName,
          message: campaign.message,
          phoneButtonText: campaign.phoneButton?.text ?? "",
          phoneButtonNumber: campaign.phoneButton?.number ?? "",
          linkButtonText: campaign.linkButton?.text ?? "",
          linkButtonUrl: campaign.linkButton?.url ?? "",
          countryCode: campaign.countryCode,
          phoneNumber,
          deliveryStatus,
          createdBy: createdByName,
          createdDate,
          mediaUrl: mediaNote,
        };
      }
    );

    const allColumns = [
      { header: "Campaign Name", key: "campaignName", width: 30 },
      { header: "Message", key: "message", width: 100 },
      { header: "Phone Button Text", key: "phoneButtonText", width: 20 },
      { header: "Phone Button Number", key: "phoneButtonNumber", width: 20 },
      { header: "Link Button Text", key: "linkButtonText", width: 20 },
      { header: "Link Button URL", key: "linkButtonUrl", width: 40 },
      { header: "Country Code", key: "countryCode", width: 15 },
      { header: "Phone Number", key: "phoneNumber", width: 20 },
      { header: "Delivery Status", key: "deliveryStatus", width: 18 },
      { header: "Created By", key: "createdBy", width: 25 },
      { header: "Created Date", key: "createdDate", width: 15 },
      { header: "Media URL", key: "mediaUrl", width: 80 },
    ];

    const isEmpty = (v: unknown): boolean =>
      v === undefined || v === null || String(v).trim() === "";
    const columns = allColumns.filter((col) =>
      rows.some((row) => !isEmpty(row[col.key]))
    );

    // Fall back to all columns only in the impossible case of zero rows.
    worksheet.columns = columns.length > 0 ? columns : allColumns;

    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF22C55E" },
    };
    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getRow(1).height = 25;

    // addRow maps by column key, so keys without a matching column are ignored.
    rows.forEach((row) => worksheet.addRow(row));

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F4F6" },
        };
      }
    });

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      });
    });

    const fileName = `${Date.now()}_campaign_${campaign.campaignName}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: unknown) {
    console.error("Error in exportCampaignToExcel controller:", error);
    return res.status(500).json({
      success: false,
      message:
        "An internal server error occurred while exporting campaign.",
    });
  }
}
