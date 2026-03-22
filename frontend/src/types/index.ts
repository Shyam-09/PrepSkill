// Auth
export interface User { id: string; name: string; email: string; role: 'user' | 'admin'; }
export interface AuthResponse { accessToken: string; refreshToken: string; user: User; }

// Content
export type Difficulty = 'easy' | 'medium' | 'hard';
export type SheetDifficulty = 'beginner' | 'intermediate' | 'advanced';
export interface Category { id: string; name: string; slug: string; description?: string; icon?: string; order: number; }
export interface Sheet { id: string; title: string; slug: string; description?: string; totalProblems: number; difficulty: SheetDifficulty; isPremium: boolean; order: number; categoryId: string; category?: Category; }
export interface Topic { id: string; title: string; slug: string; description?: string; order: number; sheetId: string; problems?: Problem[]; }
export interface Problem { id: string; title: string; slug: string; difficulty: Difficulty; tags: string[]; leetcodeUrl?: string; articleUrl?: string; videoUrl?: string; isPremium: boolean; order: number; topicId: string; sheetId: string; }

// Progress
export interface SolvedProblem { id: string; problemId: string; sheetId: string; topicId: string; difficulty: Difficulty; notes?: string; isRevision: boolean; solvedAt: string; }
export interface SheetProgress { id: string; sheetId: string; totalProblems: number; solvedCount: number; completionPercentage: number; lastActivityAt: string; }
export interface UserProgress { id: string; userId: string; totalSolved: number; easySolved: number; mediumSolved: number; hardSolved: number; currentStreak: number; longestStreak: number; solvedProblems: SolvedProblem[]; sheetProgress: SheetProgress[]; }

// Mock
export type MockDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';
export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned';
export interface MockQuestion { id: string; question: string; options: string[]; difficulty: MockDifficulty; marks: number; order: number; testId: string; correctAnswer?: number; explanation?: string; }
export interface MockTest { id: string; title: string; description?: string; category: string; totalMarks: number; duration: number; difficulty: MockDifficulty; isPremium: boolean; totalAttempts: number; questions?: MockQuestion[]; }
export interface AnswerDetail { id: string; selectedOption: number; isCorrect: boolean; marksAwarded: number; questionId: string; }
export interface MockAttempt { id: string; userId: string; testId: string; score: number; totalMarks: number; percentage: number; rank?: number; timeTakenSeconds: number; status: AttemptStatus; startedAt: string; completedAt?: string; test?: MockTest; answers?: AnswerDetail[]; }

// Interviews
export type InterviewOutcome = 'selected' | 'rejected' | 'in_progress';
export type YOE = 'fresher' | 'one_to_three' | 'three_to_five' | 'five_plus';
export type RoundResult = 'passed' | 'failed' | 'pending';
export interface InterviewRound { id: string; roundName: string; description: string; questions: string[]; difficulty: Difficulty; result: RoundResult; }
export interface InterviewExperience { id: string; userId: string; company: string; companySlug: string; role: string; package?: string; yoe: YOE; outcome: InterviewOutcome; interviewDate: string; overallExperience: string; tips?: string; difficulty: Difficulty; upvoteCount: number; isAnonymous: boolean; tags: string[]; rounds: InterviewRound[]; createdAt: string; }

// Analytics
export interface PlatformStats { totalUsers: number; totalProblems: number; totalSheets: number; totalSolves: number; totalMockAttempts: number; totalInterviewPosts: number; }
export interface ActivityByDay { date: string; solves: number; }
export interface UserAnalytics { userId: string; totalSolved: number; easySolved: number; mediumSolved: number; hardSolved: number; currentStreak: number; longestStreak: number; mockAttempts: number; averageMockScore: number; interviewPosts: number; activityByDay: ActivityByDay[]; }
export interface LeaderboardEntry { userId: string; name: string; totalSolved: number; rank: number; currentStreak: number; }
