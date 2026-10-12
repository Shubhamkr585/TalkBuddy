import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { axiosInstance } from '@/lib/axios';

import { User } from '../types';

interface AuthState {
  authUser: User | null; // We will use this name everywhere
  isCheckingAuth: boolean;
  isLoggingIn: boolean;

  checkAuth: () => Promise<void>;
  signup: (data: any) => Promise<void>;
  login: (data: any) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authUser: null,
      isCheckingAuth: true,
      isLoggingIn: false,

      checkAuth: async () => {
        try {
          const res = await axiosInstance.get('/auth/me');
          set({ authUser: res.data });
        } catch (error) {
          set({ authUser: null });
        } finally {
          set({ isCheckingAuth: false });
        }
      },

      signup: async (data) => {
        try {
          const res = await axiosInstance.post('/auth/signup', data);
          set({ authUser: res.data.user });
        } catch (error) {
          console.log("Signup error", error);
        }
      },

      login: async (data) => {
        set({ isLoggingIn: true });
        try {
          const res = await axiosInstance.post('/auth/login', data);
          set({ authUser: res.data.user });
        } catch (error) {
          console.log("Login error", error);
        } finally {
          set({ isLoggingIn: false });
        }
      },

      logout: async () => {
        try {
          await axiosInstance.post('/auth/logout');
          set({ authUser: null });
        } catch (error) {
          console.log("Logout error", error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ authUser: state.authUser }),
    }
  )
);