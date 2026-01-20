"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Loader2, Send, ChevronDown, X, Check, ChevronsUpDown, Info } from "lucide-react";

export default function LinkedInJobsPage() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        limit: "10",
        offset: 0,
        title_filter: "",
        location_filter: [] as string[],
        description_filter: "",
        organization_description_filter: "",
        organization_specialties_filter: "",
        organization_slug_filter: "",
        type_filter: [] as string[],
        remote: "false",
        agency: "",
        industry_filter: "",
        seniority_filter: "",
        exclude_ats_duplicate: "",
        external_apply_url: "",
        directapply: "",
        employees_gte: "",
        employees_lte: "",
        date_filter: "",
        order: "desc",
        advanced_title_filter: "",
        advanced_organization_filter: "",
        include_ai: false,
        ai_work_arrangement_filter: "",
        ai_experience_level_filter: "",
        ai_visa_sponsorship_filter: "",
        ai_taxonomies_a_filter: "",
        ai_taxonomies_a_primary_filter: "",
        ai_taxonomies_a_exclusion_filter: "",
        ai_education_requirements_filter: "",
        ai_has_salary: "",
        organization_filter: "",
        description_type: "text",
    });

    const [otherLocationText, setOtherLocationText] = useState("");

    const isOtherLocationSelected = useMemo(() => {
        return (formData.location_filter as string[]).includes("Other");
    }, [formData.location_filter]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: type === "number" ? (value === "" ? "" : Number(value)) : value,
        }));
    };

    const handleSelectChange = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleTypeFilterChange = (value: string, checked: boolean) => {
        setFormData((prev) => {
            const currentTypes = prev.type_filter as string[];
            if (checked) {
                // Prevent duplicates - only add if not already present
                if (!currentTypes.includes(value)) {
                    return { ...prev, type_filter: [...currentTypes, value] };
                }
                return prev;
            } else {
                return { ...prev, type_filter: currentTypes.filter((t) => t !== value) };
            }
        });
    };

    const removeTypeFilter = (value: string) => {
        setFormData((prev) => {
            const currentTypes = prev.type_filter as string[];
            return { ...prev, type_filter: currentTypes.filter((t) => t !== value) };
        });
    };

    const handleLocationFilterChange = (value: string, checked: boolean) => {
        setFormData((prev) => {
            const currentLocations = prev.location_filter as string[];
            if (checked) {
                // Prevent duplicates
                if (!currentLocations.includes(value)) {
                    return { ...prev, location_filter: [...currentLocations, value] };
                }
                return prev;
            } else {
                return { ...prev, location_filter: currentLocations.filter((l) => l !== value) };
            }
        });
    };

    const removeLocationFilter = (value: string) => {
        setFormData((prev) => {
            const currentLocations = prev.location_filter as string[];
            return { ...prev, location_filter: currentLocations.filter((l) => l !== value) };
        });
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData((prev) => ({ ...prev, include_ai: checked }));
    };

    const [jobs, setJobs] = useState<any[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setJobs([]);

        try {
            const payload = new URLSearchParams();

            Object.entries(formData).forEach(([key, value]) => {
                if (key === "type_filter" && Array.isArray(value)) {
                    // Convert array to comma-separated string
                    // If empty, default to FULL_TIME
                    const typesToSend = value.length > 0 ? value : ["FULL_TIME"];
                    payload.append(key, typesToSend.join(","));
                } else if (key === "location_filter" && Array.isArray(value)) {
                    // Convert array to OR-separated string for location filter
                    const selected = value as string[];
                    const cleanedSelected = selected.filter((v) => v !== "Other");

                    const cleanedOther = otherLocationText
                        .split(/\s+OR\s+/i)
                        .map((s) => s.trim())
                        .filter(Boolean);

                    const merged = [...cleanedSelected, ...cleanedOther];

                    payload.append(key, merged.length > 0 ? merged.join(" OR ") : "");
                } else if (value === "") {
                    payload.append(key, "");
                } else if (value === null || value === undefined) {
                    payload.append(key, "");
                } else {
                    payload.append(key, String(value));
                }
            });

            // 1. Get IDs
            const response = await fetch(
                "https://n8n.metizsoft.in/webhook/fantastic-jobs-fantastic-jobs-metiziq/api/linkedin-job-search-api",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: payload,
                }
            );

            if (response.ok) {
                const data = await response.json();

                if (data.ids && Array.isArray(data.ids) && data.ids.length > 0) {
                    // 2. Fetch Details from local DB
                    const detailsResponse = await fetch("/api/linkedin-jobs/details", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids: data.ids }),
                    });

                    if (detailsResponse.ok) {
                        const detailsData = await detailsResponse.json();
                        if (detailsData.success) {
                            // Sort by date/time (assuming 'posted_at' or similar, fallback to created order)
                            // Best guess for date field: 'posted_at', 'date', 'created_at'
                            const sortedJobs = (detailsData.jobs || []).sort((a: any, b: any) => {
                                const dateA = new Date(a.posted_at || a.date || a.createdAt || 0).getTime();
                                const dateB = new Date(b.posted_at || b.date || b.createdAt || 0).getTime();
                                return dateB - dateA;
                            });
                            setJobs(sortedJobs);
                            toast.success(`Found ${sortedJobs.length} jobs!`);
                        } else {
                            toast.error("Failed to fetch job details.");
                        }
                    } else {
                        toast.error("Failed to fetch job details from database.");
                    }
                } else {
                    toast.warning("No jobs found for these criteria.");
                }

            } else {
                toast.error("Failed to submit search request.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while submitting.");
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="flex gap-6 p-6 h-screen w-full min-w-0 overflow-hidden">
            {/* Left Section - 40% (locked) */}
            <div className="flex-[0_0_40%] max-w-[40%] min-w-0 overflow-y-auto">
                <Card className="shadow-lg border-2 border-gray-200 rounded-lg w-full">
                    <CardHeader>
                        <CardTitle>LinkedIn Job Search</CardTitle>
                        <CardDescription>
                            Configure parameters to search for jobs on LinkedIn.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {/* Title Filter */}
                                <div className="space-y-2">
                                    <Label htmlFor="title_filter">Title Filter</Label>
                                    <Input
                                        id="title_filter"
                                        placeholder="e.g. Software Engineer"
                                        value={formData.title_filter}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* Location Filter - Searchable Multi Select */}
                                <div className="space-y-2 w-full min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="location_filter">Location Filter</Label>
                                    </div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between h-9 min-w-0"
                                                id="location_filter"
                                            >
                                                <span className="truncate text-left flex-1 min-w-0 mr-2">
                                                    {(() => {
                                                        const selectedLocations = formData.location_filter as string[];
                                                        if (selectedLocations.length === 0) {
                                                            return "Select locations";
                                                        } else if (selectedLocations.length === 1) {
                                                            return selectedLocations[0];
                                                        } else if (selectedLocations.length === 2) {
                                                            return selectedLocations.join(", ");
                                                        } else {
                                                            return `${selectedLocations.length} locations selected`;
                                                        }
                                                    })()}
                                                </span>
                                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 flex-shrink-0" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                            <Command className="max-h-[320px]">
                                                <CommandInput placeholder="Search locations..." />
                                                <CommandList className="h-[200px] overflow-y-auto" style={{ maxHeight: '200px' }}>
                                                    <CommandEmpty>No location found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {[
                                                            "Other",
                                                            "United States",
                                                            "India",
                                                            "China",
                                                            "United Kingdom",
                                                            "Germany",
                                                            "Canada",
                                                            "Japan",
                                                            "South Korea",
                                                            "Australia",
                                                            "France",
                                                            "Netherlands",
                                                            "Sweden",
                                                            "Switzerland",
                                                            "Ireland",
                                                            "Singapore",
                                                            "Israel",
                                                            "Brazil",
                                                            "Mexico",
                                                            "Spain",
                                                            "Italy",
                                                            "Poland",
                                                            "Ukraine",
                                                            "Romania",
                                                            "Czech Republic",
                                                            "Estonia",
                                                            "Finland",
                                                            "Denmark",
                                                            "Norway",
                                                            "Belgium",
                                                            "Austria",
                                                            "Portugal",
                                                            "Hungary",
                                                            "Turkey",
                                                            "United Arab Emirates",
                                                            "Saudi Arabia",
                                                            "Qatar",
                                                            "South Africa",
                                                            "Nigeria",
                                                            "Kenya",
                                                            "Egypt",
                                                            "Indonesia",
                                                            "Malaysia",
                                                            "Thailand",
                                                            "Vietnam",
                                                            "Philippines",
                                                            "Taiwan",
                                                            "New Zealand",
                                                            "Argentina",
                                                        ].map((location) => {
                                                            const isChecked = (formData.location_filter as string[]).includes(location);
                                                            return (
                                                                <CommandItem
                                                                    key={location}
                                                                    onSelect={() => handleLocationFilterChange(location, !isChecked)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked: boolean) =>
                                                                            handleLocationFilterChange(location, checked)
                                                                        }
                                                                        className="mr-2"
                                                                    />
                                                                    <span>{location}</span>
                                                                    {isChecked && (
                                                                        <Check className="ml-auto h-4 w-4 text-primary" />
                                                                    )}
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    {isOtherLocationSelected && (
                                        <div className="space-y-1">
                                            <Input
                                                id="other_location_filter"
                                                placeholder="e.g. Dubai OR Netherlands OR Belgium"
                                                value={otherLocationText}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtherLocationText(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Use full names (avoid US/UK/NYC). Multiple locations supported with{" "}
                                                <span className="font-mono font-semibold">OR</span>.
                                            </p>
                                        </div>
                                    )}

                                    {/* Selected locations chips */}
                                    {(formData.location_filter as string[]).length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2 max-h-[80px] overflow-y-auto">
                                            {Array.from(new Set(formData.location_filter as string[])).map((loc, index) => (
                                                <span
                                                    key={`${loc}-${index}`}
                                                    className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-md border border-primary/20 hover:bg-primary/20 transition-colors "
                                                    title={loc}
                                                >
                                                    <span className="max-w-[120px] truncate">{loc}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLocationFilter(loc)}
                                                        className="hover:text-destructive transition-colors flex-shrink-0 hover:scale-110"
                                                        aria-label={`Remove ${loc}`}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Type Filter - Multi Select */}
                                <div className="space-y-2 w-full min-w-0">
                                    <Label htmlFor="type_filter">Type</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between h-9 min-w-0"
                                                id="type_filter"
                                            >
                                                <span className="truncate text-left flex-1 min-w-0 mr-2">
                                                    {(() => {
                                                        const selectedTypes = formData.type_filter as string[];
                                                        const labels: Record<string, string> = {
                                                            FULL_TIME: "Full Time",
                                                            PART_TIME: "Part Time",
                                                            CONTRACTOR: "Contractor",
                                                            TEMPORARY: "Temporary",
                                                            INTERN: "Intern",
                                                            VOLUNTEER: "Volunteer",
                                                            OTHER: "Other",
                                                        };

                                                        if (selectedTypes.length === 0) {
                                                            return "Select types";
                                                        } else if (selectedTypes.length === 1) {
                                                            return labels[selectedTypes[0]] || selectedTypes[0];
                                                        } else if (selectedTypes.length === 2) {
                                                            return selectedTypes.map((val) => labels[val] || val).join(", ");
                                                        } else {
                                                            return `${selectedTypes.length} types selected`;
                                                        }
                                                    })()}
                                                </span>
                                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 flex-shrink-0" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                            <div className="p-2 space-y-2">
                                                {[
                                                    { value: "FULL_TIME", label: "Full Time" },
                                                    { value: "PART_TIME", label: "Part Time" },
                                                    { value: "CONTRACTOR", label: "Contractor" },
                                                    { value: "TEMPORARY", label: "Temporary" },
                                                    { value: "INTERN", label: "Intern" },
                                                    { value: "VOLUNTEER", label: "Volunteer" },
                                                    { value: "OTHER", label: "Other" },
                                                ].map((option) => {
                                                    const isChecked = (formData.type_filter as string[]).includes(option.value);
                                                    return (
                                                        <div
                                                            key={option.value}
                                                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                                            onClick={() => handleTypeFilterChange(option.value, !isChecked)}
                                                        >
                                                            <Checkbox
                                                                id={`type-${option.value}`}
                                                                checked={isChecked}
                                                                onCheckedChange={(checked: boolean) =>
                                                                    handleTypeFilterChange(option.value, checked)
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={`type-${option.value}`}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                                            >
                                                                {option.label}
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    {/* Display selected types as chips - Show below when 3+ selected */}
                                    {(formData.type_filter as string[]).length >= 3 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {Array.from(new Set(formData.type_filter as string[])).map((val, index) => {
                                                const labels: Record<string, string> = {
                                                    FULL_TIME: "Full Time",
                                                    PART_TIME: "Part Time",
                                                    CONTRACTOR: "Contractor",
                                                    TEMPORARY: "Temporary",
                                                    INTERN: "Intern",
                                                    VOLUNTEER: "Volunteer",
                                                    OTHER: "Other",
                                                };
                                                return (
                                                    <span
                                                        key={`${val}-${index}`}
                                                        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-secondary/80 text-secondary-foreground rounded-md border border-border hover:bg-secondary transition-colors"
                                                        title={labels[val] || val}
                                                    >
                                                        <span className="whitespace-nowrap">{labels[val] || val}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTypeFilter(val)}
                                                            className="hover:text-destructive transition-colors flex-shrink-0 hover:scale-110"
                                                            aria-label={`Remove ${labels[val] || val}`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Remote */}
                                <div className="space-y-2">
                                    <Label htmlFor="remote">Remote</Label>
                                    <Select
                                        value={formData.remote}
                                        onValueChange={(val: string) => handleSelectChange("remote", val)}
                                    >
                                        <SelectTrigger id="remote">
                                            <SelectValue placeholder="Select remote" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">Yes</SelectItem>
                                            <SelectItem value="false">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Order */}
                                <div className="space-y-2">
                                    <Label htmlFor="order">Order</Label>
                                    <Select
                                        value={formData.order}
                                        onValueChange={(val: string) => handleSelectChange("order", val)}
                                    >
                                        <SelectTrigger id="order">
                                            <SelectValue placeholder="Select order" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="desc">Descending</SelectItem>
                                            <SelectItem value="asc">Ascending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Limit */}
                                <div className="space-y-2">
                                    <Label htmlFor="limit">Limit</Label>
                                    <Input
                                        id="limit"
                                        type="number"
                                        placeholder="10"
                                        value={formData.limit}
                                        min={10}
                                        max={100}
                                        step={5}
                                        inputMode="numeric"
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                            // Block negative, decimals, exponent
                                            if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
                                                e.preventDefault();
                                            }
                                            // Optional: block more than 3 digits
                                            if (/^\d$/.test(e.key)) {
                                                const el = e.currentTarget;
                                                const next = `${el.value}${e.key}`;
                                                if (next.length > 3) {
                                                    e.preventDefault();
                                                }
                                            }
                                        }}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const raw = e.target.value;
                                            const parsed = Number(raw);

                                            // Allow typing freely so user can enter 20/30 etc.
                                            // Hard-block > 100 while typing.
                                            if (!raw) {
                                                setFormData((prev) => ({ ...prev, limit: "" as any }));
                                                return;
                                            }

                                            if (Number.isNaN(parsed)) return;
                                            if (parsed > 100) return;

                                            setFormData((prev) => ({ ...prev, limit: raw }));
                                        }}
                                        onBlur={() => {
                                            const parsed = Number(formData.limit);
                                            const safe = Number.isNaN(parsed) ? 10 : Math.min(100, Math.max(10, parsed));
                                            setFormData((prev) => ({ ...prev, limit: String(Math.trunc(safe)) }));
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Minimum 10 and maximum 100.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSubmit} className="w-full" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending Request...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Search Jobs
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Section - 60% (locked) */}
            <div className="flex-[0_0_60%] max-w-[60%] min-w-0 overflow-y-auto w-full">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-foreground">Search Results</h2>
                        <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {jobs.map((job) => (
                            <Card key={job.job_id || job._id} className="overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-primary/20">
                                <CardContent className="p-6">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-3">
                                                <h3 className="text-xl font-bold text-primary hover:underline cursor-pointer">
                                                    {job.title || "No Title"}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span className="font-semibold text-foreground">{job.organization || "Unknown Company"}</span>
                                                    {job.location && (
                                                        <>
                                                            <span className="text-muted-foreground/60">&bull;</span>
                                                            <span>{job.location}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 min-w-[140px]">
                                                <a
                                                    href={job.linkedin_org_url || job.organization_url || `https://www.linkedin.com/jobs/view/${job.job_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full"
                                                >
                                                    <Button variant="outline" size="sm" className="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300">
                                                        View on LinkedIn
                                                    </Button>
                                                </a>
                                                {job.external_apply_url && (
                                                    <a href={job.external_apply_url} target="_blank" rel="noopener noreferrer" className="w-full">
                                                        <Button size="sm" className="w-full bg-primary hover:bg-primary/90">Apply Now</Button>
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(job.employment_type) && job.employment_type.length > 0 && (
                                                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                                                    {job.employment_type.join(", ")}
                                                </span>
                                            )}

                                            {job.remote_derived !== undefined && (
                                                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                                                    {job.remote_derived ? "Remote" : "On-site"}
                                                </span>
                                            )}

                                            {job.linkedin_org_size && (
                                                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                                                    {job.linkedin_org_size}
                                                </span>
                                            )}

                                            {job.linkedin_org_type && (
                                                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full border border-green-200">
                                                    {job.linkedin_org_type}
                                                </span>
                                            )}

                                            {job.linkedin_org_industry && (
                                                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full border border-red-200">
                                                    {job.linkedin_org_industry}
                                                </span>
                                            )}
                                        </div>

                                        {job.description && (
                                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                                {job.description}
                                            </p>
                                        )}
                                    </div>

                                    {(job.insights || job.skills) && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50/50 p-3 rounded-md">
                                            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Insights</h4>
                                            <p className="text-xs text-gray-700">
                                                {Array.isArray(job.insights) ? job.insights.join(", ") : job.insights || "No additional insights."}
                                                {Array.isArray(job.skills) ? ` • Skills: ${job.skills.join(", ")}` : ""}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>

    );
}

// <div className="p-6 space-y-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
//     <Card className="shadow-lg border-2 border-gray-200 rounded-lg w-full lg:max-w-md">
//         <CardHeader>
//             <CardTitle>LinkedIn Job Search</CardTitle>
//             <CardDescription>
//                 Configure parameters to search for jobs on LinkedIn.
//             </CardDescription>
//         </CardHeader>
//         <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-6">
//                 <div className="my-4">

//                     {/* Limit */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="limit">Limit</Label>
//                         <Select
//                             value={formData.limit}
//                             onValueChange={(val: string) => handleSelectChange("limit", val)}
//                         >
//                             <SelectTrigger id="limit">
//                                 <SelectValue placeholder="Select limit" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 {Array.from({ length: 10 }, (_, i) => (i + 1) * 10).map((num) => (
//                                     <SelectItem key={num} value={String(num)}>
//                                         {num}
//                                     </SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                     </div> */}

//                     {/* Offset */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="offset">Offset</Label>
//                         <Input
//                             id="offset"
//                             type="number"
//                             placeholder="0"
//                             value={formData.offset}
//                             onChange={handleInputChange}
//                             min={0}
//                         />
//                     </div> */}

//                     {/* Title Filter */}
//                     <div className="space-y-2 mb-4">
//                         <Label htmlFor="title_filter">Title Filter</Label>
//                         <Input
//                             id="title_filter"
//                             placeholder="e.g. Software Engineer"
//                             value={formData.title_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div>

//                     {/* Location Filter */}
//                     <div className="space-y-2 mb-4">
//                         <Label htmlFor="location_filter">Location Filter</Label>
//                         <Input
//                             id="location_filter"
//                             placeholder="e.g. United States"
//                             value={formData.location_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div>

//                     {/* Type Filter */}
//                     <div className="space-y-2 mb-4">
//                         <Label htmlFor="type_filter">Type</Label>
//                         <Select
//                             value={formData.type_filter}
//                             onValueChange={(val: string) => handleSelectChange("type_filter", val)}
//                         >
//                             <SelectTrigger id="type_filter">
//                                 <SelectValue placeholder="Select type" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="FULL_TIME">Full Time</SelectItem>
//                                 <SelectItem value="PART_TIME">Part Time</SelectItem>
//                                 <SelectItem value="CONTRACTOR">Contractor</SelectItem>
//                                 <SelectItem value="TEMPORARY">Temporary</SelectItem>
//                                 <SelectItem value="INTERN">Intern</SelectItem>
//                                 <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
//                                 <SelectItem value="OTHER">Other</SelectItem>
//                             </SelectContent>
//                         </Select>
//                     </div>

//                     {/* Remote */}
//                     <div className="space-y-2 mb-4">
//                         <Label htmlFor="remote">Remote</Label>
//                         <Select
//                             value={formData.remote}
//                             onValueChange={(val: string) => handleSelectChange("remote", val)}
//                         >
//                             <SelectTrigger id="remote">
//                                 <SelectValue placeholder="Select remote" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="true">True</SelectItem>
//                                 <SelectItem value="false">False</SelectItem>
//                             </SelectContent>
//                         </Select>
//                     </div>

//                     {/* Order */}
//                     <div className="space-y-2 mb-4">
//                         <Label htmlFor="order">Order</Label>
//                         <Select
//                             value={formData.order}
//                             onValueChange={(val: string) => handleSelectChange("order", val)}
//                         >
//                             <SelectTrigger id="order">
//                                 <SelectValue placeholder="Select order" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="desc">Descending</SelectItem>
//                                 <SelectItem value="asc">Ascending</SelectItem>
//                             </SelectContent>
//                         </Select>
//                     </div>

//                     {/* Description Type */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="description_type">Description Type</Label>
//                         <Input
//                             id="description_type"
//                             placeholder="text"
//                             value={formData.description_type}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Description Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="description_filter">Description Filter</Label>
//                         <Input
//                             id="description_filter"
//                             placeholder="Keywords in description"
//                             value={formData.description_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Organization Description Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="organization_description_filter">Org. Description Filter</Label>
//                         <Input
//                             id="organization_description_filter"
//                             value={formData.organization_description_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Organization Specialties Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="organization_specialties_filter">Org. Specialties Filter</Label>
//                         <Input
//                             id="organization_specialties_filter"
//                             value={formData.organization_specialties_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Organization Slug Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="organization_slug_filter">Org. Slug Filter</Label>
//                         <Input
//                             id="organization_slug_filter"
//                             value={formData.organization_slug_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Organization Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="organization_filter">Organization Filter</Label>
//                         <Input
//                             id="organization_filter"
//                             value={formData.organization_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}


//                     {/* Agency */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="agency">Agency</Label>
//                         <Input
//                             id="agency"
//                             value={formData.agency}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Industry Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="industry_filter">Industry Filter</Label>
//                         <Input
//                             id="industry_filter"
//                             value={formData.industry_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Seniority Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="seniority_filter">Seniority Filter</Label>
//                         <Input
//                             id="seniority_filter"
//                             value={formData.seniority_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Exclude ATS Duplicate */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="exclude_ats_duplicate">Exclude ATS Duplicate</Label>
//                         <Input
//                             id="exclude_ats_duplicate"
//                             value={formData.exclude_ats_duplicate}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* External Apply URL */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="external_apply_url">External Apply URL</Label>
//                         <Input
//                             id="external_apply_url"
//                             value={formData.external_apply_url}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Directapply */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="directapply">Direct Apply</Label>
//                         <Input
//                             id="directapply"
//                             value={formData.directapply}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Employees GTE */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="employees_gte">Employees &ge;</Label>
//                         <Input
//                             id="employees_gte"
//                             type="number"
//                             value={formData.employees_gte}
//                             onChange={handleInputChange}
//                             min={0}
//                         />
//                     </div> */}

//                     {/* Employees LTE */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="employees_lte">Employees &le;</Label>
//                         <Input
//                             id="employees_lte"
//                             type="number"
//                             value={formData.employees_lte}
//                             onChange={handleInputChange}
//                             min={0}
//                         />
//                     </div> */}

//                     {/* Date Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="date_filter">Date Filter</Label>
//                         <Input
//                             id="date_filter"
//                             value={formData.date_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Advanced Title Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="advanced_title_filter">Adv. Title Filter</Label>
//                         <Input
//                             id="advanced_title_filter"
//                             value={formData.advanced_title_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Advanced Organization Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="advanced_organization_filter">Adv. Org. Filter</Label>
//                         <Input
//                             id="advanced_organization_filter"
//                             value={formData.advanced_organization_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* AI Work Arrangement Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="ai_work_arrangement_filter">AI Work Arrangement</Label>
//                         <Input
//                             id="ai_work_arrangement_filter"
//                             value={formData.ai_work_arrangement_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* AI Experience Level Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="ai_experience_level_filter">AI Experience Level</Label>
//                         <Input
//                             id="ai_experience_level_filter"
//                             value={formData.ai_experience_level_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* AI Visa Sponsorship Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="ai_visa_sponsorship_filter">AI Visa Sponsorship</Label>
//                         <Input
//                             id="ai_visa_sponsorship_filter"
//                             value={formData.ai_visa_sponsorship_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* AI Taxonomies A Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="ai_taxonomies_a_filter">AI Taxonomies A</Label>
//                         <Input
//                             id="ai_taxonomies_a_filter"
//                             value={formData.ai_taxonomies_a_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* AI Taxonomies A Primary Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="ai_taxonomies_a_primary_filter">AI Tax. Primary</Label>
//                         <Input
//                             id="ai_taxonomies_a_primary_filter"
//                             value={formData.ai_taxonomies_a_primary_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* AI Taxonomies A Exclusion Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="ai_taxonomies_a_exclusion_filter">AI Tax. Exclusion</Label>
//                         <Input
//                             id="ai_taxonomies_a_exclusion_filter"
//                             value={formData.ai_taxonomies_a_exclusion_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* AI Education Requirements Filter */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="ai_education_requirements_filter">AI Education Req.</Label>
//                         <Input
//                             id="ai_education_requirements_filter"
//                             value={formData.ai_education_requirements_filter}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* AI Has Salary */}
//                     {/* <div className="space-y-2">
//                         <Label htmlFor="ai_has_salary">AI Has Salary</Label>
//                         <Input
//                             id="ai_has_salary"
//                             value={formData.ai_has_salary}
//                             onChange={handleInputChange}
//                         />
//                     </div> */}

//                     {/* Include AI Switch */}
//                     {/* <div className="space-y-2 flex flex-col justify-end pb-2">
//                         <div className="flex items-center space-x-2">
//                             <Switch
//                                 id="include_ai"
//                                 checked={formData.include_ai}
//                                 onCheckedChange={handleSwitchChange}
//                             />
//                             <Label htmlFor="include_ai">Include AI</Label>
//                         </div>
//                     </div> */}

//                 </div>

//                 <div className="flex justify-end pt-4">
//                     <Button type="submit" className="w-full md:w-auto" disabled={loading}>
//                         {loading ? (
//                             <>
//                                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                                 Sending Request...
//                             </>
//                         ) : (
//                             <>
//                                 <Send className="w-4 h-4 mr-2" />
//                                 Search Jobs
//                             </>
//                         )}
//                     </Button>
//                 </div>
//             </form>
//         </CardContent>
//     </Card>

//     {/* Results Section */}
//     {jobs.length > 0 && (
//         <div className="space-y-4">
//             <h2 className="text-xl font-semibold">Search Results ({jobs.length})</h2>
//             <div className="grid grid-cols-1 gap-4">
//                 {jobs.map((job) => (
//                     <Card key={job.job_id || job._id} className="overflow-hidden">
//                         <CardContent className="p-6">
//                             <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
//                                 <div className="space-y-2 flex-1">
//                                     <h3 className="text-lg font-bold text-blue-600">
//                                         {job.title || "No Title"}
//                                     </h3>
//                                     <div className="text-sm text-gray-600 font-medium">
//                                         {job.organization || ""} {job.location && <>&bull; {job.location}</>}
//                                     </div>

//                                     <div className="flex flex-wrap gap-2 text-xs mt-2">
//                                         {Array.isArray(job.employment_type) && job.employment_type.length > 0 && (
//                                             <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
//                                                 {job.employment_type.join(", ")}
//                                             </span>
//                                         )}

//                                         {job.remote_derived !== undefined && (
//                                             <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
//                                                 {job.remote_derived ? "Remote" : "On-site"}
//                                             </span>
//                                         )}

//                                         {job.linkedin_org_size && (
//                                             <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
//                                                 {job.linkedin_org_size}
//                                             </span>
//                                         )}

//                                         {job.linkedin_org_type && (
//                                             <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
//                                                 {job.linkedin_org_type}
//                                             </span>
//                                         )}

//                                         {job.linkedin_org_industry && (
//                                             <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
//                                                 {job.linkedin_org_industry}
//                                             </span>
//                                         )}
//                                     </div>


//                                     {job.description && (
//                                         <p className="text-sm text-gray-500 mt-3 line-clamp-3">
//                                             {job.description}
//                                         </p>
//                                     )}
//                                 </div>
//                                 <div className="flex flex-col gap-2 min-w-[120px]">
//                                     <a
//                                         href={job.linkedin_org_url || job.organization_url || `https://www.linkedin.com/jobs/view/${job.job_id}`}
//                                         target="_blank"
//                                         rel="noopener noreferrer"
//                                         className="w-full"
//                                     >
//                                         <Button variant="outline" size="sm" className="w-full">
//                                             View on LinkedIn
//                                         </Button>
//                                     </a>
//                                     {job.external_apply_url && (
//                                         <a href={job.external_apply_url} target="_blank" rel="noopener noreferrer" className="w-full">
//                                             <Button size="sm" className="w-full">Apply Now</Button>
//                                         </a>
//                                     )}
//                                 </div>
//                             </div>

//                             {/* Sub-card for extra details if needed, e.g. insights or metadata */}
//                             {(job.insights || job.skills) && (
//                                 <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50/50 p-3 rounded-md">
//                                     <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Insights</h4>
//                                     <p className="text-xs text-gray-700">
//                                         {Array.isArray(job.insights) ? job.insights.join(", ") : job.insights || "No additional insights."}
//                                         {Array.isArray(job.skills) ? ` • Skills: ${job.skills.join(", ")}` : ""}
//                                     </p>
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>
//                 ))}
//             </div>
//         </div>
//     )}
// </div>

