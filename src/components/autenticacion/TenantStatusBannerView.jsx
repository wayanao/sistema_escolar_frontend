function TenantStatusBannerView({ aviso }) {
  if (!aviso) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:px-6 xl:px-8">
        <div>
          <p className="font-bold">Servicio en mora</p>
          <p className="mt-0.5 text-amber-800">
            {aviso.mensaje || "Tu servicio se encuentra en mora. Por favor realiza el pago para evitar suspensión."}
          </p>
        </div>
        <span className="inline-flex w-fit rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-bold uppercase text-amber-800">
          {aviso.estado}
        </span>
      </div>
    </div>
  );
}

export default TenantStatusBannerView;
