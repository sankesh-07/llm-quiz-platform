import { api } from '../config/api';

export interface LoginRequest {
  identifier: string;
  password: string;
  role: 'student' | 'admin' | 'parent';
}

export interface RegisterStudentRequest {
  name: string;
  email: string;
  password: string;
  boardCode?: string;
  standard?: number;
  parentEmail: string;
  parentName: string;
}

export interface RegisterAdminRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterParentRequest {
  parentId: string;
  name: string;
  email?: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email?: string;
    role: 'student' | 'admin' | 'parent';
    parentId?: string;
  };
}

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  registerStudent: async (data: RegisterStudentRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register-student', data);
    return response.data;
  },

  registerAdmin: async (data: RegisterAdminRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register-admin', data);
    return response.data;
  },

  registerParent: async (data: RegisterParentRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register-parent', data);
    return response.data;
  },
};


