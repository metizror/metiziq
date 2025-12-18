"use client";

import { useRouter } from "next/navigation";
import { CustomerRegistration } from "@/components/CustomerRegistration";

export default function CustomerSignupPage() {
  const router = useRouter();

  return (
    <CustomerRegistration
      onRegistrationComplete={() => router.push("/")}
      onBackToLogin={() => router.push("/")}
    />
  );
}


