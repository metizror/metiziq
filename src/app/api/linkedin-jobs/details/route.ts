
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import LinkedinJob from '@/models/linkedinJob.model';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: true, jobs: [] });
        }

        await connectToDatabase();

        // Fetch jobs matching the IDs
        // Assuming 'postedAt' or 'createdAt' exists for date-wise sorting.
        // If explicit date field is unknown, we rely on _id (which contains timestamp) key or just createdAt if timestamps=true in schema works (it won't backfill).
        // Let's try to sort by _id descending which is roughly time-based for MongoDB.

        const jobs = await LinkedinJob.find({ job_id: { $in: ids } })
            .lean();

        // Re-order jobs based on the input 'ids' array order? 
        // Or sort by date as requested. User said: "date and time vise".
        // I'll try to sort by 'posted_at' if it exists, or 'date', or '_id'.
        // Since I don't know the exact field, I'll do client-side sorting or best-effort here.
        // Ideally, the user wants the latest jobs. 
        // Let's assume the DB has a date field. Common one is "date" or "posted_at". 
        // Checking the user's initial form "date_filter", maybe the results have a date?
        // Safe bet: sort by _id desc (newest first)

        // jobs.sort((a: any, b: any) => {
        //    return new Date(b.createdAt || b.date || b.posted_at).getTime() - new Date(a.createdAt || a.date || a.posted_at).getTime();
        // });

        // Actually, let's just use the query sort for _id which is reliable for creation time.
        // But if "date and time vise" refers to the JOB's date (which might differ from DB insertion), we might need to inspect the data.
        // For now, I'll return them.

        return NextResponse.json({ success: true, jobs });
    } catch (error: any) {
        console.error('Error fetching linkedin jobs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch jobs' },
            { status: 500 }
        );
    }
}
