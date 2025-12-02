import { useQuery, useMutation, UseMutationOptions } from '@tanstack/react-query';

// const API_URL = 'http://localhost:3000/api';
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

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
export const useCreateUser = (options?: UseMutationOptions<any, Error, FormData>) => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear usuario');
      }
      return res.json();
    },
    ...options,
  });
};

// Create a new loan
export const useCreateLoan = (options?: UseMutationOptions<any, Error, any>) => {
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
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear préstamo');
      }
      return res.json();
    },
    ...options,
  });
};

// Upload a payment receipt
export const useUploadReceipt = (
  isCollector?: boolean,
  options?: UseMutationOptions<any, Error, FormData>
) => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const isEditing = formData.get('isEditing') === 'true';
      
      let endpoint;
      let method = 'POST';
      
      if (isEditing) {
        // Si estamos editando, usar endpoint de actualización
        const paymentId = formData.get('paymentId');
        endpoint = `${API_URL}/payments/${paymentId}/update-receipt`;
        method = 'PUT';
      } else {
        // Si es nuevo pago, usar endpoints existentes
        endpoint = isCollector ? `${API_URL}/payments/upload-and-confirm` : `${API_URL}/payments/upload`;
      }
      
      const res = await fetch(endpoint, {
        method,
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

// Fetch all payments
export const useGetPayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/payments`, { headers: getAuthHeaders() });
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
  const res = await fetch(`${API_URL}/login`, {
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

export const loginAdmin = async ({ email, password }: any) => {
  const res = await fetch(`${API_URL}/admin-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Error en el login de administrador');
  }
  return res.json();
};

// Delete a payment
export const useDeletePayment = (options?: UseMutationOptions<any, Error, number>) => {
  return useMutation({
    mutationFn: async (paymentId: number) => {
      const res = await fetch(`${API_URL}/payments/${paymentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al borrar pago');
      }
      return res.json();
    },
    ...options,
  });
};
