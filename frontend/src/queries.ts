import { useQuery, useMutation, UseMutationOptions } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// const API_URL = 'http://localhost:3000/api';
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Fetch all loans
export const useGetLoans = (userId?: number, filtros?: { nuevos?: boolean; desde?: string }) => {
  return useQuery({
    queryKey: ['loans', userId, filtros],
    queryFn: async () => {
      let url = `${API_URL}/loans`;
      const params = new URLSearchParams();
      
      if (userId) {
        params.append('userId', userId.toString());
      }
      
      if (filtros?.nuevos) {
        params.append('nuevos', 'true');
      }
      
      if (filtros?.desde) {
        params.append('desde', filtros.desde);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await res.json();
      // Mantener compatibilidad con el formato anterior
      return data.loans || data;
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

// Investment System Queries

// Get products for MiniTienda
export const useGetProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/investments/products`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Buy product (create investment)
export const useBuyProduct = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (purchaseData: { productId: number; cantidad: number; tipo_pago?: string }) => {
      const res = await fetch(`${API_URL}/investments/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(purchaseData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al comprar producto');
      }
      return res.json();
    },
    ...options,
  });
};

// Pay microcredit
export const usePayMicrocredit = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (paymentData: { investmentId: number }) => {
      const res = await fetch(`${API_URL}/investments/pay-microcredit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(paymentData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al pagar microcrédito');
      }
      return res.json();
    },
    ...options,
  });
};

// Get pending consignments
export const useGetPendingConsignments = () => {
  return useQuery({
    queryKey: ['pending-consignments'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/investments/pending-consignments`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Get approved consignments
export const useGetApprovedConsignments = () => {
  return useQuery({
    queryKey: ['approved-consignments'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/investments/approved-consignments`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Get paid purchases
export const useGetPaidPurchases = () => {
  return useQuery({
    queryKey: ['paid-purchases'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/investments/paid-purchases`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Get product payments history
export const useGetProductPayments = () => {
  return useQuery({
    queryKey: ['product-payments'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/investments/product-payments`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Approve consignment
export const useApproveConsignment = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (data: { investmentId: number }) => {
      const res = await fetch(`${API_URL}/investments/approve-consignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al aprobar consignación');
      }
      return res.json();
    },
    ...options,
  });
};

// Reject consignment
export const useRejectConsignment = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (data: { investmentId: number }) => {
      const res = await fetch(`${API_URL}/investments/reject-consignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al rechazar consignación');
      }
      return res.json();
    },
    ...options,
  });
};

// Cancel investment
export const useCancelInvestment = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (data: { investmentId: number }) => {
      const res = await fetch(`${API_URL}/investments/cancel-investment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al cancelar compra');
      }
      return res.json();
    },
    ...options,
  });
};

// Client Products
export const useGetClientProducts = () => {
  return useQuery({
    queryKey: ['client-products'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/client-products`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

export const useCreateClientProduct = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (productData: any) => {
      const res = await fetch(`${API_URL}/client-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al crear producto');
      }
      return res.json();
    },
    ...options,
  });
};

export const useUpdateClientProduct = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async ({ id, ...productData }: any) => {
      const res = await fetch(`${API_URL}/client-products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar producto');
      }
      return res.json();
    },
    ...options,
  });
};

export const useDeleteClientProduct = (options?: UseMutationOptions<any, Error, number>) => {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_URL}/client-products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar producto');
      }
      return res.json();
    },
    ...options,
  });
};

// Get categories
export const useGetCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/client-products/categories`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Get user investments
export const useGetUserInvestments = () => {
  return useQuery({
    queryKey: ['user-investments'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/investments/my-investments`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Report sale
export const useReportSale = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (saleData: {
      investmentId: number;
      cantidad_vendida: number;
      precio_venta: number;
      fecha_venta: string;
    }) => {
      const res = await fetch(`${API_URL}/investments/report-sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(saleData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al reportar venta');
      }
      return res.json();
    },
    ...options,
  });
};

// Get investment dashboard
export const useGetInvestmentDashboard = () => {
  return useQuery({
    queryKey: ['investment-dashboard'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/investments/dashboard`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Admin mutations
export const useCreateProduct = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (productData: any) => {
      const res = await fetch(`${API_URL}/investments/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al crear producto');
      }
      return res.json();
    },
    ...options,
  });
};

export const useUpdateProduct = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async ({ id, ...productData }: any) => {
      const res = await fetch(`${API_URL}/investments/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar producto');
      }
      return res.json();
    },
    ...options,
  });
};

export const useUpdateStock = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async ({ id, stock_disponible }: any) => {
      const res = await fetch(`${API_URL}/investments/products/${id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ stock_disponible }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar stock');
      }
      return res.json();
    },
    ...options,
  });
};

