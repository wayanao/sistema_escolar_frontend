import { useState, useEffect, useMemo } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const obtenerOrdenDia = (dia) => {
  const orden = DIAS_SEMANA.indexOf(dia);
  return orden === -1 ? DIAS_SEMANA.length : orden;
};

const formatearHora12 = (hora24) => {
  if (!hora24) return "";
  if (hora24.toLowerCase().includes("am") || hora24.toLowerCase().includes("pm")) return hora24;

  const [horaStr, minutoStr = "00"] = hora24.split(":");
  let horaNum = parseInt(horaStr, 10);
  const ampm = horaNum >= 12 ? "PM" : "AM";
  horaNum = horaNum % 12 || 12;
  return `${horaNum}:${minutoStr} ${ampm}`;
};

const ordenarPorHora = (a, b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || "");

function DashboardProfesor() {
  const navigate = useNavigate();
  const [clases, setClases] = useState([]);
  const [horarioAsignado, setHorarioAsignado] = useState([]);
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
  const clasesUnicas = useMemo(() => {
    const vistos = new Map();
    for (const clase of clases) {
      const key = `${(clase.materia || "").trim().toLowerCase()}|${(clase.curso || "").trim().toLowerCase()}`;
      if (!vistos.has(key)) {
        vistos.set(key, clase);
      }
    }
    return Array.from(vistos.values());
  }, [clases]);

  const clasesConHorario = useMemo(
    () =>
      horarioAsignado
        .filter((clase) => clase.dia && clase.hora_inicio && clase.hora_fin)
        .sort((a, b) => {
          const diaA = obtenerOrdenDia(a.dia);
          const diaB = obtenerOrdenDia(b.dia);
          if (diaA !== diaB) return diaA - diaB;
          return ordenarPorHora(a, b);
        }),
    [horarioAsignado]
  );
  const horarioPorDia = useMemo(
    () =>
      DIAS_SEMANA.reduce((acc, dia) => {
        acc[dia] = clasesConHorario.filter((clase) => clase.dia === dia);
        return acc;
      }, {}),
    [clasesConHorario]
  );

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

  const cargarHorarioAsignado = async () => {
    if (!profesorId) return;
    try {
      const res = await api.get(`/mis-clases/${profesorId}`);
      const data = res.data || [];
      const horarioProfesor = data
        .map((asignacion) => ({
          id: asignacion.id,
          materia: asignacion.materia,
          curso: asignacion.curso,
          dia: asignacion.dia,
          hora_inicio: asignacion.hora_inicio,
          hora_fin: asignacion.hora_fin,
        }));

      setHorarioAsignado(horarioProfesor);
    } catch (error) {
      console.error("Error cargando horario asignado", error);
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
      await Promise.all([
        cargarClases(),
        cargarHorarioAsignado(),
        cargarInasistencias(),
        cargarNotasBajas(),
        cargarNotasAltas(),
      ]);
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
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
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
            {clasesUnicas.map(clase => (
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

      <section className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
        <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Horario asignado
              </p>
              <h2 className="mt-1 text-lg font-bold text-gray-900 sm:text-xl">
                Tus clases de la semana
              </h2>
            </div>
            <span className="w-max rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {clasesConHorario.length} {clasesConHorario.length === 1 ? "clase" : "clases"}
            </span>
          </div>
        </div>

        {clasesConHorario.length === 0 ? (
          <div className="p-6 text-gray-600">
            No tienes clases con horario asignado todavía.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 lg:hidden">
              {DIAS_SEMANA.map((dia) => {
                const clasesDelDia = horarioPorDia[dia];

                return (
                  <div key={dia} className="rounded-lg border border-gray-200 bg-gray-50">
                    <div className="border-b border-gray-200 px-3 py-2">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                        {dia}
                      </h3>
                    </div>
                    <div className="space-y-2 p-2.5">
                      {clasesDelDia.length === 0 ? (
                        <p className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-3 text-center text-sm text-gray-500">
                          Sin clases
                        </p>
                      ) : (
                        clasesDelDia.map((clase) => (
                          <article
                            key={clase.id}
                            className="rounded-md border-l-4 border-blue-600 bg-white px-2.5 py-2 shadow-sm"
                          >
                            <p className="text-[11px] font-bold leading-tight text-blue-700">
                              {formatearHora12(clase.hora_inicio)} - {formatearHora12(clase.hora_fin)}
                            </p>
                            <h4 className="mt-1 text-xs font-semibold leading-tight text-gray-900">
                              {clase.materia}
                            </h4>
                            <p className="mt-0.5 text-[11px] font-medium leading-tight text-gray-600">
                              Curso: {clase.curso}
                            </p>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto p-3 lg:block">
              <div className="grid min-w-[860px] grid-cols-5 gap-2.5">
                {DIAS_SEMANA.map((dia) => {
                  const clasesDelDia = horarioPorDia[dia];

                  return (
                    <div key={dia} className="flex min-h-[240px] flex-col rounded-lg border border-gray-200 bg-gray-50">
                      <div className="rounded-t-lg bg-blue-700 px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white">
                        {dia}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-2.5">
                        {clasesDelDia.length === 0 ? (
                          <div className="flex flex-1 items-center justify-center rounded-md border-2 border-dashed border-gray-200 bg-white px-3 text-sm italic text-gray-400">
                            Sin clases
                          </div>
                        ) : (
                          clasesDelDia.map((clase) => (
                            <article
                              key={clase.id}
                              className="rounded-md border border-gray-200 border-l-4 border-l-blue-500 bg-white px-2.5 py-2 shadow-sm transition hover:shadow-md"
                            >
                              <p className="text-[11px] font-bold leading-tight text-blue-700">
                                {formatearHora12(clase.hora_inicio)} - {formatearHora12(clase.hora_fin)}
                              </p>
                              <h4 className="mt-1 text-xs font-bold leading-tight text-gray-900">
                                {clase.materia}
                              </h4>
                              <p className="mt-0.5 text-[11px] font-medium leading-tight text-gray-600">
                                Curso: {clase.curso}
                              </p>
                            </article>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>

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
