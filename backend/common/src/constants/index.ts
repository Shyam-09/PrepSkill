// Cache keys
export const CACHE_KEYS = {
  USER_ANALYTICS: (userId: string) => `analytics:user:${userId}`,
  DASHBOARD: "analytics:dashboard",
  LEADERBOARD: (type: string) => `leaderboard:${type}`,
  CATEGORIES_ALL: "categories:all",
  CATEGORY_BY_ID: (id: string) => `category:${id}`,
  PROBLEMS_BY_SHEET: (sheetId: string) => `problems:sheet:${sheetId}`,
  PROBLEM_BY_ID: (id: string) => `problem:${id}`,
  TOPICS_BY_SHEET: (sheetId: string) => `topics:sheet:${sheetId}`,
  TOPIC_BY_ID: (id: string) => `topic:${id}`,
  SHEET_BY_ID: (id: string) => `sheet:${id}`,
  PROGRESS_USER: (userId: string) => `progress:${userId}`,
  PROGRESS_SHEET: (userId: string, sheetId: string) => `progress:${userId}:sheet:${sheetId}`,
  STATS_USER: (userId: string) => `stats:${userId}`,
  ATTEMPTS_USER: (userId: string) => `attempts:${userId}`,
  ATTEMPT_BY_ID: (id: string) => `attempt:${id}`,
  LEADERBOARD_MOCK: (testId: string, limit: number) => `leaderboard:mock:${testId}:top${limit}`,
  INTERVIEWS_ALL: "interviews:all",
  INTERVIEW_BY_ID: (id: string) => `interview:${id}`,
  USER_BY_ID: (id: string) => `user:${id}`,
} as const;


export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
} as const;


export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;


export const ERROR_MESSAGES = {
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden action",
  VALIDATION_FAILED: "Validation failed",
  INTERNAL_ERROR: "Internal server error",
  RATE_LIMIT_EXCEEDED: "Too many requests",
} as const;