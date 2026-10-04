/**
 * VistaAdministrarTiposPago
 *
 * Centro de configuración financiera del sistema escolar.
 * Permite:
 *  - Crear y editar tipos de pago (nombre + valor base)
 *  - Configuración avanzada por tipo de cobro: único, mensual, anual, opcional
 *  - Mora (porcentaje o fijo), días de gracia, fecha límite
 *  - Recurrencia mensual (mes inicial, mes final, frecuencia, generación automática)
 *  - Asignación a uno o múltiples cursos con valores diferenciados
 *  - Estado activo / inactivo
 *
 * Ubicación: src/components/carteraTiposPago/VistaAdministrarTiposPago.jsx
 * Ruta: /admin/tipos-pagos
 */

import { useMemo } from "react";
import { formatMoney } from "../../utils/carteraTiposPago/formatos";
import {
    FILTROS_ESTADO_CONCEPTO,
    MESES,
    TIPOS_COBRO,
    esRangoMesesValido,
    evaluarEstadoCartera,
    obtenerTipoCobro,
} from "../../utils/carteraTiposPago/tiposPago";

function BadgeTipoCobro({ tipo }) {
    const meta = obtenerTipoCobro(tipo);
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.badge}`}>
            {meta.label}
        </span>
    );
}

function BadgeEstado({ activo }) {
    return activo ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            ● Activo
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
            ● Inactivo
        </span>
    );
}

function BadgeEstadoCartera({ tp }) {
    const { publicado, razones } = evaluarEstadoCartera(tp);
    if (publicado) {
        return (
            <span
                className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800"
                title="Este concepto está generando deuda automáticamente a los estudiantes asignados."
            >
                ✓ Publicado
            </span>
        );
    }
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800"
            title={`No genera cartera porque: ${razones.join(" + ")}`}
        >
            ⏸ Borrador
        </span>
    );
}

function VistaAdministrarTiposPago({
    tiposPagos,
    estadoFiltro,
    setEstadoFiltro,
    selectedTipoId,
    detalle,
    loadingDetalle,
    cerrarDetalle,
    resumenEstados,
    tiposPagosFiltrados,
    mensajeConceptosVacios,
    nuevoTipoPago,
    setNuevoTipoPago,
    valorTipoPago,
    setValorTipoPago,
    editingTipoId,
    handleSubmit,
    handleEdit,
    cancelarEdicion,
    config,
    guardandoConfig,
    handleConfigChange,
    guardarConfiguracion,
    cursosAsignados,
    cursoAAgregar,
    setCursoAAgregar,
    valorCursoAAgregar,
    setValorCursoAAgregar,
    guardandoCursos,
    cursosAsignadosDirty,
    cursosDisponibles,
    cursosAsignadosActivos,
    totalCursosActivos,
    cursosPendientes,
    agregarCursoLocal,
    agregarTodosLosCursos,
    actualizarValorCurso,
    toggleActivoCurso,
    quitarCurso,
    guardarAsignacionCursos,
    seleccionarTipoParaConfigurar,
    // Según el año que mira el admin (`permisosAnio`): crear solo en el activo;
    // editar también en uno en preparación; en uno cerrado, solo consulta.
    puedeCrear = true,
    puedeEditar = true,
}) {
    const mostrarFormulario = editingTipoId ? puedeEditar : puedeCrear;
    const esMensual = config.tipo_cobro === "mensual";
    const esAnual = config.tipo_cobro === "anual";
    const rangoMesesValido = esRangoMesesValido(config);

    // Vista previa del estado de cartera con la configuración actual (no guardada).
    const carteraPreview = useMemo(() => {
        if (!detalle) return null;
        return evaluarEstadoCartera({
            nombre: detalle.nombre,
            tipo_cobro: config.tipo_cobro,
            activo: config.activo,
            cursos: cursosAsignados,
        });
    }, [detalle, config.tipo_cobro, config.activo, cursosAsignados]);

    return (
        <div className="space-y-6">
            {/* ============================ Conceptos ============================ */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    💳 Administrar Tipos de Pago y Valores
                </h2>

                {/* Banner: flujo de cartera */}
                <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                    <p className="font-semibold mb-1">📋 Flujo de cartera</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                        <li>Crea el concepto con su <strong>nombre</strong> y <strong>valor base</strong> opcional → queda en <em>Borrador</em>.</li>
                        <li>Abre <strong>⚙️ Configurar</strong> y define: tipo de cobro, mora, recurrencia.</li>
                        <li>Asigna a uno o más <strong>cursos</strong> con su valor → pasa a <em>Publicado</em>.</li>
                        <li>Solo los conceptos <strong>Publicados</strong> generan deuda automática a los estudiantes.</li>
                    </ol>
                </div>

                {mostrarFormulario && (
                    <form onSubmit={handleSubmit} className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto de Pago</label>
                                <input
                                    type="text"
                                    value={nuevoTipoPago}
                                    onChange={(e) => setNuevoTipoPago(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ej: Matrícula, Copias..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor base / Costo</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={valorTipoPago}
                                    onChange={(e) => setValorTipoPago(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium">
                                {editingTipoId ? "Actualizar Concepto" : "Guardar Concepto"}
                            </button>
                            {editingTipoId && (
                                <button
                                    type="button"
                                    onClick={cancelarEdicion}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                )}

                <div className="mt-2">
                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Conceptos Existentes</h3>
                            <p className="mt-1 text-xs text-gray-500">
                                Los inactivos se conservan para historial, pero quedan fuera de la operación diaria.
                            </p>
                        </div>
                        <div className="inline-flex w-full rounded-lg border border-gray-200 bg-gray-50 p-1 md:w-auto">
                            {FILTROS_ESTADO_CONCEPTO.map((filtro) => (
                                <button
                                    key={filtro.value}
                                    type="button"
                                    onClick={() => setEstadoFiltro(filtro.value)}
                                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors md:flex-none ${
                                        estadoFiltro === filtro.value
                                            ? "bg-white text-purple-700 shadow-sm"
                                            : "text-gray-600 hover:bg-white/70"
                                    }`}
                                >
                                    {filtro.label} ({resumenEstados[filtro.value]})
                                </button>
                            ))}
                        </div>
                    </div>
                    {tiposPagos.length === 0 ? (
                        <span className="text-gray-500 text-sm">No hay conceptos registrados</span>
                    ) : tiposPagosFiltrados.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                            {mensajeConceptosVacios}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        <th className="px-3 py-2">Concepto</th>
                                        <th className="px-3 py-2">Valor base</th>
                                        <th className="px-3 py-2">Tipo cobro</th>
                                        <th className="px-3 py-2">Cursos</th>
                                        <th className="px-3 py-2">Estado</th>
                                        <th className="px-3 py-2">Cartera</th>
                                        <th className="px-3 py-2 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {tiposPagosFiltrados.map((tp) => {
                                        const cartera = evaluarEstadoCartera(tp);
                                        const inactivo = tp.activo === false;
                                        return (
                                        <tr
                                            key={tp.id}
                                            className={`hover:bg-purple-50/40 ${
                                                selectedTipoId === tp.id
                                                    ? "bg-purple-50"
                                                    : inactivo
                                                        ? "bg-gray-50/70"
                                                        : ""
                                            }`}
                                        >
                                            <td className={`px-3 py-2 font-medium ${inactivo ? "text-gray-500" : "text-gray-800"}`}>
                                                {tp.nombre}
                                                {!cartera.publicado && (
                                                    <p className="text-[11px] text-amber-700 mt-0.5">
                                                        Falta: {cartera.razones.join(" + ")}.
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-emerald-700 font-semibold">{formatMoney(tp.valor)}</td>
                                            <td className="px-3 py-2"><BadgeTipoCobro tipo={tp.tipo_cobro || "unico"} /></td>
                                            <td className="px-3 py-2 text-gray-600">{(tp.cursos || []).length}</td>
                                            <td className="px-3 py-2"><BadgeEstado activo={tp.activo !== false} /></td>
                                            <td className="px-3 py-2"><BadgeEstadoCartera tp={tp} /></td>
                                            <td className="px-3 py-2 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => seleccionarTipoParaConfigurar(tp)}
                                                    className="text-purple-700 hover:text-purple-900 text-xs font-semibold mr-3"
                                                    title="Configurar"
                                                >
                                                    ⚙️ Configurar
                                                </button>
                                                {puedeEditar && (
                                                    <button
                                                        onClick={() => handleEdit(tp)}
                                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                                        title="Editar nombre/valor"
                                                    >
                                                        ✏️
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================ Panel avanzado ============================ */}
            {selectedTipoId && (
                <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
                        <div>
                            <p className="text-xs uppercase tracking-wide font-semibold text-purple-700">Configuración financiera</p>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                                ⚙️ {detalle?.nombre || "Tipo de pago"}
                                <BadgeTipoCobro tipo={config.tipo_cobro} />
                                <BadgeEstado activo={config.activo} />
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Valor base: <span className="font-semibold text-gray-700">{formatMoney(detalle?.valor)}</span>
                            </p>
                        </div>
                        <button
                            onClick={cerrarDetalle}
                            className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                            ✕ Cerrar
                        </button>
                    </div>

                    {loadingDetalle ? (
                        <p className="text-gray-500">Cargando...</p>
                    ) : (
                        // En un año que no se puede editar, la configuración se
                        // ve con todos sus campos bloqueados. `min-w-0` evita que
                        // la tabla de cursos ensanche la página en el celular.
                        <fieldset disabled={!puedeEditar} className="min-w-0 space-y-6">
                            {/* --- Vista previa de estado de cartera --- */}
                            {carteraPreview && (
                                carteraPreview.publicado ? (
                                    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
                                        <p className="font-semibold">✓ Listo para generar cartera</p>
                                        <p className="text-xs mt-1 opacity-80">
                                            Con esta configuración, los estudiantes de los cursos asignados
                                            tendrán deuda automática por este concepto.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                                        <p className="font-semibold">⏸ Este concepto NO generará cartera todavía</p>
                                        <p className="text-xs mt-1">
                                            Falta: <strong>{carteraPreview.razones.join(" + ")}</strong>.
                                            Ajusta y guarda para activarlo.
                                        </p>
                                    </div>
                                )
                            )}

                            {/* --- Panel: parámetros generales --- */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Parámetros generales</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                        <textarea
                                            value={config.descripcion}
                                            onChange={(e) => handleConfigChange("descripcion", e.target.value)}
                                            rows={2}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Notas internas, condiciones, etc."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cobro</label>
                                        <select
                                            value={config.tipo_cobro}
                                            onChange={(e) => handleConfigChange("tipo_cobro", e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        >
                                            {TIPOS_COBRO.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                        <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                                            <label className="inline-flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={config.activo}
                                                    onChange={(e) => handleConfigChange("activo", e.target.checked)}
                                                />
                                                Activo
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite (única)</label>
                                        <input
                                            type="date"
                                            value={config.fecha_limite || ""}
                                            onChange={(e) => handleConfigChange("fecha_limite", e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Días de gracia</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={365}
                                            value={config.dias_gracia}
                                            onChange={(e) => handleConfigChange("dias_gracia", e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* --- Panel: mora --- */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Configuración de mora</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de mora</label>
                                        <select
                                            value={config.mora_tipo || ""}
                                            onChange={(e) => handleConfigChange("mora_tipo", e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">Sin mora</option>
                                            <option value="porcentaje">Porcentaje (%)</option>
                                            <option value="fijo">Valor fijo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {config.mora_tipo === "porcentaje" ? "Porcentaje de mora (%)" : "Valor de mora"}
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={config.mora_valor}
                                            onChange={(e) => handleConfigChange("mora_valor", e.target.value)}
                                            disabled={!config.mora_tipo}
                                            className="w-full p-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* --- Panel: recurrencia --- */}
                            {(esMensual || esAnual) && (
                                <section>
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                                        Configuración de recurrencia
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Mes inicial</label>
                                            <select
                                                value={config.mes_inicial || ""}
                                                onChange={(e) => handleConfigChange("mes_inicial", e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            >
                                                <option value="">— Seleccionar —</option>
                                                {MESES.map((m, i) => (
                                                    <option key={m} value={i + 1}>{m}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {esMensual && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mes final</label>
                                                    <select
                                                        value={config.mes_final}
                                                        onChange={(e) => handleConfigChange("mes_final", e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                                        aria-describedby="ayuda-mes-final"
                                                        required
                                                    >
                                                        {MESES.map((mes, index) => {
                                                            const numeroMes = index + 1;
                                                            return (
                                                                <option
                                                                    key={mes}
                                                                    value={numeroMes}
                                                                    disabled={
                                                                        config.mes_inicial !== "" &&
                                                                        numeroMes < Number(config.mes_inicial)
                                                                    }
                                                                >
                                                                    {mes}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    <p id="ayuda-mes-final" className="text-xs text-gray-500 mt-1">
                                                        Último mes que genera mensualidades y permite adelantos.
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia (meses)</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={12}
                                                        value={config.frecuencia_meses}
                                                        onChange={(e) => handleConfigChange("frecuencia_meses", e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">1 = mensual, 2 = bimestral...</p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Día de vencimiento</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={31}
                                                        value={config.dia_limite_mes}
                                                        onChange={(e) => handleConfigChange("dia_limite_mes", e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                                        placeholder="Ej: 10"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div className="md:col-span-2 xl:col-span-4">
                                            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={config.generacion_automatica}
                                                    onChange={(e) => handleConfigChange("generacion_automatica", e.target.checked)}
                                                />
                                                Generar deudas automáticamente (evita duplicados del mismo mes)
                                            </label>
                                        </div>
                                        {!rangoMesesValido && (
                                            <p className="text-sm font-medium text-red-600 md:col-span-2 xl:col-span-4" role="alert">
                                                El mes final no puede ser anterior al mes inicial.
                                            </p>
                                        )}
                                    </div>
                                </section>
                            )}

                            {puedeEditar && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={guardarConfiguracion}
                                        disabled={guardandoConfig || !rangoMesesValido}
                                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
                                    >
                                        {guardandoConfig ? "Guardando..." : "Guardar configuración"}
                                    </button>
                                </div>
                            )}

                            {/* --- Panel: asignación a cursos --- */}
                            <section className="border-t border-gray-200 pt-6">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                            Asignación por cursos
                                        </h3>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {cursosAsignadosActivos} de {totalCursosActivos} cursos activos asignados.
                                            {cursosPendientes > 0 && ` Faltan ${cursosPendientes}.`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={agregarTodosLosCursos}
                                        disabled={cursosDisponibles.length === 0}
                                        className="text-xs font-semibold text-purple-700 hover:text-purple-900 disabled:text-gray-400"
                                    >
                                        + Agregar todos los cursos
                                    </button>
                                </div>

                                {cursosAsignadosDirty && (
                                    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                                        <p className="font-semibold">Cambios de cursos pendientes por guardar</p>
                                        <p className="mt-1 text-xs">
                                            Los cursos agregados, quitados o modificados no generan deuda hasta presionar
                                            <strong> Guardar asignación de cursos</strong>.
                                        </p>
                                    </div>
                                )}

                                {!cursosAsignadosDirty && cursosPendientes > 0 && config.tipo_cobro !== "opcional" && (
                                    <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900">
                                        <p className="font-semibold">Este concepto no está en todos los cursos activos</p>
                                        <p className="mt-1 text-xs">
                                            Solo genera deuda en los cursos asignados y activos. Usa
                                            <strong> Agregar todos los cursos</strong> si aplica para todo el colegio.
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 mb-4 items-end">
                                    <div className="flex-1 min-w-[180px]">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Curso</label>
                                        <select
                                            value={cursoAAgregar}
                                            onChange={(e) => setCursoAAgregar(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                        >
                                            <option value="">— Seleccionar curso —</option>
                                            {cursosDisponibles.map((c) => (
                                                <option key={c.id} value={c.id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-40">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Valor</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={valorCursoAAgregar}
                                            onChange={(e) => setValorCursoAAgregar(e.target.value)}
                                            placeholder={`${detalle?.valor ?? 0}`}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={agregarCursoLocal}
                                        disabled={!cursoAAgregar}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
                                    >
                                        Agregar
                                    </button>
                                </div>

                                {cursosAsignados.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">Aún no hay cursos asignados.</p>
                                ) : (
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gray-50">
                                                <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    <th className="px-3 py-2">Curso</th>
                                                    <th className="px-3 py-2">Valor</th>
                                                    <th className="px-3 py-2">Activo</th>
                                                    <th className="px-3 py-2 text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {cursosAsignados.map((c) => (
                                                    <tr key={c.curso_id}>
                                                        <td className="px-3 py-2 font-medium text-gray-800">{c.curso_nombre}</td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                step="0.01"
                                                                value={c.valor}
                                                                onChange={(e) => actualizarValorCurso(c.curso_id, e.target.value)}
                                                                className="w-32 p-1.5 border border-gray-300 rounded text-sm"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={c.activo}
                                                                onChange={() => toggleActivoCurso(c.curso_id)}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <button
                                                                onClick={() => quitarCurso(c.curso_id)}
                                                                className="text-red-500 hover:text-red-700 text-xs"
                                                            >
                                                                Quitar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {puedeEditar && (
                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={guardarAsignacionCursos}
                                            disabled={guardandoCursos || !cursosAsignadosDirty}
                                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {guardandoCursos
                                                ? "Guardando..."
                                                : cursosAsignadosDirty
                                                    ? "Guardar asignación de cursos"
                                                    : "Asignación de cursos guardada"}
                                        </button>
                                    </div>
                                )}
                            </section>
                        </fieldset>
                    )}
                </div>
            )}
        </div>
    );
}

export default VistaAdministrarTiposPago;
