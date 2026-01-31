import { api } from '../config/api';
import type { Quiz } from './learning.service';

export interface Contest {
  _id: string;
  title: string;
  description: string;
  boardCode: string;
  standard: number;
  subject?: string;
  chapter?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  questionTypes: string[];
  timerSeconds: number;
  startTime: string;
  endTime: string;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  quizTemplateId?: string;
  resultsPublished: boolean;
  solutionsPublished: boolean;
  createdAt: string;
  attempted?: boolean;
}

export interface CreateContestRequest {
  title: string;
  description: string;
  boardCode: string;
  standard: number;
  subject?: string;
  chapter?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  questionTypes: string[];
  timerSeconds: number;
  startTime: string;
  endTime: string;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  accuracy: number;
  completedAt: string;
}

export interface Leaderboard {
  contestId: string;
  leaderboard: LeaderboardEntry[];
}

export interface ContestStats {
  totalStudents: number;
  missedStudents: { name: string; email: string }[];
  totalParticipants: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  scoreDistribution: { [key: string]: number };
  topPerformers: {
    name: string;
    email: string;
    score: number;
    accuracy: number;
  }[];
}

export const contestsService = {
  getContests: async (status?: string): Promise<Contest[]> => {
    const params = status ? { status } : {};
    const response = await api.get<Contest[]>('/contests', { params });
    return response.data;
  },

  // Contests visible to current student (filtered by their board & class)
  getStudentContests: async (status?: string): Promise<Contest[]> => {
    const params = status ? { status } : {};
    const response = await api.get<Contest[]>('/contests/student', { params });
    return response.data;
  },

  getContest: async (id: string): Promise<Contest> => {
    const response = await api.get<Contest>(`/contests/${id}`);
    return response.data;
  },

  getContestStats: async (id: string): Promise<ContestStats> => {
    const response = await api.get<ContestStats>(`/contests/${id}/stats`);
    return response.data;
  },

  createContest: async (data: CreateContestRequest): Promise<Contest> => {
    const response = await api.post<Contest>('/contests', data);
    return response.data;
  },

  deleteContest: async (id: string): Promise<void> => {
    await api.delete(`/contests/${id}`);
  },

  updateContestStatus: async (id: string, status: Contest['status']): Promise<Contest> => {
    const response = await api.patch<Contest>(`/contests/${id}/status`, { status });
    return response.data;
  },

  updateContestTiming: async (
    id: string,
    data: { startTime: string; endTime: string; timerSeconds: number }
  ): Promise<Contest> => {
    const response = await api.patch<Contest>(`/contests/${id}/timing`, data);
    return response.data;
  },

  generateQuizTemplate: async (id: string) => {
    const response = await api.post(`/contests/${id}/generate-quiz-template`);
    return response.data;
  },

  generateCandidateQuestions: async (id: string): Promise<{ questions: any[] }> => {
    const response = await api.post(`/contests/${id}/generate-quiz-template`, { preview: true });
    return response.data;
  },

  saveQuizTemplate: async (id: string, questions: any[]) => {
    const response = await api.post(`/contests/${id}/save-quiz-template`, { questions });
    return response.data;
  },

  getContestQuiz: async (id: string) => {
    const response = await api.get(`/contests/${id}/quiz`);
    return response.data;
  },

  getLeaderboard: async (id: string): Promise<Leaderboard> => {
    const response = await api.get<Leaderboard>(`/contests/${id}/leaderboard`);
    return response.data;
  },

  getSolutions: async (id: string): Promise<Quiz> => {
    const response = await api.get<Quiz>(`/contests/${id}/solutions`);
    return response.data;
  },
};


