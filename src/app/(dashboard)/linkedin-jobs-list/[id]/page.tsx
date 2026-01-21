"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { privateApiCall } from "@/lib/api";
import type { User } from "@/types/dashboard.types";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { LinkedInJob } from "@/components/linkedin-jobs-detail/types";
import { LinkedInJobHeader } from "@/components/linkedin-jobs-detail/job-header";
import { LinkedInJobMeta } from "@/components/linkedin-jobs-detail/job-meta";
import { LinkedInJobDescriptionSections } from "@/components/linkedin-jobs-detail/description-sections";

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
        <div className="p-6 max-w-6xl mx-auto">
            {/* Top bar */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" onClick={() => router.back()} className="w-fit">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Jobs
                </Button>
                <div />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="border-border/60 shadow-lg">
                        <LinkedInJobHeader
                            title={job.title}
                            organization={job.organization}
                            location={job.location}
                            employmentTypes={job.employment_type}
                            isRemote={job.remote_derived}
                            seniority={job.seniority}
                            linkedinJobUrl={job.company_site}
                            organizationUrl={job.organization_url || job.linkedin_org_url}
                            applyUrl={job.external_apply_url}
                        />
                        <CardContent className="space-y-6">
                            <LinkedInJobDescriptionSections descriptionText={job.description_text} />

                            {job.linkedin_org_description && (
                                <div>
                                    <Separator className="my-2" />
                                    <h3 className="text-lg font-semibold mb-3">About {job.organization}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {job.linkedin_org_description}
                                    </p>

                                    {job.linkedin_org_specialties && job.linkedin_org_specialties.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium mb-2">Specialties</p>
                                            <div className="flex flex-wrap gap-2">
                                                {job.linkedin_org_specialties.slice(0, 18).map((spec, i) => (
                                                    <Badge key={`${spec}-${i}`} variant="outline" className="text-xs">
                                                        {spec}
                                                    </Badge>
                                                ))}
                                                {job.linkedin_org_specialties.length > 18 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{job.linkedin_org_specialties.length - 18} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <LinkedInJobMeta
                        companySize={job.linkedin_org_size}
                        industry={job.linkedin_org_industry}
                        posted={job.date_posted}
                        validThrough={job.date_validthrough}
                        salary={salary}
                        headquarters={job.linkedin_org_headquarters}
                        followers={job.linkedin_org_followers}
                        formatDate={formatDate}
                    />
                </div>
            </div>
        </div>
    );
}
