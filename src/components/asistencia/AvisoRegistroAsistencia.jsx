function AvisoRegistroAsistencia({
  visible,
  hayCambiosSinGuardar,
  cantidadGuardada,
  totalEstudiantes,
}) {
  if (!visible) return null;

  return (
    <div className={`mb-6 rounded-lg border px-4 py-3 shadow-sm ${
      hayCambiosSinGuardar
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-emerald-200 bg-emerald-50 text-emerald-800"
    }`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold">
            {hayCambiosSinGuardar ? "Editando asistencia guardada" : "Asistencia del día ya tomada"}
          </p>
          <p className="text-sm">
            {hayCambiosSinGuardar
              ? "Tienes cambios pendientes. Guárdalos para actualizar el registro del día."
              : `Hay registro para ${cantidadGuardada} de ${totalEstudiantes} estudiantes en la fecha seleccionada.`}
          </p>
        </div>
        <span className={`inline-flex w-fit rounded-full border bg-white px-3 py-1 text-xs font-bold ${
          hayCambiosSinGuardar ? "border-amber-300" : "border-emerald-300"
        }`}>
          {hayCambiosSinGuardar ? "Cambios sin guardar" : "Guardado"}
        </span>
      </div>
    </div>
  );
}

export default AvisoRegistroAsistencia;
