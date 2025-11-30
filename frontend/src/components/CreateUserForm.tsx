import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useCreateUser } from '../queries';

const CreateUserForm: React.FC = () => {
  const createUserMutation = useCreateUser();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    fecha_nacimiento: '',
    tipo_comercio: '',
    whatsapp: '',
    rol: '',
    foto: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, foto: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append('nombre', formData.nombre);
    data.append('apellido', formData.apellido);
    data.append('cedula', formData.cedula);
    data.append('fecha_nacimiento', formData.fecha_nacimiento);
    data.append('tipo_comercio', formData.tipo_comercio);
    data.append('whatsapp', formData.whatsapp);
    data.append('rol', formData.rol);
    if (formData.foto) {
      data.append('foto', formData.foto);
    }

    try {
      await createUserMutation.mutateAsync(data);
      toast.success('Usuario creado exitosamente!');
      // Reset form
      setFormData({
        nombre: '',
        apellido: '',
        cedula: '',
        fecha_nacimiento: '',
        tipo_comercio: '',
        whatsapp: '',
        rol: '',
        foto: null,
      });
    } catch (error) {
      toast.error('Error creando usuario: ' + (error as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg shadow-md">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre:</label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Apellido:</label>
        <input
          type="text"
          name="apellido"
          value={formData.apellido}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Cédula:</label>
        <input
          type="text"
          name="cedula"
          value={formData.cedula}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento:</label>
        <input
          type="date"
          name="fecha_nacimiento"
          value={formData.fecha_nacimiento}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo de Comercio:</label>
        <input
          type="text"
          name="tipo_comercio"
          value={formData.tipo_comercio}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">WhatsApp:</label>
        <input
          type="text"
          name="whatsapp"
          value={formData.whatsapp}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Rol:</label>
        <select
          name="rol"
          value={formData.rol}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        >
          <option value="">Selecciona un rol</option>
          <option value="COLECTOR">COLECTOR</option>
          <option value="DEUDOR">DEUDOR</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Foto:</label>
        <input
          type="file"
          name="foto"
          onChange={handleFileChange}
          accept="image/*"
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-sm"
      >
        Crear Usuario
      </button>
    </form>
  );
};

export default CreateUserForm;
