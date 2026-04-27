import { useState, useEffect } from "react";
import api from "../utils/api";

const API = import.meta.env.VITE_API_URL;

function CrearEstudiante() {

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [documento, setDocumento] = useState("");
  const [fecha, setFecha] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [descuentoMatricula, setDescuentoMatricula] = useState(0);
  const [descuentoMensualidad, setDescuentoMensualidad] = useState(0);

  const [cursos, setCursos] = useState([]);

  // 🔥 cargar cursos
  const cargarCursos = async () => {
    const res = await api.get(`/cursos`);
    const data = res.data;
    setCursos(data);
  };

  useEffect(() => {
    cargarCursos();
  }, []);

       // 🔥 crear estudiante
    const crearEstudiante = async () => {

      if (!nombre || !apellido || !documento || !fecha || !cursoId) {
        alert("Completa los campos obligatorios");
        return;
      }

    try {
      const res = await api.post(`/estudiantes`, {
          nombre,
          apellido,
          documento_identidad: documento,
          fecha_nacimiento: fecha,
          curso_id: parseInt(cursoId),
          descuento_matricula: parseFloat(descuentoMatricula),
          descuento_mensualidad: parseFloat(descuentoMensualidad)
      });

      if (!(res.status >= 200 && res.status < 300)) {
        const error = await res.text();
        console.error(error);
        alert("Error creando estudiante");
        return;
      }

      alert("Estudiante creado 🔥");

      // limpiar
      setNombre("");
      setApellido("");
      setDocumento("");
      setFecha("");
      setCursoId("");
      setDescuentoMatricula(0);
      setDescuentoMensualidad(0);

    } catch (error) {
      console.error(error);
      alert("Error de conexión");
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">🎓 Crear Estudiante</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            placeholder="Nombre"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
          <input
            placeholder="Apellido"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
          <input
            placeholder="Documento"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={cursoId}
            onChange={(e) => setCursoId(e.target.value)}
          >
            <option value="">Seleccionar Curso</option>
            {cursos.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descuento Matrícula (%)</label>
          <input
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={descuentoMatricula}
            onChange={(e) => setDescuentoMatricula(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descuento Mensualidad (%)</label>
          <input
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={descuentoMensualidad}
            onChange={(e) => setDescuentoMensualidad(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={crearEstudiante}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
      >
        Crear Estudiante
      </button>
    </div>
  );
}

export default CrearEstudiante;