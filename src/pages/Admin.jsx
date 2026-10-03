import { lazy, Suspense, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const CrearProfesor = lazy(() => import("../components/administracionAcademica/profesores/CrearProfesor"));
const CrearCurso = lazy(() => import("../components/administracionAcademica/cursos/CrearCurso"));
const CrearMateria = lazy(() => import("../components/administracionAcademica/materias/CrearMateria"));
const AsignarClase = lazy(() => import("../components/administracionAcademica/asignaciones/AsignarClase"));
const OrdenBoletin = lazy(() => import("./OrdenBoletin"));

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
    {
        id: "orden-boletin",
        titulo: "Orden boletín",
        componente: OrdenBoletin,
    },
];

// La pestaña vive en la dirección (`/admin?modulo=cursos`) y no en un estado:
// así sobrevive cuando la página se reinicia al cambiar de año, y la barra
// sabe si la pestaña abierta depende del año (`RUTAS_POR_ANIO` en
// `utils/anioLectivo.js` repite los ids de las pestañas del año). `replace`
// evita que cada clic en una pestaña sume un paso al botón Atrás.
const PARAMETRO_MODULO = "modulo";

function Admin() {
    const [parametros, setParametros] = useSearchParams();
    const moduloSolicitado = parametros.get(PARAMETRO_MODULO);
    const moduloActivo = useMemo(
        () => modulosAdmin.find((modulo) => modulo.id === moduloSolicitado) || modulosAdmin[0],
        [moduloSolicitado]
    );
    const moduloActivoId = moduloActivo.id;
    const ModuloActivo = moduloActivo.componente;

    const setModuloActivoId = (id) => {
        setParametros({ [PARAMETRO_MODULO]: id }, { replace: true });
    };

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
