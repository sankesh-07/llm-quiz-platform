import { api } from '../config/api';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role: 'student' | 'admin' | 'parent';
  boardCode?: string;
  standard?: number;
  parentId?: string;
  parent?: {
    name: string;
    email?: string;
  };
}

export const usersService = {
  updateEducation: async (data: { boardCode: string; standard: number }): Promise<UserProfile> => {
    const response = await api.patch<UserProfile>('/users/me/education', data);
    return response.data;
  },

  getStudents: async (filters?: { boardCode?: string; standard?: number }): Promise<UserProfile[]> => {
    const response = await api.get<UserProfile[]>('/users', { params: filters });
    return response.data;
  },

  getStudentDetails: async (id: string): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/users/${id}`);
    return response.data;
  },
};
