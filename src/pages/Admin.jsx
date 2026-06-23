import { lazy, Suspense, useMemo, useState } from "react";

const CrearProfesor = lazy(() => import("../components/CrearProfesor"));
const CrearCurso = lazy(() => import("../components/CrearCurso"));
const CrearMateria = lazy(() => import("../components/CrearMateria"));
const AsignarClase = lazy(() => import("../components/AsignarClase"));

const modulosAdmin = [
    {
        id: "profesores",
        titulo: "Profesores",
        componente: CrearProfesor,
    },
    {
        id: "cursos",
        titulo: "Cursos",
        componente: CrearCurso,
    },
    {
        id: "materias",
        titulo: "Materias",
        componente: CrearMateria,
    },
    {
        id: "asignar-clases",
        titulo: "Asignaciones",
        componente: AsignarClase,
    },
];

function Admin() {
    const [moduloActivoId, setModuloActivoId] = useState("profesores");
    const moduloActivo = useMemo(
        () => modulosAdmin.find((modulo) => modulo.id === moduloActivoId) || modulosAdmin[0],
        [moduloActivoId]
    );
    const ModuloActivo = moduloActivo.componente;

    return (
        <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-5 sm:py-6">
            <div className="mx-auto w-full max-w-[1500px]">
                <header className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        Administración académica
                    </h1>
                </header>

                <nav
                    aria-label="Módulos de administración"
                    className="mb-4 overflow-x-auto border-b border-gray-200"
                >
                    <div className="flex min-w-max gap-2">
                        {modulosAdmin.map((modulo) => {
                            const activo = modulo.id === moduloActivoId;

                            return (
                                <button
                                    key={modulo.id}
                                    type="button"
                                    onClick={() => setModuloActivoId(modulo.id)}
                                    aria-current={activo ? "page" : undefined}
                                    className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
                                        activo
                                            ? "border-purple-600 text-purple-700"
                                            : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
                                    }`}
                                >
                                    {modulo.titulo}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                <main className="min-w-0">
                    <div className="min-w-0 overflow-x-auto pb-2">
                        <Suspense
                            fallback={
                                <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">
                                    Cargando módulo...
                                </div>
                            }
                        >
                            <ModuloActivo />
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Admin;
