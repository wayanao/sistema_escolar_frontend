import { useState, useEffect } from "react";
import api from "../utils/api";

const API = import.meta.env.VITE_API_URL;

function Observaciones({ estudiante, asignacionId, periodo }) {

  const [conductual, setConductual] = useState("");
  const [cognitivo, setCognitivo] = useState("");
  const [lenguaje, setLenguaje] = useState("");

  const profesor = JSON.parse(localStorage.getItem("profesor") || "{}");
  const periodoActivo = parseInt(localStorage.getItem("periodo"), 10) || 1;

// 🔥 función para generar el reporte imprimible
  const imprimirReporte = () => {
    const reporteHTML = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Reporte de Observaciones</title>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
          <style>
            :root {
              --bg: #f6f8fb;
              --card: #ffffff;
              --text: #1b2938;
              --sub: #556a7b;
              --primary: #1f75ff;
              --accent: #76b7ff;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0; padding: 20px;
              font-family: 'Poppins', Arial, sans-serif;
              background: var(--bg); color: var(--text);
            }
            .container {
              max-width: 900px; margin: 0 auto;
              background: var(--card);
              border: 1px solid #dbe3ee;
              border-radius: 16px;
              padding: 30px;
              box-shadow: 0 12px 24px rgba(36, 67, 99, 0.12);
            }
            .header {
              display: flex; justify-content: space-between; align-items: center;
              border-bottom: 2px solid #e1e8f2; padding-bottom: 16px; margin-bottom: 24px;
            }
            .logo {
              font-weight: 700; color: var(--primary); letter-spacing: 0.08em;
              font-size: 16px;
            }
            .title { font-size: 28px; margin: 0; color: #0d2b55; }
            .subtitle { margin: 4px 0 0; color: var(--sub); }
            .section { margin-bottom: 18px; }
            .section-title { font-size: 16px; margin-bottom: 10px; color: #1a3d6b; letter-spacing: .02em; }
            .field { border: 1px solid #d9e3f2; border-radius: 8px; background: #f8fbff; padding: 14px; min-height: 70px; white-space: pre-wrap; }
            .field label { display: block; font-size: 13px; color: #4c6580; margin-bottom: 6px; font-weight: 600; }
            .field-content { font-size: 14px; color: #24384e; line-height: 1.55; }
            .signatures { display: flex; gap: 40px; margin-top: 40px; }
            .sign { flex: 1; text-align: center; }
            .sign-line { border-top: 1px dashed #7a8ba1; width: 220px; margin: 0 auto 6px; }
            .sign-name { font-weight: 600; color: #0f314f; }
            .print-note { font-size: 12px; color: #526775; margin-top: 20px; }
            @media print {
              body { background: white; margin: 0; }
              .container { border: none; box-shadow: none; margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <h1 class="title">Reporte de Observaciones</h1>
                <p class="subtitle">Estudiante: ${estudiante.nombre} ${estudiante.apellido} — Período: ${periodo}</p>
              </div>
              <div class="logo">Colegio 💠</div>
            </div>

            <div class="section">
              <div class="section-title">Dimensión Conductual</div>
              <div class="field"><div class="field-content">${conductual || "---"}</div></div>
            </div>

            <div class="section">
              <div class="section-title">Dimensión Cognitiva</div>
              <div class="field"><div class="field-content">${cognitivo || "---"}</div></div>
            </div>

            <div class="section">
              <div class="section-title">Dimensión del Lenguaje</div>
              <div class="field"><div class="field-content">${lenguaje || "---"}</div></div>
            </div>

            <div class="signatures">
              <div class="sign">
                <div class="sign-line"></div>
                <p class="sign-name">${(profesor.nombre ? profesor.nombre : "")} ${ (profesor.apellido ? profesor.apellido : "") }</p>
                <p class="sign-title">Firma del Profesor</p>
              </div>
              <div class="sign">
                <div class="sign-line"></div>
                <p class="sign-name">Acudiente</p>
                <p class="sign-title">Firma del Acudiente</p>
              </div>
            </div>

            <p class="print-note no-print">Pulsa Ctrl+P o usa el botón del navegador para imprimir este reporte.</p>
          </div>
        </body>
      </html>
    `;
// Abrir nueva ventana e imprimir
    const nuevaVentana = window.open('', '_blank');
    nuevaVentana.document.write(reporteHTML);
    nuevaVentana.document.close();
  };

  // 🔥 Cargar observación existente
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
// Guardar o actualizar observación
    try {
      const res = await api.post(`/observaciones`, {
          estudiante_id: estudiante.estudiante_id,
          asignacion_id: parseInt(asignacionId),
          periodo: parseInt(periodo),
          conductual,
          cognitivo,
          lenguaje
        });

      if (!(res.status >= 200 && res.status < 300)) {
        const error = await res.text();
        console.error(error);
        alert("Error al guardar");
        return;
      }

      alert("Observación guardada/actualizada 🔥");

    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    }
  };
// 🔥 función para abrir nueva ventana
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
          onClick={imprimirReporte}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Imprimir Reporte
        </button>
      </div>
    </div>
  );
}

export default Observaciones;