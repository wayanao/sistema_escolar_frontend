import { useId, useRef } from "react";

const CAMPOS_TEXTO = [
  { key: "nombre_institucion", label: "Nombre de la institución", placeholder: "Ej. Colegio San José" },
  {
    key: "membrete",
    label: "Membrete",
    placeholder: "Escribe el membrete del colegio…",
    multilinea: true,
    extra: true,
    ayuda: "Aparece justo debajo del nombre del colegio en los documentos. Puedes escribir varias líneas.",
  },
  {
    key: "aprobacion_resolucion",
    label: "Aprobación de resolución",
    placeholder: "Escribe la aprobación de resolución…",
    multilinea: true,
    extra: true,
    ayuda: "Aparece debajo del NIT y el código DANE en los documentos. Puedes escribir varias líneas.",
  },
  { key: "eslogan", label: "Eslogan / Lema", placeholder: "Formando líderes para el futuro" },
  { key: "direccion", label: "Dirección", placeholder: "Calle 10 #5-30, Ciudad" },
  { key: "telefono", label: "Teléfono", placeholder: "+57 300 000 0000" },
  { key: "email", label: "Email", placeholder: "contacto@colegio.edu" },
  { key: "nit", label: "NIT", placeholder: "901.234.567-8" },
  {
    key: "codigo_dane",
    label: "Código DANE",
    placeholder: "Ej. 105001000123",
    inputMode: "numeric",
    maxLength: 20,
  },
  { key: "sitio_web", label: "Sitio web", placeholder: "www.colegio.edu" },
];

// Quién firma los certificados y dónde se expiden. Se guardan en
// `configuracion_extra`, como el membrete (ver
// docs/funcionalidades/CERTIFICADOS_NUEVOS.md).
const CAMPOS_CERTIFICADOS = [
  {
    key: "certificado_encabezado",
    label: "Frase antes de «CERTIFICA:»",
    placeholder: "Ej. LA SUSCRITA DIRECTORA DEL COLEGIO …",
    multilinea: true,
    filas: 2,
    extra: true,
    ayuda: "Sale centrada, arriba de «CERTIFICA:». Puedes escribirla en dos líneas.",
  },
  { key: "firmante_nombre", label: "Nombre de quien firma", placeholder: "Ej. María Pérez Gómez", extra: true },
  { key: "firmante_cargo", label: "Cargo de quien firma", placeholder: "Ej. Directora", extra: true },
  {
    key: "firmante_documento",
    label: "Documento de quien firma",
    placeholder: "Ej. C.C. 12.345.678 de Barranquilla",
    extra: true,
    ayuda: "Tal como debe salir debajo del nombre.",
  },
  {
    key: "ciudad_expedicion",
    label: "Ciudad donde se expiden",
    placeholder: "Ej. Galapa",
    extra: true,
    ayuda: "Para «Se expide… en Galapa, a los veinte (20) días…».",
  },
];

export default function IdentidadInstitucionalView({
  branding,
  guardando,
  loading,
  mensaje,
  onCambiarCampo,
  onEliminarLogo,
  onGuardar,
  onSubirLogo,
}) {
  const inputPrincipalRef = useRef(null);
  const inputSecundarioRef = useRef(null);
  const camposId = useId();

  const subir = async (e, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onSubirLogo(file, slot);
    } finally {
      e.target.value = "";
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Cargando identidad institucional...</div>;
  }

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

      <section className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Logos / Escudos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LogoSlot
            label="Logo principal"
            url={branding?.logo_principal_url}
            inputRef={inputPrincipalRef}
            onUpload={(e) => subir(e, "principal")}
            onDelete={() => onEliminarLogo("principal")}
          />
          <LogoSlot
            label="Logo secundario (opcional)"
            url={branding?.logo_secundario_url}
            inputRef={inputSecundarioRef}
            onUpload={(e) => subir(e, "secundario")}
            onDelete={() => onEliminarLogo("secundario")}
          />
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Formatos: PNG, JPG, WebP. Tamaño máximo 2MB.
        </p>
      </section>

      <section className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Datos institucionales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CAMPOS_TEXTO.map((c) => (
            <CampoTexto
              key={c.key}
              campo={c}
              id={`${camposId}-${c.key}`}
              branding={branding}
              onCambiarCampo={onCambiarCampo}
            />
          ))}
        </div>

        <h3 className="text-md font-bold text-slate-800 mt-6 mb-1">Certificados: firma y lugar</h3>
        <p className="text-xs text-slate-500 mb-3">
          Quién firma los certificados y en qué ciudad se expiden.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CAMPOS_CERTIFICADOS.map((c) => (
            <CampoTexto
              key={c.key}
              campo={c}
              id={`${camposId}-${c.key}`}
              branding={branding}
              onCambiarCampo={onCambiarCampo}
            />
          ))}
        </div>

        <h3 className="text-md font-bold text-slate-800 mt-6 mb-3">Colores institucionales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorPicker
            label="Color primario"
            value={branding?.color_primario || "#0f314f"}
            onChange={(v) => onCambiarCampo("color_primario", v)}
          />
          <ColorPicker
            label="Color secundario"
            value={branding?.color_secundario || "#526775"}
            onChange={(v) => onCambiarCampo("color_secundario", v)}
          />
          <div className="md:col-span-2">
            <ColorPicker
              label="Color del texto"
              value={branding?.configuracion_extra?.color_texto || "#0f314f"}
              onChange={(v) => onCambiarCampo("color_texto", v)}
            />
            <p className="text-xs text-slate-500 mt-1">
              Aplica solo a las letras de los documentos (nombre del colegio, título,
              periodo/año, firmas, pie de página) — independiente del color primario y
              secundario, que siguen controlando fondos y resaltados.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onGuardar}
            disabled={guardando}
            className="bg-purple-600 hover:bg-purple-800 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded shadow"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </section>
    </div>
  );
}

function CampoTexto({ campo, id, branding, onCambiarCampo }) {
  const Control = campo.multilinea ? "textarea" : "input";
  const valor = campo.extra
    ? branding?.configuracion_extra?.[campo.key]
    : branding?.[campo.key];

  return (
    <div className={campo.multilinea || campo.key === "eslogan" ? "md:col-span-2" : ""}>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1">
        {campo.label}
      </label>
      <Control
        id={id}
        type={campo.multilinea ? undefined : "text"}
        rows={campo.multilinea ? campo.filas || 4 : undefined}
        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        placeholder={campo.placeholder}
        inputMode={campo.inputMode}
        maxLength={campo.maxLength}
        value={valor || ""}
        onChange={(e) => onCambiarCampo(campo.key, e.target.value)}
      />
      {campo.ayuda && (
        <p className="text-xs text-slate-500 mt-1">
          {campo.ayuda}
        </p>
      )}
    </div>
  );
}

function LogoSlot({ label, url, inputRef, onUpload, onDelete }) {
  return (
    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center text-center">
      <p className="font-semibold text-slate-700 mb-3">{label}</p>
      {url ? (
        <img
          src={url}
          alt={label}
          className="max-h-32 max-w-full mb-3 object-contain"
        />
      ) : (
        <div className="h-32 w-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 rounded">
          Sin imagen
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onUpload}
        className="hidden"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="bg-purple-600 hover:bg-purple-800 text-white text-sm px-4 py-2 rounded"
        >
          {url ? "Cambiar" : "Subir"}
        </button>
        {url && (
          <button
            type="button"
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 border border-slate-300 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-slate-300 rounded px-3 py-2 font-mono text-sm uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}
