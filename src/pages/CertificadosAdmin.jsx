import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import DocumentoImprimible from "../components/impresion/DocumentoImprimible";

const PERIODOS = [
  { value: "todos", label: "Todos los periodos" },
  { value: "1", label: "Periodo 1" },
  { value: "2", label: "Periodo 2" },
  { value: "3", label: "Periodo 3" },
  { value: "4", label: "Periodo 4" },
];
const PERIODOS_NUMERICOS = [1, 2, 3, 4];
const PERIODOS_REPORTE = PERIODOS.filter((item) => item.value !== "todos");
const MATERIA_TODAS = "todas";
const ESTADOS = [
  { value: "activo", label: "Activos" },
  { value: "retirado", label: "Retirados" },
  { value: "egresado", label: "Egresados" },
  { value: "inactivo", label: "Inactivos" },
  { value: "todos", label: "Todos" },
];

function normalizarTexto(valor, fallback = "N/A") {
  const texto = String(valor ?? "").trim();
  return texto || fallback;
}

function nombreEstudiante(estudiante) {
  return `${normalizarTexto(estudiante?.nombre, "")} ${normalizarTexto(estudiante?.apellido, "")}`
    .trim()
    .replace(/\s+/g, " ");
}

function documentoEstudiante(estudiante) {
  return normalizarTexto(
    estudiante?.documento_identidad ?? estudiante?.documento ?? estudiante?.identificacion ?? estudiante?.cedula
  );
}

function getDefinitiva(materia) {
  const valor = materia?.definitiva ?? materia?.promedio ?? materia?.nota_final ?? null;
  const numero = Number(valor);
  if (Number.isFinite(numero) && numero > 0) return numero;

  const notasDetalle = (materia?.detalles || [])
    .flatMap((detalle) => {
      const periodoActual = String(materia?.periodo ?? detalle?.periodo ?? "");
      if (periodoActual && detalle?.notas_por_periodo?.[periodoActual] !== undefined) {
        return [detalle.notas_por_periodo[periodoActual]];
      }
      return [detalle?.nota];
    })
    .map(Number)
    .filter((nota) => Number.isFinite(nota) && nota > 0);

  if (!notasDetalle.length) return null;
  return notasDetalle.reduce((total, nota) => total + nota, 0) / notasDetalle.length;
}

function getDesempeno(definitiva) {
  if (definitiva === null) return "Pendiente";
  if (definitiva >= 4.6) return "Superior";
  if (definitiva >= 4.0) return "Alto";
  if (definitiva >= 3.0) return "Basico";
  return "Bajo";
}

function formatoNota(definitiva) {
  return definitiva === null ? "---" : definitiva.toFixed(1);
}

function obtenerFilasMaterias(certificado) {
  const mapa = new Map();
  const fuentes = certificado.todos_los_periodos
    ? certificado.periodos_data || []
    : [certificado];

  fuentes.forEach((periodoData) => {
    const periodoKey = String(periodoData.periodo);
    (periodoData.materias || []).forEach((materia) => {
      const key = materia.materia_id ?? materia.id ?? materia.materia ?? materia.nombre;
      if (!mapa.has(key)) {
        mapa.set(key, {
          key,
          nombre: normalizarTexto(materia.materia || materia.nombre || materia.nombre_materia, "Materia"),
          docente: normalizarTexto(`${materia.profesor_nombre || ""} ${materia.profesor_apellido || ""}`.trim()),
          notasPorPeriodo: {},
        });
      }
      mapa.get(key).notasPorPeriodo[periodoKey] = getDefinitiva(materia);
    });
  });

  return Array.from(mapa.values()).map((fila) => {
    const notas = Object.values(fila.notasPorPeriodo).filter((nota) => nota !== null);
    const promedio = notas.length
      ? notas.reduce((total, nota) => total + nota, 0) / notas.length
      : null;
    return { ...fila, promedio };
  });
}

function getMateriaId(materia) {
  return materia?.materia_id ?? materia?.id ?? materia?.materia ?? materia?.nombre;
}

function getNombreMateria(materia) {
  return normalizarTexto(materia?.materia || materia?.nombre || materia?.nombre_materia, "Materia");
}

function getDocenteMateria(materia) {
  return normalizarTexto(`${materia?.profesor_nombre || ""} ${materia?.profesor_apellido || ""}`.trim());
}

