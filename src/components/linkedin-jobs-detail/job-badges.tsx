"use client";

import { Badge } from "@/components/ui/badge";

interface LinkedInJobBadgesProps {
  employmentTypes?: string[];
  isRemote?: boolean;
  seniority?: string;
}

export function LinkedInJobBadges({ employmentTypes, isRemote, seniority }: LinkedInJobBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.isArray(employmentTypes) &&
        employmentTypes.map((type, i) => (
          <Badge key={`${type}-${i}`} variant="secondary" className="capitalize">
            {type.replaceAll("_", " ")}
          </Badge>
        ))}
      {typeof isRemote === "boolean" && (
        <Badge variant={isRemote ? "default" : "outline"}>{isRemote ? "Remote" : "On-site"}</Badge>
      )}
      {seniority && <Badge variant="outline">{seniority}</Badge>}
    </div>
  );
}

