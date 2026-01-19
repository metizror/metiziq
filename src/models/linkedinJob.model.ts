
import mongoose from 'mongoose';

const LinkedinJobSchema = new mongoose.Schema({
    job_id: { type: String, required: true, index: true },
}, {
    strict: false,
    timestamps: true,
    collection: 'linkedin_jobs'
});

const LinkedinJob = mongoose.models.LinkedinJob || mongoose.model('LinkedinJob', LinkedinJobSchema);

export default LinkedinJob;
