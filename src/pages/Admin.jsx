import { lazy, Suspense, useMemo, useState } from "react";

const CrearProfesor = lazy(() => import("../components/CrearProfesor"));
const CrearCurso = lazy(() => import("../components/CrearCurso"));
const CrearMateria = lazy(() => import("../components/CrearMateria"));
const AsignarClase = lazy(() => import("../components/AsignarClase"));

const modulosAdmin = [
    {
        id: "profesores",
        titulo: "Crear profesor",
        descripcion: "Registrar, editar y consultar profesores.",
        componente: CrearProfesor,
    },
    {
        id: "cursos",
        titulo: "Crear curso",
        descripcion: "Administrar cursos, matrículas y mensualidades.",
        componente: CrearCurso,
    },
    {
        id: "materias",
        titulo: "Crear materia",
        descripcion: "Crear y actualizar materias académicas.",
        componente: CrearMateria,
    },
    {
        id: "asignar-clases",
        titulo: "Asignar clases",
        descripcion: "Relacionar profesores, cursos, materias y horarios.",
        componente: AsignarClase,
    },
];

function Admin() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    const [moduloActivoId, setModuloActivoId] = useState(null);
    const moduloActivo = useMemo(
        () => modulosAdmin.find((modulo) => modulo.id === moduloActivoId),
        [moduloActivoId]
    );
    const ModuloActivo = moduloActivo?.componente;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Panel Administrativo
                    </h1>
                    <p className="text-gray-600">
                        Bienvenido, {usuario?.nombre || "Admin"}. Selecciona una opcion para cargar solo ese modulo.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                    <aside className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm lg:sticky lg:top-6 lg:self-start">
                        <div className="px-2 pb-3">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                                Modulos
                            </h2>
                        </div>

                        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                            {modulosAdmin.map((modulo) => {
                                const activo = modulo.id === moduloActivoId;

                                return (
                                    <button
                                        key={modulo.id}
                                        type="button"
                                        onClick={() => setModuloActivoId(modulo.id)}
                                        className={`min-w-[220px] rounded-md border px-4 py-3 text-left transition lg:min-w-0 ${
                                            activo
                                                ? "border-purple-600 bg-purple-50 text-purple-900 shadow-sm"
                                                : "border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                                        }`}
                                    >
                                        <span className="block text-sm font-semibold">
                                            {modulo.titulo}
                                        </span>
                                        <span className="mt-1 block text-xs leading-5 text-gray-500">
                                            {modulo.descripcion}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    <main className="min-w-0">
                        {ModuloActivo ? (
                            <Suspense
                                fallback={
                                    <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">
                                        Cargando modulo...
                                    </div>
                                }
                            >
                                <ModuloActivo />
                            </Suspense>
                        ) : (
                            <section className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Elige un modulo del panel
                                </h2>
                                <p className="mx-auto mt-2 max-w-xl text-gray-600">
                                    Al entrar no se consultan profesores, cursos, materias, asignaciones ni tipos de pago.
                                    Cada modulo se carga cuando lo abres desde el sidebar.
                                </p>
                            </section>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default Admin;
