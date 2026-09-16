import { useId } from "react";
import {
  LIMITES_TAMANO_ESCUDO,
  obtenerTamanoEscudo,
} from "../../../utils/certificadosImpresion/tamanoEscudo";
import {
  LIMITES_TAMANO_NOMBRE_COLEGIO,
  obtenerTamanoNombreColegio,
} from "../../../utils/certificadosImpresion/tamanoNombreColegio";
import {
  LIMITES_TAMANO_ESLOGAN,
  obtenerTamanoEslogan,
} from "../../../utils/certificadosImpresion/tamanoEslogan";

const TIPOS = [
  { key: "boletin", label: "Boletín de notas" },
  { key: "voucher_pago", label: "Voucher de pago" },
  { key: "volante_venta", label: "Volante de venta" },
  { key: "reporte_estudiante", label: "Reporte de estudiante" },
  { key: "observaciones", label: "Observaciones" },
  { key: "planeador", label: "Planeador" },
];

const POSICIONES_LOGO = [
  { value: "izquierda", label: "Izquierda" },
  { value: "centro", label: "Centro" },
  { value: "derecha", label: "Derecha" },
];

const ALINEACIONES = [
  { value: "center", label: "Centrado" },
  { value: "left", label: "Izquierda" },
];

const FUENTES = [
  { value: "Inter, system-ui, sans-serif", label: "Inter (sans-serif)" },
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "Georgia, serif", label: "Georgia (serif)" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
];

