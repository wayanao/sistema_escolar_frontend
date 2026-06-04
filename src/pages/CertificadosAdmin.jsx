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

export default function CertificadosAdmin() {
  const [cursos, setCursos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [busqueda, setBusqueda] = useState("");
  const [periodo, setPeriodo] = useState("1");
  const [loading, setLoading] = useState(true);
  const [generandoId, setGenerandoId] = useState(null);
  const [certificado, setCertificado] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarBase = async () => {
      setLoading(true);
      setError("");
      try {
        const [resCursos, resEstudiantes] = await Promise.all([
          api.get("/cursos"),
          api.get("/estudiantes"),
        ]);
        setCursos(resCursos.data || []);
        setEstudiantes(resEstudiantes.data || []);
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

  if (certificado) {
    return (
      <CertificadoPreview
        certificado={certificado}
        onBack={() => setCertificado(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Certificados</h1>
        <p className="text-sm text-slate-600">Certificado de notas por estudiante y periodo.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_180px_150px]">
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
            placeholder="Buscar por estudiante o documento"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />

          <select
            value={periodo}
            onChange={(event) => setPeriodo(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          >
            {PERIODOS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          <select
            value={estadoFiltro}
            onChange={(event) => setEstadoFiltro(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          >
            {ESTADOS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
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
                          disabled={!!generandoId}
                          onClick={() => generarCertificado(estudiante.id)}
                          className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cargando ? "Generando..." : "Generar"}
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
      <div className="fixed bottom-6 left-6 z-50 no-print">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-slate-800"
          title="Volver"
        >
          Volver
        </button>
      </div>

      <DocumentoImprimible
        tipo="reporte_estudiante"
        titulo="Certificado de Notas"
        subtitulo={`${periodoTexto} · Año Lectivo ${new Date().getFullYear()}`}
        firmas={[
          { nombre: "", cargo: "Rector(a)" },
          { nombre: "", cargo: "Secretaria academica" },
        ]}
      >
        <section className="space-y-5 text-slate-800">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <DatoCertificado label="Estudiante" value={estudianteFormal} />
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

function DatoCertificado({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="truncate text-sm font-extrabold uppercase text-slate-900">{value}</p>
    </div>
  );
}
