import { useImagenProtegida } from "../../ImagenProtegida";
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
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span
          className="h-9 w-1 shrink-0 rounded-full bg-amber-500"
          aria-hidden="true"
        />
        <div>
          <h3 className="text-sm font-semibold text-gray-950 sm:text-base">
            Evidencias y continuidad
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Registra el desarrollo cognitivo y el trabajo que continuará en
            casa.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TarjetaEvidencia
          titulo="Desarrollo cognitivo"
          descripcion="Proceso principal y evidencia asociada."
          tituloClassName="text-purple-950"
          descripcionClassName="text-purple-700/80"
          className="border-purple-200 from-purple-50/90"
        >
          <CampoTextareaPlanProfesor
            label="Descripción"
            value={form.dba}
            onChange={(valor) => onActualizarCampo("dba", valor)}
            placeholder="Proceso, habilidad o DBA relacionado"
            rows={5}
          />
          <EvidenciaCampo
            id="evidencia-desarrollo-cognitivo"
            label="Evidencia de desarrollo cognitivo"
            descripcion="Adjunta una foto relacionada con este desarrollo."
            inputRef={(element) =>
              onRegistrarInputImagen("imagen1", element)
            }
            seleccionada={imagenesSeleccionadas.imagen1}
            guardada={imagenesGuardadas.imagen1}
            onChange={(event) => onManejarImagen("imagen1", event)}
            onEliminarImagen={() => onEliminarImagen("imagen1")}
          />
        </TarjetaEvidencia>

        <TarjetaEvidencia
          titulo="Actividad en casa"
          descripcion="Continuidad del aprendizaje y evidencia asociada."
          tituloClassName="text-amber-950"
          descripcionClassName="text-amber-700/80"
          className="border-amber-200 from-amber-50/90"
        >
          <CampoTextareaPlanProfesor
            label="Descripción"
            value={form.actividad_casa}
            onChange={(valor) => onActualizarCampo("actividad_casa", valor)}
            placeholder="Refuerzo, consulta o producción para casa"
            rows={5}
          />
          <EvidenciaCampo
            id="evidencia-actividad-casa"
            label="Evidencia de actividad en casa"
            descripcion="Adjunta una foto relacionada con la actividad enviada."
            inputRef={(element) =>
              onRegistrarInputImagen("imagen2", element)
            }
            seleccionada={imagenesSeleccionadas.imagen2}
            guardada={imagenesGuardadas.imagen2}
            onChange={(event) => onManejarImagen("imagen2", event)}
            onEliminarImagen={() => onEliminarImagen("imagen2")}
            tono="amber"
          />
        </TarjetaEvidencia>
      </div>
    </div>
  );
}

function TarjetaEvidencia({
  titulo,
  descripcion,
  tituloClassName,
  descripcionClassName,
  className,
  children,
}) {
  return (
    <div
      className={`space-y-4 rounded-xl border bg-gradient-to-b to-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div>
        <p className={`text-sm font-semibold ${tituloClassName}`}>{titulo}</p>
        <p className={`mt-0.5 text-xs ${descripcionClassName}`}>
          {descripcion}
        </p>
      </div>
      {children}
    </div>
  );
}

function EvidenciaCampo({
  id,
  label,
  descripcion,
  inputRef,
  seleccionada,
  guardada,
  onChange,
  onEliminarImagen,
  tono = "purple",
}) {
  const inputClass =
    tono === "amber"
      ? "border-amber-200 bg-amber-50/50 text-gray-600 file:bg-amber-100 file:text-amber-800 hover:border-amber-300 hover:file:bg-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
      : "border-purple-200 bg-purple-50/50 text-gray-600 file:bg-purple-100 file:text-purple-800 hover:border-purple-300 hover:file:bg-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100";

  return (
    <div className="rounded-lg border border-gray-200 bg-white/90 p-3.5">
      <div className="mb-2">
        <label htmlFor={id} className="text-sm font-semibold text-gray-800">
          {label}
        </label>
        <p className="text-xs text-gray-600">{descripcion}</p>
      </div>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={onChange}
        className={`block w-full cursor-pointer rounded-lg border border-dashed px-2 py-2 text-xs shadow-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-2 file:text-xs file:font-semibold ${inputClass}`}
      />
      {seleccionada && <ImagenSeleccionadaCard imagen={seleccionada} />}
      {guardada ? (
        <ImagenGuardadaCard
          imagen={{ path: guardada, label }}
          alt={label}
          onEliminarImagen={onEliminarImagen}
        />
      ) : (
        <p className="mt-2 text-xs text-gray-500">
          Sin evidencia guardada para este campo.
        </p>
      )}
    </div>
  );
}

function ImagenSeleccionadaCard({ imagen }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-purple-100 bg-white">
      <img
        src={imagen.url}
        alt={imagen.nombre}
        className="h-32 w-full object-contain sm:h-36"
      />
      <div className="border-t border-purple-100 px-3 py-2 text-xs font-medium text-gray-700">
        Por subir: {imagen.nombre}
      </div>
    </div>
  );
}

function ImagenGuardadaCard({ imagen, alt, onEliminarImagen }) {
  const { url, cargando, error } = useImagenProtegida(imagen.path);

  const abrirImagen = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={abrirImagen}
        disabled={!url}
        className="block h-36 w-full transition hover:opacity-90 disabled:cursor-not-allowed sm:h-40"
      >
        {cargando && (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Cargando imagen...
          </div>
        )}
        {error && !cargando && (
          <div className="flex h-full items-center justify-center px-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {url && !cargando && (
          <img src={url} alt={alt} className="h-full w-full object-contain" />
        )}
      </button>
      <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">{imagen.label}</p>
          <button
            type="button"
            onClick={abrirImagen}
            disabled={!url}
            className="text-xs font-medium text-purple-700 disabled:text-gray-400"
          >
            Ver imagen completa
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
