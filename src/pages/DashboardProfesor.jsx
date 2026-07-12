import { useCallback, useState, useEffect, useMemo } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import CumpleanosSemana from "../components/dashboard/CumpleanosSemana";
import { guardarPeriodoProfesor, obtenerPeriodoProfesor } from "../utils/periodoProfesor";

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

const capitalizarInicial = (valor) => {
  const texto = String(valor || "").trim();
  return texto ? texto.charAt(0).toLocaleUpperCase("es-CO") + texto.slice(1).toLocaleLowerCase("es-CO") : "";
};

function DashboardProfesor() {
  const navigate = useNavigate();
  const [clases, setClases] = useState([]);
  const [horarioAsignado, setHorarioAsignado] = useState([]);
  const [asignacionId, setAsignacionId] = useState(localStorage.getItem("asignacionId") || "");
  const [periodo, setPeriodo] = useState(() => obtenerPeriodoProfesor());
  const [fecha, setFecha] = useState(localStorage.getItem("fechaAsistencia") || "");
  const [inasistencias, setInasistencias] = useState([]);
  const [notasBajas, setNotasBajas] = useState([]);
  const [notasAltas, setNotasAltas] = useState([]);
  const [cursoFiltroRendimiento, setCursoFiltroRendimiento] = useState("");
  const [materiaFiltroRendimiento, setMateriaFiltroRendimiento] = useState("todas");
  const [loadingClases, setLoadingClases] = useState(true);
  const [loadingInasistencias, setLoadingInasistencias] = useState(true);
  const [loadingRendimiento, setLoadingRendimiento] = useState(false);
  const [cumpleanos, setCumpleanos] = useState([]);
  const [loadingCumpleanos, setLoadingCumpleanos] = useState(true);
  const [errorCumpleanos, setErrorCumpleanos] = useState("");

  const handleAsignacionChange = (e) => {
    const value = e.target.value;
    setAsignacionId(value);
    localStorage.setItem("asignacionId", value);
  };

  const handlePeriodoChange = (e) => {
    const value = e.target.value;
    setPeriodo(value);
    guardarPeriodoProfesor(value);
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
  const primerNombreProfesor = capitalizarInicial((profesor?.nombre || nombreProfesor || "profe").trim().split(/\s+/)[0]);
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
  const cursosProfesor = useMemo(() => {
    const vistos = new Map();
    for (const clase of clases) {
      if (!clase.curso_id) continue;
      const key = String(clase.curso_id);
      if (!vistos.has(key)) {
        vistos.set(key, { id: clase.curso_id, nombre: clase.curso });
      }
    }
    return Array.from(vistos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [clases]);
  const cursoFiltroNombre = useMemo(() => {
    return cursosProfesor.find((curso) => String(curso.id) === String(cursoFiltroRendimiento))?.nombre || "Curso";
  }, [cursoFiltroRendimiento, cursosProfesor]);
  const materiasDelCursoFiltro = useMemo(
    () =>
      clasesUnicas
        .filter((clase) => String(clase.curso_id) === String(cursoFiltroRendimiento))
        .sort((a, b) => (a.materia || "").localeCompare(b.materia || "")),
    [clasesUnicas, cursoFiltroRendimiento]
  );
  const materiaFiltroNombre = useMemo(() => {
    if (materiaFiltroRendimiento === "todas") return "Todas las materias";
    return materiasDelCursoFiltro.find((clase) => String(clase.id) === String(materiaFiltroRendimiento))?.materia || "Materia";
  }, [materiaFiltroRendimiento, materiasDelCursoFiltro]);

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

  const cargarClases = useCallback(async () => {
    if (!profesorId) return;
    setLoadingClases(true);
    try {
      const res = await api.get(`/mis-clases/${profesorId}`);
      const data = res.data || [];
      setClases(data);
      const horarioProfesor = data
        .map((asignacion) => ({
          id: asignacion.id,
          horario_id: asignacion.horario_id || asignacion.id,
          materia: asignacion.materia,
          curso: asignacion.curso,
          curso_id: asignacion.curso_id,
          dia: asignacion.dia,
          hora_inicio: asignacion.hora_inicio,
          hora_fin: asignacion.hora_fin,
        }));

      setHorarioAsignado(horarioProfesor);
    } catch (error) {
      console.error("Error cargando clases", error);
    } finally {
      setLoadingClases(false);
    }
  }, [profesorId]);

  const cargarInasistencias = useCallback(async () => {
    if (!profesorId) return;
    setLoadingInasistencias(true);
    try {
      const res = await api.get(`/dashboard/inasistencias/${profesorId}`);
      const data = res.data;
      setInasistencias(Array.isArray(data) ? data : data ? [data] : []);
    } catch (error) {
      console.error("Error cargando inasistencias", error);
    } finally {
      setLoadingInasistencias(false);
    }
  }, [profesorId]);

  const cargarCumpleanos = useCallback(async () => {
    if (!profesorId) return;

    setLoadingCumpleanos(true);
    setErrorCumpleanos("");

    try {
      const res = await api.get(`/dashboard/cumpleanos/profesor/${profesorId}`, {
        params: { dias: 7 },
      });
      setCumpleanos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando cumpleaños", error);
      setErrorCumpleanos("No se pudieron cargar los cumpleaños de la semana.");
    } finally {
      setLoadingCumpleanos(false);
    }
  }, [profesorId]);

  const cargarRendimiento = useCallback(async () => {
    if (!profesorId) return;
    if (!cursoFiltroRendimiento) {
      setNotasBajas([]);
      setNotasAltas([]);
      return;
    }
    setLoadingRendimiento(true);
    try {
      const params = { curso_id: cursoFiltroRendimiento };
      if (materiaFiltroRendimiento !== "todas") {
        params.asignacion_id = materiaFiltroRendimiento;
      }
      const [bajasRes, altasRes] = await Promise.all([
        api.get(`/dashboard/notas-bajas/${profesorId}`, { params }),
        api.get(`/dashboard/notas-altas/${profesorId}`, { params }),
      ]);
      setNotasBajas(bajasRes.data || []);
      setNotasAltas(altasRes.data || []);
    } catch (error) {
      console.error("Error cargando rendimiento", error);
    } finally {
      setLoadingRendimiento(false);
    }
  }, [cursoFiltroRendimiento, materiaFiltroRendimiento, profesorId]);

  useEffect(() => {
    if (!profesorId) {
      window.location.href = "/login";
      return;
    }
    cargarClases();
    cargarInasistencias();
    cargarCumpleanos();
  }, [cargarClases, cargarCumpleanos, cargarInasistencias, profesorId]);

  useEffect(() => {
    if (!cursosProfesor.length || cursoFiltroRendimiento) return;
    setCursoFiltroRendimiento(String(cursosProfesor[0].id));
  }, [cursosProfesor, cursoFiltroRendimiento]);

  useEffect(() => {
    if (!profesorId) return;
    cargarRendimiento();
  }, [profesorId, cargarRendimiento]);

  const irARanking = (ruta) => {
    if (!asignacionId) {
      alert("Por favor, selecciona un salón (materia) primero para ver el ranking.");
      return;
    }
    navigate(ruta);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Panel del Profesor
        </h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-700">
          <span>
            Hola, <strong className="font-bold text-gray-950">{primerNombreProfesor}</strong>
          </span>
          <span className="text-sm text-gray-600">
            📚 Prepara tu jornada y acompaña cada avance con calma.
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Salón:</label>
          <select
            value={asignacionId}
            onChange={handleAsignacionChange}
            disabled={loadingClases}
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{loadingClases ? "Cargando salones..." : "Todos los salones"}</option>
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

      <CumpleanosSemana
        className="mb-6"
        estudiantes={cumpleanos}
        loading={loadingCumpleanos}
        error={errorCumpleanos}
        diasRango={7}
        emptyText="Esta semana no hay estudiantes de tus cursos asignados cumpliendo años."
      />

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

        {loadingClases ? (
          <div className="p-6 text-sm font-medium text-gray-500">
            Cargando horario asignado...
          </div>
        ) : clasesConHorario.length === 0 ? (
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
                            key={`${clase.horario_id || clase.id}-${clase.dia}-${clase.hora_inicio}`}
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
                              key={`${clase.horario_id || clase.id}-${clase.dia}-${clase.hora_inicio}`}
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

      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Filtro de rendimiento</p>
          <p className="text-sm text-gray-600">
            Primero selecciona el curso; luego mira todas las materias de ese curso o una materia especifica.
          </p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Curso
            </label>
            <select
              value={cursoFiltroRendimiento}
              onChange={(e) => {
                setCursoFiltroRendimiento(e.target.value);
                setMateriaFiltroRendimiento("todas");
              }}
              disabled={loadingClases || cursosProfesor.length === 0}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loadingClases && <option value="">Cargando cursos...</option>}
              {!loadingClases && cursosProfesor.length > 0 && <option value="" disabled>Selecciona un curso</option>}
              {!loadingClases && cursosProfesor.length === 0 && <option value="">Sin cursos asignados</option>}
              {cursosProfesor.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Materia
            </label>
            <select
              value={materiaFiltroRendimiento}
              onChange={(e) => setMateriaFiltroRendimiento(e.target.value)}
              disabled={loadingClases || !cursoFiltroRendimiento}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="todas">Todas las materias del curso</option>
              {materiasDelCursoFiltro.map((clase) => (
                <option key={clase.id} value={clase.id}>
                  {clase.materia}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg">
          <div className="p-6">
            <div className="bg-red-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl" aria-hidden="true">!</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ranking de inasistencias por curso
            </h3>
            {loadingInasistencias ? (
              <p className="text-sm font-medium text-gray-500">Cargando inasistencias...</p>
            ) : inasistencias.length > 0 ? (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {inasistencias.map((item) => (
                  <div
                    key={`${item.curso_id}-${item.estudiante_id}-${item.posicion}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                          #{item.posicion}
                        </span>
                        <p className="truncate text-sm font-semibold text-gray-900">{item.nombre}</p>
                      </div>
                      <p className="mt-1 truncate text-xs font-medium text-gray-600">Curso: {item.curso}</p>
                    </div>
                    <span className="shrink-0 rounded bg-white px-2 py-1 text-sm font-bold text-red-600">
                      {item.total_fallas}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No hay datos disponibles</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg">
          <div className="p-6">
            <div className="bg-yellow-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl" aria-hidden="true">↓</span>
            </div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
              Estudiantes con bajo rendimiento
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-700">
                  {cursoFiltroNombre}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                  {materiaFiltroNombre}
                </span>
              </div>
            </div>
            {loadingRendimiento ? (
              <p className="text-sm font-medium text-gray-500">Cargando rendimiento...</p>
            ) : notasBajas.length > 0 ? (
              <div className="space-y-2">
                {notasBajas.map((estudiante, index) => (
                  <div key={`${estudiante.nombre}-${index}`} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-gray-900">{estudiante.nombre}</p>
                      <p className={`text-sm font-bold ${estudiante.color === 'red' ? 'text-red-500' : estudiante.color === 'yellow' ? 'text-yellow-500' : 'text-green-500'}`}>
                        {Number(estudiante.promedio).toFixed(2)}
                      </p>
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-gray-600">
                      Curso: {estudiante.curso} · Materia: {estudiante.materia || materiaFiltroNombre}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No hay estudiantes con bajo rendimiento</p>
            )}
            <button
              type="button"
              onClick={() => irARanking("/ranking-rendimiento")}
              className="mt-4 w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Ver ranking por materia
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg">
          <div className="p-6">
            <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl" aria-hidden="true">↑</span>
            </div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
              Mejores Estudiantes
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                  {cursoFiltroNombre}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                  {materiaFiltroNombre}
                </span>
              </div>
            </div>
            {loadingRendimiento ? (
              <p className="text-sm font-medium text-gray-500">Cargando rendimiento...</p>
            ) : notasAltas.length > 0 ? (
              <div className="space-y-2">
                {notasAltas.map((estudiante, index) => (
                  <div key={`${estudiante.nombre}-${index}`} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-gray-900">{estudiante.nombre}</p>
                      <p className="text-sm font-bold text-green-600">
                        {Number(estudiante.promedio).toFixed(2)}
                      </p>
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-gray-600">
                      Curso: {estudiante.curso} · Materia: {estudiante.materia || materiaFiltroNombre}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No hay estudiantes con notas altas aún</p>
            )}
            <button
              type="button"
              onClick={() => irARanking("/ranking-mejor-rendimiento")}
              className="mt-4 w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Ver ranking por materia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardProfesor;
