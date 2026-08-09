function CambiarPasswordView({
  passwordActual,
  passwordNueva,
  confirmacion,
  guardando,
  onCambiarPasswordActual,
  onCambiarPasswordNueva,
  onCambiarConfirmacion,
  onGuardar,
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <form onSubmit={onGuardar} className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Primer ingreso</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Cambia tu password</h1>
        </div>

        <label className="mb-4 block text-sm font-semibold text-slate-800">
          Password temporal
          <input
            type="password"
            autoComplete="current-password"
            value={passwordActual}
            onChange={(event) => onCambiarPasswordActual(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="mb-4 block text-sm font-semibold text-slate-800">
          Nueva password
          <input
            type="password"
            autoComplete="new-password"
            value={passwordNueva}
            onChange={(event) => onCambiarPasswordNueva(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="mb-6 block text-sm font-semibold text-slate-800">
          Confirmar nueva password
          <input
            type="password"
            autoComplete="new-password"
            value={confirmacion}
            onChange={(event) => onCambiarConfirmacion(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar password"}
        </button>
      </form>
    </div>
  );
}

export default CambiarPasswordView;
