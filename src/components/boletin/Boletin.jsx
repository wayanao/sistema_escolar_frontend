
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DocumentoImprimible from '../impresion/DocumentoImprimible';

const VALORACIONES_DESARROLLO = {
  destacado: { label: "Destacado", emoji: "⭐" },
  logrado: { label: "Logrado", emoji: "😀" },
  proceso: { label: "En proceso", emoji: "🙂" },
  apoyo: { label: "Requiere acompañamiento", emoji: "🧩" }
};

const EMOJI_DESARROLLO = {
  destacado: "⭐",
  logrado: "😀",
  proceso: "🙂",
  apoyo: "🧩"
};

const ESCALA_NUMERICA = [
  { rango: "5.0", concepto: "Excelente / Superior" },
  { rango: "4.0 - 4.9", concepto: "Alto" },
  { rango: "3.0 - 3.9", concepto: "Básico" },
  { rango: "1.0 - 2.9", concepto: "Bajo" }
];

const normalizarTexto = (valor, fallback = "N/A") => {
  const texto = String(valor ?? "").trim();
  return texto || fallback;
};

const documentoEstudiante = (estudiante) =>
  normalizarTexto(
    estudiante?.documento_identidad ??
      estudiante?.documento ??
      estudiante?.identificacion ??
      estudiante?.cedula
  );

