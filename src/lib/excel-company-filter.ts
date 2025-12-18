import * as XLSX from "xlsx";

/**
 * Parse Excel file and extract company names from it
 * @param fileBuffer - Buffer of the Excel file
 * @returns Array of company names (normalized to lowercase and trimmed)
 */
export function extractCompanyNamesFromExcel(fileBuffer: Buffer): string[] {
  try {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert sheet to JSON array
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as any[][];

    if (jsonData.length === 0) {
      return [];
    }

    // Find company name column (check first row for headers)
    const headers = jsonData[0] || [];
    let companyNameColumnIndex = -1;

    // Try to find company name column by header name
    const companyNameHeaderPatterns = [
      /company/i,
      /company name/i,
      /companyname/i,
      /company_name/i,
      /organization/i,
      /org/i,
      /business/i,
      /firm/i,
    ];

    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] || "").trim().toLowerCase();
      if (companyNameHeaderPatterns.some((pattern) => pattern.test(header))) {
        companyNameColumnIndex = i;
        break;
      }
    }

    // If no company name header found, try to use the first column
    if (companyNameColumnIndex === -1) {
      companyNameColumnIndex = 0; // Default to first column
    }

    // Extract company names from the identified column
    const companyNames: string[] = [];

    for (let row = 1; row < jsonData.length; row++) {
      const cellValue = String(jsonData[row]?.[companyNameColumnIndex] || "").trim();
      if (cellValue && cellValue.length > 0) {
        // Normalize to lowercase for case-insensitive matching
        companyNames.push(cellValue.toLowerCase());
      }
    }

    // Remove duplicates and return
    return [...new Set(companyNames)];
  } catch (error: any) {
    console.error("Error extracting company names from Excel:", error);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

/**
 * Convert base64 string to Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  // Remove data URL prefix if present (e.g., "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,")
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  return Buffer.from(base64Data, "base64");
}
