import { create } from 'zustand';
import axios from 'axios';

interface AuthState {
  token: string | null;
  user: any | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,

  login: async (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    const res = await axios.post('https://smartneer.onrender.com/token', params);
    const token = res.data.access_token;
    localStorage.setItem('token', token);
    set({ token });
    await get().fetchUser();
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },

  fetchUser: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await axios.get('https://smartneer.onrender.com/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: res.data });
    } catch (e) {
      set({ token: null, user: null });
      localStorage.removeItem('token');
    }
  }
}));
