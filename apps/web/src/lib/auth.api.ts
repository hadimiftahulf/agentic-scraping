import api from './api';

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthResponse {
  data: {
    type: 'auth_session';
    id: string;
    attributes: AuthSession;
  };
}

export const authApi = {
  login: async (credentials: any): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/api/v1/auth/login', {
      data: {
        type: 'auth_credentials',
        attributes: credentials,
      },
    });
    return data;
  },

  register: async (userData: any): Promise<any> => {
    const { data } = await api.post('/api/v1/auth/register', {
      data: {
        type: 'users',
        attributes: userData,
      },
    });
    return data;
  },

  getMe: async (): Promise<any> => {
    const { data } = await api.get('/api/v1/auth/me');
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/v1/auth/logout');
  },
};