export default function PlantillasAdminView({
  config,
  loading,
  mensaje,
  plantillas,
  seleccionada,
  tipoActivo,
  onActivar,
  onActualizarCampoConfig,
  onCambiarTipoActivo,
  onDuplicar,
  onEliminar,
  onGuardarConfig,
  onSeleccionarPlantilla,
}) {
  return (
    <div className="space-y-6">
      {mensaje && (
        <div
          className={`p-3 rounded ${
            mensaje.tipo === "ok"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
        <p className="text-sm text-slate-600 mb-2 font-semibold">Tipo de documento:</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {TIPOS.map((t) => (
            <button
              key={t.key}
              onClick={() => onCambiarTipoActivo(t.key)}
              className={`shrink-0 px-3 py-1.5 rounded text-sm font-medium transition ${
                tipoActivo === t.key
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <p className="text-slate-500 italic">Cargando...</p>
          ) : (
            plantillas.map((p) => (
              <PlantillaCard
                key={p.id}
                plantilla={p}
                seleccionada={seleccionada?.id === p.id}
                onSelect={() => onSeleccionarPlantilla(p)}
                onActivar={() => onActivar(p.id)}
                onDuplicar={() => onDuplicar(p)}
                onEliminar={() => onEliminar(p)}
              />
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {seleccionada ? (
            <EditorPlantilla
              plantilla={seleccionada}
              config={config}
              onChange={onActualizarCampoConfig}
              onSave={onGuardarConfig}
            />
          ) : (
            <div className="bg-white rounded-lg shadow border border-slate-200 p-6 text-center text-slate-500 sm:p-12">
              Selecciona una plantilla a la izquierda para verla y/o editarla.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlantillaCard({ plantilla, seleccionada, onSelect, onActivar, onDuplicar, onEliminar }) {
  const c = plantilla.config_json || {};
  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg shadow border-2 p-4 cursor-pointer transition ${
        seleccionada
          ? "border-purple-500 ring-2 ring-purple-200"
          : "border-slate-200 hover:border-slate-400"
      }`}
    >
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800">{plantilla.nombre}</h3>
          <p className="text-xs text-slate-500">
            {plantilla.es_predefinida ? "Predefinida" : "Personalizada"}
          </p>
        </div>
        {plantilla.activa && (
          <span className="w-fit bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
            ACTIVA
          </span>
        )}
      </div>
      <div
        className="border rounded p-2 text-xs mb-3"
        style={{ fontFamily: c.fuente || "sans-serif" }}
      >
        <div className="text-slate-700">
          <strong>Aa</strong> · {c.encabezado_alineacion || "center"} · logo {c.posicion_logo || "izquierda"}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {!plantilla.activa && (
          <button
            onClick={(e) => { e.stopPropagation(); onActivar(); }}
            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1 rounded"
          >
            Activar
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicar(); }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2.5 py-1 rounded"
        >
          Duplicar
        </button>
        {!plantilla.es_predefinida && (
          <button
            onClick={(e) => { e.stopPropagation(); onEliminar(); }}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1 rounded"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

function EditorPlantilla({ plantilla, config, onChange, onSave }) {
  const set = onChange;
  const bloqueado = plantilla.es_predefinida;
  const tamanoEscudoId = useId();
  const tamanoEscudo = obtenerTamanoEscudo(config);
  const tamanoNombreColegioId = useId();
  const tamanoNombreColegio = obtenerTamanoNombreColegio(config);
  const tamanoEsloganId = useId();
  const tamanoEslogan = obtenerTamanoEslogan(config);

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 p-4 sm:p-6">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold text-slate-800 sm:text-xl">{plantilla.nombre}</h2>
          {bloqueado && (
            <p className="text-sm text-amber-600 mt-1">
              ⚠️ Las plantillas predefinidas no se pueden editar. Duplícala para personalizar.
            </p>
          )}
        </div>
      </div>

      <fieldset disabled={bloqueado} className="space-y-5 disabled:opacity-60">
        <Campo label="Fuente">
          <select
            value={config.fuente || "Inter, system-ui, sans-serif"}
            onChange={(e) => set("fuente", e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2"
          >
            {FUENTES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </Campo>

        <Campo label={`Tamaño de fuente base: ${config.tamano_fuente_base || 12}px`}>
          <input
            type="range"
            min="9"
            max="16"
            value={config.tamano_fuente_base || 12}
            onChange={(e) => set("tamano_fuente_base", parseInt(e.target.value))}
            className="w-full"
          />
        </Campo>

        <Campo
          label={`Tamaño del nombre del colegio: ${tamanoNombreColegio}px`}
          htmlFor={tamanoNombreColegioId}
        >
          <input
            id={tamanoNombreColegioId}
            type="range"
            min={LIMITES_TAMANO_NOMBRE_COLEGIO.min}
            max={LIMITES_TAMANO_NOMBRE_COLEGIO.max}
            step={LIMITES_TAMANO_NOMBRE_COLEGIO.paso}
            value={tamanoNombreColegio}
            aria-valuetext={`${tamanoNombreColegio} píxeles`}
            onChange={(e) => set("tamano_nombre_colegio", Number(e.target.value))}
            className="w-full accent-purple-600"
          />
          <p className="text-xs text-slate-500 mt-1">
            Ajusta el nombre del colegio en el encabezado, en pantalla y al imprimir.
          </p>
        </Campo>

        <Campo label="Posición del logo principal">
          <div className="flex flex-col gap-2 sm:flex-row">
            {POSICIONES_LOGO.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => set("posicion_logo", p.value)}
                className={`flex-1 px-3 py-2 rounded text-sm border ${
                  (config.posicion_logo || "izquierda") === p.value
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Campo>

        <Campo label={`Tamaño del escudo: ${tamanoEscudo}px`} htmlFor={tamanoEscudoId}>
          <input
            id={tamanoEscudoId}
            type="range"
            min={LIMITES_TAMANO_ESCUDO.min}
            max={LIMITES_TAMANO_ESCUDO.max}
            step={LIMITES_TAMANO_ESCUDO.paso}
            value={tamanoEscudo}
            aria-valuetext={`${tamanoEscudo} píxeles de alto`}
            onChange={(e) => set("tamano_escudo", Number(e.target.value))}
            className="w-full accent-purple-600"
          />
          <p className="text-xs text-slate-500 mt-1">
            Ajusta la altura del escudo principal de esta plantilla conservando sus proporciones.
          </p>
        </Campo>

        <Campo label="Alineación del encabezado">
          <div className="flex flex-col gap-2 sm:flex-row">
            {ALINEACIONES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => set("encabezado_alineacion", p.value)}
                className={`flex-1 px-3 py-2 rounded text-sm border ${
                  (config.encabezado_alineacion || "center") === p.value
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Campo>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <CampoNumero
            label="Margen sup. (mm)"
            value={config.margen_top ?? 20}
            onChange={(v) => set("margen_top", v)}
          />
          <CampoNumero
            label="Margen inf. (mm)"
            value={config.margen_bottom ?? 20}
            onChange={(v) => set("margen_bottom", v)}
          />
          <CampoNumero
            label="Margen izq. (mm)"
            value={config.margen_left ?? 20}
            onChange={(v) => set("margen_left", v)}
          />
          <CampoNumero
            label="Margen der. (mm)"
            value={config.margen_right ?? 20}
            onChange={(v) => set("margen_right", v)}
          />
        </div>

        <div className="space-y-2">
          <Toggle
            label="Mostrar membrete"
            value={config.mostrar_membrete !== false}
            onChange={(v) => set("mostrar_membrete", v)}
          />
          <Toggle
            label="Mostrar aprobación de resolución"
            value={config.mostrar_aprobacion_resolucion !== false}
            onChange={(v) => set("mostrar_aprobacion_resolucion", v)}
          />
          <Toggle
            label="Mostrar logo secundario"
            value={!!config.mostrar_logo_secundario}
            onChange={(v) => set("mostrar_logo_secundario", v)}
          />
          <Toggle
            label="Mostrar eslogan"
            value={config.mostrar_eslogan !== false}
            onChange={(v) => set("mostrar_eslogan", v)}
          />
        </div>

        <Campo
          label={`Tamaño del eslogan: ${tamanoEslogan}px`}
          htmlFor={tamanoEsloganId}
        >
          <input
            id={tamanoEsloganId}
            type="range"
            min={LIMITES_TAMANO_ESLOGAN.min}
            max={LIMITES_TAMANO_ESLOGAN.max}
            step={LIMITES_TAMANO_ESLOGAN.paso}
            value={tamanoEslogan}
            aria-valuetext={`${tamanoEslogan} píxeles`}
            onChange={(e) => set("tamano_eslogan", Number(e.target.value))}
            className="w-full accent-purple-600"
          />
          <p className="text-xs text-slate-500 mt-1">
            Ajusta el tamaño del lema o eslogan en el encabezado, en pantalla y al imprimir.
          </p>
        </Campo>

        <div className="space-y-2">
          <Toggle
            label="Mostrar pie de página"
            value={config.mostrar_pie !== false}
            onChange={(v) => set("mostrar_pie", v)}
          />
          <Toggle
            label="Mostrar firmas"
            value={config.mostrar_firmas !== false}
            onChange={(v) => set("mostrar_firmas", v)}
          />
          <Toggle
            label="Borde alrededor del documento"
            value={!!config.borde_documento}
            onChange={(v) => set("borde_documento", v)}
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onSave}
            disabled={bloqueado}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded shadow sm:w-auto"
          >
            Guardar cambios
          </button>
        </div>
      </fieldset>
    </div>
  );
}

function Campo({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function CampoNumero({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
      <input
        type="number"
        min="0"
        max="50"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || 0))}
        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
      />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-purple-600"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}
