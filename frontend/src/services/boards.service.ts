import { api } from '../config/api';

export interface Board {
  _id: string;
  name: string;
  code: string;
  standards: Array<{
    grade: number;
    subjects: Array<{
      name: string;
      chapters: Array<{
        name: string;
      }>;
    }>;
  }>;
}

export const boardsService = {
  getBoards: async (): Promise<Board[]> => {
    const response = await api.get<Board[]>('/boards');
    return response.data;
  },

  getStandards: async (boardCode: string) => {
    const response = await api.get(`/boards/${boardCode}/standards`);
    return response.data;
  },

  getSubjects: async (boardCode: string, grade: number) => {
    const response = await api.get(`/boards/${boardCode}/standards/${grade}/subjects`);
    return response.data;
  },

  getChapters: async (boardCode: string, grade: number, subject: string) => {
    const response = await api.get(`/boards/${boardCode}/standards/${grade}/subjects/${subject}/chapters`);
    return response.data;
  },
};


