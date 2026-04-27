import { useState } from "react";
import Swal from "sweetalert2";
import api from "../utils/api";
import Cookies from "js-cookie";

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

      // Guardar token y tenant para que el interceptor los inyecte en cada request
      Cookies.set('token', data.access_token, { expires: 1 });
      localStorage.setItem('tenant', data.tenant);

      // 🔥 guardar sesión según rol y limpiar la opuesta
      if (data.rol === "admin") {
        localStorage.setItem("usuario", JSON.stringify(data));
        localStorage.removeItem("profesor"); // Limpiar sesión de profesor
      } else {
        // Para profesores, mantener compatibilidad con el código existente
        localStorage.setItem("profesor", JSON.stringify(data));
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
        if (data.rol === "admin") {
          window.location.href = "/dashboard-admin";
        } else {
          window.location.href = "/";
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'Credenciales incorrectas' });
      } else {
          Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con el servidor' });
      }
    }
  };


// 🔥 cargar historial
return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        iniciarSesion();
      }}
      className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">

      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
        🔐 Login Sistema Escolar SaaS
      </h1>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Código del Colegio</label>
        <input
          type="text"
          placeholder="ej. colegio123"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 uppercase"
          style={{textTransform: 'lowercase'}}
          value={codigoColegio}
          onChange={(e) => setCodigoColegio(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
        <input
          type="email"
          placeholder="Correo"
          autoComplete="username"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
    
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <input
          type="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
        Ingresar
      </button>
    </form>
);

}

export default LoginForm;





















