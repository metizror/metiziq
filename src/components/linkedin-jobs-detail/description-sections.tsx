"use client";

import { Separator } from "@/components/ui/separator";

interface DescriptionSection {
    title: string;
    content: string;
}

function splitDescriptionIntoSections(raw: string): DescriptionSection[] {
    const text = raw.trim();
    if (!text) return [];

    // Heuristic: split by common headings found in scraped job descriptions.
    const headingPatterns: Array<{ title: string; regex: RegExp }> = [
        { title: "Responsibilities", regex: /^\s*(responsibilities|what you(?:'|’)ll do|role responsibilities)\s*:?\s*$/i },
        { title: "Qualifications", regex: /^\s*(qualifications|requirements|what we(?:'|’)re looking for|skills)\s*:?\s*$/i },
        { title: "Benefits", regex: /^\s*(benefits|perks|what we offer)\s*:?\s*$/i },
        { title: "About the role", regex: /^\s*(about the role|role overview)\s*:?\s*$/i },
        { title: "About the company", regex: /^\s*(about (the )?company|company overview)\s*:?\s*$/i },
    ];

    const lines = text.split(/\r?\n/);
    const sections: DescriptionSection[] = [];

    let currentTitle = "Overview";
    let currentLines: string[] = [];

    function flush() {
        const content = currentLines.join("\n").trim();
        if (content) sections.push({ title: currentTitle, content });
        currentLines = [];
    }

    for (const line of lines) {
        const trimmed = line.trim();
        const matched = headingPatterns.find((p) => p.regex.test(trimmed));
        if (matched) {
            flush();
            currentTitle = matched.title;
            continue;
        }
        currentLines.push(line);
    }

    flush();

    // If we only got an "Overview", keep it as a single section.
    if (sections.length === 1 && sections[0]?.title === "Overview") return sections;

    // Otherwise remove tiny/noisy sections (often caused by scraping artifacts).
    return sections.filter((s) => s.content.replace(/\s+/g, " ").length > 40);
}

interface LinkedInJobDescriptionSectionsProps {
    descriptionText?: string;
}

export function LinkedInJobDescriptionSections({ descriptionText }: LinkedInJobDescriptionSectionsProps) {
    if (!descriptionText) return null;

    const sections = splitDescriptionIntoSections(descriptionText);
    if (sections.length === 0) return null;

    return (
        <div>
            <h3 className="text-lg font-semibold mb-3">Job Details</h3>
            <div className="rounded-lg border bg-card/40">
                {sections.map((section, idx) => (
                    <div key={`${section.title}-${idx}`} className="p-4">
                        {idx > 0 && <Separator className="mb-4" />}
                        <div className="text-sm font-semibold mb-2">{section.title}</div>
                        <p className="whitespace-pre-wrap leading-relaxed text-sm text-foreground/90">
                            {section.content}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

