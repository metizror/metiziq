"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { privateApiCall } from "@/lib/api";
import type { User } from "@/types/dashboard.types";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Building2, MapPin, Briefcase, Users, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface LinkedInJob {
    _id?: string;
    id?: string;
    job_id?: string;
    title?: string;
    organization?: string;
    organization_url?: string;
    location?: string;
    description_text?: string;
    employment_type?: string[];
    remote_derived?: boolean;
    linkedin_org_size?: string;
    linkedin_org_type?: string;
    linkedin_org_industry?: string;
    linkedin_org_url?: string;
    linkedin_org_description?: string;
    linkedin_org_specialties?: string[];
    linkedin_org_headquarters?: string;
    linkedin_org_followers?: string;
    external_apply_url?: string;
    company_site?: string;
    seniority?: string;
    salary_raw?: string;
    date_posted?: string;
    date_validthrough?: string;
    updated_at?: string;
    [key: string]: any;
}

export default function LinkedInJobDetailPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params?.id as string;

    const { user } = useAppSelector((state) => state.auth);
    const [job, setJob] = useState<LinkedInJob | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const dashboardUser: User | null = user
        ? {
            id: user.id,
            email: user.email,
            name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
            role: user.role || null,
        }
        : null;

    useEffect(() => {
        const fetchJob = async () => {
            if (!jobId) {
                setError("Job ID is required");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Fetch job by ID
                const response = await privateApiCall<{
                    success: boolean;
                    job: LinkedInJob;
                }>(`/linkedin-jobs/${jobId}`);

                if (response.success && response.job) {
                    setJob(response.job);
                } else {
                    setError("Job not found");
                }
            } catch (err: any) {
                console.error("Error fetching LinkedIn job:", err);
                setError(err.message || "Failed to fetch job details");
                toast.error("Failed to load job details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJob();
    }, [jobId]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return dateString;
        }
    };

    const parseSalary = (salaryRaw?: string) => {
        if (!salaryRaw) return null;
        try {
            const parsed = JSON.parse(salaryRaw);
            if (parsed?.value?.minValue && parsed?.value?.maxValue) {
                const min = new Intl.NumberFormat('en-US', { style: 'currency', currency: parsed.currency || 'USD' }).format(parsed.value.minValue);
                const max = new Intl.NumberFormat('en-US', { style: 'currency', currency: parsed.currency || 'USD' }).format(parsed.value.maxValue);
                return `${min} - ${max} per ${parsed.value.unitText?.toLowerCase() || 'year'}`;
            }
        } catch {
            return null;
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Card>
                    <CardContent className="p-12 text-center">
                        <p className="text-red-600 text-lg">{error || "Job not found"}</p>
                        <Button onClick={() => router.back()} className="mt-4">
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const salary = parseSalary(job.salary_raw);

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Jobs
                </Button>
                <div className="flex gap-2">
                    {job.company_site && (
                        <Button variant="outline" asChild>
                            <a
                                href={job.company_site}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View on LinkedIn
                            </a>
                        </Button>
                    )}
                    {job.external_apply_url && (
                        <Button asChild>
                            <a
                                href={job.external_apply_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                            >
                                Apply Now
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {/* Job Details Card */}
            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        <div>
                            <CardTitle className="text-3xl mb-2">{job.title || "No Title"}</CardTitle>
                            <div className="flex items-center gap-4 text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Building2 className="h-4 w-4" />
                                    <span className="font-medium">{job.organization || "Unknown Company"}</span>
                                </div>
                                {job.location && (
                                    <>
                                        <span>•</span>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>{job.location}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                            {Array.isArray(job.employment_type) && job.employment_type.map((type, i) => (
                                <Badge key={i} variant="secondary">{type.replace('_', ' ')}</Badge>
                            ))}
                            {job.remote_derived !== undefined && (
                                <Badge variant={job.remote_derived ? "default" : "outline"}>
                                    {job.remote_derived ? "Remote" : "On-site"}
                                </Badge>
                            )}
                            {job.seniority && (
                                <Badge variant="outline">{job.seniority}</Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {job.linkedin_org_size && (
                            <div className="flex items-start gap-3">
                                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Company Size</p>
                                    <p className="text-sm text-muted-foreground">{job.linkedin_org_size}</p>
                                </div>
                            </div>
                        )}
                        {job.linkedin_org_industry && (
                            <div className="flex items-start gap-3">
                                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Industry</p>
                                    <p className="text-sm text-muted-foreground">{job.linkedin_org_industry}</p>
                                </div>
                            </div>
                        )}
                        {job.date_posted && (
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Posted</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(job.date_posted)}</p>
                                </div>
                            </div>
                        )}
                        {
                            job.date_validthrough && (
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Valid through</p>
                                        <p className="text-sm text-muted-foreground">{formatDate(job.date_validthrough)}</p>
                                    </div>
                                </div>
                            )
                        }
                        {salary && (
                            <div className="flex items-start gap-3">
                                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Salary</p>
                                    <p className="text-sm text-muted-foreground">{salary}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Description */}
                    {job.description_text && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                            <div className="prose prose-sm max-w-none text-foreground">
                                <p className="whitespace-pre-wrap leading-relaxed">{job.description_text}</p>
                            </div>
                        </div>
                    )}

                    {/* Company Info */}
                    {job.linkedin_org_description && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-semibold mb-3">About {job.organization}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{job.linkedin_org_description}</p>

                                {job.linkedin_org_specialties && job.linkedin_org_specialties.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium mb-2">Specialties:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {job.linkedin_org_specialties.map((spec, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">{spec}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(job.linkedin_org_headquarters || job.linkedin_org_followers) && (
                                    <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
                                        {job.linkedin_org_headquarters && (
                                            <div>
                                                <span className="font-medium">Headquarters:</span> {job.linkedin_org_headquarters}
                                            </div>
                                        )}
                                        {job.linkedin_org_followers && (
                                            <div>
                                                <span className="font-medium">Followers:</span> {Number(job.linkedin_org_followers).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
