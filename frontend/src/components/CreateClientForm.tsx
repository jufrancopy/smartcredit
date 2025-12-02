import React, { useState } from 'react';
import { useCreateUser } from '../queries';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface CreateClientFormProps {
  onSuccess: () => void;
}

const CreateClientForm: React.FC<CreateClientFormProps> = ({ onSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cedula, setCedula] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState(new Date().toISOString().split('T')[0]);
  const [tipoComercio, setTipoComercio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [foto, setFoto] = useState<File | null>(null);

  const queryClient = useQueryClient();

  const { mutate: createUser, isLoading } = useCreateUser({
    onSuccess: () => {
      toast.success('Cliente creado exitosamente!');
      queryClient.invalidateQueries(['users']);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(`Error al crear cliente: ${error.message}`);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFoto(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('apellido', apellido);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('cedula', cedula);
    formData.append('fecha_nacimiento', fechaNacimiento);
    formData.append('tipo_comercio', tipoComercio);
    formData.append('whatsapp', whatsapp);
    formData.append('role', 'deudor');
    if (foto) {
      formData.append('foto', foto);
    }
    
    createUser(formData);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8 p-6 md:p-8">
        {/* Sección de Información Personal */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-base-content">Información Personal</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Nombre</span>
              </label>
              <input 
                type="text" 
                placeholder="Ingrese el nombre" 
                value={nombre} 
                onChange={e => setNombre(e.target.value)} 
                className="input input-bordered w-full focus:input-primary transition-all" 
                required 
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Apellido</span>
              </label>
              <input 
                type="text" 
                placeholder="Ingrese el apellido" 
                value={apellido} 
                onChange={e => setApellido(e.target.value)} 
                className="input input-bordered w-full focus:input-primary transition-all" 
                required 
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Cédula</span>
              </label>
              <input 
                type="text" 
                placeholder="Número de cédula" 
                value={cedula} 
                onChange={e => setCedula(e.target.value)} 
                className="input input-bordered w-full focus:input-primary transition-all" 
                required 
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Fecha de Nacimiento</span>
              </label>
              <input 
                type="date" 
                value={fechaNacimiento} 
                onChange={e => setFechaNacimiento(e.target.value)} 
                className="input input-bordered w-full focus:input-primary transition-all" 
                required 
              />
            </div>
          </div>
        </div>

        {/* Sección de Contacto */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-base-content">Información de Contacto</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <input 
                type="email" 
                placeholder="correo@ejemplo.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="input input-bordered w-full focus:input-primary transition-all" 
                required 
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">WhatsApp</span>
              </label>
              <input 
                type="text" 
                placeholder="+595 XXX XXX XXX" 
                value={whatsapp} 
                onChange={e => setWhatsapp(e.target.value)} 
                className="input input-bordered w-full focus:input-primary transition-all" 
                required 
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Contraseña</span>
              </label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="input input-bordered w-full focus:input-primary transition-all" 
                required 
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Tipo de Comercio</span>
              </label>
              <input 
                type="text" 
                placeholder="Ej: Restaurante, Tienda, etc." 
                value={tipoComercio} 
                onChange={e => setTipoComercio(e.target.value)} 
                className="input input-bordered w-full focus:input-primary transition-all" 
                required 
              />
            </div>
          </div>
        </div>

        {/* Sección de Foto */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-base-content">Foto de Perfil</h3>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Seleccionar imagen</span>
              <span className="label-text-alt text-base-content/60">Opcional</span>
            </label>
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="file-input file-input-bordered file-input-primary w-full" 
              accept="image/*"
            />
            {foto && (
              <label className="label">
                <span className="label-text-alt text-success">✓ {foto.name}</span>
              </label>
            )}
          </div>
        </div>

        {/* Botón de envío */}
        <div className="pt-4">
          <button 
            type="submit" 
            className="btn btn-primary w-full text-lg h-14 shadow-lg hover:shadow-xl transition-all" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner"></span>
                Creando Cliente...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Crear Cliente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClientForm;