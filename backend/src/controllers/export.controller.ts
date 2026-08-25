import { gzipSync } from "node:zlib";
import type { Request, Response } from "express";
import ExcelJS from "exceljs";
import XLSX from "xlsx";
import Campaign, {
  CampaignStats,
  DeliveryStatus,
} from "../models/campaign.model.js";
import { pathParam } from "../utils/route-params.utils.js";
import { userCanViewCampaign } from "../utils/campaign-access.utils.js";

/** Excel 97-2003 stores at most 65,536 rows, header included. */
const BIFF8_MAX_ROWS = 65_535;

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

    // ?format=xls → legacy Excel 97-2003 (.xls); anything else → modern .xlsx.
    const wantsLegacyXls = String(req.query.format ?? "").toLowerCase() === "xls";
    const workbook = wantsLegacyXls ? null : new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet | null = null;
    let xlsBuffer: Buffer | null = null;

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
    // Combine the country code and the phone number into one full international
    // number (e.g. "+919090090150") in a single column. The stored number often
    // already includes the country-code digits, so guard against double-prefix.
    const toFullNumber = (raw: string): string => {
      const ccDigits = (campaign.countryCode ?? "").replace(/\D/g, "");
      const numDigits = (raw ?? "").replace(/\D/g, "");
      if (!numDigits) return "";
      if (ccDigits && numDigits.startsWith(ccDigits)) return `+${numDigits}`;
      return `+${ccDigits}${numDigits}`;
    };

    const rows: Record<string, string>[] = campaign.mobileNumbers.map(
      (phoneNumber, i) => {
        const result = deliveryResults[i];
        const deliveryStatus = (result?.status ?? fallback).toUpperCase();
        return {
          campaignName: campaign.campaignName,
          campaignStatus: (campaign.status ?? "").toUpperCase(),
          message: campaign.message,
          phoneButtonText: campaign.phoneButton?.text ?? "",
          phoneButtonNumber: campaign.phoneButton?.number ?? "",
          linkButtonText: campaign.linkButton?.text ?? "",
          linkButtonUrl: campaign.linkButton?.url ?? "",
          phoneNumber: toFullNumber(phoneNumber),
          deliveryStatus,
          createdBy: createdByName,
          createdDate,
          mediaUrl: mediaNote,
        };
      }
    );

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
    const columns = allColumns.filter((col) =>
      rows.some((row) => !isEmpty(row[col.key]))
    );

    // Fall back to all columns only in the impossible case of zero rows.
    const finalColumns = columns.length > 0 ? columns : allColumns;

    // Legacy .xls (BIFF8) — plain data only, the 97-2003 format via SheetJS
    // carries no styling, which is fine: it exists for old Excel/ERP imports.
    if (wantsLegacyXls) {
      // Hard format limit; past it Excel silently truncates or refuses the file.
      if (rows.length > BIFF8_MAX_ROWS) {
        return res.status(400).json({
          success: false,
          message: `This campaign has ${rows.length.toLocaleString()} recipients. The old Excel 97-2003 format tops out at ${BIFF8_MAX_ROWS.toLocaleString()} rows — download the newer .xlsx instead.`,
        });
      }

      const aoa = [
        finalColumns.map((c) => c.header),
        ...rows.map((row) => finalColumns.map((c) => row[c.key] ?? "")),
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(aoa),
        "Campaign Data"
      );
      xlsBuffer = XLSX.write(wb, { bookType: "biff8", type: "buffer" });
    } else {
      worksheet = workbook!.addWorksheet("Campaign Data");
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

      // addRow maps by column key, so keys without a matching column are ignored.
      rows.forEach((row) => worksheet!.addRow(row));

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
    }

    // Sanitize to a pure-ASCII, filesystem-safe name. A raw campaign name can
    // hold quotes, slashes, or unicode that break the Content-Disposition header
    // and mangle the file extension on some clients (Mac Numbers/Safari), so the
    // downloaded file won't open.
    const safeBase =
      `campaign_${campaign.campaignName}_${createdDate}`
        .normalize("NFKD")
        .replace(/[^\x20-\x7E]/g, "") // drop non-ASCII
        .replace(/[\\/:*?"<>|]/g, "_") // filesystem-illegal chars
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "") || "campaign";
    const fileName = `${safeBase}.${wantsLegacyXls ? "xls" : "xlsx"}`;

    res.setHeader(
      "Content-Type",
      wantsLegacyXls
        ? "application/vnd.ms-excel"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    if (wantsLegacyXls) {
      // BIFF8 repeats every string on every row — a 10k-recipient campaign is
      // ~7 MB of mostly the same message text, and compresses ~27x. .xlsx is
      // already a zip, so only this branch is worth compressing.
      const acceptsGzip = /\bgzip\b/.test(req.headers["accept-encoding"] ?? "");
      if (acceptsGzip && xlsBuffer) {
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Vary", "Accept-Encoding");
        res.end(gzipSync(xlsBuffer));
        return;
      }
      res.end(xlsBuffer);
      return;
    }

    await workbook!.xlsx.write(res);
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
