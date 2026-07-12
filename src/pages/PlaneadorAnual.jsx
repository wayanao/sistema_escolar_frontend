import { useState, useEffect, useRef, useCallback } from "react";
import api from "../utils/api";
import DocumentoImprimible from "../components/impresion/DocumentoImprimible";
import { guardarPeriodoProfesor, obtenerPeriodoProfesor } from "../utils/periodoProfesor";

function PlaneadorAnual() {
  const [planeadores, setPlaneadores] = useState(Array(8).fill({
    unidad_tematica: "",
    estandar_competencia: "",
    contenido: "",
    actividades_recursos: "",
    fecha: ""
  }));
  const [periodo, setPeriodo] = useState(() => obtenerPeriodoProfesor());
  const [asignacion, setAsignacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [vistaImpresion, setVistaImpresion] = useState(false);
  const [estadoGuardado, setEstadoGuardado] = useState({
    cargando: true,
    guardado: false,
    modificado: false,
    guardadoEn: null,
  });

  const asignacionId = localStorage.getItem("asignacionId");
  const profesor = JSON.parse(localStorage.getItem("profesor") || "null");
  const profesorId = profesor?.id;

  const textareasRefs = useRef(Array(8).fill().map(() => Array(4).fill(null))); // 8 filas, 4 textareas por fila

  const adjustTextareaHeight = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const handleTextareaChange = (index, field, value) => {
    handleChange(index, field, value);
    // Adjust height after state update
    setTimeout(() => {
      const fieldIndex = ['unidad_tematica', 'estandar_competencia', 'contenido', 'actividades_recursos'].indexOf(field);
      if (fieldIndex !== -1 && textareasRefs.current[index][fieldIndex]) {
        adjustTextareaHeight(textareasRefs.current[index][fieldIndex]);
      }
    }, 0);
  };

  const cargarAsignacion = useCallback(async () => {
    if (!profesorId) return;
    try {
      const res = await api.get(`/mis-clases/${profesorId}`);
      const data = res.data;
      const asign = data.find(a => a.id.toString() === asignacionId);
      setAsignacion(asign);
    } catch (error) {
      console.error("Error cargando asignación", error);
    }
  }, [profesorId, asignacionId]);

  const cargarPlaneadores = useCallback(async () => {
    if (!asignacionId || !periodo) return;
    setEstadoGuardado({
      cargando: true,
      guardado: false,
      modificado: false,
      guardadoEn: null,
    });
    try {
      const res = await api.get(`/planeador-anual/${asignacionId}/${periodo}`);
      const data = res.data;
      const planeadoresData = data.planeadores || [];
      const updatedPlaneadores = Array(8).fill({
        unidad_tematica: "",
        estandar_competencia: "",
        contenido: "",
        actividades_recursos: "",
        fecha: ""
      });
      planeadoresData.forEach((p, index) => {
        if (index < 8) {
          updatedPlaneadores[index] = {
            unidad_tematica: p.unidad_tematica || "",
            estandar_competencia: p.estandar_competencia || "",
            contenido: p.contenido || "",
            actividades_recursos: p.actividades_recursos || "",
            fecha: p.fecha || ""
          };
        }
      });
      setPlaneadores(updatedPlaneadores);
      setEstadoGuardado({
        cargando: false,
        guardado: planeadoresData.length > 0,
        modificado: false,
        guardadoEn: null,
      });
    } catch (error) {
      console.error("Error cargando planeadores", error);
      setEstadoGuardado({
        cargando: false,
        guardado: false,
        modificado: false,
        guardadoEn: null,
      });
    } finally {
      setLoading(false);
    }
  }, [asignacionId, periodo]);

  const obtenerEstadoVisual = () => {
    if (estadoGuardado.cargando || loading) {
      return {
        label: "Verificando",
        detail: "Consultando malla del periodo",
        badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
        dotClass: "bg-slate-400",
        buttonText: "Guardar Planeador",
      };
    }

    if (estadoGuardado.modificado) {
      return {
        label: "Cambios sin guardar",
        detail: "Hay ediciones pendientes",
        badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
        dotClass: "bg-amber-500",
        buttonText: "Guardar cambios",
      };
    }

    if (estadoGuardado.guardado) {
      return {
        label: "Guardado",
        detail: estadoGuardado.guardadoEn ? `Actualizado ${estadoGuardado.guardadoEn}` : "Malla registrada",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
        dotClass: "bg-emerald-500",
        buttonText: "Actualizar malla",
      };
    }

    return {
      label: "Pendiente",
      detail: "Aún no se ha guardado",
      badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
      dotClass: "bg-slate-400",
      buttonText: "Guardar Planeador",
    };
  };

  const guardarPlaneadores = async () => {
    if (!asignacionId || !periodo) return;

    const filaSinFecha = planeadores.findIndex((planeador) => {
      const tieneContenido = [
        planeador.unidad_tematica,
        planeador.estandar_competencia,
        planeador.contenido,
        planeador.actividades_recursos,
      ].some((valor) => String(valor || "").trim());

      return tieneContenido && !planeador.fecha;
    });

    if (filaSinFecha !== -1) {
      alert(`Debes seleccionar la fecha en la fila ${filaSinFecha + 1} antes de guardar.`);
      return;
    }

    setGuardando(true);
    try {
      const res = await api.put(`/planeador-anual/${asignacionId}/${periodo}`, planeadores);
      if (res.status >= 200 && res.status < 300) {
        setEstadoGuardado({
          cargando: false,
          guardado: true,
          modificado: false,
          guardadoEn: new Date().toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
        alert("Planeador guardado correctamente");
      } else {
        alert("Error al guardar/debe completar todos los campos");
      }
    } catch (error) {
      console.error("Error guardando planeadores", error);
    } finally {
      setGuardando(false);
    }
  };

  const handlePeriodoChange = (e) => {
    const value = e.target.value;
    setPeriodo(value);
    guardarPeriodoProfesor(value);
  };

  const handleChange = (index, field, value) => {
    const updated = [...planeadores];
    updated[index] = { ...updated[index], [field]: value };
    setPlaneadores(updated);
    setEstadoGuardado((actual) => ({ ...actual, modificado: true }));
  };

  const imprimirPeriodo = () => setVistaImpresion(true);

  useEffect(() => {
    cargarAsignacion();
  }, [cargarAsignacion]);

  useEffect(() => {
    cargarPlaneadores();
  }, [cargarPlaneadores]);

  useEffect(() => {
    // Adjust textarea heights after planeadores are loaded or updated
    setTimeout(() => {
      textareasRefs.current.forEach((rowRefs) => {
        rowRefs.forEach((ref) => {
          if (ref) adjustTextareaHeight(ref);
        });
      });
    }, 100);
  }, [planeadores]);

  if (loading) {
    return (
      <div className="flex bg-white items-center justify-center p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">Cargando...</span>
      </div>
    );
  }

  if (!asignacionId) {
    return <div className="p-6 text-center">Selecciona una asignación en el Dashboard primero.</div>;
  }

  if (vistaImpresion) {
    return (
      <div className="fixed inset-0 bg-slate-100 z-50 overflow-auto">
        <div className="fixed left-4 top-4 no-print z-[60] md:left-6 md:top-6">
          <button
            onClick={() => setVistaImpresion(false)}
            className="bg-slate-800 text-white px-4 py-2.5 rounded-full text-sm font-bold shadow-xl hover:bg-slate-900 transition"
            title="Atras"
          >
            ← Atrás
          </button>
        </div>
        <DocumentoImprimible
          tipo="planeador"
          className="di-documento--planeador"
          titulo="Planeador Anual de Clases"
          subtitulo={`${asignacion ? `${asignacion.curso} · ${asignacion.materia} · ` : ""}Período ${periodo}`}
        >
          <table className="w-full border-collapse text-xs">
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider">
                <th className="border border-slate-300 px-2 py-2 text-left">Unidad temática</th>
                <th className="border border-slate-300 px-2 py-2 text-left">Estándar/competencia</th>
                <th className="border border-slate-300 px-2 py-2 text-left">Contenido</th>
                <th className="border border-slate-300 px-2 py-2 text-left">Actividades y recursos</th>
                <th className="border border-slate-300 px-2 py-2 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {planeadores.map((p, i) => (
                <tr key={i} className="align-top">
                  <td className="border border-slate-300 px-2 py-2 whitespace-pre-wrap">{p.unidad_tematica || ""}</td>
                  <td className="border border-slate-300 px-2 py-2 whitespace-pre-wrap">{p.estandar_competencia || ""}</td>
                  <td className="border border-slate-300 px-2 py-2 whitespace-pre-wrap">{p.contenido || ""}</td>
                  <td className="border border-slate-300 px-2 py-2 whitespace-pre-wrap">{p.actividades_recursos || ""}</td>
                  <td className="border border-slate-300 px-2 py-2">{p.fecha || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DocumentoImprimible>
      </div>
    );
  }

  const estadoVisual = obtenerEstadoVisual();

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <style>
        {`
          .planeador-header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .planeador-table {
            table-layout: fixed;
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .planeador-table th {
            background-color: #f3f4f6;
            color: #374151;
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 1rem;
            border-bottom: 2px solid #e5e7eb;
            text-align: left;
          }
          
          .planeador-table td {
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
            word-break: break-word;
            white-space: pre-wrap;
          }
          
          .planeador-table tr:nth-child(even) {
            background-color: #f9fafb;
          }
          
          .planeador-table tr:hover {
            background-color: #f3f4f6;
          }
          
          .planeador-textarea {
            width: 100%;
            border: none;
            outline: none;
            resize: none;
            font-family: inherit;
            font-size: 0.875rem;
            line-height: 1.5;
            word-break: break-word;
            white-space: pre-wrap;
            overflow-wrap: break-word;
            background: transparent;
            min-height: 2.5rem;
          }
          
          .planeador-textarea:focus {
            background-color: rgba(59, 130, 246, 0.05);
            border-radius: 4px;
          }
          
          .planeador-input {
            width: 100%;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 0.5rem;
            font-size: 0.875rem;
            outline: none;
          }
          
          .planeador-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          @media screen and (max-width: 640px) {
            .planeador-header {
              padding: 1.25rem;
              margin-bottom: 1rem;
              text-align: left;
            }

            .planeador-header h1 {
              font-size: 1.5rem;
              line-height: 1.2;
            }

            .planeador-header p {
              font-size: 0.95rem;
            }

            .planeador-textarea {
              min-height: 5.5rem;
              border: 1px solid #d1d5db;
              border-radius: 0.5rem;
              padding: 0.75rem;
              background: #ffffff;
            }

            .planeador-input {
              min-height: 2.75rem;
              border-radius: 0.5rem;
            }
          }
          
          @media print {
            body { 
              font-size: 11px; 
              margin: 0;
              background: white !important;
            }
            .no-print { display: none !important; }
            .planeador-header {
              background: #e0f2fe !important;
              color: #1e40af !important;
              -webkit-print-color-adjust: exact;
              margin-bottom: 1rem;
              padding: 1rem;
            }
            .planeador-table { 
              width: 100%; 
              border-collapse: collapse;
              box-shadow: none;
              page-break-inside: auto;
            }
            .planeador-table th, 
            .planeador-table td { 
              border: 1px solid #9ca3af; 
              padding: 0.5rem;
              page-break-inside: avoid;
            }
            .planeador-table th {
              background-color: #f3f4f6 !important;
              -webkit-print-color-adjust: exact;
            }
            .planeador-table tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            .planeador-textarea, .planeador-input {
              border: none !important;
              background: transparent !important;
              padding: 0 !important;
            }
          }
        `}
      </style>
      
      <div className="planeador-header">
        <h1 className="text-2xl font-bold mb-2 sm:text-4xl">Planeador Anual de Clases</h1>
        <p className="text-blue-100 text-base sm:text-lg">Planificación académica institucional</p>
      </div>

      {asignacion && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:mb-6 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Curso</p>
                <p className="text-lg font-semibold text-gray-900">{asignacion.curso}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Materia</p>
                <p className="text-lg font-semibold text-gray-900">{asignacion.materia}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${estadoVisual.badgeClass}`}>
                <span className={`h-2 w-2 rounded-full ${estadoVisual.dotClass}`} aria-hidden="true"></span>
                {estadoVisual.label}
              </span>
              <span className="text-xs font-medium text-gray-500 sm:ml-3">{estadoVisual.detail}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 no-print sm:mb-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Período:</label>
          <select
            value={periodo}
            onChange={handlePeriodoChange}
            className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
          >
            <option value="1">Período 1</option>
            <option value="2">Período 2</option>
            <option value="3">Período 3</option>
            <option value="4">Período 4</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 sm:hidden">
        {planeadores.map((planeador, index) => (
          <section key={index} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 bg-blue-50 px-4 py-3">
              <h2 className="text-sm font-black uppercase tracking-wide text-blue-900">
                Fila {index + 1}
              </h2>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-blue-100">
                Periodo {periodo}
              </span>
            </div>

            <div className="space-y-4 p-4">
              <CampoMallaMovil label="Unidad temática">
                <textarea
                  name={`unidad_tematica-mobile-${index}`}
                  value={planeador.unidad_tematica}
                  onChange={(e) => handleTextareaChange(index, "unidad_tematica", e.target.value)}
                  className="planeador-textarea font-semibold"
                  rows="3"
                  placeholder="Unidad temática"
                />
              </CampoMallaMovil>

              <CampoMallaMovil label="Estándar/competencia">
                <textarea
                  name={`estandar_competencia-mobile-${index}`}
                  value={planeador.estandar_competencia}
                  onChange={(e) => handleTextareaChange(index, "estandar_competencia", e.target.value)}
                  className="planeador-textarea"
                  rows="3"
                  placeholder="Estándar/competencia"
                />
              </CampoMallaMovil>

              <CampoMallaMovil label="Contenido">
                <textarea
                  name={`contenido-mobile-${index}`}
                  value={planeador.contenido}
                  onChange={(e) => handleTextareaChange(index, "contenido", e.target.value)}
                  className="planeador-textarea"
                  rows="3"
                  placeholder="Contenido"
                />
              </CampoMallaMovil>

              <CampoMallaMovil label="Actividades y recursos">
                <textarea
                  name={`actividades_recursos-mobile-${index}`}
                  value={planeador.actividades_recursos}
                  onChange={(e) => handleTextareaChange(index, "actividades_recursos", e.target.value)}
                  className="planeador-textarea"
                  rows="3"
                  placeholder="Actividades y recursos"
                />
              </CampoMallaMovil>

              <CampoMallaMovil label="Fecha estimada">
                <input
                  name={`fecha-mobile-${index}`}
                  type="date"
                  value={planeador.fecha}
                  onChange={(e) => handleChange(index, "fecha", e.target.value)}
                  className="planeador-input"
                />
              </CampoMallaMovil>
            </div>
          </section>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="planeador-table">
          <colgroup>
            <col style={{width: '20%'}} />
            <col style={{width: '20%'}} />
            <col style={{width: '25%'}} />
            <col style={{width: '25%'}} />
            <col style={{width: '10%'}} />
          </colgroup>
          <thead>
            <tr>
              <th>Unidad temática</th>
              <th>Estándar/competencia</th>
              <th>Contenido</th>
              <th>Actividades y recursos</th>
              <th>Fecha estimada</th>
            </tr>
          </thead>
          <tbody>
            {planeadores.map((planeador, index) => (
              <tr key={index}>
                <td>
                  <textarea
                    ref={(el) => textareasRefs.current[index][0] = el}
                    name={`unidad_tematica-${index}`}
                    value={planeador.unidad_tematica}
                    onChange={(e) => handleTextareaChange(index, "unidad_tematica", e.target.value)}
                    className="planeador-textarea font-semibold"
                    rows="1"
                    placeholder="Unidad temática"
                  />
                </td>
                <td>
                  <textarea
                    ref={(el) => textareasRefs.current[index][1] = el}
                    name={`estandar_competencia-${index}`}
                    value={planeador.estandar_competencia}
                    onChange={(e) => handleTextareaChange(index, "estandar_competencia", e.target.value)}
                    className="planeador-textarea"
                    rows="1"
                    placeholder="Estándar/competencia"
                  />
                </td>
                <td>
                  <textarea
                    ref={(el) => textareasRefs.current[index][2] = el}
                    name={`contenido-${index}`}
                    value={planeador.contenido}
                    onChange={(e) => handleTextareaChange(index, "contenido", e.target.value)}
                    className="planeador-textarea"
                    rows="1"
                    placeholder="Contenido"
                  />
                </td>
                <td>
                  <textarea
                    ref={(el) => textareasRefs.current[index][3] = el}
                    name={`actividades_recursos-${index}`}
                    value={planeador.actividades_recursos}
                    onChange={(e) => handleTextareaChange(index, "actividades_recursos", e.target.value)}
                    className="planeador-textarea"
                    rows="1"
                    placeholder="Actividades y recursos"
                  />
                </td>
                <td>
                  <input
                    name={`fecha-${index}`}
                    type="date"
                    value={planeador.fecha}
                    onChange={(e) => handleChange(index, "fecha", e.target.value)}
                    className="planeador-input"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex flex-col gap-3 no-print sm:mt-8 sm:flex-row sm:gap-4">
        <button
          onClick={guardarPlaneadores}
          disabled={guardando || estadoGuardado.cargando}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition duration-200 transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:hover:scale-100"
        >
          <span className="flex items-center justify-center">
            <span className="mr-2">💾</span>
            {guardando ? "Guardando..." : estadoVisual.buttonText}
          </span>
        </button>
        <button
          onClick={imprimirPeriodo}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition duration-200 transform hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          <span className="flex items-center justify-center">
            <span className="mr-2">🖨️</span>
            Imprimir Período
          </span>
        </button>
      </div>
    </div>
  );
}

function CampoMallaMovil({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export default PlaneadorAnual;
