import { useQuery, useMutation, UseMutationOptions } from '@tanstack/react-query';

const API_URL = 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Fetch all loans
export const useGetLoans = (userId?: number) => {
  return useQuery({
    queryKey: ['loans', userId],
    queryFn: async () => {
      const url = userId ? `${API_URL}/loans?userId=${userId}` : `${API_URL}/loans`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Create a new user
export const useCreateUser = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Create a new loan
export const useCreateLoan = () => {
  return useMutation({
    mutationFn: async (newLoan: any) => {
      const res = await fetch(`${API_URL}/loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(newLoan),
      });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Upload a payment receipt
export const useUploadReceipt = (
  isCollector?: boolean,
  options?: UseMutationOptions<any, Error, FormData>
) => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const endpoint = isCollector ? `${API_URL}/payments/upload-and-confirm` : `${API_URL}/payments/upload`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      });
      if (!res.ok) {
        const errorBody = await res.text();
        console.error('Upload receipt error:', errorBody);
        throw new Error(`Network response was not ok: ${errorBody}`);
      }
      return res.json();
    },
    ...options,
  });
};

// Confirm a payment
export const useConfirmPayment = () => {
  return useMutation({
    mutationFn: async (paymentConfirmation: { paymentId: number; installmentId: number; monto: number }) => {
      const res = await fetch(`${API_URL}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(paymentConfirmation),
      });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Get user scoring
export const useGetUserScoring = (userId: number) => {
  return useQuery({
    queryKey: ['scoring', userId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/users/${userId}/scoring`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Fetch all users
export const useGetUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Obtener un usuario por ID
export const useGetUser = (userId: number) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/users/${userId}`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

export const loginUser = async ({ email, password }: any) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorBody = await res.json(); // Assuming error response is also JSON
    throw new Error(errorBody.message || 'Error en el login');
  }
  return res.json();
};
