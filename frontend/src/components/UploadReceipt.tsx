import React, { useState } from 'react';
import { useUploadReceipt } from '../queries';

interface UploadReceiptProps {
  installmentId: string;
  expectedMonto: number;
  onClose: () => void;
  debtorId?: number; // Make debtorId optional as it might be passed from CollectorDashboard
  isCollector?: boolean; // New prop to indicate if the uploader is a collector
  onSuccessfulUploadAndConfirm?: (paymentId: number, installmentId: number, monto: number) => void; // Callback for collector's auto-confirmation
  paymentId?: number; // ID del pago a editar (opcional)
  isEditing?: boolean; // Indica si estamos editando un pago existente
  onSuccess?: () => void; // Callback for success notification
}

const UploadReceipt: React.FC<UploadReceiptProps> = ({ installmentId, expectedMonto, onClose, debtorId, isCollector, onSuccessfulUploadAndConfirm, paymentId, isEditing, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [monto, setMonto] = useState<string>(expectedMonto.toString());
  const [isDragging, setIsDragging] = useState(false);
  const { mutate: uploadReceipt, isLoading, isSuccess, isError, error } = useUploadReceipt(isCollector, {
    onSuccess: (data) => {
      // For collectors, trigger the confirmation callback directly
      if (isCollector && onSuccessfulUploadAndConfirm) {
        onSuccessfulUploadAndConfirm(data.paymentId, parseInt(installmentId), parseFloat(monto));
      }
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      onClose(); // Close modal and trigger refetch in parent
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMonto(value);
    }
  };

  const formatMonto = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value);
    return num.toLocaleString('es-PY');
  };

  const handleSubmit = () => {
    const montoNum = parseFloat(monto);
    if (file && montoNum > 0) {
      const formData = new FormData();
      formData.append('installmentId', installmentId);
      if (debtorId) {
        formData.append('userId', debtorId.toString());
      }
      formData.append('monto', montoNum.toString());
      formData.append('comprobante', file);
      formData.append('comentario', isEditing ? 'Comprobante actualizado' : 'Comprobante de pago');
      
      // Si estamos editando, agregar el ID del pago
      if (isEditing && paymentId) {
        formData.append('paymentId', paymentId.toString());
        formData.append('isEditing', 'true');
      }

      uploadReceipt(formData);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const montoNum = parseFloat(monto);
  const isValid = file && montoNum > 0;

  return (
    <div className="space-y-5">
      {/* Monto Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          💰 Monto del Pago
        </label>
        <div className="relative">
          <input
            type="text"
            value={monto}
            onChange={handleMontoChange}
            className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-semibold text-slate-800"
            placeholder="0"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <span className="text-slate-500 font-medium text-sm">Gs</span>
          </div>
        </div>
        {monto && montoNum > 0 && (
          <p className="mt-2 text-sm text-slate-600 font-medium">
            {formatMonto(monto)} Guaraníes
          </p>
        )}
      </div>

      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          📎 {isEditing ? 'Nuevo Comprobante de Pago' : 'Comprobante de Pago'}
        </label>
        
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden
              ${isDragging 
                ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
          >
            <label className="flex flex-col items-center justify-center px-6 py-8 cursor-pointer">
              <div className={`text-6xl mb-3 transition-transform ${isDragging ? 'scale-110' : ''}`}>
                📤
              </div>
              <p className="text-slate-700 font-semibold mb-1">
                {isEditing ? 'Seleccionar nuevo comprobante' : 'Haz clic para seleccionar'}
              </p>
              <p className="text-slate-500 text-sm mb-3">
                o arrastra y suelta aquí
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                  PNG
                </span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                  JPG
                </span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                  PDF
                </span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                  Hasta 10MB
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,.pdf"
              />
            </label>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-3xl">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-semibold truncate">
                    {file.name}
                  </p>
                  <p className="text-slate-600 text-sm">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors flex-shrink-0"
                title="Eliminar archivo"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all shadow-lg
          ${isValid && !isLoading
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]'
            : 'bg-slate-300 cursor-not-allowed'
          }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
            Subiendo comprobante...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>📤</span>
            {isEditing ? 'Actualizar Comprobante' : 'Subir Comprobante'}
          </span>
        )}
      </button>

      {/* Status Messages */}
      {isSuccess && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="text-2xl">✓</div>
          <p className="text-emerald-700 font-semibold">
            {isEditing ? '¡Comprobante actualizado exitosamente!' : '¡Comprobante subido exitosamente!'}
          </p>
        </div>
      )}
      
      {isError && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
          <div className="text-2xl">⚠</div>
          <div className="flex-1">
            <p className="text-red-700 font-semibold">
              {isEditing ? 'Error al actualizar comprobante' : 'Error al subir comprobante'}
            </p>
            {error?.message && (
              <p className="text-red-600 text-sm mt-1">
                {error.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadReceipt;