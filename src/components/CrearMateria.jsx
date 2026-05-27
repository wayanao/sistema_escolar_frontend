import { useState, useEffect } from "react";
import api from "../utils/api";

const toTitleCase = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-CO")
    .replace(/(^|\s)(\p{L})/gu, (_, space, letter) => `${space}${letter.toLocaleUpperCase("es-CO")}`);

function CrearMateria() {
  const [materias, setMaterias] = useState([]);
  const [editId, setEditId] = useState(null);
  const [nombre, setNombre] = useState("");

  const cargarMaterias = async () => {
    try {
      const res = await api.get('/materias');
      if (res.status === 200) setMaterias(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarMaterias();
  }, []);

  const handleSubmit = async () => {
    if (!nombre) return alert("Falta nombre");

    try {
      const nombreNormalizado = toTitleCase(nombre);
      let res;
      if (editId) {
        res = await api.put(`/materias/${editId}`, { nombre: nombreNormalizado });
      } else {
        res = await api.post(`/materia`, { nombre: nombreNormalizado });
      }

      if (res.status >= 200 && res.status < 300) {
        alert(editId ? "Materia actualizada 🔥" : "Materia creada 🔥");
        setEditId(null);
        setNombre("");
        cargarMaterias();
      } else {
        alert("Error al guardar materia");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };

  const editMateria = (m) => {
    setEditId(m.id);
    setNombre(m.nombre);
  };

  const cancelEdit = () => {
    setEditId(null);
    setNombre("");
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📚 {editId ? "Editar" : "Crear"} Materia
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            placeholder="Matemáticas, Biología..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
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
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Lista de Materias</h3>
        <div className="overflow-y-auto max-h-48">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-2 border-b">Nombre</th>
                <th className="p-2 border-b text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materias.map(m => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{m.nombre}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => editMateria(m)}
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

export default CrearMateria;
