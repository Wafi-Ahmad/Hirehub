// API base URL for all requests
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/users/login/',
  REGISTER: '/users/register/',
  LOGOUT: '/users/logout/',
  PASSWORD_RESET: '/users/password-reset/',
  PASSWORD_RESET_CONFIRM: '/users/reset-password-confirm/'
};

// User endpoints
export const USER_ENDPOINTS = {
  PROFILE: '/users/profile/me/',
  UPDATE_PROFILE: '/users/update-basic-info/',
  UPDATE_PRIVACY: '/users/update-privacy/',
  SEARCH_PROFILES: '/users/search-profiles/',
  FOLLOW_USER: '/users/follow/',
  FOLLOWERS_FOLLOWING: '/users/followers-following/',
  NOTIFICATIONS: '/users/notifications/',
  RECOMMENDATIONS: '/users/recommendations/'
};

// CV endpoints
export const CV_ENDPOINTS = {
  UPLOAD_CV: '/users/cv/',
  PARSE_CV: '/users/parse-cv/'
};

// Posts endpoints
export const POST_ENDPOINTS = {
  LIST_POSTS: '/posts/',
  CREATE_POST: '/posts/',
  POST_DETAIL: '/posts/:id/'
};

// Jobs endpoints
export const JOB_ENDPOINTS = {
  LIST_JOBS: '/jobs/',
  CREATE_JOB: '/jobs/',
  JOB_DETAIL: '/jobs/:id/',
  APPLY_JOB: '/jobs/:id/apply/'
};

// Messages endpoints
export const MESSAGE_ENDPOINTS = {
  CONVERSATIONS: '/messages/conversations/',
  CONVERSATION_DETAIL: '/messages/conversations/:id/'
}; 