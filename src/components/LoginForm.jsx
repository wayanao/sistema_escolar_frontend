import { useState } from "react";
import Swal from "sweetalert2";
import api from "../utils/api";

function LoginForm() {

  const [email, setEmail] = useState("");// estado para el email
  const [password, setPassword] = useState("");// estado para la contraseña
  const [codigoColegio, setCodigoColegio] = useState("demo");// estado para el código del colegio (saas)

  const iniciarSesion = async () => {

    if (!email || !password || !codigoColegio) {
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'Completa todos los campos (incluyendo el código de colegio)' });
        return;
    }

        // 🔥 enviar al backend
    try {
      const res = await api.post(`/login`, { 
        email, 
        password, 
        codigo_colegio: codigoColegio.toLowerCase().trim() 
      });

          // revisar respuesta
      const data = res.data;

      const sessionData = {
        id: data.id,
        nombre: data.nombre,
        rol: data.rol,
        tenant: data.tenant,
      };

      // Guardar tenant local; la cookie de sesion la emite el backend.
      localStorage.setItem('tenant', data.tenant);

      // 🔥 guardar sesión según rol y limpiar la opuesta
      if (data.rol === "super_admin") {
        localStorage.setItem("super_admin", JSON.stringify(sessionData));
        localStorage.removeItem("usuario");
        localStorage.removeItem("profesor");
      } else if (data.rol === "admin") {
        localStorage.setItem("usuario", JSON.stringify(sessionData));
        localStorage.removeItem("super_admin");
        localStorage.removeItem("profesor"); // Limpiar sesión de profesor
      } else {
        // Para profesores, mantener compatibilidad con el código existente
        localStorage.setItem("profesor", JSON.stringify(sessionData));
        localStorage.removeItem("super_admin");
        localStorage.removeItem("usuario"); // Limpiar sesión de admin
      }

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: `Bienvenido ${data.nombre}`,
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        // 🔥 redirigir según rol
        if (data.rol === "super_admin") {
          window.location.href = "/super-admin";
        } else if (data.rol === "admin") {
          window.location.href = "/dashboard-admin";
        } else {
          window.location.href = "/";
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'Credenciales incorrectas' });
      } else if (error.response && error.response.status === 403) {
          const detail = error.response.data?.detail;
          const message = typeof detail === "object"
            ? detail.message
            : detail;
          Swal.fire({
            icon: 'warning',
            title: 'Servicio no disponible',
            text: message || 'El servicio del colegio no se encuentra habilitado.',
          });
      } else {
          Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con el servidor' });
      }
    }
  };


return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        iniciarSesion();
      }}
      className="w-full max-w-md">

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-700 text-2xl font-black text-white shadow-lg shadow-purple-200">
          S
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
          Acceso institucional
        </p>
        <h2 className="mt-2 text-3xl font-black text-gray-950">
          Accede a Scholarix
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Ingresa con tu colegio, correo y contraseña para continuar con la gestion academica.
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Codigo del colegio</label>
        <input
          type="text"
          placeholder="ej. colegio123"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
          style={{textTransform: 'lowercase'}}
          value={codigoColegio}
          onChange={(e) => setCodigoColegio(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Correo</label>
        <input
          type="email"
          placeholder="correo@colegio.edu"
          autoComplete="username"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
    
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Contraseña</label>
        <input
          type="password"
          placeholder="Tu contraseña"
          autoComplete="current-password"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-purple-700 px-4 py-3.5 font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800 focus:outline-none focus:ring-4 focus:ring-purple-200"
        >
        Ingresar
      </button>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-medium text-slate-500">
        Plataforma segura para administradores y profesores.
      </div>
    </form>
);

}

export default LoginForm;





