function getValorDetalle(detalle, periodo) {
  const periodoKey = String(periodo);
  const valoracion = detalle?.valoraciones_por_periodo?.[periodoKey] ?? detalle?.valoracion;
  if (valoracion) return String(valoracion);

  const nota = detalle?.notas_por_periodo?.[periodoKey] ?? detalle?.nota;
  const numero = Number(nota);
  return Number.isFinite(numero) && numero > 0 ? numero.toFixed(1) : "";
}

function getDescripcionDetalle(detalle, index) {
  const texto = String(detalle?.observacion ?? detalle?.descripcion ?? detalle?.tipo_nota ?? "").trim();
  return texto || `Evaluacion ${index + 1}`;
}

function getEstadoMateria(materia) {
  const definitiva = getDefinitiva(materia);
  const detalles = materia?.detalles || [];

  if (!detalles.length && definitiva === null) return "Sin calificar";
  if (definitiva === null || detalles.some((detalle, index) => !getValorDetalle(detalle, materia?.periodo || detalle?.periodo || 1) && getDescripcionDetalle(detalle, index))) {
    return "Con pendientes";
  }
  return "Al dia";
}

function contarAusencias(registro) {
  return (registro?.historial || []).filter((item) => String(item?.estado || "").toLowerCase() === "ausente").length;
}

function construirMateriaReporte(materia, periodo, asistenciaPorAsignacion, estudianteId) {
  const asistenciaAsignacion = asistenciaPorAsignacion.get(Number(materia.asignacion_id)) || [];
  const registroEstudiante = asistenciaAsignacion.find((item) => Number(item.estudiante_id) === Number(estudianteId));
  const detalles = (materia.detalles || []).map((detalle, index) => ({
    descripcion: getDescripcionDetalle(detalle, index),
    valor: getValorDetalle(detalle, periodo),
  }));
  const definitiva = getDefinitiva({ ...materia, periodo });

  return {
    asignacion_id: materia.asignacion_id,
    materia_id: getMateriaId(materia),
    nombre: getNombreMateria(materia),
    docente: getDocenteMateria(materia),
    definitiva,
    desempeno: getDesempeno(definitiva),
    estado: getEstadoMateria({ ...materia, periodo }),
    inasistencias: contarAusencias(registroEstudiante),
    detalles,
  };
}

function promedioMaterias(materias) {
  const notas = materias.map((materia) => materia.definitiva).filter((nota) => nota !== null);
  if (!notas.length) return null;
  return notas.reduce((total, nota) => total + nota, 0) / notas.length;
}

function totalInasistencias(materias) {
  return materias.reduce((total, materia) => total + (Number(materia.inasistencias) || 0), 0);
}

