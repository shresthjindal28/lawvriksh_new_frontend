//Route constants

export const REDIRECT_ROUTES = {
  ADMIN: '/dashboard/admin',
  PROFESSIONAL: '/dashboard/professional',
  STUDENT: '/dashboard/student',
  USER: '/profile-completion',
} as const;

export const PUBLIC_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
} as const;

export const COMMON_ROUTES = {
  SETTINGS: '/settings',
  WRITING_SECTION: '/writing-section',
  AI_DRAFTING: '/AIDrafting',
  BLOG_READING: '/blog-reading',
  PROFILE_COMPLETION: '/profile-completion',
  HELP: '/help',
  ANOTATE_FILE: '/anotate',
} as const;

export const PROFESSIONAL_ROUTES = {
  PROFESSIONAL_DASHBOARD: '/dashboard/professional',
  PROFESSIONAL_PROFILE: '/dashboard/professional/profile',
  PROFESSIONAL_APPLICATIONS: '/dashboard/professional/applications',
  PROFESSIONAL_APPLY_CREATOR: '/creator-application',
  PROFESSIONAL_LIBRARY: '/dashboard/professional/library',
  PROFESSIONAL_DOCUMENTS: '/dashboard/professional/documents',
  PROFESSIONAL_REFERENCE_MANAGER: '/dashboard/professional/reference-manager',
} as const;

export const STUDENT_ROUTES = {
  STUDENT_DASHBOARD: '/dashboard/student',
  STUDENT_PROFILE: '/dashboard/student/profile',
  STUDENT_APPLICATIONS: '/dashboard/student/applications',
  STUDENT_APPLY_CREATOR: '/creator-application',
  STUDENT_LIBRARY: '/dashboard/student/library',
  STUDENT_DOCUMENTS: '/dashboard/student/documents',
  STUDENT_SUBSCRIPTION: '/dashboard/student/subscription',
  STUDENT_REFERENCE_MANAGER: '/dashboard/student/reference-manager',
} as const;

