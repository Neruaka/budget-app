// src/infrastructure/api.ts

import { Expense, Category, Budget, CreateExpenseDTO, CreateBudgetDTO, User } from '../domain/types';

// L'URL du backend — sera remplacée par la variable Docker demain
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const CURRENT_USER_ID = 'user-test';

// Helper générique pour les requêtes
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erreur réseau' }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── AUTH ────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, nom: string, prenom: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nom, prenom }),
    }),
};

// ─── EXPENSES ──────────────────────────────────────────────
export const expensesApi = {
  getAll: () => request<Expense[]>(`/expenses/${CURRENT_USER_ID}`),

  getByMonth: (mois: number, annee: number) =>
    request<Expense[]>(`/expenses/${CURRENT_USER_ID}/period/${annee}/${mois}`),

create: (data: CreateExpenseDTO) =>
  request<{ expense: Expense; budgetDepasse: boolean; montantRestant: number }>('/expenses', {
    method: 'POST',
    body: JSON.stringify({ ...data, userId: CURRENT_USER_ID }),
  }).then(res => res.expense),

  update: (id: string, data: Partial<CreateExpenseDTO>) =>
    request<Expense>(`/expenses/${CURRENT_USER_ID}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/expenses/${CURRENT_USER_ID}/${id}`, { method: 'DELETE' }),
};

// ─── CATEGORIES ──────────────────────────────────────────────

export const categoriesApi = {
  getAll: () => request<Category[]>('/categories'),
};

// ─── BUDGET ──────────────────────────────────────────────────
export const budgetApi = {
  getCurrent: () => {
    const now = new Date();
    return request<Budget | null>(
      `/budget/${CURRENT_USER_ID}/${now.getFullYear()}/${now.getMonth() + 1}`
    ).catch(() => null); 
  },

  set: (data: CreateBudgetDTO) =>
    request<Budget>('/budget', {
      method: 'POST',
      body: JSON.stringify({ ...data, userId: CURRENT_USER_ID }),
    }),
};