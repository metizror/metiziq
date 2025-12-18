import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import Contacts from "@/models/contacts.model";
import Companies from "@/models/companies.model";
import { requireAdminAuth } from "../../../../services/jwt.service";
import { createActivity } from "../../../../services/activity.service";

// Increase timeout for large imports
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_IMPORT_LIMIT = 10000;
const BATCH_SIZE = 1000;

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const { error, admin } = await requireAdminAuth(request);
  if (error) {
    return error;
  }

  try {
    // Read request body with increased size handling
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError: any) {
      if (
        parseError.message?.includes("too large") ||
        parseError.message?.includes("413")
      ) {
        return NextResponse.json(
          {
            message:
              "Request body too large. Please split your import into smaller batches (max 5000 contacts per batch).",
            maxBatchSize: 5000,
          },
          { status: 413 }
        );
      }
      throw parseError;
    }

    const { data, skipActivityLog, createActivityLogWithTotal } = requestBody;

    // Validate that data is an array
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { message: "Invalid input: 'data' must be an array" },
        { status: 400 }
      );
    }

    // Allow empty data only if we're just creating an activity log with a total count
    if (data.length === 0 && createActivityLogWithTotal === undefined) {
      return NextResponse.json(
        { message: "Invalid input: 'data' array cannot be empty" },
        { status: 400 }
      );
    }

    // If we're just creating an activity log, skip the rest of the processing
    if (data.length === 0 && createActivityLogWithTotal !== undefined) {
      if (!skipActivityLog) {
        createActivity(
          "Contacts imported",
          `${createActivityLogWithTotal} Contacts imported by ${admin?.name}`,
          admin?._id || "",
          admin?.name || ""
        ).catch((err) => {
          console.error("Error creating activity log:", err);
        });
      }
      return NextResponse.json(
        {
          message: "Activity log created successfully",
          imported: 0,
        },
        { status: 200 }
      );
    }

    // Check maximum limit
    if (data.length > MAX_IMPORT_LIMIT) {
      return NextResponse.json(
        {
          message: `Maximum import limit is ${MAX_IMPORT_LIMIT} contacts. You are trying to import ${data.length} contacts.`,
          maxLimit: MAX_IMPORT_LIMIT,
          provided: data.length,
        },
        { status: 400 }
      );
    }

    // Validate and prepare contacts data according to model schema
    const emails: string[] = [];
    const emailSet = new Set<string>();
    const duplicateEmails: string[] = [];
    const validContacts: any[] = [];
    const invalidContacts: any[] = [];

    // Validate each contact and check for duplicates
    for (const item of data) {
      // Check required fields
      if (
        !item.email ||
        !item.firstName ||
        !item.lastName ||
        !item.jobTitle ||
        !item.companyName
      ) {
        invalidContacts.push({
          email: item.email || "N/A",
          reason:
            "Missing required fields (email, firstName, lastName, jobTitle, or companyName)",
        });
        continue;
      }

      // Check for duplicate emails in incoming data
      if (emailSet.has(item.email)) {
        duplicateEmails.push(item.email);
        continue;
      }

      emailSet.add(item.email);
      emails.push(item.email);

      // Prepare contact data according to model
      const contactData: any = {
        firstName: item.firstName.trim(),
        lastName: item.lastName.trim(),
        fullName:
          item.fullName ||
          `${item.firstName.trim()} ${item.lastName.trim()}`.trim(),
        jobTitle: item.jobTitle.trim(),
        email: item.email.trim(),
        companyName: item.companyName.trim(),
        employeeSize: item.employeeSize || "",
        revenue: item.revenue || "",
        uploaderId: admin?._id,
        createdBy: admin?.name || null,
      };

      // Optional fields
      if (item.jobLevel) contactData.jobLevel = item.jobLevel;
      if (item.jobRole) contactData.jobRole = item.jobRole;
      if (item.phone) contactData.phone = item.phone;
      if (item.directPhone) contactData.directPhone = item.directPhone;
      if (item.address1) contactData.address1 = item.address1;
      if (item.address2) contactData.address2 = item.address2;
      if (item.city) contactData.city = item.city;
      if (item.state) contactData.state = item.state;
      if (item.zipCode) contactData.zipCode = item.zipCode;
      if (item.country) {
        contactData.country = item.country;
        if (item.country === "Other" && item.otherCountry) {
          contactData.otherCountry = item.otherCountry;
        }
      }
      if (item.website) contactData.website = item.website;
      if (item.industry) {
        contactData.industry = item.industry;
        if (item.industry === "Other" && item.otherIndustry) {
          contactData.otherIndustry = item.otherIndustry;
        }
      }
      if (item.subIndustry) contactData.subIndustry = item.subIndustry;
      if (item.contactLinkedIn)
        contactData.contactLinkedIn = item.contactLinkedIn;
      if (item.lastUpdateDate)
        contactData.lastUpdateDate = new Date(item.lastUpdateDate);
      if (item.amfNotes) contactData.amfNotes = item.amfNotes;

      validContacts.push(contactData);
    }

    // Return errors if duplicates or invalid contacts found
    if (duplicateEmails.length > 0) {
      return NextResponse.json(
        {
          message: "Duplicate emails found in import data",
          duplicateEmails: [...new Set(duplicateEmails)],
        },
        { status: 400 }
      );
    }

    if (invalidContacts.length > 0) {
      return NextResponse.json(
        {
          message: "Invalid contacts found in import data",
          invalidContacts: invalidContacts.slice(0, 10), // Show first 10
          totalInvalid: invalidContacts.length,
        },
        { status: 400 }
      );
    }

    // Check which emails already exist in the database (batched for performance)
    const existingEmailsSet = new Set<string>();
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const emailBatch = emails.slice(i, i + BATCH_SIZE);
      const existingContacts = await Contacts.find({
        email: { $in: emailBatch },
      }).select("email");

      existingContacts.forEach((contact: any) => {
        existingEmailsSet.add(contact.email);
      });
    }

    const existingEmails = Array.from(existingEmailsSet);

    // Filter out contacts with existing emails - skip them but continue with new ones
    const contactsToImport = validContacts.filter((contact: any) => {
      return !existingEmailsSet.has(contact.email);
    });

    // If no contacts to import after filtering, return early
    if (contactsToImport.length === 0) {
      const emailsList = existingEmails.slice(0, 10).join(", ");
      const moreEmails =
        existingEmails.length > 10
          ? ` and ${existingEmails.length - 10} more`
          : "";
      const message = `All contacts already exist in the database. Existing emails: ${emailsList}${moreEmails}.`;

      return NextResponse.json(
        {
          message: message,
          existingEmails: existingEmails,
          importedEmails: [],
          imported: 0,
          skipped: existingEmails.length,
          total: data.length,
        },
        { status: 200 }
      );
    }

    // Extract unique companies from contacts to import (excluding existing ones)
    const companyMap = new Map<string, any>();
    contactsToImport.forEach((contact: any) => {
      if (contact.companyName && contact.companyName.trim()) {
        const companyName = contact.companyName.trim();
        if (!companyMap.has(companyName)) {
          // Create company object according to model schema
          const companyData: any = {
            companyName: companyName,
            uploaderId: admin?._id,
            createdBy: admin?.name || null,
          };

          // Optional fields - merge from contact data
          if (contact.phone) companyData.phone = contact.phone;
          if (contact.address1) companyData.address1 = contact.address1;
          if (contact.address2) companyData.address2 = contact.address2;
          if (contact.city) companyData.city = contact.city;
          if (contact.state) companyData.state = contact.state;
          if (contact.zipCode) companyData.zipCode = contact.zipCode;
          if (contact.country) {
            companyData.country = contact.country;
            if (contact.country === "Other" && contact.otherCountry) {
              companyData.otherCountry = contact.otherCountry;
            }
          }
          if (contact.website) companyData.website = contact.website;
          if (contact.revenue) companyData.revenue = contact.revenue;
          if (contact.employeeSize)
            companyData.employeeSize = contact.employeeSize;
          if (contact.industry) {
            companyData.industry = contact.industry;
            if (contact.industry === "Other" && contact.otherIndustry) {
              companyData.otherIndustry = contact.otherIndustry;
            }
          }
          if (contact.subIndustry)
            companyData.subIndustry = contact.subIndustry;
          if (contact.technology) companyData.technology = contact.technology;
          if (contact.contactLinkedIn)
            companyData.companyLinkedInUrl = contact.contactLinkedIn;

          companyMap.set(companyName, companyData);
        } else {
          // Merge data - prefer non-empty values
          const existing = companyMap.get(companyName);
          const fieldsToMerge = [
            "phone",
            "address1",
            "address2",
            "city",
            "state",
            "zipCode",
            "country",
            "website",
            "revenue",
            "employeeSize",
            "industry",
            "subIndustry",
            "technology",
            "companyLinkedInUrl",
            "otherCountry",
            "otherIndustry",
          ];

          fieldsToMerge.forEach((key) => {
            const contactValue =
              contact[key] ||
              (key === "companyLinkedInUrl" ? contact.contactLinkedIn : null);
            if (contactValue && !existing[key]) {
              existing[key] = contactValue;
            }
          });
        }
      }
    });

    // Create or update companies using bulk operations for speed
    let companiesCreated = 0;
    let companiesUpdated = 0;
    const uniqueCompanies = Array.from(companyMap.values());

    if (uniqueCompanies.length > 0) {
      // Get all existing companies in one query
      const companyNames = uniqueCompanies.map((c: any) => c.companyName);
      const existingCompanies = await Companies.find({
        companyName: { $in: companyNames },
      });

      const existingCompanyMap = new Map<string, any>();
      existingCompanies.forEach((company: any) => {
        existingCompanyMap.set(company.companyName, company);
      });

      // Prepare bulk operations
      const bulkOps: any[] = [];
      const companiesToCreate: any[] = [];

      for (const companyData of uniqueCompanies) {
        const existingCompany = existingCompanyMap.get(companyData.companyName);

        if (existingCompany) {
          // Prepare update data
          const updateData: any = {};
          Object.keys(companyData).forEach((key) => {
            if (
              key !== "companyName" &&
              key !== "createdBy" &&
              key !== "uploaderId"
            ) {
              if (
                companyData[key] &&
                companyData[key] !==
                  existingCompany[key as keyof typeof existingCompany]
              ) {
                updateData[key] = companyData[key];
              }
            }
          });

          if (Object.keys(updateData).length > 0) {
            bulkOps.push({
              updateOne: {
                filter: { _id: existingCompany._id },
                update: { $set: updateData },
              },
            });
            companiesUpdated++;
          }
        } else {
          companiesToCreate.push(companyData);
          companiesCreated++;
        }
      }

      // Execute bulk operations
      if (bulkOps.length > 0) {
        await Companies.bulkWrite(bulkOps, { ordered: false });
      }

      // Bulk create new companies in batches
      if (companiesToCreate.length > 0) {
        for (let i = 0; i < companiesToCreate.length; i += BATCH_SIZE) {
          const companyBatch = companiesToCreate.slice(i, i + BATCH_SIZE);
          await Companies.insertMany(companyBatch, { ordered: false });
        }
      }
    }

    // Bulk insert contacts in batches for better performance
    let totalInserted = 0;
    const insertedContacts: any[] = [];
    const importedEmails: string[] = [];

    for (let i = 0; i < contactsToImport.length; i += BATCH_SIZE) {
      const contactBatch = contactsToImport.slice(i, i + BATCH_SIZE);
      try {
        const inserted = await Contacts.insertMany(contactBatch, {
          ordered: false,
        });
        insertedContacts.push(...inserted);
        totalInserted += inserted.length;
        // Extract emails from successfully inserted contacts
        inserted.forEach((contact: any) => {
          if (contact.email) {
            importedEmails.push(contact.email);
          }
        });
      } catch (batchError: any) {
        // Handle partial batch failures
        if (batchError.writeErrors) {
          const successful =
            contactBatch.length - batchError.writeErrors.length;
          totalInserted += successful;
          // Extract emails from successful inserts
          contactBatch.forEach((contact: any, index: number) => {
            const isError = batchError.writeErrors?.some(
              (err: any) => err.index === index
            );
            if (!isError && contact.email) {
              importedEmails.push(contact.email);
            }
          });
          console.error(
            `Batch ${i / BATCH_SIZE + 1} partially failed: ${
              batchError.writeErrors.length
            } errors`
          );
        } else {
          throw batchError;
        }
      }
    }

    // Create activity log only if not skipped (for chunked imports, only create on final chunk)
    // If createActivityLogWithTotal is provided, use that count instead of totalInserted
    if (!skipActivityLog) {
      const activityCount =
        createActivityLogWithTotal !== undefined
          ? createActivityLogWithTotal
          : totalInserted;
      createActivity(
        "Contacts imported",
        `${activityCount} Contacts imported by ${admin?.name}`,
        admin?._id || "",
        admin?.name || ""
      ).catch((err) => {
        console.error("Error creating activity log:", err);
      });
    }

    // Build response message
    let message = "Contacts and companies imported successfully";
    if (existingEmails.length > 0) {
      const emailsList = existingEmails.slice(0, 10).join(", ");
      const moreEmails =
        existingEmails.length > 10
          ? ` and ${existingEmails.length - 10} more`
          : "";
      message = `${totalInserted} contacts imported successfully. ${existingEmails.length} contact(s) already exist and were skipped. Existing emails: ${emailsList}${moreEmails}.`;
    }

    return NextResponse.json(
      {
        message: message,
        imported: totalInserted,
        skipped: existingEmails.length,
        existingEmails: existingEmails.length > 0 ? existingEmails : [],
        importedEmails: importedEmails.length > 0 ? importedEmails : [],
        total: data.length,
        validContacts: validContacts.length,
        companiesCreated: companiesCreated,
        companiesUpdated: companiesUpdated,
        companiesTotal: companiesCreated + companiesUpdated,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        message: "Error importing contacts",
        error: error?.message || "Unknown error occurred",
        ...(process.env.NODE_ENV === "development" && { stack: error?.stack }),
      },
      { status: 500 }
    );
  }
}
