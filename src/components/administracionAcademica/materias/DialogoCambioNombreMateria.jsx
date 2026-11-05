export default function DialogoCambioNombreMateria({
    mensaje,
    onCambiarIgual,
    onCrearNueva,
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogo-cambio-nombre-materia-titulo"
        >
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                <h3
                    id="dialogo-cambio-nombre-materia-titulo"
                    className="text-xl font-semibold text-gray-900"
                >
                    La materia se usa en otro año
                </h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                    {mensaje}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                    Puedes corregir el nombre en todos los años o crear una materia distinta.
                </p>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onCrearNueva}
                        className="rounded-lg border border-purple-600 px-4 py-2 font-semibold text-purple-700 hover:bg-purple-50"
                    >
                        Crear una materia nueva
                    </button>
                    <button
                        type="button"
                        onClick={onCambiarIgual}
                        className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-800"
                    >
                        Cambiar igual
                    </button>
                </div>
            </div>
        </div>
    );
}
