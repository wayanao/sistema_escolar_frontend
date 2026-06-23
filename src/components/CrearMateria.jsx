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

const ESTADOS_MATERIA = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
];

const FILTROS_MATERIA = [
  ...ESTADOS_MATERIA,
  { value: "todos", label: "Todos" },
];

const estadoLabel = (estado) =>
  ESTADOS_MATERIA.find((item) => item.value === estado)?.label || "Activo";

const estadoClasses = {
  activo: "bg-green-100 text-green-800 border-green-200",
  inactivo: "bg-gray-100 text-gray-700 border-gray-200",
};

function CrearMateria() {
  const [materias, setMaterias] = useState([]);
  const [editId, setEditId] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState("activo");

  const limpiarFormulario = () => {
    setEditId(null);
    setNombre("");
    setEstado("activo");
  };

  const cargarMaterias = useCallback(async () => {
    try {
      const res = await api.get('/materias', { params: { estado: estadoFiltro } });
      if (res.status === 200) setMaterias(res.data);
    } catch(err) {
      console.error(err);
    }
  }, [estadoFiltro]);

  useEffect(() => {
    cargarMaterias();
  }, [cargarMaterias]);

  const handleSubmit = async () => {
    if (!nombre) return alert("Falta nombre");

    try {
      const nombreNormalizado = toUpperText(nombre);
      const payload = { nombre: nombreNormalizado, estado };
      let res;
      if (editId) {
        res = await api.put(`/materias/${editId}`, payload);
      } else {
        res = await api.post(`/materia`, payload);
      }

      if (res.status >= 200 && res.status < 300) {
        alert(editId ? "Materia actualizada 🔥" : "Materia creada 🔥");
        limpiarFormulario();
        cargarMaterias();
      } else {
        alert("Error al guardar materia");
      }
    } catch (error) {
      console.error(error);
      alert(getApiErrorMessage(error, "No se pudo guardar la materia"));
    }
  };

  const editMateria = (m) => {
    setEditId(m.id);
    setNombre(m.nombre);
    setEstado(m.estado || "activo");
  };

  const cancelEdit = () => {
    limpiarFormulario();
  };

  const cambiarEstadoMateria = async (materia, nuevoEstado) => {
    const estadoActual = materia.estado || "activo";
    if (nuevoEstado === estadoActual) return;

    const accion = nuevoEstado === "activo" ? "reactivar" : "desactivar";
    if (!window.confirm(`¿Deseas ${accion} la materia ${materia.nombre}?`)) {
      return;
    }

    try {
      const res = await api.patch(`/materias/${materia.id}/estado`, {
        estado: nuevoEstado,
      });
      const estadoActualizado = res.data?.estado || nuevoEstado;

      setMaterias((actuales) =>
        actuales
          .map((item) =>
            item.id === materia.id
              ? { ...item, estado: estadoActualizado }
              : item
          )
          .filter((item) =>
            estadoFiltro === "todos" ? true : (item.estado || "activo") === estadoFiltro
          )
      );

      if (editId === materia.id) {
        setEstado(estadoActualizado);
      }
    } catch (error) {
      console.error("Error cambiando estado de la materia:", error);
      alert("No se pudo cambiar el estado de la materia");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📚 {editId ? "Editar" : "Crear"} Materia
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              placeholder="Matemáticas, Biología..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              {ESTADOS_MATERIA.map((item) => (
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
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
          >
            {editId ? "Actualizar Materia" : "Crear Materia"}
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
          <h3 className="text-lg font-semibold text-gray-900">Lista de Materias</h3>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
          >
            {FILTROS_MATERIA.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-y-auto max-h-64">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-2 border-b">Nombre</th>
                <th className="p-2 border-b">Estado</th>
                <th className="p-2 border-b text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materias.map(m => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{m.nombre}</td>
                  <td className="p-2">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoClasses[m.estado || "activo"] || estadoClasses.activo}`}>
                      {estadoLabel(m.estado || "activo")}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <select
                        value={m.estado || "activo"}
                        onChange={(e) => cambiarEstadoMateria(m, e.target.value)}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
                      >
                        {ESTADOS_MATERIA.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => editMateria(m)}
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

export default CrearMateria;
