import { useCallback, useEffect, useState } from "react";
import api from "../utils/api";

const API = import.meta.env.VITE_API_URL;

const toTitleCase = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-CO")
    .replace(/(^|\s)(\p{L})/gu, (_, space, letter) => `${space}${letter.toLocaleUpperCase("es-CO")}`);

const ESTADOS_PROFESOR = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
];

const FILTROS_PROFESOR = [
  ...ESTADOS_PROFESOR,
  { value: "todos", label: "Todos" },
];

const estadoLabel = (estado) =>
  ESTADOS_PROFESOR.find((item) => item.value === estado)?.label || "Activo";

const estadoClasses = {
  activo: "bg-green-100 text-green-800 border-green-200",
  inactivo: "bg-gray-100 text-gray-700 border-gray-200",
};

function CrearProfesor() {
  const [profesores, setProfesores] = useState([]);
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [documento_identidad, setDocumento] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [sueldo, setSueldo] = useState("");
  const [estado, setEstado] = useState("activo");

  const limpiarFormulario = () => {
    setEditId(null);
    setNombre("");
    setApellido("");
    setDocumento("");
    setEmail("");
    setTelefono("");
    setPassword("");
    setSueldo("");
    setEstado("activo");
  };

  const cargarProfesores = useCallback(async () => {
    try {
      const res = await api.get('/profesores', { params: { estado: estadoFiltro } });
      if (res.status === 200) {
        setProfesores(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, [estadoFiltro]);

  useEffect(() => {
    cargarProfesores();
  }, [cargarProfesores]);

  const handleSubmit = async () => {
    if (!nombre || !apellido || !documento_identidad || !email || !telefono || (!password && !editId) || !sueldo) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    try {
      const payload = {
        nombre: toTitleCase(nombre),
        apellido: toTitleCase(apellido),
        documento_identidad,
        email: email.trim().toLocaleLowerCase("es-CO"),
        telefono,
        password,
        sueldo: parseFloat(sueldo) || 0,
        estado,
      };

      let res;
      if (editId) {
        res = await api.put(`/profesores/${editId}`, payload);
      } else {
        res = await api.post(`/profesores`, payload);
      }

      if (res.status >= 200 && res.status < 300) {
        alert(editId ? "Profesor actualizado 🔥" : "Profesor creado 🔥");
        limpiarFormulario();
        cargarProfesores();
      } else {
        alert("Error al guardar profesor");
      }
    } catch (error) {
      console.error("FETCH ERROR:", error);
      alert("No se pudo conectar con el servidor");
    }
  };

  const editProfesor = (p) => {
    setEditId(p.id);
    setNombre(p.nombre);
    setApellido(p.apellido);
    setDocumento(p.documento);
    setEmail(p.email);
    setTelefono(p.telefono);
    setPassword(""); // Leave blank if not changing
    setSueldo(p.sueldo || 0);
    setEstado(p.estado || "activo");
  };

  const cancelEdit = () => {
    limpiarFormulario();
  };

  const cambiarEstadoProfesor = async (profesor, nuevoEstado) => {
    const estadoActual = profesor.estado || "activo";
    if (nuevoEstado === estadoActual) return;

    const accion = nuevoEstado === "activo" ? "reactivar" : "desactivar";
    if (!window.confirm(`¿Deseas ${accion} a ${profesor.nombre} ${profesor.apellido}?`)) {
      return;
    }

    try {
      const res = await api.patch(`/profesores/${profesor.id}/estado`, {
        estado: nuevoEstado,
      });
      const estadoActualizado = res.data?.estado || nuevoEstado;

      setProfesores((actuales) =>
        actuales
          .map((item) =>
            item.id === profesor.id
              ? { ...item, estado: estadoActualizado }
              : item
          )
          .filter((item) =>
            estadoFiltro === "todos" ? true : (item.estado || "activo") === estadoFiltro
          )
      );

      if (editId === profesor.id) {
        setEstado(estadoActualizado);
      }
    } catch (error) {
      console.error("Error cambiando estado del profesor:", error);
      alert("No se pudo cambiar el estado del profesor");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          👨‍🏫 {editId ? "Editar" : "Crear"} Profesor
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                placeholder="Nombre"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
              <input
                placeholder="Apellidos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
              <input
                placeholder="Documento"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={documento_identidad}
                onChange={(e) => setDocumento(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="Email"
                autoComplete="username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                placeholder="Teléfono"
                autoComplete="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña {editId && "(dejar vacío para no cambiar)"}
              </label>
              <input
                type="password"
                placeholder="Contraseña"
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sueldo ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ej. 1200.50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={sueldo}
                onChange={(e) => setSueldo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
              >
                {ESTADOS_PROFESOR.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
            >
              {editId ? "Actualizar Profesor" : "Crear Profesor"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Lista de Profesores</h3>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input 
            type="text" 
            placeholder="🔍 Buscar profesor..." 
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
          >
            {FILTROS_PROFESOR.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-2 border-b">Nombre</th>
                <th className="p-2 border-b">Email</th>
                <th className="p-2 border-b">Estado</th>
                <th className="p-2 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {profesores.filter(p => `${p.nombre} ${p.apellido} ${p.documento}`.toLowerCase().includes(busqueda.toLowerCase())).map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{p.nombre} {p.apellido}</td>
                  <td className="p-2">{p.email}</td>
                  <td className="p-2">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoClasses[p.estado || "activo"] || estadoClasses.activo}`}>
                      {estadoLabel(p.estado || "activo")}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={p.estado || "activo"}
                        onChange={(e) => cambiarEstadoProfesor(p, e.target.value)}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
                      >
                        {ESTADOS_PROFESOR.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => editProfesor(p)}
                        className="text-purple-700 hover:underline"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CrearProfesor;
