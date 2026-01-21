export interface LinkedInJob {
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

