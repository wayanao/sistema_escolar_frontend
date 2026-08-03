import { useEffect, useRef } from "react";
import {
  CAMPOS_CONTENIDO,
  CANTIDAD_FILAS_PLANEADOR,
  filaTieneContenido,
} from "../../utils/mallaCurricular/planeadorAnual";

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

export default function EditorMallaCurricular({ onCampoChange, periodo, planeadores }) {
  const textareasRefs = useRef(
    Array(CANTIDAD_FILAS_PLANEADOR).fill().map(() => Array(CAMPOS_CONTENIDO.length).fill(null))
  );

  const ajustarAlturaTextarea = (textarea) => {
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const manejarTextareaChange = (index, field, value) => {
    onCampoChange(index, field, value);
    setTimeout(() => {
      const fieldIndex = CAMPOS_CONTENIDO.indexOf(field);
      if (fieldIndex !== -1) {
        ajustarAlturaTextarea(textareasRefs.current[index][fieldIndex]);
      }
    }, 0);
  };

  useEffect(() => {
    setTimeout(() => {
      textareasRefs.current.forEach((rowRefs) => {
        rowRefs.forEach(ajustarAlturaTextarea);
      });
    }, 100);
  }, [planeadores]);

  return (
    <>
      <div className="space-y-4 sm:hidden">
        {planeadores.map((planeador, index) => (
          <section key={index} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 bg-purple-50 px-4 py-3">
              <h2 className="text-sm font-black uppercase tracking-wide text-purple-900">
                Fila {index + 1}
              </h2>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-purple-700 ring-1 ring-purple-100">
                Periodo {periodo}
              </span>
            </div>

            <div className="space-y-4 p-4">
              <CampoMallaMovil label="Unidad temática">
                <textarea
                  name={`unidad_tematica-mobile-${index}`}
                  value={planeador.unidad_tematica}
                  onChange={(event) => manejarTextareaChange(index, "unidad_tematica", event.target.value)}
                  className="planeador-textarea font-semibold"
                  rows="3"
                  placeholder="Unidad temática"
                />
              </CampoMallaMovil>

              <CampoMallaMovil label="Estándar/competencia">
                <textarea
                  name={`estandar_competencia-mobile-${index}`}
                  value={planeador.estandar_competencia}
                  onChange={(event) => manejarTextareaChange(index, "estandar_competencia", event.target.value)}
                  className="planeador-textarea"
                  rows="3"
                  placeholder="Estándar/competencia"
                />
              </CampoMallaMovil>

              <CampoMallaMovil label="Contenido">
                <textarea
                  name={`contenido-mobile-${index}`}
                  value={planeador.contenido}
                  onChange={(event) => manejarTextareaChange(index, "contenido", event.target.value)}
                  className="planeador-textarea"
                  rows="3"
                  placeholder="Contenido"
                />
              </CampoMallaMovil>

              <CampoMallaMovil label="Actividades y recursos">
                <textarea
                  name={`actividades_recursos-mobile-${index}`}
                  value={planeador.actividades_recursos}
                  onChange={(event) => manejarTextareaChange(index, "actividades_recursos", event.target.value)}
                  className="planeador-textarea"
                  rows="3"
                  placeholder="Actividades y recursos"
                />
              </CampoMallaMovil>

              <CampoMallaMovil label="Fecha límite *">
                <input
                  name={`fecha-mobile-${index}`}
                  type="date"
                  value={planeador.fecha}
                  onChange={(event) => onCampoChange(index, "fecha", event.target.value)}
                  required={filaTieneContenido(planeador)}
                  aria-required={filaTieneContenido(planeador)}
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
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Unidad temática</th>
              <th>Estándar/competencia</th>
              <th>Contenido</th>
              <th>Actividades y recursos</th>
              <th>Fecha límite *</th>
            </tr>
          </thead>
          <tbody>
            {planeadores.map((planeador, index) => (
              <tr key={index}>
                {CAMPOS_CONTENIDO.map((field, fieldIndex) => (
                  <td key={field}>
                    <textarea
                      ref={(element) => { textareasRefs.current[index][fieldIndex] = element; }}
                      name={`${field}-${index}`}
                      value={planeador[field]}
                      onChange={(event) => manejarTextareaChange(index, field, event.target.value)}
                      className={`planeador-textarea${field === "unidad_tematica" ? " font-semibold" : ""}`}
                      rows="1"
                      placeholder={{
                        unidad_tematica: "Unidad temática",
                        estandar_competencia: "Estándar/competencia",
                        contenido: "Contenido",
                        actividades_recursos: "Actividades y recursos",
                      }[field]}
                    />
                  </td>
                ))}
                <td>
                  <input
                    name={`fecha-${index}`}
                    type="date"
                    value={planeador.fecha}
                    onChange={(event) => onCampoChange(index, "fecha", event.target.value)}
                    required={filaTieneContenido(planeador)}
                    aria-required={filaTieneContenido(planeador)}
                    className="planeador-input"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
