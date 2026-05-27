import { useState, useEffect } from "react";
import api from "../utils/api";

const API = import.meta.env.VITE_API_URL;

const toTitleCase = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-CO")
    .replace(/(^|\s)(\p{L})/gu, (_, space, letter) => `${space}${letter.toLocaleUpperCase("es-CO")}`);

function CrearCurso() {
  const [cursos, setCursos] = useState([]);
  const [editId, setEditId] = useState(null);

  const [nombre, setNombre] = useState("");
  const [jornada, setJornada] = useState("Mañana");

  const cargarCursos = async () => {
    try {
      const res = await api.get('/cursos');
      if (res.status === 200) setCursos(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  const handleSubmit = async () => {
    if (!nombre) return alert("Falta nombre");

    try {
      const payload = {
        nombre: toTitleCase(nombre),
        jornada
      };

      let res;
      if (editId) {
        res = await api.put(`/cursos/${editId}`, payload);
      } else {
        res = await api.post(`/cursos`, payload);
      }

      if (res.status >= 200 && res.status < 300) {
        alert(editId ? "Curso actualizado 🔥" : "Curso creado 🔥");
        setEditId(null);
        setNombre("");
        setJornada("Mañana");
        cargarCursos();
      } else {
        alert("Error al guardar el curso");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };

  const editCurso = (c) => {
    setEditId(c.id);
    setNombre(c.nombre);
    setJornada(c.jornada || "Mañana");
  };

  const cancelEdit = () => {
    setEditId(null);
    setNombre("");
    setJornada("Mañana");
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🏫 {editId ? "Editar" : "Crear"} Curso
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">        
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
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Lista de Cursos</h3>
        <div className="overflow-x-auto max-h-48">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-2 border-b">Nombre</th>
                <th className="p-2 border-b">Jornada</th>
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
                  <td className="p-2 text-right">
                    <button
                      onClick={() => editCurso(c)}
                      className="text-purple-700 hover:underline"
                    >
                      ✏️ Editar
                    </button>
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
