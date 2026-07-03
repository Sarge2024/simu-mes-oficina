import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const djangoApi = axios.create({
  baseURL: '/api/django/api',
  headers: { 'Content-Type': 'application/json' },
});

djangoApi.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  if (state.tenantId) {
    config.headers['X-Tenant-ID'] = String(state.tenantId);
  }
  if (state.user?.role === 'MASTER') {
    config.headers['X-Master-Role'] = 'true';
  }
  return config;
});

export const fastapiApi = axios.create({
  baseURL: '/api/fastapi',
  headers: { 'Content-Type': 'application/json' },
});