const Boletin = () => {
  const [cargando, setCargando] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [periodo, setPeriodo] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  
  const [boletinData, setBoletinData] = useState(null);
  const [cargandoBoletin, setCargandoBoletin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCursos, resEst] = await Promise.all([
          api.get('/cursos'),
          api.get('/estudiantes')
        ]);
        setCursos(resCursos.data);
        setEstudiantes(resEst.data);
      } catch (error) {
        console.error("Error cargando base de datos", error);
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  const generarBoletin = async (estudianteId) => {
    setCargandoBoletin(true);
    try {
      const res = await api.get(`/boletines/admin/generar/${estudianteId}/${periodo}`);
      setBoletinData(res.data);
    } catch (e) {
      alert("Error al cargar el boletín. " + (e.response?.data?.detail || e.message));
    } finally {
      setCargandoBoletin(false);
    }
  };

  const calcularPromedioGeneral = () => {
    if (!boletinData || !boletinData.materias) return 0;
    const evaluadas = boletinData.materias.filter(m => m.definitiva !== null);
    if (evaluadas.length === 0) return 0;
    const suma = evaluadas.reduce((acc, m) => acc + m.definitiva, 0);
    return (suma / evaluadas.length).toFixed(1);
  };

  const getDesempeno = (definitiva) => {
    if (definitiva === null) return "PENDIENTE";
    if (definitiva >= 4.6) return "SUPERIOR";
    if (definitiva >= 4.0) return "ALTO";
    if (definitiva >= 3.0) return "BÁSICO";
    return "BAJO";
  };

  const getStyles = (definitiva) => {
    if (definitiva === null) return { text: "text-gray-500", bg: "bg-gray-100" };
    if (definitiva >= 4.0) return { text: "text-green-700", bg: "bg-green-50" };
    if (definitiva >= 3.0) return { text: "text-purple-700", bg: "bg-purple-50" };
    return { text: "text-red-700", bg: "bg-red-50" };
  };

  const renderValoracionPeriodo = (det, periodoKey) => {
    const valor = det.valoraciones_por_periodo?.[periodoKey];
    if (valor) {
      return EMOJI_DESARROLLO[valor] || valor;
    }

    return det.notas_por_periodo?.[periodoKey]?.toFixed(1) || "";
  };

  const estudiantesFiltrados = estudiantes.filter(est => {
    const matchCurso = cursoSeleccionado ? est.curso_id === parseInt(cursoSeleccionado) : true;
    const textoBusqueda = [
      est.nombre,
      est.apellido,
      documentoEstudiante(est),
    ].join(" ").toLowerCase();
    const matchBusqueda = textoBusqueda.includes(busqueda.toLowerCase());
    return matchCurso && matchBusqueda;
  });

  if (!boletinData) {
    return (
      <div className="w-full p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Generar Boletines Administrativos</h1>
        <p className="text-gray-600 mb-8">Escoge un estudiante para extraer y consolidar las notas digitadas por los profesores.</p>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <select 
            className="p-3 border rounded-lg shadow-sm w-full md:w-1/3 focus:ring-2 focus:ring-purple-500"
            value={cursoSeleccionado}
            onChange={(e) => setCursoSeleccionado(e.target.value)}
          >
            <option value="">-- Todos los Cursos --</option>
            {cursos.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} ({c.jornada || "Mañana"})</option>
            ))}
          </select>

          <input 
            type="text"
            className="p-3 border rounded-lg shadow-sm w-full md:w-2/3 focus:ring-2 focus:ring-purple-500"
            placeholder="Buscar alumno por nombre, apellido o documento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select 
            className="p-3 border rounded-lg shadow-sm w-full md:w-32 focus:ring-2 focus:ring-purple-500 border-purple-300"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            title="Periodo Académico"
          >
            <option value={1}>Per 1</option>
            <option value={2}>Per 2</option>
            <option value={3}>Per 3</option>
            <option value={4}>Per 4</option>
          </select>
        </div>

        {cargando ? (
          <div className="animate-pulse p-10 text-center text-gray-500 font-bold">Cargando base de datos...</div>
        ) : (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="p-4 font-semibold">Documento</th>
                    <th className="p-4 font-semibold">Estudiante</th>
                    <th className="p-4 font-semibold">Curso</th>
                    <th className="p-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {estudiantesFiltrados.map(est => {
                    const cursoObj = cursos.find(c => c.id === est.curso_id);
                    const cursoNombre = cursoObj ? cursoObj.nombre : "Sin Asignar";
                    return (
                      <tr key={est.id} className="hover:bg-purple-50 transition duration-150">
                        <td className="p-4 text-sm text-gray-600">{documentoEstudiante(est)}</td>
                        <td className="p-4 font-bold text-gray-800 uppercase">{est.apellido}, {est.nombre}</td>
                        <td className="p-4 text-sm text-gray-600 font-medium">{cursoNombre}</td>
                        <td className="p-4 text-right">
                          <button 
                            disabled={cargandoBoletin}
                            onClick={() => generarBoletin(est.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md transition transform hover:-translate-y-1 disabled:opacity-50"
                          >
                            {cargandoBoletin ? "⏳ Generando..." : "📄 Generar Boletín"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {estudiantesFiltrados.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-500">No se encontraron estudiantes asociados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  const usaDesarrolloInfantil = boletinData.materias?.some((materia) =>
    materia.detalles?.some((detalle) =>
      detalle.tipo_evaluacion === "desarrollo" ||
      Object.keys(detalle.valoraciones_por_periodo || {}).length > 0
    )
  );
  const materiasBoletin = Array.from(
    (boletinData.materias || []).reduce((mapa, mat) => {
      const clave = String(mat.materia_id);
      if (!mapa.has(clave)) {
        mapa.set(clave, { ...mat, detalles: [] });
      }
      mapa.get(clave).detalles.push(...(mat.detalles || []));
      return mapa;
    }, new Map()).values()
  );

  return (
    <div className="bg-gray-100 min-h-screen py-10 px-4 md:px-8 relative">
      <div className="fixed left-4 top-4 no-print z-50 md:left-6 md:top-6">
        <button
          onClick={() => setBoletinData(null)}
          className="bg-slate-800 text-white px-4 py-2.5 rounded-full text-sm font-bold shadow-xl hover:bg-slate-900 transition"
          title="Atras"
        >
          ← Atrás
        </button>
      </div>

      <DocumentoImprimible
        tipo="boletin"
        className="di-documento--boletin"
        titulo="Boletín Académico Informativo"
        subtitulo={`Periodo ${boletinData.periodo} · Año Lectivo ${new Date().getFullYear()}`}
        firmas={[
          { nombre: "Director del Colegio" },
          { nombre: "Director de Grupo" },
        ]}
      >
        {/* Datos del alumno + chips - una sola fila balanceada */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 leading-none mb-1">Estudiante</p>
            <p className="text-base font-extrabold uppercase tracking-wide text-slate-800 truncate leading-tight">
              {boletinData.estudiante_apellido}, {boletinData.estudiante_nombre}
            </p>
          </div>
          <div className="flex items-stretch gap-1.5 text-[11px]">
            <Chip label="Curso" value={boletinData.curso} highlight />
            <Chip label="Periodo" value={boletinData.periodo} highlight />
            <Chip label="Año" value={new Date().getFullYear()} />
          </div>
        </div>

        {/* Escala + Promedio en una sola fila */}
        <div className="rounded-lg border border-slate-200 mb-4 overflow-hidden">
          <div className="flex items-stretch">
            <div className="flex-1 p-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                Escala de valoración
              </p>
              <div className="flex flex-wrap gap-1.5">
                {usaDesarrolloInfantil
                  ? Object.entries(VALORACIONES_DESARROLLO).map(([key, item]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-2 py-0.5 text-[11px] font-semibold"
                      >
                        <span>{item.emoji}</span>
                        <span>{item.label}</span>
                      </span>
                    ))
                  : ESCALA_NUMERICA.map((item) => (
                      <span
                        key={item.rango}
                        className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-900 border border-purple-200 rounded px-2 py-0.5 text-[11px]"
                      >
                        <span className="font-black">{item.rango}</span>
                        <span className="font-semibold">{item.concepto}</span>
                      </span>
                    ))}
              </div>
            </div>
            <div
              className="border-l border-slate-200 px-5 py-3 flex items-stretch text-white min-w-[140px] divide-x divide-white/20"
              style={{ backgroundColor: "var(--di-color-primario, #0f314f)" }}
            >
              <div className="flex flex-col items-center justify-center px-2">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">Promedio</span>
                <span className={`text-3xl font-black leading-none mt-1 ${(calcularPromedioGeneral() >= 3.0 || calcularPromedioGeneral() == 0) ? 'text-white' : 'text-red-300'}`}>
                  {calcularPromedioGeneral()}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70 mt-1">general</span>
              </div>
              {!usaDesarrolloInfantil && boletinData.puesto && boletinData.total_estudiantes > 0 && (
                <div className="flex flex-col items-center justify-center px-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">Puesto</span>
                  <span className="text-3xl font-black leading-none mt-1">{boletinData.puesto}</span>
                  <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70 mt-1">
                    de {boletinData.total_estudiantes}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Encabezado materias */}
        <h2 className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-700 border-b-2 border-slate-800 pb-1 mb-3">
          Resumen de evaluaciones
        </h2>

        {/* Materias */}
        <div className="space-y-3">
          {materiasBoletin.map((mat) => {
            const tipoMateria = mat.detalles?.some(det => det.tipo_evaluacion === "desarrollo") ? "desarrollo" : "numerica";
            const styles = getStyles(mat.definitiva);
            const desempeno = getDesempeno(mat.definitiva);

            return (
              <div
                key={`${mat.materia_id}-${mat.boletin_id}`}
                className="border border-slate-200 rounded-lg overflow-hidden page-break-inside-avoid"
              >
                <div className="px-3 py-2 flex justify-between items-center bg-slate-50 border-b border-slate-200">
                  <div className="min-w-0">
                    <h3 className="font-bold uppercase text-slate-800 tracking-wide text-sm truncate">
                      {mat.materia}
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">
                      Docente: {mat.profesor_nombre} {mat.profesor_apellido || ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {tipoMateria === "desarrollo" ? (
                      <span className="text-[10px] font-black tracking-widest px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                        DESARROLLO
                      </span>
                    ) : (
                      <>
                        <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded border ${styles.text} ${styles.bg}`}>
                          {desempeno}
                        </span>
                        <span className={`text-2xl font-black leading-none ${styles.text}`}>
                          {mat.definitiva !== null ? mat.definitiva.toFixed(1) : "---"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white">
                  {mat.detalles && mat.detalles.length > 0 ? (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wide">
                          <th className="text-left px-3 py-1.5 border-b border-slate-200">Logro / Observación</th>
                          <th className="text-center px-2 py-1.5 w-12 border-b border-slate-200">P1</th>
                          <th className="text-center px-2 py-1.5 w-12 border-b border-slate-200">P2</th>
                          <th className="text-center px-2 py-1.5 w-12 border-b border-slate-200">P3</th>
                          <th className="text-center px-2 py-1.5 w-12 border-b border-slate-200">P4</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(mat?.detalles || []).map((det, idx) => (
                          <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-3 py-1.5 text-slate-700 break-words whitespace-normal max-w-[300px]">
                              {det.observacion?.trim() || <span className="text-slate-400 italic">Sin observación</span>}
                            </td>
                            <td className="px-2 py-1.5 text-center font-semibold text-slate-700">{renderValoracionPeriodo(det, "1")}</td>
                            <td className="px-2 py-1.5 text-center font-semibold text-slate-700">{renderValoracionPeriodo(det, "2")}</td>
                            <td className="px-2 py-1.5 text-center font-semibold text-slate-700">{renderValoracionPeriodo(det, "3")}</td>
                            <td className="px-2 py-1.5 text-center font-semibold text-slate-700">{renderValoracionPeriodo(det, "4")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-3 text-slate-400 text-[10px] uppercase font-semibold">
                      Calificación y observaciones pendientes por ingresar.
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {boletinData.materias.length === 0 && (
            <div className="p-8 text-center font-semibold text-slate-400 border-2 border-dashed border-slate-300 rounded">
              El curso no tiene asignadas materias o profesores todavía.
            </div>
          )}
        </div>

        {/* Observación general - editable en pantalla, NO se guarda en BD */}
        <section className="mt-5 page-break-inside-avoid">
          <p
            className="text-[10px] uppercase tracking-widest font-bold mb-1.5"
            style={{ color: "var(--di-color-primario, #0f314f)" }}
          >
            Observación general
          </p>
          <div
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-placeholder="Escriba aquí la observación general del estudiante…"
            className="di-observacion-editable rounded-lg border border-slate-300 bg-white text-slate-800"
            style={{
              minHeight: "110px",
              padding: "10px 14px",
              lineHeight: "24px",
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 23px, #e2e8f0 23px, #e2e8f0 24px)",
              backgroundPosition: "0 14px",
              outline: "none",
              whiteSpace: "pre-wrap",
            }}
          />
        </section>
      </DocumentoImprimible>
    </div>
  );
};

function Chip({ label, value, highlight }) {
  const highlightStyle = highlight
    ? {
        backgroundColor: "var(--di-color-primario, #0f314f)",
        borderColor: "var(--di-color-primario, #0f314f)",
        color: "#ffffff",
      }
    : undefined;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 border ${highlight ? "" : "bg-white text-slate-700 border-slate-300"}`}
      style={highlightStyle}
    >
      <span className={`text-[9px] uppercase tracking-widest font-bold ${highlight ? "opacity-75" : "text-slate-500"}`}>{label}</span>
      <span className="font-bold">{value}</span>
    </span>
  );
}

export default Boletin;