export default function CertificadosAdmin() {
  const [tabActiva, setTabActiva] = useState("notas");
  const [cursos, setCursos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [busqueda, setBusqueda] = useState("");
  const [periodo, setPeriodo] = useState("1");
  const [periodoReporte, setPeriodoReporte] = useState("1");
  const [materiaReporte, setMateriaReporte] = useState(MATERIA_TODAS);
  const [anioLectivo, setAnioLectivo] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [generandoId, setGenerandoId] = useState(null);
  const [generandoCurso, setGenerandoCurso] = useState(false);
  const [certificado, setCertificado] = useState(null);
  const [certificadoMatricula, setCertificadoMatricula] = useState(null);
  const [reporteParcial, setReporteParcial] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarBase = async () => {
      setLoading(true);
      setError("");
      try {
        const [resCursos, resEstudiantes, resMaterias] = await Promise.all([
          api.get("/cursos"),
          api.get("/estudiantes"),
          api.get("/materias"),
        ]);
        setCursos(resCursos.data || []);
        setEstudiantes(resEstudiantes.data || []);
        setMaterias(resMaterias.data || []);
      } catch (err) {
        console.error("Error cargando base para certificados", err);
        setError("No se pudo cargar la informacion base.");
      } finally {
        setLoading(false);
      }
    };

    cargarBase();
  }, []);

  const cursosPorId = useMemo(() => {
    const mapa = new Map();
    cursos.forEach((curso) => mapa.set(curso.id, curso));
    return mapa;
  }, [cursos]);

  const estudiantesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return estudiantes.filter((estudiante) => {
      const coincideCurso = cursoSeleccionado
        ? estudiante.curso_id === Number(cursoSeleccionado)
        : true;
      const estado = estudiante.estado || "activo";
      const coincideEstado = estadoFiltro === "todos" ? true : estado === estadoFiltro;
      const nombreCompleto = `${estudiante.nombre || ""} ${estudiante.apellido || ""} ${estudiante.documento_identidad || ""}`.toLowerCase();
      const coincideBusqueda = texto ? nombreCompleto.includes(texto) : true;
      return coincideCurso && coincideEstado && coincideBusqueda;
    });
  }, [busqueda, cursoSeleccionado, estadoFiltro, estudiantes]);

  const generarCertificado = async (estudianteId) => {
    setGenerandoId(estudianteId);
    setError("");
    try {
      const estudiante = estudiantes.find((item) => item.id === estudianteId);
      const curso = cursosPorId.get(estudiante?.curso_id);
      const periodosConsultar = periodo === "todos" ? PERIODOS_NUMERICOS : [Number(periodo)];
      const respuestas = await Promise.all(
        periodosConsultar.map((periodoItem) =>
          api.get(`/boletines/admin/generar/${estudianteId}/${periodoItem}`)
        )
      );
      const data = respuestas[0].data;
      const periodosData = respuestas.map((respuesta, index) => ({
        ...respuesta.data,
        periodo: periodosConsultar[index],
        materias: (respuesta.data.materias || []).map((materia) => ({
          ...materia,
          periodo: periodosConsultar[index],
        })),
      }));
      setCertificado({
        ...data,
        periodo: periodo === "todos" ? "Todos" : data.periodo,
        todos_los_periodos: periodo === "todos",
        periodos_data: periodosData,
        documento_identidad: documentoEstudiante(estudiante),
        estudiante_nombre: estudiante?.nombre ?? data.estudiante_nombre,
        estudiante_apellido: estudiante?.apellido ?? data.estudiante_apellido,
        estudiante_nombre_completo: nombreEstudiante(estudiante),
        curso: data.curso ?? curso?.nombre,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error generando certificado", err);
      setError(err?.response?.data?.detail || "No se pudo generar el certificado.");
    } finally {
      setGenerandoId(null);
    }
  };

  const generarCertificadoMatricula = (estudianteId) => {
    setGenerandoId(estudianteId);
    setError("");
    try {
      const estudiante = estudiantes.find((item) => item.id === estudianteId);
      if (!estudiante) {
        setError("No se encontro el estudiante seleccionado.");
        return;
      }

      const curso = cursosPorId.get(estudiante.curso_id);
      setCertificadoMatricula({
        estudiante_nombre_completo: nombreEstudiante(estudiante),
        documento_identidad: documentoEstudiante(estudiante),
        curso: curso?.nombre || estudiante.curso_nombre || "Sin asignar",
        jornada: curso?.jornada || estudiante.jornada || "",
        estado: estudiante.estado || "activo",
        anio_lectivo: anioLectivo || String(new Date().getFullYear()),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setGenerandoId(null);
    }
  };

  const construirReporteParcial = async (estudiantesObjetivo, alcance) => {
    const periodoNumero = Number(periodoReporte);
    const materiaIdFiltro = materiaReporte === MATERIA_TODAS ? null : Number(materiaReporte);
    const respuestas = await Promise.allSettled(
      estudiantesObjetivo.map((estudiante) =>
        api.get(`/boletines/admin/generar/${estudiante.id}/${periodoNumero}`)
      )
    );

    const boletinesValidos = respuestas
      .map((respuesta, index) => {
        if (respuesta.status !== "fulfilled") return null;
        const estudiante = estudiantesObjetivo[index];
        const data = respuesta.value.data || {};
        const materiasFiltradas = (data.materias || [])
          .filter((materia) => (materiaIdFiltro ? Number(getMateriaId(materia)) === materiaIdFiltro : true))
          .map((materia) => ({ ...materia, periodo: periodoNumero }));
        return { estudiante, data, materiasFiltradas };
      })
      .filter(Boolean);

    if (!boletinesValidos.length) {
      throw new Error("No se pudo cargar informacion academica para los filtros seleccionados.");
    }

    const asignacionIds = Array.from(
      new Set(
        boletinesValidos
          .flatMap((item) => item.materiasFiltradas)
          .map((materia) => Number(materia.asignacion_id))
          .filter(Boolean)
      )
    );
    const asistenciaPorAsignacion = new Map();

    await Promise.all(
      asignacionIds.map(async (asignacionId) => {
        try {
          const res = await api.get(`/asistencia/historial/${asignacionId}/${periodoNumero}`);
          asistenciaPorAsignacion.set(asignacionId, Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          console.error("Error cargando asistencia para reporte parcial", err);
          asistenciaPorAsignacion.set(asignacionId, []);
        }
      })
    );

    const estudiantesReporte = boletinesValidos.map(({ estudiante, data, materiasFiltradas }) => {
      const curso = cursosPorId.get(estudiante.curso_id);
      const materiasReporte = materiasFiltradas.map((materia) =>
        construirMateriaReporte(materia, periodoNumero, asistenciaPorAsignacion, estudiante.id)
      );

      return {
        id: estudiante.id,
        nombre: nombreEstudiante(estudiante) || normalizarTexto(`${data.estudiante_nombre || ""} ${data.estudiante_apellido || ""}`.trim()),
        documento: documentoEstudiante(estudiante),
        curso: data.curso || curso?.nombre || "Sin asignar",
        estado: estudiante.estado || "activo",
        promedio: promedioMaterias(materiasReporte),
        inasistencias: totalInasistencias(materiasReporte),
        materias: materiasReporte,
      };
    });

    const errores = respuestas.filter((respuesta) => respuesta.status === "rejected").length;
    const cursoSeleccionadoInfo = cursosPorId.get(Number(cursoSeleccionado));
    const materiaSeleccionadaInfo = materiaIdFiltro
      ? materias.find((materia) => Number(materia.id) === materiaIdFiltro)
      : null;

    setReporteParcial({
      alcance,
      periodo: periodoNumero,
      materia: materiaSeleccionadaInfo?.nombre || "Todas las materias",
      curso: alcance === "curso"
        ? `${normalizarTexto(cursoSeleccionadoInfo?.nombre, "Curso")} ${cursoSeleccionadoInfo?.jornada ? `- ${cursoSeleccionadoInfo.jornada}` : ""}`.trim()
        : estudiantesReporte[0]?.curso,
      fecha: new Date().toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      estudiantes: estudiantesReporte,
      errores,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generarReporteParcialEstudiante = async (estudianteId) => {
    setGenerandoId(estudianteId);
    setError("");
    try {
      const estudiante = estudiantes.find((item) => item.id === estudianteId);
      if (!estudiante) {
        setError("No se encontro el estudiante seleccionado.");
        return;
      }
      await construirReporteParcial([estudiante], "estudiante");
    } catch (err) {
      console.error("Error generando reporte academico parcial", err);
      setError(err?.response?.data?.detail || err?.message || "No se pudo generar el reporte academico parcial.");
    } finally {
      setGenerandoId(null);
    }
  };

  const generarReporteParcialCurso = async () => {
    setGenerandoCurso(true);
    setError("");
    try {
      if (!cursoSeleccionado) {
        setError("Selecciona un curso para generar el reporte academico parcial del grupo.");
        return;
      }

      const estudiantesCurso = estudiantes.filter((estudiante) => {
        const coincideCurso = estudiante.curso_id === Number(cursoSeleccionado);
        const estado = estudiante.estado || "activo";
        const coincideEstado = estadoFiltro === "todos" ? true : estado === estadoFiltro;
        return coincideCurso && coincideEstado;
      });

      if (!estudiantesCurso.length) {
        setError("No hay estudiantes en el curso y estado seleccionados.");
        return;
      }

      await construirReporteParcial(estudiantesCurso, "curso");
    } catch (err) {
      console.error("Error generando reporte academico parcial por curso", err);
      setError(err?.response?.data?.detail || err?.message || "No se pudo generar el reporte academico parcial.");
    } finally {
      setGenerandoCurso(false);
    }
  };

  const generarSegunTab = (estudianteId) => {
    if (tabActiva === "matricula") {
      generarCertificadoMatricula(estudianteId);
      return;
    }

    if (tabActiva === "reporte-parcial") {
      generarReporteParcialEstudiante(estudianteId);
      return;
    }

    generarCertificado(estudianteId);
  };

  if (certificado) {
    return (
      <CertificadoPreview
        certificado={certificado}
        onBack={() => setCertificado(null)}
      />
    );
  }

  if (certificadoMatricula) {
    return (
      <CertificadoMatriculaPreview
        certificado={certificadoMatricula}
        onBack={() => setCertificadoMatricula(null)}
      />
    );
  }

  if (reporteParcial) {
    return (
      <ReporteParcialPreview
        reporte={reporteParcial}
        onBack={() => setReporteParcial(null)}
      />
    );
  }

  const tabs = [
    { id: "notas", label: "Certificado de notas" },
    { id: "matricula", label: "Certificado de matrícula" },
    { id: "reporte-parcial", label: "Reporte académico parcial" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Certificados</h1>
        <p className="text-sm text-slate-600">
          Genera certificados e informes academicos para consulta administrativa e impresion.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setTabActiva(tab.id);
              setError("");
            }}
            className={`border-b-2 px-4 py-2 text-sm font-bold transition ${
              tabActiva === tab.id
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_150px]">
          <select
            value={cursoSeleccionado}
            onChange={(event) => setCursoSeleccionado(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          >
            <option value="">Todos los cursos</option>
            {cursos.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.nombre} {curso.jornada ? `- ${curso.jornada}` : ""}
              </option>
            ))}
          </select>

          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder={tabActiva === "reporte-parcial" ? "Buscar alumno para reporte individual" : "Buscar por estudiante o documento"}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />

          {tabActiva === "notas" ? (
            <select
              value={periodo}
              onChange={(event) => setPeriodo(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              {PERIODOS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          ) : tabActiva === "matricula" ? (
            <input
              type="number"
              min="2000"
              max="2100"
              value={anioLectivo}
              onChange={(event) => setAnioLectivo(event.target.value)}
              placeholder="Año lectivo"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          ) : (
            <select
              value={periodoReporte}
              onChange={(event) => setPeriodoReporte(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              {PERIODOS_REPORTE.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          )}

          <select
            value={estadoFiltro}
            onChange={(event) => setEstadoFiltro(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          >
            {ESTADOS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          {tabActiva === "reporte-parcial" && (
            <>
              <select
                value={materiaReporte}
                onChange={(event) => setMateriaReporte(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 md:col-span-1 xl:col-span-2"
              >
                <option value={MATERIA_TODAS}>Todas las materias</option>
                {materias.map((materia) => (
                  <option key={materia.id} value={materia.id}>
                    {materia.nombre}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!cursoSeleccionado || generandoCurso || !!generandoId}
                onClick={generarReporteParcialCurso}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-1 xl:col-span-2"
              >
                {generandoCurso ? "Generando reporte..." : "Generar reporte del curso"}
              </button>
            </>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Documento</th>
                  <th className="px-4 py-3 font-semibold">Estudiante</th>
                  <th className="px-4 py-3 font-semibold">Curso</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estudiantesFiltrados.map((estudiante) => {
                  const curso = cursosPorId.get(estudiante.curso_id);
                  const cargando = generandoId === estudiante.id;
                  return (
                    <tr key={estudiante.id} className="hover:bg-purple-50/50">
                      <td className="px-4 py-3 text-slate-600">
                        {documentoEstudiante(estudiante)}
                      </td>
                      <td className="px-4 py-3 font-semibold uppercase text-slate-900">
                        {nombreEstudiante(estudiante)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {curso?.nombre || "Sin asignar"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                          {estudiante.estado || "activo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={!!generandoId || generandoCurso}
                          onClick={() => generarSegunTab(estudiante.id)}
                          className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cargando
                            ? "Generando..."
                            : tabActiva === "matricula"
                              ? "Generar matrícula"
                              : tabActiva === "reporte-parcial"
                                ? "Ver reporte"
                                : "Generar notas"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {estudiantesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                      No hay estudiantes para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function CertificadoPreview({ certificado, onBack }) {
  const filasMaterias = obtenerFilasMaterias(certificado);
  const notas = filasMaterias
    .flatMap((fila) => Object.values(fila.notasPorPeriodo))
    .filter((nota) => nota !== null);
  const promedio = notas.length
    ? (notas.reduce((total, nota) => total + nota, 0) / notas.length).toFixed(1)
    : "---";
  const estudiante = normalizarTexto(
    certificado.estudiante_nombre_completo,
    `${normalizarTexto(certificado.estudiante_nombre, "")} ${normalizarTexto(certificado.estudiante_apellido, "")}`
  )
    .trim()
    .replace(/\s+/g, " ");
  const estudianteFormal = estudiante || "el/la estudiante";
  const periodoTexto = certificado.todos_los_periodos
    ? "Todos los periodos"
    : `Periodo ${certificado.periodo}`;
  const fecha = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="fixed left-4 top-4 z-50 no-print md:left-6 md:top-6">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl transition hover:bg-slate-800"
          title="Atras"
        >
          ← Atrás
        </button>
      </div>

      <DocumentoImprimible
        tipo="reporte_estudiante"
        className="di-documento--certificado"
        titulo="Certificado de Notas"
        subtitulo={`${periodoTexto} · Año Lectivo ${new Date().getFullYear()}`}
        firmas={[
          { nombre: "", cargo: "Rector(a)" },
          { nombre: "", cargo: "Secretaria academica" },
        ]}
      >
        <section className="space-y-5 text-slate-800">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <DatoCertificado label="Documento" value={normalizarTexto(certificado.documento_identidad)} />
              <DatoCertificado label="Curso" value={normalizarTexto(certificado.curso)} />
              <DatoCertificado label="Periodo" value={periodoTexto} />
              <DatoCertificado label="Promedio" value={promedio} />
            </div>
          </div>

          <p className="text-justify text-sm leading-7">
            La institucion certifica que <strong className="uppercase">{estudianteFormal}</strong>,
            identificado(a) con documento <strong>{normalizarTexto(certificado.documento_identidad)}</strong>,
            registra las siguientes valoraciones academicas en el curso{" "}
            <strong>{normalizarTexto(certificado.curso)}</strong>, correspondiente a{" "}
            <strong>{periodoTexto.toLowerCase()}</strong> del ano lectivo <strong>{new Date().getFullYear()}</strong>.
          </p>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">Materia</th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">Docente</th>
                  {certificado.todos_los_periodos ? (
                    PERIODOS_NUMERICOS.map((periodoItem) => (
                      <th key={periodoItem} className="w-16 px-3 py-2 text-center font-semibold uppercase tracking-wide">
                        P{periodoItem}
                      </th>
                    ))
                  ) : (
                    <th className="w-24 px-3 py-2 text-center font-semibold uppercase tracking-wide">Nota</th>
                  )}
                  {certificado.todos_los_periodos && (
                    <th className="w-24 px-3 py-2 text-center font-semibold uppercase tracking-wide">Promedio</th>
                  )}
                  <th className="w-28 px-3 py-2 text-center font-semibold uppercase tracking-wide">Desempeno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filasMaterias.map((materia, index) => {
                  const definitiva = certificado.todos_los_periodos
                    ? materia.promedio
                    : materia.notasPorPeriodo[String(certificado.periodo)];
                  return (
                    <tr key={`${materia.key}-${index}`}>
                      <td className="px-3 py-2 font-semibold uppercase text-slate-800">
                        {materia.nombre}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {materia.docente}
                      </td>
                      {certificado.todos_los_periodos ? (
                        PERIODOS_NUMERICOS.map((periodoItem) => (
                          <td key={periodoItem} className="px-3 py-2 text-center font-black text-slate-900">
                            {formatoNota(materia.notasPorPeriodo[String(periodoItem)] ?? null)}
                          </td>
                        ))
                      ) : (
                        <td className="px-3 py-2 text-center text-base font-black text-slate-900">
                          {formatoNota(definitiva)}
                        </td>
                      )}
                      {certificado.todos_los_periodos && (
                        <td className="px-3 py-2 text-center text-base font-black text-slate-900">
                          {formatoNota(materia.promedio)}
                        </td>
                      )}
                      <td className="px-3 py-2 text-center font-semibold text-slate-700">
                        {getDesempeno(definitiva)}
                      </td>
                    </tr>
                  );
                })}

                {filasMaterias.length === 0 && (
                  <tr>
                    <td colSpan={certificado.todos_los_periodos ? 8 : 4} className="px-3 py-6 text-center font-semibold text-slate-400">
                      No hay notas registradas para la seleccion actual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-justify text-sm leading-7">
            Este certificado se expide a solicitud del interesado en la fecha {fecha}.
          </p>
        </section>
      </DocumentoImprimible>
    </div>
  );
}

function ReporteParcialPreview({ reporte, onBack }) {
  const esCurso = reporte.alcance === "curso";
  const promedios = reporte.estudiantes
    .map((estudiante) => estudiante.promedio)
    .filter((promedio) => promedio !== null);
  const promedioGeneral = promedios.length
    ? promedios.reduce((total, promedio) => total + promedio, 0) / promedios.length
    : null;
  const totalAusencias = reporte.estudiantes.reduce((total, estudiante) => total + estudiante.inasistencias, 0);
  const titulo = "Reporte Académico Parcial";
  const subtitulo = `Periodo ${reporte.periodo} · ${reporte.materia}`;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="fixed left-4 top-4 z-50 no-print md:left-6 md:top-6">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl transition hover:bg-slate-800"
          title="Atras"
        >
          ← Atrás
        </button>
      </div>

      <DocumentoImprimible
        tipo="reporte_estudiante"
        className="di-documento--certificado"
        titulo={titulo}
        subtitulo={subtitulo}
        firmas={[
          { nombre: "", cargo: "Coordinacion academica" },
          { nombre: "", cargo: "Direccion" },
        ]}
      >
        <section className="space-y-5 text-slate-800">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-900">
            Informe parcial e informativo generado con las notas registradas hasta la fecha.
            No reemplaza boletin final, certificado oficial ni cierre academico del periodo.
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <DatoCertificado label="Curso" value={normalizarTexto(reporte.curso)} />
              <DatoCertificado label="Periodo" value={`Periodo ${reporte.periodo}`} />
              <DatoCertificado label="Materia" value={normalizarTexto(reporte.materia)} />
              <DatoCertificado label={esCurso ? "Estudiantes" : "Inasistencias"} value={esCurso ? reporte.estudiantes.length : totalAusencias} />
              {esCurso && (
                <>
                  <DatoCertificado label="Promedio grupo" value={formatoNota(promedioGeneral)} />
                  <DatoCertificado label="Inasistencias" value={totalAusencias} />
                  <DatoCertificado label="Fecha" value={reporte.fecha} />
                  <DatoCertificado label="Alcance" value="Curso" />
                </>
              )}
            </div>
          </div>

          {reporte.errores > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500">
              {reporte.errores} registro(s) no pudieron cargarse y fueron omitidos del reporte.
            </div>
          )}

          {esCurso ? (
            <ReporteParcialCurso estudiantes={reporte.estudiantes} />
          ) : (
            <ReporteParcialEstudiante estudiante={reporte.estudiantes[0]} />
          )}
        </section>
      </DocumentoImprimible>
    </div>
  );
}

function ReporteParcialCurso({ estudiantes }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">Estudiante</th>
            <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">Materia</th>
            <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">Docente</th>
            <th className="w-20 px-2 py-2 text-center font-semibold uppercase tracking-wide">Nota</th>
            <th className="w-20 px-2 py-2 text-center font-semibold uppercase tracking-wide">Inas.</th>
            <th className="w-28 px-2 py-2 text-center font-semibold uppercase tracking-wide">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {estudiantes.flatMap((estudiante) => {
            if (!estudiante.materias.length) {
              return [
                <tr key={`${estudiante.id}-sin-materias`}>
                  <td className="px-2 py-2 align-top">
                    <p className="font-bold uppercase text-slate-900">{estudiante.nombre}</p>
                    <p className="text-[10px] text-slate-500">{estudiante.documento}</p>
                  </td>
                  <td colSpan="5" className="px-2 py-2 text-center font-semibold text-slate-400">
                    Sin registros academicos para la seleccion actual.
                  </td>
                </tr>,
              ];
            }

            return estudiante.materias.map((materia, index) => (
              <tr key={`${estudiante.id}-${materia.asignacion_id}-${index}`} className="page-break-inside-avoid">
                <td className="px-2 py-2 align-top">
                  {index === 0 && (
                    <>
                      <p className="font-bold uppercase text-slate-900">{estudiante.nombre}</p>
                      <p className="text-[10px] text-slate-500">{estudiante.documento}</p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-600">
                        Promedio: {formatoNota(estudiante.promedio)} · Inasistencias: {estudiante.inasistencias}
                      </p>
                    </>
                  )}
                </td>
                <td className="px-2 py-2 font-semibold uppercase text-slate-800">{materia.nombre}</td>
                <td className="px-2 py-2 text-slate-600">{materia.docente}</td>
                <td className="px-2 py-2 text-center text-sm font-black text-slate-900">{formatoNota(materia.definitiva)}</td>
                <td className="px-2 py-2 text-center font-bold text-slate-700">{materia.inasistencias}</td>
                <td className="px-2 py-2 text-center font-semibold text-slate-700">{materia.estado}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReporteParcialEstudiante({ estudiante }) {
  if (!estudiante) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm font-semibold text-slate-400">
        No hay datos para mostrar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DatoCertificado label="Estudiante" value={estudiante.nombre} />
          <DatoCertificado label="Documento" value={estudiante.documento} />
          <DatoCertificado label="Promedio" value={formatoNota(estudiante.promedio)} />
          <DatoCertificado label="Inasistencias" value={estudiante.inasistencias} />
        </div>
      </div>

      {estudiante.materias.map((materia) => (
        <article key={`${estudiante.id}-${materia.asignacion_id}`} className="page-break-inside-avoid overflow-hidden rounded-lg border border-slate-200">
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <div className="min-w-0">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">{materia.nombre}</h3>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Docente: {materia.docente}</p>
            </div>
            <div className="grid min-w-[150px] grid-cols-2 gap-1 text-center text-[10px]">
              <span className="rounded border border-slate-200 bg-white px-2 py-1 font-bold text-slate-600">
                Nota {formatoNota(materia.definitiva)}
              </span>
              <span className="rounded border border-slate-200 bg-white px-2 py-1 font-bold text-slate-600">
                Inas. {materia.inasistencias}
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_140px]">
            <div className="overflow-hidden">
              {materia.detalles.length ? (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-white text-[10px] uppercase tracking-wide text-slate-500">
                      <th className="border-b border-slate-200 px-3 py-1.5 text-left">Evaluacion / observacion</th>
                      <th className="w-24 border-b border-slate-200 px-3 py-1.5 text-center">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materia.detalles.map((detalle, index) => (
                      <tr key={`${materia.asignacion_id}-detalle-${index}`} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-1.5 text-slate-700">{detalle.descripcion}</td>
                        <td className="px-3 py-1.5 text-center font-bold text-slate-900">{detalle.valor || "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-3 py-4 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Calificacion y observaciones pendientes por ingresar.
                </div>
              )}
            </div>
            <aside className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs md:border-l md:border-t-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Estado</p>
              <p className="mt-1 font-black text-slate-800">{materia.estado}</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Desempeno</p>
              <p className="mt-1 font-black text-slate-800">{materia.desempeno}</p>
            </aside>
          </div>
        </article>
      ))}

      {estudiante.materias.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm font-semibold text-slate-400">
          Sin registros academicos para la seleccion actual.
        </div>
      )}
    </div>
  );
}

function CertificadoMatriculaPreview({ certificado, onBack }) {
  const estudiante = normalizarTexto(certificado.estudiante_nombre_completo);
  const documento = normalizarTexto(certificado.documento_identidad);
  const curso = normalizarTexto(certificado.curso);
  const jornada = normalizarTexto(certificado.jornada, "No especificada");
  const estado = normalizarTexto(certificado.estado, "activo");
  const anioLectivo = normalizarTexto(certificado.anio_lectivo, String(new Date().getFullYear()));
  const fecha = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="fixed left-4 top-4 z-50 no-print md:left-6 md:top-6">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl transition hover:bg-slate-800"
          title="Atras"
        >
          ← Atrás
        </button>
      </div>

      <DocumentoImprimible
        tipo="reporte_estudiante"
        className="di-documento--certificado"
        titulo="Certificado de Matrícula"
        subtitulo={`Año Lectivo ${anioLectivo}`}
        firmas={[
          { nombre: "", cargo: "Rector(a)" },
          { nombre: "", cargo: "Secretaria academica" },
        ]}
      >
        <section className="space-y-6 text-slate-800">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <DatoCertificado label="Documento" value={documento} />
              <DatoCertificado label="Curso" value={curso} />
              <DatoCertificado label="Jornada" value={jornada} />
              <DatoCertificado label="Estado" value={estado} />
            </div>
          </div>

          <div className="space-y-4 text-justify text-sm leading-8">
            <p>
              La institución educativa certifica que <strong className="uppercase">{estudiante}</strong>,
              identificado(a) con documento de identidad <strong>{documento}</strong>, se encuentra
              matriculado(a) en esta institución para el año lectivo <strong>{anioLectivo}</strong>,
              cursando <strong>{curso}</strong>
              {jornada !== "No especificada" ? (
                <>
                  {" "}en la jornada <strong>{jornada}</strong>
                </>
              ) : null}
              .
            </p>

            <p>
              El presente certificado se expide a solicitud del interesado para los fines que estime
              convenientes, incluyendo trámites administrativos, pensiones, subsidios u otros soportes
              requeridos por entidades externas.
            </p>

            <p>
              Se expide en la fecha {fecha}.
            </p>
          </div>
        </section>
      </DocumentoImprimible>
    </div>
  );
}

function DatoCertificado({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="truncate text-sm font-extrabold uppercase text-slate-900">{value}</p>
    </div>
  );
}
