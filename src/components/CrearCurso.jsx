import { useCallback, useState, useEffect } from "react";
import api from "../utils/api";

const toUpperText = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("es-CO");

const getApiErrorMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.message || String(item)).join("\n");
  }
  return detail || fallback;
};

const ESTADOS_CURSO = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
];

const FILTROS_CURSO = [
  ...ESTADOS_CURSO,
  { value: "todos", label: "Todos" },
];

const estadoLabel = (estado) =>
  ESTADOS_CURSO.find((item) => item.value === estado)?.label || "Activo";

const estadoClasses = {
  activo: "bg-green-100 text-green-800 border-green-200",
  inactivo: "bg-gray-100 text-gray-700 border-gray-200",
};

function CrearCurso() {
  const [cursos, setCursos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState("activo");

  const [nombre, setNombre] = useState("");
  const [jornada, setJornada] = useState("Mañana");
  const [estado, setEstado] = useState("activo");

  const limpiarFormulario = () => {
    setEditId(null);
    setNombre("");
    setJornada("Mañana");
    setEstado("activo");
  };

  const cargarCursos = useCallback(async () => {
    try {
      const res = await api.get('/cursos', { params: { estado: estadoFiltro } });
      if (res.status === 200) setCursos(res.data);
    } catch(err) {
      console.error(err);
    }
  }, [estadoFiltro]);

  useEffect(() => {
    cargarCursos();
  }, [cargarCursos]);

  const handleSubmit = async () => {
    if (!nombre) return alert("Falta nombre");

    try {
      const payload = {
        nombre: toUpperText(nombre),
        jornada,
        estado,
      };

      let res;
      if (editId) {
        res = await api.put(`/cursos/${editId}`, payload);
      } else {
        res = await api.post(`/cursos`, payload);
      }

      if (res.status >= 200 && res.status < 300) {
        alert(editId ? "Curso actualizado 🔥" : "Curso creado 🔥");
        limpiarFormulario();
        cargarCursos();
      } else {
        alert("Error al guardar el curso");
      }
    } catch (error) {
      console.error(error);
      alert(getApiErrorMessage(error, "No se pudo guardar el curso"));
    }
  };

  const editCurso = (c) => {
    setEditId(c.id);
    setNombre(c.nombre);
    setJornada(c.jornada || "Mañana");
    setEstado(c.estado || "activo");
  };

  const cancelEdit = () => {
    limpiarFormulario();
  };

  const cambiarEstadoCurso = async (curso, nuevoEstado) => {
    const estadoActual = curso.estado || "activo";
    if (nuevoEstado === estadoActual) return;

    const accion = nuevoEstado === "activo" ? "reactivar" : "desactivar";
    if (!window.confirm(`¿Deseas ${accion} el curso ${curso.nombre}?`)) {
      return;
    }

    try {
      const res = await api.patch(`/cursos/${curso.id}/estado`, {
        estado: nuevoEstado,
      });
      const estadoActualizado = res.data?.estado || nuevoEstado;

      setCursos((actuales) =>
        actuales
          .map((item) =>
            item.id === curso.id
              ? { ...item, estado: estadoActualizado }
              : item
          )
          .filter((item) =>
            estadoFiltro === "todos" ? true : (item.estado || "activo") === estadoFiltro
          )
      );

      if (editId === curso.id) {
        setEstado(estadoActualizado);
      }
    } catch (error) {
      console.error("Error cambiando estado del curso:", error);
      alert("No se pudo cambiar el estado del curso");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🏫 {editId ? "Editar" : "Crear"} Curso
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">        
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              placeholder="Nombre (6A, 7B...)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jornada</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
              value={jornada}
              onChange={(e) => setJornada(e.target.value)}
            >
              <option value="Mañana">🌅 Mañana</option>
              <option value="Tarde">🌇 Tarde</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              {ESTADOS_CURSO.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
          >
            {editId ? "Actualizar Curso" : "Crear Curso"}
          </button>
          {editId && (
            <button
              onClick={cancelEdit}
              className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Cursos</h3>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
          >
            {FILTROS_CURSO.map((item) => (
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
                <th className="p-2 border-b">Jornada</th>
                <th className="p-2 border-b">Estado</th>
                <th className="p-2 border-b text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{c.nombre}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${c.jornada === 'Tarde' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-900'}`}>
                      {c.jornada || 'Mañana'}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoClasses[c.estado || "activo"] || estadoClasses.activo}`}>
                      {estadoLabel(c.estado || "activo")}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <select
                        value={c.estado || "activo"}
                        onChange={(e) => cambiarEstadoCurso(c, e.target.value)}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
                      >
                        {ESTADOS_CURSO.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => editCurso(c)}
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

export default CrearCurso;
