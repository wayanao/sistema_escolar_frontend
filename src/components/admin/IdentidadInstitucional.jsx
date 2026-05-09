import { useEffect, useRef, useState } from "react";
import {
  getBranding,
  updateBranding,
  uploadLogo,
  deleteLogo,
} from "../../services/printingService";
import { invalidatePrintCache } from "../../hooks/usePrintConfig";

const CAMPOS_TEXTO = [
  { key: "nombre_institucion", label: "Nombre de la institución", placeholder: "Ej. Colegio San José" },
  { key: "eslogan", label: "Eslogan / Lema", placeholder: "Formando líderes para el futuro" },
  { key: "direccion", label: "Dirección", placeholder: "Calle 10 #5-30, Ciudad" },
  { key: "telefono", label: "Teléfono", placeholder: "+57 300 000 0000" },
  { key: "email", label: "Email", placeholder: "contacto@colegio.edu" },
  { key: "nit", label: "NIT", placeholder: "901.234.567-8" },
  { key: "sitio_web", label: "Sitio web", placeholder: "www.colegio.edu" },
];

export default function IdentidadInstitucional() {
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const inputPrincipalRef = useRef(null);
  const inputSecundarioRef = useRef(null);

  useEffect(() => {
    let cancelado = false;
    getBranding()
      .then((data) => { if (!cancelado) setBranding(data); })
      .catch((err) => {
        console.error(err);
        setMensaje({ tipo: "error", texto: "No se pudo cargar la identidad institucional." });
      })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, []);

  const cambiarCampo = (key, valor) => {
    setBranding((prev) => ({ ...prev, [key]: valor }));
  };

  const guardar = async () => {
    if (!branding) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const data = await updateBranding(branding);
      setBranding(data);
      invalidatePrintCache();
      setMensaje({ tipo: "ok", texto: "Datos guardados correctamente." });
    } catch (err) {
      console.error(err);
      const detalle = err?.response?.data?.detail || err.message;
      setMensaje({ tipo: "error", texto: `Error al guardar: ${detalle}` });
    } finally {
      setGuardando(false);
    }
  };

  const subir = async (e, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMensaje(null);
    try {
      const data = await uploadLogo(file, slot);
      setBranding((prev) => ({
        ...prev,
        [slot === "principal" ? "logo_principal_url" : "logo_secundario_url"]: data.url,
      }));
      invalidatePrintCache();
      setMensaje({ tipo: "ok", texto: `Logo ${slot} actualizado.` });
    } catch (err) {
      console.error(err);
      const detalle = err?.response?.data?.detail || err.message;
      setMensaje({ tipo: "error", texto: `Error al subir logo: ${detalle}` });
    } finally {
      e.target.value = "";
    }
  };

  const borrar = async (slot) => {
    if (!confirm(`¿Eliminar el logo ${slot}?`)) return;
    try {
      await deleteLogo(slot);
      setBranding((prev) => ({
        ...prev,
        [slot === "principal" ? "logo_principal_url" : "logo_secundario_url"]: null,
      }));
      invalidatePrintCache();
      setMensaje({ tipo: "ok", texto: `Logo ${slot} eliminado.` });
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: "error", texto: "No se pudo eliminar el logo." });
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
            onDelete={() => borrar("principal")}
          />
          <LogoSlot
            label="Logo secundario (opcional)"
            url={branding?.logo_secundario_url}
            inputRef={inputSecundarioRef}
            onUpload={(e) => subir(e, "secundario")}
            onDelete={() => borrar("secundario")}
          />
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Formatos: PNG, JPG, WebP, SVG. Tamaño máximo 2MB.
        </p>
      </section>

      <section className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Datos institucionales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CAMPOS_TEXTO.map((c) => (
            <div key={c.key} className={c.key === "eslogan" ? "md:col-span-2" : ""}>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {c.label}
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={c.placeholder}
                value={branding?.[c.key] || ""}
                onChange={(e) => cambiarCampo(c.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <h3 className="text-md font-bold text-slate-800 mt-6 mb-3">Colores institucionales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorPicker
            label="Color primario"
            value={branding?.color_primario || "#0f314f"}
            onChange={(v) => cambiarCampo("color_primario", v)}
          />
          <ColorPicker
            label="Color secundario"
            value={branding?.color_secundario || "#526775"}
            onChange={(v) => cambiarCampo("color_secundario", v)}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={guardar}
            disabled={guardando}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded shadow"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </section>
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
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={onUpload}
        className="hidden"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
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
