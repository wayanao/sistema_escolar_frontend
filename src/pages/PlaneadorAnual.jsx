import { useState, useEffect, useRef, useCallback } from "react";
import api from "../utils/api";
import DocumentoImprimible from "../components/impresion/DocumentoImprimible";

const API = import.meta.env.VITE_API_URL;

function PlaneadorAnual() {
  const [planeadores, setPlaneadores] = useState(Array(8).fill({
    unidad_tematica: "",
    estandar_competencia: "",
    contenido: "",
    actividades_recursos: "",
    fecha: ""
  }));
  const [periodo, setPeriodo] = useState(localStorage.getItem("periodo") || "1");
  const [asignacion, setAsignacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vistaImpresion, setVistaImpresion] = useState(false);

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
    } catch (error) {
      console.error("Error cargando planeadores", error);
    } finally {
      setLoading(false);
    }
  }, [asignacionId, periodo]);

  const guardarPlaneadores = async () => {
    if (!asignacionId || !periodo) return;
    try {
      const res = await api.put(`/planeador-anual/${asignacionId}/${periodo}`, planeadores);
      if (res.status >= 200 && res.status < 300) {
        alert("Planeador guardado correctamente");
      } else {
        alert("Error al guardar/debe completar todos los campos");
      }
    } catch (error) {
      console.error("Error guardando planeadores", error);
    }
  };

  const handlePeriodoChange = (e) => {
    const value = e.target.value;
    setPeriodo(value);
    localStorage.setItem("periodo", value);
  };

  const handleChange = (index, field, value) => {
    const updated = [...planeadores];
    updated[index] = { ...updated[index], [field]: value };
    setPlaneadores(updated);
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
        <div className="fixed top-4 left-4 no-print z-[60]">
          <button
            onClick={() => setVistaImpresion(false)}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-900"
          >
            ← Volver
          </button>
        </div>
        <DocumentoImprimible
          tipo="planeador"
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
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
        <h1 className="text-4xl font-bold mb-2">Planeador Anual de Clases</h1>
        <p className="text-blue-100 text-lg">Planificación académica institucional</p>
      </div>

      {asignacion && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>
      )}

      <div className="mb-6 no-print">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
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

      <div className="overflow-x-auto">
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
      <div className="mt-8 flex flex-col sm:flex-row gap-4 no-print">
        <button
          onClick={guardarPlaneadores}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition duration-200 transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <span className="flex items-center justify-center">
            <span className="mr-2">💾</span>
            Guardar Planeador
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

export default PlaneadorAnual;