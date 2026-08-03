export function CargandoMallaCurricular() {
  return (
    <div className="flex bg-white items-center justify-center p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      <span className="ml-3 text-slate-600">Cargando...</span>
    </div>
  );
}

export function SinAsignacionMallaCurricular() {
  return (
    <div className="p-6 text-center">
      Selecciona una asignación en el Dashboard primero.
    </div>
  );
}
