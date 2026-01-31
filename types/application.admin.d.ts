// The status of a creator application
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

// Represents a single creator application, including user details
export interface CreatorApplication {
  id: string;
  user_id: string;
  bio: string;
  category: string;
  experience_years: number;
  portfolio_url?: string;
  why_creator: string;
  status: ApplicationStatus;
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  // Nested user info from the backend
  user_name?: string;
  user_email?: string;
  user_username?: string;
  spam_analysis?: SpamAnalysis;
  flags: {
    high_spam_risk: boolean;
    high_user_risk: boolean;
    needs_review: boolean;
    urgent: boolean;
  };
}

export interface SpamAnalysis {
  spam_score: number;
  spam_level: string;
  confidence: number;
}

// The structure of the 'data' object from the GET /applications list endpoint
export interface CreatorApplicationsResponseData {
  applications: CreatorApplication[];
  pagination: {
    current_page: number;
    limit: number;
    pages: number;
    skip: number;
    total: number;
  };
  filter_status?: ApplicationStatus;
}

// The payload for submitting a review
export interface ReviewApplicationRequest {
  status: 'approved' | 'rejected';
  review_notes?: string;
}
