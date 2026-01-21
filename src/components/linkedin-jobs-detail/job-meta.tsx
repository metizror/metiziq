"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Briefcase, Calendar, Clock, DollarSign, Link2, Users } from "lucide-react";

interface LinkedInJobMetaProps {
    companySize?: string;
    industry?: string;
    posted?: string;
    validThrough?: string;
    salary?: string | null;
    headquarters?: string;
    followers?: string;
    formatDate: (dateString?: string) => string;
}

export function LinkedInJobMeta({
    companySize,
    industry,
    posted,
    validThrough,
    salary,
    headquarters,
    followers,
    formatDate,
}: LinkedInJobMetaProps) {
    return (
        <Card className="border-border/60 shadow-lg">
            <CardHeader>
                <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {companySize && (
                    <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium">Company Size</p>
                            <p className="text-sm text-muted-foreground break-words">{companySize}</p>
                        </div>
                    </div>
                )}
                {industry && (
                    <div className="flex items-start gap-3">
                        <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium">Industry</p>
                            <p className="text-sm text-muted-foreground break-words">{industry}</p>
                        </div>
                    </div>
                )}
                {posted && (
                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">Posted</p>
                            <p className="text-sm text-muted-foreground">{formatDate(posted)}</p>
                        </div>
                    </div>
                )}
                {validThrough && (
                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">Valid through</p>
                            <p className="text-sm text-muted-foreground">{formatDate(validThrough)}</p>
                        </div>
                    </div>
                )}
                {salary && (
                    <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium">Salary</p>
                            <p className="text-sm text-muted-foreground break-words">{salary}</p>
                        </div>
                    </div>
                )}

                {(headquarters || followers) && (
                    <>
                        <Separator />
                        <div className="space-y-2 text-sm">
                            {headquarters && (
                                <div className="text-muted-foreground">
                                    <span className="font-medium text-foreground/90">HQ:</span> {headquarters}
                                </div>
                            )}
                            {followers && (
                                <div className="text-muted-foreground">
                                    <span className="font-medium text-foreground/90">Followers:</span>{" "}
                                    {Number(followers).toLocaleString()}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

