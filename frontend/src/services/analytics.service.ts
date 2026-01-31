import { api } from '../config/api';

export interface StudentSummary {
  totalQuizzes: number;
  avgScore: number;
  avgAccuracy: number;
}

export interface SubjectAnalytics {
  subject: string;
  totalQuestions: number;
  correct: number;
  accuracy: number;
}

export interface ChapterAnalytics {
  subject: string;
  chapter: string;
  totalQuestions: number;
  correct: number;
  accuracy: number;
}

export type AnalyticsMode = 'PRACTICE' | 'CONTEST';

export interface ContestPerformance {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  attempted: boolean;
  score: number | null;
  totalQuestions: number | null;
  accuracy: number | null;
  completedAt: string | null;
}

export interface ContestAnalyticsSummary {
  totalContests: number;
  attemptedContests: number;
  missedContests: number;
  avgScore?: number;
  avgAccuracy?: number;
  contests: ContestPerformance[];
}

export interface ChildStats {
  id: string;
  name: string;
  email: string;
  boardCode?: string;
  standard?: number;
  totalQuizzes: number;
  totalAppeared: number;
  avgScore: number;
  avgAccuracy: number;
}

export interface ParentAnalytics {
  parent: {
    id: string;
    parentId: string;
    name: string;
    email?: string;
  };
  children: ChildStats[];
}

export const analyticsService = {
  getStudentSummary: async (mode?: AnalyticsMode): Promise<StudentSummary> => {
    const params = mode ? { mode } : {};
    const response = await api.get<StudentSummary>('/analytics/student/me/summary', { params });
    return response.data;
  },

  getStudentBySubject: async (mode?: AnalyticsMode): Promise<SubjectAnalytics[]> => {
    const params = mode ? { mode } : {};
    const response = await api.get<SubjectAnalytics[]>('/analytics/student/me/by-subject', { params });
    return response.data;
  },

  getStudentByChapter: async (subject?: string, mode?: AnalyticsMode): Promise<ChapterAnalytics[]> => {
    const params: Record<string, string> = {};
    if (subject) params.subject = subject;
    if (mode) params.mode = mode;
    const response = await api.get<ChapterAnalytics[]>('/analytics/student/me/by-chapter', { params });
    return response.data;
  },

  getStudentContestAnalytics: async (): Promise<ContestAnalyticsSummary> => {
    const response = await api.get<ContestAnalyticsSummary>('/analytics/student/me/contests');
    return response.data;
  },

  getParentChildren: async (): Promise<ParentAnalytics> => {
    const response = await api.get<ParentAnalytics>('/analytics/parent/me/children');
    return response.data;
  },

  getChildContestAnalytics: async (childId: string): Promise<ContestAnalyticsResponse[]> => {
    const response = await api.get<ContestAnalyticsResponse[]>(`/analytics/parent/child/${childId}/contests`);
    return response.data;
  },
};

export interface ContestAnalyticsResponse {
  id: string;
  title: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  userStatus: 'Attempted' | 'Not Given';
  score: number | null;
  totalQuestions: number;
  accuracy: number | null;
  startTime: string;
  endTime: string;
  completedAt: string | null;
}


