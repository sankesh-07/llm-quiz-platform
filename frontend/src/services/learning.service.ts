import { api } from '../config/api';

export interface Question {
  prompt: string;
  // Only MCQ and NUMERIC questions are supported in the UI
  type: 'MCQ' | 'NUMERIC';
  options?: string[];
  correctOptionIndex?: number;
  correctAnswerText?: string;
  explanation?: string;
  subject?: string;
  chapter?: string;
}

export interface Quiz {
  _id: string;
  mode: 'LEARNING' | 'CONTEST';
  title?: string;
  description?: string;
  boardCode: string;
  standard: number;
  subject?: string;
  chapter?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  timerSeconds?: number;
  startTime?: string;
  endTime?: string;
  questions: Question[];
  createdAt: string;
}

export interface CreateLearningQuizRequest {
  title?: string;
  description?: string;
  boardCode: string;
  standard: number;
  subject?: string;
  chapter?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  questionTypes?: string[];
  timerSeconds?: number;
  startTime?: string;
  endTime?: string;
}

export const learningService = {
  createQuiz: async (data: CreateLearningQuizRequest): Promise<Quiz> => {
    const response = await api.post<Quiz>('/learning/quiz', data);
    return response.data;
  },

  getMyQuizzes: async (): Promise<Quiz[]> => {
    const response = await api.get<Quiz[]>('/learning/quizzes');
    return response.data;
  },
};


