import { api } from '../config/api';
import type { Quiz } from './learning.service';

export interface Answer {
  questionIndex: number;
  selectedOptionIndex?: number;
  answerText?: string;
}

export interface Submission {
  _id: string;
  quizId: string;
  studentId: string;
  contestId?: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  startedAt: string;
  completedAt: string;
  // Optional metadata from populated quiz
  quizTitle?: string | null;
  quizMode?: 'LEARNING' | 'CONTEST' | null;
  quizSubject?: string | null;
  quizChapter?: string | null;
  quizDifficulty?: 'easy' | 'medium' | 'hard' | null;
  contestTitle?: string | null;
  answers: Array<{
    questionIndex: number;
    selectedOptionIndex?: number;
    answerText?: string;
    isCorrect: boolean;
  }>;
}

export interface SubmitQuizRequest {
  answers: Answer[];
}

export interface SubmissionDetails {
  submission: Submission;
  quiz: Quiz;
}

export const submissionsService = {
  submitQuiz: async (quizId: string, data: SubmitQuizRequest): Promise<Submission> => {
    const response = await api.post<Submission>(`/submissions/${quizId}/submit`, data);
    return response.data;
  },

  getMySubmissions: async (): Promise<Submission[]> => {
    const response = await api.get<Submission[]>('/submissions/me');
    return response.data;
  },

  getSubmissionDetails: async (id: string): Promise<SubmissionDetails> => {
    const response = await api.get<SubmissionDetails>(`/submissions/${id}`);
    return response.data;
  },

  getStudentSubmissions: async (studentId: string): Promise<Submission[]> => {
    const response = await api.get<Submission[]>(`/submissions/student/${studentId}`);
    return response.data;
  },
};


