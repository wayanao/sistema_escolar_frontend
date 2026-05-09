import { useState, useEffect } from "react";
import api from "../utils/api";
import DocumentoImprimible from "./impresion/DocumentoImprimible";

function Observaciones({ estudiante, asignacionId, periodo }) {
  const [conductual, setConductual] = useState("");
  const [cognitivo, setCognitivo] = useState("");
  const [lenguaje, setLenguaje] = useState("");
  const [vistaImpresion, setVistaImpresion] = useState(false);

  const profesor = JSON.parse(localStorage.getItem("profesor") || "{}");
  const periodoActivo = parseInt(localStorage.getItem("periodo"), 10) || 1;

  useEffect(() => {
    const cargarObservacion = async () => {
      try {
        const per = periodoActivo || periodo || 1;
        const res = await api.get(`/observaciones/${estudiante.estudiante_id}/${asignacionId}/${per}`);
        if (res.status >= 200 && res.status < 300) {
          const data = res.data;
          if (data) {
            setConductual(data.conductual || "");
            setCognitivo(data.cognitivo || "");
            setLenguaje(data.lenguaje || "");
          }
        }
      } catch (error) {
        console.error("Error cargando observación", error);
      }
    };
    cargarObservacion();
  }, [estudiante.estudiante_id, asignacionId, periodo]);

  const guardar = async () => {
    if (!conductual || !cognitivo || !lenguaje) {
      alert("Completa todas las observaciones");
      return;
    }
    try {
      const res = await api.post(`/observaciones`, {
        estudiante_id: estudiante.estudiante_id,
        asignacion_id: parseInt(asignacionId),
        periodo: parseInt(periodo),
        conductual,
        cognitivo,
        lenguaje,
      });
      if (!(res.status >= 200 && res.status < 300)) {
        alert("Error al guardar");
        return;
      }
      alert("Observación guardada/actualizada");
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    }
  };

  const firmas = [
    {
      nombre: `${profesor.nombre || ""} ${profesor.apellido || ""}`.trim() || "Profesor",
      cargo: "Firma del Profesor",
    },
    { nombre: "Acudiente", cargo: "Firma del Acudiente" },
  ];

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
          tipo="observaciones"
          titulo="Reporte de Observaciones"
          subtitulo={`Estudiante: ${estudiante.nombre} ${estudiante.apellido} · Periodo ${periodo}`}
          firmas={firmas}
        >
          <div className="space-y-4">
            <section>
              <h3 className="font-bold uppercase text-sm tracking-wider text-slate-700 mb-2">
                Dimensión Conductual
              </h3>
              <div className="border border-slate-300 rounded p-3 bg-slate-50 whitespace-pre-wrap text-sm min-h-[60px]">
                {conductual || "---"}
              </div>
            </section>
            <section>
              <h3 className="font-bold uppercase text-sm tracking-wider text-slate-700 mb-2">
                Dimensión Cognitiva
              </h3>
              <div className="border border-slate-300 rounded p-3 bg-slate-50 whitespace-pre-wrap text-sm min-h-[60px]">
                {cognitivo || "---"}
              </div>
            </section>
            <section>
              <h3 className="font-bold uppercase text-sm tracking-wider text-slate-700 mb-2">
                Dimensión del Lenguaje
              </h3>
              <div className="border border-slate-300 rounded p-3 bg-slate-50 whitespace-pre-wrap text-sm min-h-[60px]">
                {lenguaje || "---"}
              </div>
            </section>
          </div>
        </DocumentoImprimible>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mt-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        {estudiante.nombre} {estudiante.apellido} (Período {periodoActivo})
      </h3>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dimensión Conductual</label>
          <textarea
            placeholder="Observaciones sobre el comportamiento del estudiante..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            value={conductual}
            onChange={(e) => setConductual(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dimensión Cognitiva</label>
          <textarea
            placeholder="Observaciones sobre el desarrollo cognitivo..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            value={cognitivo}
            onChange={(e) => setCognitivo(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dimensión del Lenguaje</label>
          <textarea
            placeholder="Observaciones sobre el desarrollo del lenguaje..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            value={lenguaje}
            onChange={(e) => setLenguaje(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={guardar}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Guardar Observación
        </button>

        <button
          onClick={() => setVistaImpresion(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Imprimir Reporte
        </button>
      </div>
    </div>
  );
}

export default Observaciones;
