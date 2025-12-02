import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useCreateUser } from '../queries';
import { useQueryClient } from '@tanstack/react-query';

interface CreateUserFormProps {
  onSuccess: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSuccess }) => {
  const queryClient = useQueryClient();
  const { mutate: createUser, isLoading } = useCreateUser({
    onSuccess: () => {
      toast.success('Usuario creado exitosamente!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(`Error creando usuario: ${error.message}`);
    }
  });

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    password: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append('nombre', formData.nombre);
    data.append('apellido', formData.apellido);
    data.append('cedula', formData.cedula);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('fecha_nacimiento', formData.fecha_nacimiento);
    data.append('tipo_comercio', formData.tipo_comercio);
    data.append('whatsapp', formData.whatsapp);
    data.append('rol', formData.rol);
    if (formData.foto) {
      data.append('foto', formData.foto);
    }
    
    createUser(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="form-control w-full">
          <div className="label"><span className="label-text">Nombre</span></div>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="input input-bordered w-full" />
        </label>
        <label className="form-control w-full">
          <div className="label"><span className="label-text">Apellido</span></div>
          <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required className="input input-bordered w-full" />
        </label>
        <label className="form-control w-full">
          <div className="label"><span className="label-text">Email</span></div>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input input-bordered w-full" />
        </label>
        <label className="form-control w-full">
          <div className="label"><span className="label-text">Contraseña</span></div>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required className="input input-bordered w-full" />
        </label>
        <label className="form-control w-full">
          <div className="label"><span className="label-text">Cédula</span></div>
          <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required className="input input-bordered w-full" />
        </label>
        <label className="form-control w-full">
          <div className="label"><span className="label-text">Fecha de Nacimiento</span></div>
          <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required className="input input-bordered w-full" />
        </label>
        <label className="form-control w-full">
          <div className="label"><span className="label-text">Tipo de Comercio</span></div>
          <input type="text" name="tipo_comercio" value={formData.tipo_comercio} onChange={handleChange} required className="input input-bordered w-full" />
        </label>
        <label className="form-control w-full">
          <div className="label"><span className="label-text">WhatsApp</span></div>
          <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} required className="input input-bordered w-full" />
        </label>
        <label className="form-control w-full">
          <div className="label"><span className="label-text">Rol</span></div>
          <select name="rol" value={formData.rol} onChange={handleChange} required className="select select-bordered w-full">
            <option value="">Selecciona un rol</option>
            <option value="cobrador">Cobrador</option>
            <option value="deudor">Deudor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="form-control w-full md:col-span-2">
          <div className="label"><span className="label-text">Foto de Perfil</span></div>
          <input type="file" name="foto" onChange={handleFileChange} className="file-input file-input-bordered w-full" />
        </label>
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Creando Usuario...' : 'Crear Usuario'}
      </button>
    </form>
  );
};

export default CreateUserForm;