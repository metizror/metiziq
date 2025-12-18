"use client";

import { ImportDataModule } from "@/components/ImportDataModule";
import { useState } from "react";
import type { Contact, Company } from "@/types/dashboard.types";

export default function ImportPage() {
  const [contacts, setContacts] = useState([] as Contact[]);
  const [companies, setCompanies] = useState([] as Company[]);

  return (
    <ImportDataModule 
      onImportComplete={(newContacts, newCompanies) => {
        setContacts([...contacts, ...newContacts]);
        setCompanies([...companies, ...newCompanies]);
      }}
    />
  );
}

