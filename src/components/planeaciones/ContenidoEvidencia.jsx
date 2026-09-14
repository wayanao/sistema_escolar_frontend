/**
 * Pinta el interior de una evidencia: la imagen, o una portada para el PDF.
 * Un PDF no se puede previsualizar sin descargarlo entero, así que se anuncia
 * con su nombre en lugar de dejar un recuadro roto.
 */
export default function ContenidoEvidencia({
  url,
  esPdf,
  alt,
  nombre,
  cargando,
  error,
  claseImagen = "h-full w-full object-contain",
}) {
  if (cargando) {
    return (
      <span className="flex h-full items-center justify-center px-3 text-sm text-slate-500">
        Cargando evidencia...
      </span>
    );
  }

  if (error) {
    return (
      <span className="flex h-full items-center justify-center px-3 text-sm text-rose-600">
        {error}
      </span>
    );
  }

  if (!url) return null;

  if (esPdf) {
    return (
      <span className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-xs font-black text-rose-700"
          aria-hidden="true"
        >
          PDF
        </span>
        <span className="line-clamp-2 break-words text-sm font-bold text-slate-800">
          {nombre || alt}
        </span>
        <span className="text-xs font-semibold text-violet-700">
          Abrir documento
        </span>
      </span>
    );
  }

  return <img src={url} alt={alt} className={claseImagen} />;
}
