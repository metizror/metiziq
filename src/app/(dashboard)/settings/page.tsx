"use client";

import { SettingsPanel } from "@/components/SettingsPanel";
import { useAppSelector } from "@/store/hooks";
import type { User } from "@/types/dashboard.types";

export default function SettingsPage() {
  const { user } = useAppSelector((state) => state.auth);

  const dashboardUser: User | null = user ? {
    id: user.id,
    email: user.email,
    name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
    role: user.role || null,
  } : null;

  if (!dashboardUser) return null;

  return <SettingsPanel user={dashboardUser} />;
}

