import useAperturaEvidencia from "../../../hooks/planeaciones/useAperturaEvidencia";
import { useImagenProtegida } from "../../../hooks/planeaciones/useImagenProtegida";
import {
  ACCEPT_EVIDENCIA,
  esEvidenciaPdf,
} from "../../../utils/planeaciones/evidencias";
import ContenidoEvidencia from "../ContenidoEvidencia";
import VisorPdfPlaneacion from "../VisorPdfPlaneacion";
import CampoTextareaPlanProfesor from "./CampoTextareaPlanProfesor";

export default function EvidenciasPlanProfesor({
  form,
  imagenesSeleccionadas,
  imagenesGuardadas,
  onActualizarCampo,
  onRegistrarInputImagen,
  onManejarImagen,
  onEliminarImagen,
}) {
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <div className="space-y-4">
          <CampoTextareaPlanProfesor
            label="Desarrollo cognitivo"
            value={form.dba}
            onChange={(valor) => onActualizarCampo("dba", valor)}
            placeholder="Proceso, habilidad o DBA relacionado"
            rows={5}
            color="bg-orange-500"
          />
          <EvidenciaCampo
            id="evidencia-desarrollo-cognitivo"
            label="Actividad a desarrollar"
            inputRef={(element) =>
              onRegistrarInputImagen("imagen1", element)
            }
            seleccionada={imagenesSeleccionadas.imagen1}
            guardada={imagenesGuardadas.imagen1}
            onChange={(event) => onManejarImagen("imagen1", event)}
            onEliminarImagen={() => onEliminarImagen("imagen1")}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <div className="space-y-4">
          <CampoTextareaPlanProfesor
            label="Actividad en casa"
            value={form.actividad_casa}
            onChange={(valor) => onActualizarCampo("actividad_casa", valor)}
            placeholder="Refuerzo, consulta o producción para casa"
            rows={5}
            color="bg-sky-500"
          />
          <EvidenciaCampo
            id="evidencia-actividad-casa"
            label="Evidencia de actividad en casa"
            inputRef={(element) =>
              onRegistrarInputImagen("imagen2", element)
            }
            seleccionada={imagenesSeleccionadas.imagen2}
            guardada={imagenesGuardadas.imagen2}
            onChange={(event) => onManejarImagen("imagen2", event)}
            onEliminarImagen={() => onEliminarImagen("imagen2")}
          />
        </div>
      </div>
    </>
  );
}

function EvidenciaCampo({
  id,
  label,
  inputRef,
  seleccionada,
  guardada,
  onChange,
  onEliminarImagen,
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white/90 p-3.5">
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-semibold text-gray-800"
      >
        {label}
      </label>
      <p className="mb-2 text-xs text-gray-500">
        Imagen hasta 5MB o PDF hasta 15MB.
      </p>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={ACCEPT_EVIDENCIA}
        onChange={onChange}
        className="block w-full cursor-pointer rounded-lg border border-dashed border-purple-200 bg-purple-50/50 px-2 py-2 text-xs text-gray-600 shadow-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-purple-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-purple-800 hover:border-purple-300 hover:file:bg-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
      />
      {seleccionada && <ImagenSeleccionadaCard imagen={seleccionada} />}
      {guardada && (
        <ImagenGuardadaCard
          imagen={{ path: guardada, label }}
          alt={label}
          onEliminarImagen={onEliminarImagen}
        />
      )}
    </div>
  );
}

function ImagenSeleccionadaCard({ imagen }) {
  const { abrir, cerrar, visorAbierto } = useAperturaEvidencia({
    url: imagen.url,
    esPdf: imagen.esPdf,
  });

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-purple-100 bg-white">
      <button
        type="button"
        onClick={abrir}
        className="block h-32 w-full transition hover:opacity-90 sm:h-36"
      >
        <ContenidoEvidencia
          url={imagen.url}
          esPdf={imagen.esPdf}
          alt={imagen.nombre}
          nombre={imagen.nombre}
        />
      </button>
      <div className="border-t border-purple-100 px-3 py-2 text-xs font-medium text-gray-700">
        Por subir: {imagen.nombre}
      </div>
      {visorAbierto && (
        <VisorPdfPlaneacion
          url={imagen.url}
          nombre={imagen.nombre}
          onCerrar={cerrar}
        />
      )}
    </div>
  );
}

function ImagenGuardadaCard({ imagen, alt, onEliminarImagen }) {
  const { url, cargando, error } = useImagenProtegida(imagen.path);
  const esPdf = esEvidenciaPdf(imagen.path);
  const { abrir, cerrar, visorAbierto } = useAperturaEvidencia({ url, esPdf });

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={abrir}
        disabled={!url}
        className="block h-36 w-full transition hover:opacity-90 disabled:cursor-not-allowed sm:h-40"
      >
        <ContenidoEvidencia
          url={url}
          esPdf={esPdf}
          alt={alt}
          nombre={imagen.label}
          cargando={cargando}
          error={error}
        />
      </button>
      {visorAbierto && (
        <VisorPdfPlaneacion url={url} nombre={imagen.label} onCerrar={cerrar} />
      )}
      <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">{imagen.label}</p>
          <button
            type="button"
            onClick={abrir}
            disabled={!url}
            className="text-xs font-medium text-purple-700 disabled:text-gray-400"
          >
            {esPdf ? "Ver documento completo" : "Ver imagen completa"}
          </button>
        </div>
        <button
          type="button"
          onClick={onEliminarImagen}
          className="rounded-md border border-red-200 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Borrar
        </button>
      </div>
    </div>
  );
}
