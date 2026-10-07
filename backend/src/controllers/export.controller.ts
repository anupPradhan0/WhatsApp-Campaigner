import type { Request, Response } from "express";
import ExcelJS from "exceljs";
import Campaign, {
  CampaignStats,
  DeliveryStatus,
} from "../models/campaign.model.js";
import { pathParam } from "../utils/route-params.utils.js";
import { userCanViewCampaign } from "../utils/campaign-access.utils.js";
import { stripHtml } from "../utils/strip-html.utils.js";

/** Modern Excel stores at most 1,048,576 rows, header included. */
const XLSX_MAX_ROWS = 1_048_575;

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

    const numbersOnly = String(req.query.numbersOnly ?? "").toLowerCase() === "true";

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

    // Keep only columns with at least one non-empty value, so fields that are
    // empty for the whole campaign (e.g. no button or media) are omitted.
    // Combine the country code and phone number into one full international
    // number without a leading plus (e.g. "919090090150"). Stored numbers
    // often already include the country-code digits, so avoid duplicating them.
    const ccDigits = (campaign.countryCode ?? "").replace(/\D/g, "");
    const cleanMessage = stripHtml(campaign.message ?? "");
    const campaignStatus = (campaign.status ?? "").toUpperCase();
    const toFullNumber = (raw: string): string => {
      const numDigits = (raw ?? "").replace(/\D/g, "");
      if (!numDigits) return "";
      if (ccDigits && numDigits.startsWith(ccDigits)) return numDigits;
      return `${ccDigits}${numDigits}`;
    };

    const makeRow = (phoneNumber: string, index: number): Record<string, string> => ({
      campaignName: campaign.campaignName,
      campaignStatus,
      message: cleanMessage,
      phoneButtonText: campaign.phoneButton?.text ?? "",
      phoneButtonNumber: (campaign.phoneButton?.number ?? "").replace(/\D/g, ""),
      linkButtonText: campaign.linkButton?.text ?? "",
      linkButtonUrl: campaign.linkButton?.url ?? "",
      phoneNumber: toFullNumber(phoneNumber),
      deliveryStatus: (deliveryResults[index]?.status ?? fallback).toUpperCase(),
      createdBy: createdByName,
      createdDate,
      mediaUrl: mediaNote,
    });

    const allColumns = [
      { header: "Campaign Name", key: "campaignName", width: 30 },
      { header: "Campaign Status", key: "campaignStatus", width: 18 },
      { header: "Message", key: "message", width: 100 },
      { header: "Phone Button Text", key: "phoneButtonText", width: 20 },
      { header: "Phone Button Number", key: "phoneButtonNumber", width: 20 },
      { header: "Link Button Text", key: "linkButtonText", width: 20 },
      { header: "Link Button URL", key: "linkButtonUrl", width: 40 },
      { header: "Phone Number", key: "phoneNumber", width: 22 },
      { header: "Delivery Status", key: "deliveryStatus", width: 18 },
      { header: "Created By", key: "createdBy", width: 25 },
      { header: "Created Date", key: "createdDate", width: 15 },
      { header: "Media URL", key: "mediaUrl", width: 80 },
    ];

    const isEmpty = (v: unknown): boolean =>
      v === undefined || v === null || String(v).trim() === "";
    const firstRow = campaign.mobileNumbers.length
      ? makeRow(campaign.mobileNumbers[0], 0)
      : null;
    const columns = numbersOnly
      ? allColumns.filter((col) => col.key === "phoneNumber")
      : allColumns.filter((col) =>
          col.key === "phoneNumber"
            ? campaign.mobileNumbers.some((phoneNumber) => !isEmpty(toFullNumber(phoneNumber)))
            : firstRow ? !isEmpty(firstRow[col.key]) : false
        );

    // Fall back to all columns only in the impossible case of zero rows.
    const finalColumns = columns.length > 0 ? columns : allColumns;

    if (campaign.mobileNumbers.length > XLSX_MAX_ROWS) {
      return res.status(400).json({
        success: false,
        message: `This campaign has ${campaign.mobileNumbers.length.toLocaleString()} recipients. Excel supports up to ${XLSX_MAX_ROWS.toLocaleString()} recipients per sheet.`,
      });
    }

    // Sanitize to a pure-ASCII, filesystem-safe name. A raw campaign name can
    // hold quotes, slashes, or unicode that break the Content-Disposition header
    // and mangle the file extension on some clients (Mac Numbers/Safari), so
    // the downloaded file won't open.
    const safeBase =
      `campaign_${campaign.campaignName}_${createdDate}`
        .normalize("NFKD")
        .replace(/[^\x20-\x7E]/g, "")
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "") || "campaign";
    const fileName = `${safeBase}${numbersOnly ? "_numbers" : ""}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // Stream the workbook directly to the response. The document writer kept
    // all rows, styles and shared strings in memory; the streaming writer
    // commits each row as it is generated. Inline strings avoid retaining a
    // potentially huge shared-string table. Lower ZIP compression reduces CPU
    // time while keeping the file substantially smaller than raw XML.
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true,
      useSharedStrings: false,
      zip: { zlib: { level: 1 } },
    });
    const worksheet = workbook.addWorksheet(numbersOnly ? "Phone Numbers" : "Campaign Data");
    worksheet.columns = finalColumns;

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

    // Header only styling keeps workbook generation fast on large exports.
    for (let index = 0; index < campaign.mobileNumbers.length; index += 1) {
      const row = numbersOnly
        ? { phoneNumber: toFullNumber(campaign.mobileNumbers[index]) }
        : makeRow(campaign.mobileNumbers[index], index);
      worksheet.addRow(row).commit();
    }
    worksheet.commit();
    await workbook.commit();
  } catch (error: unknown) {
    console.error("Error in exportCampaignToExcel controller:", error);
    if (res.headersSent) {
      res.destroy(error instanceof Error ? error : undefined);
      return;
    }
    return res.status(500).json({
      success: false,
      message:
        "An internal server error occurred while exporting campaign.",
    });
  }
}