export const useDeleteProduct = (options?: UseMutationOptions<any, Error, number>) => {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_URL}/investments/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar producto');
      }
      return res.json();
    },
    ...options,
  });
};

export const useUploadProductImage = (options?: UseMutationOptions<any, Error, File>) => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await fetch(`${API_URL}/upload/product-image`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al subir imagen');
      }
      return res.json();
    },
    ...options,
  });
};

// Get collector stores
export const useGetCollectorStores = () => {
  return useQuery({
    queryKey: ['collector-stores'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/investments/collector-stores`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

export const useConfigureStore = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (storeData: { tienda_nombre: string; tienda_slug: string }) => {
      const res = await fetch(`${API_URL}/investments/configure-store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(storeData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al configurar tienda');
      }
      return res.json();
    },
    ...options,
  });
};

export const useUpdateUser = (options?: UseMutationOptions<any, Error, { id: number; formData: FormData }>) => {
  return useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar usuario');
      }
      return res.json();
    },
    ...options,
  });
};

export const useDeleteUser = (options?: UseMutationOptions<any, Error, number>) => {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar usuario');
      }
      return res.json();
    },
    ...options,
  });
};

// Verificar elegibilidad para renovación
export const useCheckRenewalEligibility = (userId: number) => {
  return useQuery({
    queryKey: ['renewal-eligibility', userId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/loan-renewal/check-eligibility/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('Error al verificar elegibilidad');
      }
      return res.json();
    },
    enabled: !!userId,
  });
};

// Crear renovación de préstamo
export const useCreateRenewalLoan = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_URL}/loan-renewal/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al crear renovación');
      }
      return res.json();
    },
    onSuccess: (data, variables, context) => {
      // Ejecutar callback personalizado si existe
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};

// Download loan PDF
// Fetch loans by status (nuevos vs existentes)
export const useGetLoansByStatus = () => {
  return useQuery({
    queryKey: ['loans-by-status'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/loans/by-status`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
};

// Update loan
export const useUpdateLoan = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async ({ id, ...loanData }: any) => {
      const res = await fetch(`${API_URL}/loans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(loanData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar préstamo');
      }
      return res.json();
    },
    ...options,
  });
};

// Request restock for out-of-stock product
export const useRequestRestock = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (data: { productId: number }) => {
      const res = await fetch(`${API_URL}/investments/request-restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al solicitar restock');
      }
      return res.json();
    },
    ...options,
  });
};

// Get restock requests
export const useGetRestockRequests = () => {
  return useQuery({
    queryKey: ['restock-requests'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/investments/restock-requests`, { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
    retry: false,
    refetchOnWindowFocus: false
  });
};

// Approve restock request
export const useApproveRestock = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (data: { requestId: number }) => {
      const res = await fetch(`${API_URL}/investments/approve-restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al aprobar solicitud de restock');
      }
      return res.json();
    },
    ...options,
  });
};

// Reject restock request
export const useRejectRestock = (options?: UseMutationOptions<any, Error, any>) => {
  return useMutation({
    mutationFn: async (data: { requestId: number }) => {
      const res = await fetch(`${API_URL}/investments/reject-restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al rechazar solicitud de restock');
      }
      return res.json();
    },
    ...options,
  });
};

export const downloadLoanPDF = async (loanId: number) => {
  try {
    const res = await fetch(`${API_URL}/pdf/loan/${loanId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!res.ok) {
      throw new Error('Error al generar PDF');
    }
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    
    // Obtener nombre del archivo del header Content-Disposition
    const contentDisposition = res.headers.get('Content-Disposition');
    console.log('Content-Disposition:', contentDisposition);
    let filename = `Cliente_${loanId}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (contentDisposition) {
      // Buscar tanto filename= como filename*=
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/); 
      console.log('Filename match:', filenameMatch);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/["']/g, '');
        // Si está codificado, decodificar
        if (filename.includes('UTF-8')) {
          filename = decodeURIComponent(filename.split("''")[1] || filename);
        }
        console.log('Final filename:', filename);
      }
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};
