import axios from 'axios';

export const djangoApi = axios.create({
  baseURL: '/api/django',
  headers: { 'Content-Type': 'application/json' },
});

export const fastapiApi = axios.create({
  baseURL: '/api/fastapi',
  headers: { 'Content-Type': 'application/json' },
});
