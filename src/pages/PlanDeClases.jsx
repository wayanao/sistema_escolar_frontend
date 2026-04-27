import { useState, useEffect } from "react";
import api from "../utils/api";

const API = import.meta.env.VITE_API_URL;

function PlanDeClases() {
  const [asignacionId, setAsignacionId] = useState(localStorage.getItem("asignacionId") || "");
  const [clases, setClases] = useState([]);
  const [periodo, setPeriodo] = useState(localStorage.getItem("periodo") || "1");
  const [unidad, setUnidad] = useState("");
  const [proposito, setProposito] = useState("");
  const [estandar, setEstandar] = useState("");
  const [dba, setDba] = useState("");
  const [competencias, setCompetencias] = useState("");
  const [tema, setTema] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [imagenes, setImagenes] = useState([]);

  const profesorStorage = localStorage.getItem("profesor");
  const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
  const profesorId = profesor?.id;

  const cargarClases = async () => {
    if (!profesorId) return;
    try {
      const res = await api.get(`/mis-clases/${profesorId}`);
      const data = res.data;
      setClases(data);
    } catch (error) {
      console.error("Error cargando clases", error);
    }
  };

  useEffect(() => {
    if (!profesor) {
      window.location.href = "/login";
      return;
    }
    cargarClases();
  }, [profesorId]);

    const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 2) {
        alert("Solo puedes seleccionar hasta 2 imágenes");
        return;
    }
    setImagenes(files);
    };

    const guardarPlan = async () => {
    if (
    !asignacionId ||
    !unidad ||
    !fecha ||
    !proposito ||
    !estandar ||
    !dba ||
    !competencias ||
    !tema
) {
    alert("Completa todos los campos obligatorios");
    return;
}

    const formData = new FormData();
    formData.append("asignacion_id", asignacionId);
    formData.append("unidad", unidad);
    formData.append("proposito", proposito);
    formData.append("estandar", estandar);
    formData.append("dba", dba);
    formData.append("competencias", competencias);
    formData.append("tema", tema);
    formData.append("fecha", fecha);

    if (imagenes[0]) formData.append("imagen1", imagenes[0]);
    if (imagenes[1]) formData.append("imagen2", imagenes[1]);

    try {
      const res = await api.post(`/plan-de-clases`, formData);
      const data = res.data;
      alert("Plan guardado: " + data.mensaje);
      // Limpiar campos
      setUnidad("");
      setProposito("");
      setEstandar("");
      setDba("");
      setCompetencias("");
      setTema("");
      setImagenes([]);
    } catch (error) {
      console.error("Error guardando plan", error);
      alert("Error al guardar");
    }
  };

  const selectedClase = clases.find(c => c.id == asignacionId);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📚 Plan de Clases
        </h1>
        <p className="text-gray-600">
          Crea y gestiona tus planes de clases
        </p>
      </div>

      {selectedClase && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Curso</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Materia</p>
              <p className="text-gray-900">{selectedClase.materia}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Período</p>
              <p className="text-gray-900">{periodo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Salón</p>
              <p className="text-gray-900">{selectedClase.curso}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles del Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
            <textarea
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Describe la unidad..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logro</label>
            <textarea
              value={proposito}
              onChange={(e) => setProposito(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Objetivos de aprendizaje..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estándar</label>
            <textarea
              value={estandar}
              onChange={(e) => setEstandar(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Estándares curriculares..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desarrollo</label>
            <textarea
              value={dba}
              onChange={(e) => setDba(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Actividades y desarrollo de la clase..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homework</label>
            <textarea
              value={competencias}
              onChange={(e) => setCompetencias(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Tareas para casa..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
            <input
              type="text"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tema de la clase..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Imágenes (máximo 2)</h2>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {imagenes.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">Archivos seleccionados:</p>
            {imagenes.map((img, idx) => (
              <p key={idx} className="text-sm text-gray-900">{img.name}</p>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={guardarPlan}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
        >
          Guardar Plan
        </button>
      </div>
    </div>
  );
}

export default PlanDeClases;