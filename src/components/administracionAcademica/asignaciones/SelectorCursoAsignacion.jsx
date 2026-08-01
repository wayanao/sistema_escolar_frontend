function SelectorCursoAsignacion({
    cursoId,
    cursos,
    cursoSeleccionado,
    onSeleccionarCurso,
}) {
    return (
        <section className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso de trabajo</label>
                    <select
                        value={cursoId}
                        onChange={(event) => onSeleccionarCurso(event.target.value)}
                        className="w-full lg:max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Seleccionar curso</option>
                        {cursos.map((curso) => (
                            <option key={curso.id} value={curso.id}>
                                {curso.nombre}{curso.jornada ? ` (${curso.jornada})` : ""}
                            </option>
                        ))}
                    </select>
                </div>

                {cursoSeleccionado && (
                    <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        Asignando para <strong>{cursoSeleccionado.nombre}</strong>
                        {cursoSeleccionado.jornada && <span> · Jornada {cursoSeleccionado.jornada}</span>}
                    </div>
                )}
            </div>
        </section>
    );
}

export default SelectorCursoAsignacion;
