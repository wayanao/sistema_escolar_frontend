// El aviso debajo de la navegación cuando el admin mira un año que no es el
// activo. Mismo lugar y misma forma que el aviso de estado del colegio
// (`TenantStatusBannerView`), en azul para no confundirlo con el de mora.
function AvisoAnioLectivoView({ aviso, onVolver }) {
  if (!aviso) {
    return null;
  }

  return (
    <div role="status" className="border-b border-sky-200 bg-sky-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 py-3 text-sm text-sky-900 sm:flex-row sm:items-center sm:justify-between sm:px-6 xl:px-8">
        <p className="font-semibold">{aviso.mensaje}</p>
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex w-fit rounded-md border border-sky-300 bg-white px-3 py-1 text-xs font-bold text-sky-800 transition-colors hover:bg-sky-100"
        >
          {aviso.textoVolver}
        </button>
      </div>
    </div>
  );
}

export default AvisoAnioLectivoView;
