"use client";

import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Globe, Linkedin, MapPin, Send } from "lucide-react";
import { LinkedInJobBadges } from "./job-badges";

interface LinkedInJobHeaderProps {
    title?: string;
    organization?: string;
    location?: string;
    employmentTypes?: string[];
    isRemote?: boolean;
    seniority?: string;
    linkedinJobUrl?: string;
    applyUrl?: string;
    organizationUrl?: string;
}

export function LinkedInJobHeader({
    title,
    organization,
    location,
    employmentTypes,
    isRemote,
    seniority,
    linkedinJobUrl,
    applyUrl,
    organizationUrl,
}: LinkedInJobHeaderProps) {
    return (
        <CardHeader>
            <div className="space-y-4">
                {/* Title | URLs (same line on desktop) */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <CardTitle className="text-3xl leading-tight tracking-tight min-w-0">
                        <span className="block min-w-0 truncate lg:whitespace-normal lg:break-words">
                            {title || "No Title"}
                        </span>
                    </CardTitle>

                    <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
                        {linkedinJobUrl && (
                            <Button variant="outline" asChild className="h-9">
                                <a
                                    href={linkedinJobUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                >
                                    <Globe className="w-4 h-4" />
                                    Website
                                </a>
                            </Button>
                        )}
                        {organizationUrl && (
                            <Button variant="outline" asChild className="h-9">
                                <a
                                    href={organizationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                >
                                    <Linkedin className="w-4 h-4" />
                                    LinkedIn
                                </a>
                            </Button>
                        )}
                        {applyUrl && (
                            <Button asChild className="h-9">
                                <a
                                    href={applyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                >
                                    Apply
                                    <Send className="w-4 h-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Secondary meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium text-foreground/90">
                            {organization || "Unknown Company"}
                        </span>
                    </div>
                    {location && (
                        <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="max-w-[520px] truncate">{location}</span>
                        </div>
                    )}
                </div>

                <LinkedInJobBadges employmentTypes={employmentTypes} isRemote={isRemote} seniority={seniority} />
            </div>
        </CardHeader>
    );
}

