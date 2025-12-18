import * as XLSX from "xlsx";

/**
 * Parse Excel file and extract emails from it
 * @param fileBuffer - Buffer of the Excel file
 * @returns Array of email addresses (normalized to lowercase)
 */
export function extractEmailsFromExcel(fileBuffer: Buffer): string[] {
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

    // Find email column (check first row for headers)
    const headers = jsonData[0] || [];
    let emailColumnIndex = -1;

    // Try to find email column by header name
    const emailHeaderPatterns = [
      /email/i,
      /e-mail/i,
      /email address/i,
      /e-mail address/i,
    ];

    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] || "").trim().toLowerCase();
      if (emailHeaderPatterns.some((pattern) => pattern.test(header))) {
        emailColumnIndex = i;
        break;
      }
    }

    // If no email header found, try to find column with email-like values
    if (emailColumnIndex === -1) {
      for (let col = 0; col < headers.length; col++) {
        // Check first few rows for email pattern
        let emailCount = 0;
        for (let row = 1; row < Math.min(6, jsonData.length); row++) {
          const cellValue = String(jsonData[row]?.[col] || "").trim();
          if (cellValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cellValue)) {
            emailCount++;
          }
        }
        if (emailCount >= 2) {
          // If at least 2 rows have email-like values, assume this is the email column
          emailColumnIndex = col;
          break;
        }
      }
    }

    // If still no email column found, check all columns for email values
    if (emailColumnIndex === -1) {
      const emails: string[] = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      for (let row = 1; row < jsonData.length; row++) {
        for (let col = 0; col < jsonData[row].length; col++) {
          const cellValue = String(jsonData[row]?.[col] || "").trim();
          if (emailRegex.test(cellValue)) {
            emails.push(cellValue.toLowerCase());
          }
        }
      }
      return [...new Set(emails)]; // Remove duplicates
    }

    // Extract emails from the identified column
    const emails: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let row = 1; row < jsonData.length; row++) {
      const cellValue = String(jsonData[row]?.[emailColumnIndex] || "").trim();
      if (cellValue && emailRegex.test(cellValue)) {
        emails.push(cellValue.toLowerCase());
      }
    }

    // Remove duplicates and return
    return [...new Set(emails)];
  } catch (error: any) {
    console.error("Error extracting emails from Excel:", error);
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