export const ADMIN_ROUTES = {
  ADMIN_DASHBOARD: '/dashboard/admin',
  ADMIN_APPLICATIONS: '/dashboard/admin/applications',
  ADMIN_PROFILE: '/dashboard/admin/profile',
  ADMIN_USERS: '/dashboard/admin/users',
  ADMIN_LOGS: '/admin/logs',
  ADMIN_SYSTEM: '/admin/system',
  ADMIN_LIBRARY: '/dashboard/admin/library',
  ADMIN_DOCUMENTS: '/dashboard/admin/documents',
  ADMIN_WORKSPACE: '/dashboard/admin/workspace',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  PREREGISTER: `api/auth/check-preregister`,
  SIGNUP: `api/auth/signup`,
  LOGIN: `api/auth/login`,
  LOGOUT: `api/auth/logout`,
  LOGOUT_ALL: `api/auth/logout-all`,
  VERIFY_OTP: `api/auth/verify-otp`,
  FORGOT_PASSWORD: `api/auth/forgot-password`,
  RESET_PASSWORD: `api/auth/reset-password`,
  CHANGE_PASSWORD: `api/auth/change-password`,
  REFRESH_TOKEN: `api/auth/refresh`,
  ENABLE_2FA: `api/auth/enable-2fa`,
  DISABLE_2FA: `api/auth/disable-2fa`,
  VERIFY_2FA: `api/auth/verify-2fa`,
  SESSIONS: `api/auth/sessions`,

  //Settings
  UPDATE_SETTINGS: `api/users/profile`,
  GET_SETTINGS: `api/users/profile`,

  // Google OAuth
  GOOGLE_AUTH_URL: `api/auth/google/url`,
  GOOGLE_CALLBACK: `api/auth/google/callback`,

  // User endpoints
  ME: `api/users/profile`,
  UPDATE_PROFILE: `api/users/profile`,
  USER_SETUP: `api/users/profile`,
  ACCOUNT_DELETE: `api/users/account`,

  //workspace
  WORKSPACES: `api/dms/workspaces`,
  WORKSPACES_PROJECTS: `api/dms/workspaces`,
  WORKSPACES_BLOGS: `api/dms/workspaces`,

  //projects
  CREATE_PROJECT: `api/dms/workspaces`,
  GET_PROJECT_BY_ID: `api/dms/workspaces`,
  UPDATE_PROJECT: `api/dms/workspaces`,
  EXPORT_PROJECT: `api/dms/documents/export`,
  DELETE_PROJECT: `api/dms/workspaces`,
  SEARCH_PROJECTS: `api/dms/workspaces/search`,

  // AI Drafting endpoints
  DRAFT_DOCUMENT_INQUIRY: 'api/ai/draft-document/inquiry',
  GENERATE_DRAFT_TEMPLATE: `api/ai/draft-document/generate-template`,

  // Trash bin endpoints
  GET_TRASHED_PROJECTS: `api/dms/workspaces/trash/user`,
  RESTORE_PROJECT: `api/dms/workspaces/restore`,

  // Creator endpoints
  APPLY_CREATOR: `api/users/creator/apply`,
  GET_MY_APPLICATIONS: `api/users/creator/application`,
  ELIGIBLE_FOR_CREATOR: `api/users/creator/eligibility`,

  // Admin endpoints
  ADMIN_STATS: `api/admin/stats`,
  ADMIN_APPLICATIONS: `api/admin/applications`,
  REVIEW_APPLICATION: `api/admin/applications`,
  APPROVE_APPLICATION: `api/admin/applications/:id/approve`,
  REJECT_APPLICATION: `api/admin/applications/:id/reject`,
  GET_USERS: `api/admin/users`,
  ADD_USER: `api/admin/user`,
  EDIT_USER: (userId: string) => `api/admin/user/${userId}/profile`,
  ADMIN_DASHBOARD: `api/admin/dashboard`,
  CLEANUP: `api/admin/cleanup`,
  AUDIT_LOGS: `api/admin/audit-logs`,
  AUDIT_LOGS_EXPORT: `api/admin/audit-logs/export`,
  AUDIT_LOGS_SEARCH: `api/admin/audit-logs/search`,
  UPDATE_USER_SCORE: `api/admin/users`,
  UPDATE_USER_ROLE: `api/admin/users`,
  USER_ACTION: `api/admin/users`,
  SYSTEM_HEALTH_CHECK: `api/admin/system/health`,
  SYSTEM_CLEANUP: `api/admin/system/cleanup`,

  //geniAi Endpoints
  GENAI_RISK_EVALUATE: `api/genai/risk-evaluate`,
  GENAI_SCORE: `api/genai/score`,
  GENAI_TEMPLATE: `api/genai/template`,

  //citations Endpoints
  SEND_DATA_FOR_CITATIONS_GENERATION: `api/ai/citations/get-enhanced`,
  GET_COMBINED_RECOMMENDATIONS: `api/ai/citations/get-combined-recommendations`,
  SAVE_CITATION_TO_DATABASE: `api/citations/save`,

  //grammer spellcheck Endpoints
  SEND_DATA_FOR_SPELLCHECK: `api/grammer-spellcheck`,

  //upload Endpoints
  DIRECT_UPLOAD: `api/documents/upload`,

  // Document endpoints
  GET_DOCUMENTS: `api/documents`,
  GET_DOCUMENT_BY_ID: (id: string) => `api/documents/${id}`,
  UPLOAD_DOCUMENT: `api/documents`,

  //copilotservice
  UPLOAD_DATA_FOR_ANALYSIS: `api/ai/copilot/analyze`,

  // New separate API endpoints
  FACT_CHECKER: 'api/ai/fact-check/verify-and-correct-blog',
  COMPLIANCE_CHECK: 'api/ai/compliance/analyze',
  ARGUMENT_LOGIC: 'api/ai/argument-logic/check',
  PLAGIARISM_CHECK: 'api/ai/legal-doc-quality/analyze-plagiarism',
  //batch version
  ARGUMENT_LOGIC_BATCH: 'api/ai/argument-logic/batch-analyze',
  // Batch endpoint
  COMPLIANCE_BATCH_CHECK: 'api/ai/compliance/batch-check',

  // AI
  // AI_COPILOT: `api/ai/copilot/query`,
  // AI_DRAFTING: `api/ai/drafting/generate`,
  TIMELINE_EXTRACT: 'api/ai/timeline/extract',

  // AI Writing endpoints
  AI_IMPROVE: `api/ai/writing/improve`,
  AI_PARAPHRASE: `api/ai/writing/paraphrase`,
  AI_TRANSLATE: `api/ai/writing/translate`,
  AI_GENERATE_PARAGRAPH: `api/ai/content/generate-paragraph`,

  GET_EXPLORE_MORE_ITEMS: `api/ai/copilot/explore-more-items`,
  SEARCH_LEGAL_DOCUMENTS: `api/ai/search/legal-documents`,

  //document for student
  CREATE_DOCUMENT: `api/student/create-document`,

  //library
  INIT_UPLOAD: 'api/dms/documents/init-upload',
  COMPLETE_UPLOAD: 'api/dms/documents/complete-upload',
  LIST_DOCUMENTS: 'api/dms/documents',
  GET_DOCUMENT: (documentId: string) => `api/dms/documents/${documentId}`,
  VIEW_DOCUMENT: (documentId: string) => `api/dms/documents/${documentId}/view`,
  DOWNLOAD_DOCUMENT: (documentId: string) => `api/dms/documents/${documentId}/download`,
  DELETE_DOCUMENT: (documentId: string) => `api/dms/documents/${documentId}`,

  // Templates
  LIST_TEMPLATES: 'api/dms/templates',
  SEARCH_TEMPLATES: 'api/dms/templates/search/',
  GET_TEMPLATE: (templateId: string) => `api/dms/templates/${templateId}`,
  INIT_TEMPLATE_UPLOAD: 'api/dms/templates/init-upload',
  COMPLETE_TEMPLATE_UPLOAD: 'api/dms/templates/complete-upload',

  //image
  INIT_IMAGE_UPLOAD: 'api/dms/images/init-upload',
  COMPLETE_IMAGE_UPLOAD: 'api/dms/images/complete-upload',
  UPLOAD_PROFILE_IMAGE: 'api/users/me/profile-image',
  GET_PROFILE_IMAGE: 'api/dms/images/profile',
  GET_PROFILE_IMAGE_URLS: 'api/users/me/profile-image-urls',
  GET_WORKSPACE_IMAGES: 'api/dms/images/workspace',
  DELETE_IMAGE: (imageId: string) => `api/dms/images/${imageId}`,

  //feedback
  SEND_FEEDBACK: `api/users/profile`,

  //conversion
  CONVERT_TEMPLATE: `api/ai/template/convert`,
  CONVERT_BATCH: `api/ai/template/convert-batch`,
  EXTRACT_TEXT: `api/dms/documents/extract-text`,

  REF_COLLECTIONS: 'api/ref-manager/collections',
  REF_FOLDERS: 'api/ref-manager/folders',
  REF_DOCUMENTS: 'api/ref-manager/ref-documents',
  REF_DOCUMENTS_PUBLIC_PREVIEW: 'api/ref-manager/ref-documents/public-preview',
  REF_ANNOTATIONS: 'api/ref-manager/annotations',
  REF_TAGS: 'api/ref-manager/tags',
  REF_NOTES: 'api/ref-manager/ref-notes',
  REF_VERSIONS: 'api/ref-manager/versions',
  REF_AI: 'api/ref-manager/ai',
  REF_REFERENCES: 'api/ref-manager/references',

  // Workspace References (citations for workspaces)
  ADD_WORKSPACE_REFERENCE: (workspaceId: string) => `api/dms/workspaces/${workspaceId}/references`,
  DELETE_WORKSPACE_REFERENCE: (workspaceId: string, referenceId: string) =>
    `api/dms/workspaces/${workspaceId}/references/${referenceId}`,

  // Dashboard
  DASHBOARD_ANALYTICS: 'api/dms/dashboard/analytics',

  // Prompt History
  PROMPT_HISTORY: 'api/dms/prompt-history',
} as const;
