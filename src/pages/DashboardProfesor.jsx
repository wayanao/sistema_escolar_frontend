import { useState, useEffect } from "react";
import api from "../utils/api";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function DashboardProfesor() {
  const navigate = useNavigate();
  const [clases, setClases] = useState([]);
  const [asignacionId, setAsignacionId] = useState(localStorage.getItem("asignacionId") || "");
  const [periodo, setPeriodo] = useState(localStorage.getItem("periodo") || "1");
  const [fecha, setFecha] = useState(localStorage.getItem("fechaAsistencia") || "");
  const [inasistencias, setInasistencias] = useState(null);
  const [notasBajas, setNotasBajas] = useState([]);
  const [notasAltas, setNotasAltas] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleAsignacionChange = (e) => {
    const value = e.target.value;
    setAsignacionId(value);
    localStorage.setItem("asignacionId", value);
  };

  const handlePeriodoChange = (e) => {
    const value = e.target.value;
    setPeriodo(value);
    localStorage.setItem("periodo", value);
  };

  const handleFechaChange = (e) => {
    const value = e.target.value;
    setFecha(value);
    localStorage.setItem("fechaAsistencia", value); // Usar la misma clave que Asistencia
  };

  const profesorStorage = localStorage.getItem("profesor");
  const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
  const profesorId = profesor?.id;
  const nombreProfesor = profesor ? `${profesor.nombre || ""} ${profesor.apellido || ""}`.trim() : "";

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

  const cargarInasistencias = async () => {
    if (!profesorId) return;
    try {
      const res = await api.get(`/dashboard/inasistencias/${profesorId}`);
      const data = res.data;
      setInasistencias(data);
    } catch (error) {
      console.error("Error cargando inasistencias", error);
    }
  };

  const cargarNotasBajas = async () => {
    if (!profesorId) return;
    try {
      const res = await api.get(`/dashboard/notas-bajas/${profesorId}`);
      const data = res.data;
      setNotasBajas(data);
    } catch (error) {
      console.error("Error cargando notas bajas", error);
    }
  };

  const cargarNotasAltas = async () => {
    if (!profesorId) return;
    try {
      const res = await api.get(`/dashboard/notas-altas/${profesorId}`);        
      const data = res.data;
      setNotasAltas(data);
    } catch (error) {
      console.error("Error cargando notas altas", error);
    }
  };

  useEffect(() => {
    if (!profesor) {
      window.location.href = "/login";
      return;
    }
    const cargarDatos = async () => {
      setLoading(true);
      await Promise.all([cargarClases(), cargarInasistencias(), cargarNotasBajas(), cargarNotasAltas()]);
      setLoading(false);
    };
    cargarDatos();
  }, [profesorId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Panel del Profesor
        </h1>
        <p className="text-gray-600">
          Bienvenida/o,  {nombreProfesor}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Salón:</label>
          <select
            value={asignacionId}
            onChange={handleAsignacionChange}
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los salones</option>
            {clases.map(clase => (
              <option key={clase.id} value={clase.id}>
                {clase.materia} - {clase.curso}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Período:</label>
          <select
            value={periodo}
            onChange={handlePeriodoChange}
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">Período 1</option>
            <option value="2">Período 2</option>
            <option value="3">Período 3</option>
            <option value="4">Período 4</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Fecha:</label>
          <input
            type="date"
            value={fecha}
            onChange={handleFechaChange}
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
          <div className="p-6">
            <div className="bg-red-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Estudiante con más inasistencias
            </h3>
            {inasistencias ? (
              <div>
                <p className="text-lg font-medium">{inasistencias.nombre}</p>
                <p className="text-gray-600">Curso: {inasistencias.curso}</p>
                <p className="text-red-500 font-bold">Total de fallas: {inasistencias.total_fallas}</p>
              </div>
            ) : (
              <p className="text-gray-600">No hay datos disponibles</p>
            )}
          </div>
        </div>

        <div 
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 cursor-pointer"
          onClick={() => {
            if (!asignacionId) {
              alert("Por favor, selecciona un salón (materia) primero para ver el ranking.");
              return;
            }
            navigate("/ranking-rendimiento");
          }}
        >
          <div className="p-6">
            <div className="bg-yellow-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 cursor-pointer">
              <span className="text-2xl">📉</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors">
              Estudiantes con bajo rendimiento
            </h3>
            {notasBajas.length > 0 ? (
              <div>
                <p className="text-lg font-medium">{notasBajas[0].nombre}</p>
                <p className="text-gray-600">Curso: {notasBajas[0].curso}</p>
                <p className={`text-sm font-bold ${notasBajas[0].color === 'red' ? 'text-red-500' : notasBajas[0].color === 'yellow' ? 'text-yellow-500' : 'text-green-500'}`}>
                  Promedio: {Number(notasBajas[0].promedio).toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-gray-600">No hay estudiantes con bajo rendimiento</p>
            )}
          </div>
        </div>

        <div
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 cursor-pointer"
          onClick={() => {
            if (!asignacionId) {
              alert("Por favor, selecciona un salón (materia) primero para ver el ranking.");
              return;
            }
            navigate("/ranking-mejor-rendimiento");
          }}
        >
          <div className="p-6">
            <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 cursor-pointer">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 cursor-pointer hover:text-green-600 transition-colors">
              Mejores Estudiantes
            </h3>
            {notasAltas.length > 0 ? (
              <div>
                <p className="text-lg font-medium">{notasAltas[0].nombre}</p>
                <p className="text-gray-600">Curso: {notasAltas[0].curso}</p>
                <p className="text-sm font-bold text-green-600">
                  Promedio: {Number(notasAltas[0].promedio).toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-gray-600">No hay estudiantes con notas altas aún</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardProfesor;