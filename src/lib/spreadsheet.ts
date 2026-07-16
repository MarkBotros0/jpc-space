import ExcelJS from "exceljs";
import { Readable } from "node:stream";

export class SpreadsheetParseError extends Error {}

export function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("hyperlink" in value && typeof value.hyperlink === "string") {
      return value.hyperlink.replace(/^mailto:/i, "");
    }
    if ("result" in value) return cellText((value as { result: ExcelJS.CellValue }).result);
    if ("richText" in value) {
      return (value as ExcelJS.CellRichTextValue).richText.map((part) => part.text).join("");
    }
  }
  return "";
}

export async function loadFirstWorksheet(
  buffer: Buffer,
  filename: string,
): Promise<ExcelJS.Worksheet | undefined> {
  const workbook = new ExcelJS.Workbook();
  if (filename.toLowerCase().endsWith(".csv")) {
    // Keep every CSV cell as raw text — the default reader coerces numeric-looking
    // cells to numbers, which strips a leading "+" and drops leading zeros from
    // phone numbers.
    return workbook.csv.read(Readable.from([buffer]), { map: (value: unknown) => value });
  }
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  return workbook.worksheets[0];
}
