export interface CreatorApplicationRequest {
  education: string;
  practise_area: string;
  year_of_passing: number;
}

export interface CreatorApplicationResponse {
  application_id: string;
  status: string;
  applied_at: string;
}

export interface ApplyForCreatorEligiblity {
  eligible: boolean;
  message: string;
  profile_complete: boolean;
  current_role: string;
}

export interface CreatorApplicationsData {
  applications: CreatorApplication[];
  total: number;
}

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
  user_name?: string;
  user_email?: string;
  user_username?: string;
}
