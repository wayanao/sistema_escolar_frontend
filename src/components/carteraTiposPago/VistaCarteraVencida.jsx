/**
 * VistaCarteraVencida
 *
 * Centro de control de cartera vencida del colegio.
 *  - KPIs (total deuda, # estudiantes en mora, mora acumulada, etc.)
 *  - Distribución por curso (mini barras)
 *  - Filtros: curso, tipo de deuda, búsqueda por nombre
 *  - Tabla expandible con detalle por estudiante (conceptos + ventas pendientes)
 *  - Exportar a CSV
 *  - Acceso rápido a registrar pago de cada estudiante
 *
 * Endpoints:
 *  - GET /cartera/mora           → lista detallada
 *  - GET /cartera/mora/resumen   → resumen para KPIs
 */

import React from "react";
import DeudasAniosAnterioresView from "../anioLectivo/DeudasAniosAnterioresView";
import SpinnerView from "../anioLectivo/SpinnerView";
import DocumentoImprimible from "../impresion/DocumentoImprimible";
import { calcularTotalesCartera } from "../../utils/carteraTiposPago/cartera";
import {
    formatDate,
    formatMoney,
    nombreCompleto,
} from "../../utils/carteraTiposPago/formatos";

function DatoResumen({ label, value, accent = false }) {
    return (
        <div className={`rounded border px-3 py-2 ${accent ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{label}</p>
            <p className={`text-sm font-extrabold ${accent ? "text-rose-800" : "text-slate-800"}`}>{value}</p>
        </div>
    );
}

function TablaConceptos({ conceptos }) {
    if (!conceptos.length) {
        return <p className="text-xs text-slate-500 italic">Sin conceptos académicos en cuotas vencidas.</p>;
    }

    return (
        <table className="w-full border-collapse text-xs">
            <thead>
                <tr className="bg-slate-100 text-slate-600">
                    <th className="border border-slate-200 px-2 py-1 text-left">Concepto</th>
                    <th className="border border-slate-200 px-2 py-1 text-center">Cuotas</th>
                    <th className="border border-slate-200 px-2 py-1 text-right">Pagado</th>
                    <th className="border border-slate-200 px-2 py-1 text-right">Mora</th>
                    <th className="border border-slate-200 px-2 py-1 text-right">Debe</th>
                </tr>
            </thead>
            <tbody>
                {conceptos.map((concepto, idx) => (
                    <tr key={`${concepto.concepto || "concepto"}-${idx}`}>
                        <td className="border border-slate-200 px-2 py-1">
                            <span className="font-semibold text-slate-800">{concepto.concepto}</span>
                            {concepto.tipo_cobro && (
                                <span className="ml-1 text-[10px] text-slate-500">({concepto.tipo_cobro})</span>
                            )}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-center">{concepto.cuotas_vencidas || "—"}</td>
                        <td className="border border-slate-200 px-2 py-1 text-right text-emerald-700">{formatMoney(concepto.pagado)}</td>
                        <td className="border border-slate-200 px-2 py-1 text-right text-rose-700">
                            {Number(concepto.mora || 0) > 0 ? formatMoney(concepto.mora) : "—"}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-bold text-rose-800">
                            {formatMoney(concepto.deuda)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function TablaVentasPendientes({ ventas }) {
    if (!ventas.length) {
        return <p className="text-xs text-slate-500 italic">Sin cargos de inventario en cuotas vencidas.</p>;
    }

    return (
        <table className="w-full border-collapse text-xs">
            <thead>
                <tr className="bg-slate-100 text-slate-600">
                    <th className="border border-slate-200 px-2 py-1 text-left">Venta</th>
                    <th className="border border-slate-200 px-2 py-1 text-left">Fecha</th>
                    <th className="border border-slate-200 px-2 py-1 text-right">Saldo</th>
                </tr>
            </thead>
            <tbody>
                {ventas.map((venta) => (
                    <tr key={venta.venta_id}>
                        <td className="border border-slate-200 px-2 py-1 font-mono text-slate-700">#{venta.venta_id}</td>
                        <td className="border border-slate-200 px-2 py-1 text-slate-600">{formatDate(venta.fecha)}</td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-bold text-amber-700">
                            {formatMoney(venta.saldo)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function BloqueEstudianteCartera({ item }) {
    const conceptos = item.conceptos || [];
    const ventasPendientes = item.ventas_pendientes || [];
    const totalAniosAnteriores = (item.deuda_anios_anteriores || []).reduce(
        (total, anio) => total + Number(anio?.total_deuda || 0),
        0,
    );

    return (
        <section className="rounded-lg border border-slate-200 overflow-hidden bg-white" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Estudiante</p>
                    <h3 className="text-sm font-extrabold uppercase text-slate-800">{nombreCompleto(item)}</h3>
                    <p className="text-[11px] text-slate-500">Curso: {item.curso_nombre || "Sin curso"}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Total vencido</p>
                    <p className="text-lg font-black text-rose-800">{formatMoney(item.total)}</p>
                </div>
            </div>

            <div className="p-3 space-y-3">
                <div className={`grid grid-cols-2 gap-2 ${totalAniosAnteriores > 0 ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
                    <DatoResumen label="Académica" value={formatMoney(item.deuda_academica)} />
                    <DatoResumen label="Inventario" value={formatMoney(item.deuda_inventario)} />
                    <DatoResumen label="Mora" value={formatMoney(item.mora)} />
                    <DatoResumen label="Cuotas vencidas" value={item.cuotas_vencidas || 0} accent />
                    {totalAniosAnteriores > 0 && (
                        <DatoResumen label="Años anteriores" value={formatMoney(totalAniosAnteriores)} />
                    )}
                </div>

                <DeudasAniosAnterioresView
                    deudasAnios={item.deuda_anios_anteriores}
                    formatearMonto={formatMoney}
                />

                <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-600 mb-1">
                        Conceptos académicos
                    </h4>
                    <TablaConceptos conceptos={conceptos} />
                </div>

                <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-600 mb-1">
                        Ventas o cargos pendientes
                    </h4>
                    <TablaVentasPendientes ventas={ventasPendientes} />
                </div>
            </div>
        </section>
    );
}

function ReporteCursoEstadoCuenta({ reporte, totales }) {
    const lista = reporte.items || [];

    return (
        <div className="space-y-4 text-slate-800">
            <section className="grid grid-cols-2 gap-2 text-xs">
                <DatoResumen label="Curso" value={reporte.nombre} />
                <DatoResumen label="Fecha de corte" value={reporte.fechaCorte} />
                <DatoResumen label="Estudiantes incluidos" value={lista.length} />
                <DatoResumen label="Alcance" value="Cuotas vencidas" />
            </section>

            <section className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                <div className="bg-slate-50 border-b border-slate-200 px-3 py-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
                        Resumen por estudiante
                    </h3>
                </div>
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-100 text-slate-600">
                            <th className="border border-slate-200 px-3 py-2 text-left">Estudiante</th>
                            <th className="border border-slate-200 px-3 py-2 text-right">Valor que debe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.map((item) => (
                            <tr key={item.estudiante_id}>
                                <td className="border border-slate-200 px-3 py-2 font-semibold uppercase text-slate-800">
                                    {nombreCompleto(item)}
                                </td>
                                <td className="border border-slate-200 px-3 py-2 text-right font-bold text-rose-800">
                                    {formatMoney(item.total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="rounded-lg border border-slate-200 bg-slate-50 p-3" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-700 mb-2">
                    Totales del curso
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <DatoResumen label="Total deuda académica" value={formatMoney(totales.academica)} />
                    <DatoResumen label="Total deuda inventario" value={formatMoney(totales.inventario)} />
                    <DatoResumen label="Total general" value={formatMoney(totales.total)} accent />
                </div>
            </section>
        </div>
    );
}

function ReporteCarteraVencida({ reporte }) {
    const lista = reporte.items || [];
    const totales = calcularTotalesCartera(lista);
    const esCurso = reporte.tipo === "curso";

    if (esCurso) {
        return <ReporteCursoEstadoCuenta reporte={reporte} totales={totales} />;
    }

    return (
        <div className="space-y-4 text-slate-800">
            <section className="grid grid-cols-2 gap-2 text-xs">
                <DatoResumen label="Estudiante" value={reporte.nombre} />
                <DatoResumen label="Fecha de corte" value={reporte.fechaCorte} />
                <DatoResumen label="Registros incluidos" value={`${lista.length} estudiante${lista.length === 1 ? "" : "s"}`} />
                <DatoResumen label="Alcance" value="Cuotas vencidas" />
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <DatoResumen label="Total vencido" value={formatMoney(totales.total)} accent />
                <DatoResumen label="Académica" value={formatMoney(totales.academica)} />
                <DatoResumen label="Inventario" value={formatMoney(totales.inventario)} />
                <DatoResumen label="Mora" value={formatMoney(totales.mora)} />
            </section>

            <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                Este documento muestra únicamente las cuotas vencidas visibles al momento de generarlo.
            </p>

            <div className="space-y-3">
                {lista.map((item) => (
                    <BloqueEstudianteCartera key={item.estudiante_id} item={item} />
                ))}
            </div>
        </div>
    );
}

function KpiCard({ icon, label, value, accent = "purple", subtitle }) {
    const palette = {
        purple: "from-purple-600 to-purple-700",
        red: "from-rose-600 to-red-600",
        amber: "from-amber-500 to-orange-500",
        emerald: "from-emerald-600 to-teal-600",
        slate: "from-slate-600 to-gray-700",
    }[accent];
    return (
        <div className="rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden">
            <div className={`bg-gradient-to-r ${palette} px-4 py-3 flex items-center justify-between`}>
                <span className="text-2xl">{icon}</span>
                <span className="text-xs uppercase tracking-wider font-semibold text-white/90">{label}</span>
            </div>
            <div className="p-4">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
}

function BadgeTipoDeuda({ tipo }) {
    const map = {
        academica: { label: "Académica", cls: "bg-blue-100 text-blue-800 border-blue-200" },
        inventario: { label: "Inventario", cls: "bg-amber-100 text-amber-800 border-amber-200" },
        mora: { label: "Con mora", cls: "bg-rose-100 text-rose-800 border-rose-200" },
        anteriores: { label: "Años anteriores", cls: "bg-orange-100 text-orange-800 border-orange-200" },
    };
    const meta = map[tipo] || map.academica;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}>
            {meta.label}
        </span>
    );
}

const horaCorta = (fecha) =>
    fecha.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

// `actualizando`: se vuelve a pedir la cartera con los datos a la vista.
// `error` sin `hayDatos`: no hay cifras que mostrar, y no se muestran (un
// error no debe verse como «nadie debe»). `error` con `hayDatos`: lo que se ve
// es de `actualizadoA`, y se avisa.
function VistaCarteraVencida({
    resumen,
    cargando,
    actualizando = false,
    error = null,
    hayDatos = true,
    actualizadoA = null,
    busqueda,
    setBusqueda,
    filtroCurso,
    setFiltroCurso,
    filtroTipo,
    setFiltroTipo,
    cursosUnicos,
    itemsFiltrados,
    totales,
    maxDeuda,
    cursoSeleccionado,
    expandido,
    reporteImpresion,
    onCerrarReporte,
    onActualizar,
    onExportar,
    onImprimirCurso,
    onImprimirEstudiante,
    onCobrar,
    onToggleExpandido,
    puedeCobrar = true,
}) {
    const totalAniosAnterioresFiltrado = itemsFiltrados.reduce(
        (total, item) =>
            total + (item.deuda_anios_anteriores || []).reduce(
                (subtotal, anio) => subtotal + Number(anio?.total_deuda || 0),
                0,
            ),
        0,
    );
    const hayDeudasAnteriores =
        Number(resumen?.total_anios_anteriores || 0) > 0 ||
        totalAniosAnterioresFiltrado > 0;

    if (reporteImpresion) {
        return (
            <div className="bg-gray-100 min-h-screen py-10 px-4 md:px-8 relative">
                <div className="fixed left-4 top-4 no-print z-50 md:left-6 md:top-6">
                    <button
                        onClick={onCerrarReporte}
                        className="bg-slate-800 text-white px-4 py-2.5 rounded-full text-sm font-bold shadow-xl hover:bg-slate-900 transition"
                        title="Atras"
                    >
                        ← Atrás
                    </button>
                </div>

                <DocumentoImprimible
                    tipo="reporte_estudiante"
                    className={`di-documento--cartera di-documento--cartera-${reporteImpresion.tipo}`}
                    titulo="Estado de cuenta"
                    subtitulo={`${reporteImpresion.tipo === "curso" ? "Curso" : "Estudiante"}: ${reporteImpresion.nombre}${reporteImpresion.anioLectivo ? ` · Año lectivo ${reporteImpresion.anioLectivo}` : ""}`}
                >
                    <ReporteCarteraVencida reporte={reporteImpresion} />
                </DocumentoImprimible>
            </div>
        );
    }

    if (cargando) {
        return (
            <div role="status" className="flex flex-col items-center justify-center gap-3 h-64 text-gray-600">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
                <p className="text-sm font-medium">Cargando cartera vencida...</p>
            </div>
        );
    }

    const encabezado = (
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
                <p className="text-xs uppercase tracking-wide font-semibold text-purple-700">Cartera</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📂 Estado de cuenta</h1>
                <p className="text-gray-600 text-sm mt-1">
                    Reporte consolidado de cuotas vencidas académicas y de inventario.
                </p>
            </div>
            <div className="flex flex-col items-end gap-1">
                <div className="flex flex-wrap justify-end gap-2">
                    <button
                        onClick={onActualizar}
                        disabled={actualizando}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium disabled:cursor-wait disabled:opacity-75"
                    >
                        {actualizando ? (
                            <>
                                <SpinnerView />
                                Actualizando...
                            </>
                        ) : (
                            "↻ Actualizar"
                        )}
                    </button>
                    <button
                        onClick={onExportar}
                        disabled={itemsFiltrados.length === 0}
                        className="px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-800 font-medium disabled:opacity-50"
                    >
                        ⬇ Exportar CSV
                    </button>
                    <button
                        onClick={onImprimirCurso}
                        disabled={!cursoSeleccionado || itemsFiltrados.length === 0}
                        title={cursoSeleccionado ? "Imprimir estado de cuenta del curso seleccionado" : "Selecciona un curso para imprimir"}
                        className="px-3 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Imprimir curso
                    </button>
                </div>
                {actualizadoA && (
                    <p className="text-xs text-gray-500">Actualizado a las {horaCorta(actualizadoA)}</p>
                )}
            </div>
        </div>
    );

    // Sin datos que mostrar, solo el error: nada de cifras en $0 ni «🎉 No hay
    // estudiantes en mora», que harían pasar un error por «nadie debe».
    if (error && !hayDatos) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                {encabezado}
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
                    <p className="font-semibold">{error}</p>
                    <p className="mt-1 text-sm">Revisa la conexión e inténtalo de nuevo.</p>
                    <button
                        type="button"
                        onClick={onActualizar}
                        disabled={actualizando}
                        className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-50"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {encabezado}

            {error && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <p>
                        No se pudo actualizar la cartera.
                        {actualizadoA && ` Lo que ves es de las ${horaCorta(actualizadoA)}.`}
                    </p>
                    <button
                        type="button"
                        onClick={onActualizar}
                        disabled={actualizando}
                        className="rounded border border-amber-400 bg-white px-3 py-1 font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-50"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KpiCard
                    icon="💸"
                    label="Total cuotas vencidas"
                    value={formatMoney(resumen?.total_deuda)}
                    accent="red"
                    subtitle={`${resumen?.total_estudiantes || 0} estudiantes en mora`}
                />
                <KpiCard
                    icon="🎓"
                    label="Deuda académica"
                    value={formatMoney(resumen?.total_academico)}
                    accent="purple"
                    subtitle="Matrícula, pensión, conceptos"
                />
                <KpiCard
                    icon="📦"
                    label="Deuda inventario"
                    value={formatMoney(resumen?.total_inventario)}
                    accent="amber"
                    subtitle="Saldos de ventas pendientes"
                />
                <KpiCard
                    icon="⚠️"
                    label="Mora acumulada"
                    value={formatMoney(resumen?.total_mora)}
                    accent="slate"
                    subtitle="Recargos por cuotas vencidas"
                />
                {hayDeudasAnteriores && (
                    <KpiCard
                        icon="🗓️"
                        label="Deuda de años anteriores"
                        value={formatMoney(resumen?.total_anios_anteriores)}
                        accent="amber"
                        subtitle="Separada del año consultado"
                    />
                )}
            </div>

            {/* Distribución por curso */}
            {resumen?.distribucion_cursos?.length > 0 && (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                        Distribución por curso
                    </h3>
                    <div className="space-y-2">
                        {resumen.distribucion_cursos.slice(0, 8).map((c) => {
                            const max = resumen.distribucion_cursos[0]?.total || 1;
                            const pct = Math.max(4, (c.total / max) * 100);
                            return (
                                <div key={c.curso_id} className="flex items-center gap-3 text-sm">
                                    <span className="w-16 font-semibold text-gray-700 shrink-0">{c.curso_nombre}</span>
                                    <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden relative">
                                        <div
                                            className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded"
                                            style={{ width: `${pct}%` }}
                                        />
                                        <span className="absolute inset-0 flex items-center px-2 text-xs font-semibold text-gray-700">
                                            {c.estudiantes} estud.
                                        </span>
                                    </div>
                                    <span className="w-32 text-right font-bold text-rose-700 shrink-0">
                                        {formatMoney(c.total)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar estudiante</label>
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Nombre, apellido o curso..."
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Curso</label>
                    <select
                        value={filtroCurso}
                        onChange={(e) => setFiltroCurso(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <option value="">Todos los cursos</option>
                        {cursosUnicos.map((c) => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de deuda</label>
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <option value="todos">Todas</option>
                        <option value="academica">Solo académica</option>
                        <option value="inventario">Solo inventario</option>
                        <option value="mora">Solo con mora</option>
                    </select>
                </div>
            </div>

            {/* Totales filtrados */}
            <div className="flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-semibold">
                    Mostrando: <strong>{itemsFiltrados.length}</strong> estudiantes
                </span>
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-semibold">
                    Total filtrado: <strong>{formatMoney(totales.total)}</strong>
                </span>
                {totales.mora > 0 && (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">
                        Mora: <strong>{formatMoney(totales.mora)}</strong>
                    </span>
                )}
                {totalAniosAnterioresFiltrado > 0 && (
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-semibold">
                        Años anteriores: <strong>{formatMoney(totalAniosAnterioresFiltrado)}</strong>
                    </span>
                )}
            </div>

            {/* Tabla */}
            {itemsFiltrados.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-10 text-center">
                    <p className="text-4xl mb-2">🎉</p>
                    <p className="text-gray-700 font-semibold">No hay estudiantes en mora con estos filtros.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr className="text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                    <th className="px-3 py-3">Estudiante</th>
                                    <th className="px-3 py-3">Curso</th>
                                    <th className="px-3 py-3 text-right">Académica</th>
                                    <th className="px-3 py-3 text-right">Inventario</th>
                                    <th className="px-3 py-3 text-right">Mora</th>
                                    <th className="px-3 py-3 text-right">
                                        {hayDeudasAnteriores ? "Año consultado" : "Total"}
                                    </th>
                                    {hayDeudasAnteriores && (
                                        <th className="px-3 py-3 text-right">Años anteriores</th>
                                    )}
                                    <th className="px-3 py-3">Indicador</th>
                                    <th className="px-3 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {itemsFiltrados.map((i) => {
                                    const abierto = expandido === i.estudiante_id;
                                    const pct = (i.total / maxDeuda) * 100;
                                    return (
                                        <React.Fragment key={i.estudiante_id}>
                                            <tr
                                                className={`hover:bg-purple-50/40 cursor-pointer ${abierto ? "bg-purple-50" : ""}`}
                                                onClick={() => onToggleExpandido(i.estudiante_id)}
                                            >
                                                <td className="px-3 py-2 font-medium text-gray-800">
                                                    <div className="flex items-center gap-2">
                                                        {/* La fila entera abre con el mouse; este botón
                                                            también con el teclado. */}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onToggleExpandido(i.estudiante_id);
                                                            }}
                                                            aria-expanded={abierto}
                                                            aria-label={`${abierto ? "Ocultar" : "Ver"} detalle de ${i.apellido}, ${i.nombre}`}
                                                            className="rounded px-1 text-xs text-purple-600 hover:bg-purple-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                                                        >
                                                            {abierto ? "▼" : "▶"}
                                                        </button>
                                                        <div>
                                                            <p>{i.apellido}, {i.nombre}</p>
                                                            <div className="flex gap-1 mt-0.5">
                                                                {i.deuda_academica > 0 && <BadgeTipoDeuda tipo="academica" />}
                                                                {i.deuda_inventario > 0 && <BadgeTipoDeuda tipo="inventario" />}
                                                                {i.mora > 0 && <BadgeTipoDeuda tipo="mora" />}
                                                                {(i.deuda_anios_anteriores || []).some(
                                                                    (anio) => Number(anio?.total_deuda || 0) > 0,
                                                                ) && <BadgeTipoDeuda tipo="anteriores" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-gray-600">{i.curso_nombre}</td>
                                                <td className="px-3 py-2 text-right text-blue-700 font-semibold">
                                                    {i.deuda_academica > 0 ? formatMoney(i.deuda_academica) : "—"}
                                                </td>
                                                <td className="px-3 py-2 text-right text-amber-700 font-semibold">
                                                    {i.deuda_inventario > 0 ? formatMoney(i.deuda_inventario) : "—"}
                                                </td>
                                                <td className="px-3 py-2 text-right text-rose-700 font-semibold">
                                                    {i.mora > 0 ? formatMoney(i.mora) : "—"}
                                                </td>
                                                <td className="px-3 py-2 text-right text-rose-800 font-bold">
                                                    {formatMoney(i.total)}
                                                </td>
                                                {hayDeudasAnteriores && (
                                                    <td className="px-3 py-2 text-right text-orange-800 font-bold">
                                                        {(() => {
                                                            const totalAnterior = (i.deuda_anios_anteriores || []).reduce(
                                                                (total, anio) => total + Number(anio?.total_deuda || 0),
                                                                0,
                                                            );
                                                            return totalAnterior > 0 ? formatMoney(totalAnterior) : "—";
                                                        })()}
                                                    </td>
                                                )}
                                                <td className="px-3 py-2 min-w-[120px]">
                                                    <div className="h-2 bg-gray-100 rounded overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-rose-500 to-red-600"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onImprimirEstudiante(i);
                                                            }}
                                                            className="text-xs px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-800 text-white font-semibold whitespace-nowrap"
                                                        >
                                                            Imprimir
                                                        </button>
                                                        {puedeCobrar && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onCobrar(i);
                                                                }}
                                                                className="text-xs px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold whitespace-nowrap"
                                                            >
                                                                💰 Cobrar
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {abierto && (
                                                <tr className="bg-purple-50/30">
                                                    <td colSpan={hayDeudasAnteriores ? 9 : 8} className="px-6 py-4">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                            {/* Conceptos académicos */}
                                                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                                                                <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">
                                                                    🎓 Conceptos académicos
                                                                </h4>
                                                                {(i.conceptos || []).length === 0 ? (
                                                                    <p className="text-xs text-gray-500 italic">Sin deuda académica.</p>
                                                                ) : (
                                                                    <table className="w-full text-xs">
                                                                        <thead>
                                                                            <tr className="text-left text-gray-500">
                                                                                <th className="py-1">Concepto</th>
                                                                                <th className="py-1 text-center">Cuotas</th>
                                                                                <th className="py-1 text-right">Pagado</th>
                                                                                <th className="py-1 text-right">Mora</th>
                                                                                <th className="py-1 text-right">Debe</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {(i.conceptos || []).map((c, idx) => (
                                                                                <tr key={idx} className="border-t border-gray-100">
                                                                                    <td className="py-1 font-medium text-gray-800">
                                                                                        {c.concepto}
                                                                                        <span className="ml-1 text-[10px] text-gray-500">({c.tipo_cobro})</span>
                                                                                    </td>
                                                                                    <td className="py-1 text-center">{c.cuotas_vencidas || "—"}</td>
                                                                                    <td className="py-1 text-right text-emerald-700">{formatMoney(c.pagado)}</td>
                                                                                    <td className="py-1 text-right text-rose-700">{c.mora > 0 ? formatMoney(c.mora) : "—"}</td>
                                                                                    <td className="py-1 text-right text-rose-800 font-bold">{formatMoney(c.deuda)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                )}
                                                            </div>

                                                            {/* Ventas pendientes */}
                                                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                                                                <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">
                                                                    📦 Ventas / cargos pendientes
                                                                </h4>
                                                                {(i.ventas_pendientes || []).length === 0 ? (
                                                                    <p className="text-xs text-gray-500 italic">Sin cargos de inventario pendientes.</p>
                                                                ) : (
                                                                    <table className="w-full text-xs">
                                                                        <thead>
                                                                            <tr className="text-left text-gray-500">
                                                                                <th className="py-1">Venta</th>
                                                                                <th className="py-1">Fecha</th>
                                                                                <th className="py-1 text-right">Saldo</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {(i.ventas_pendientes || []).map((v) => (
                                                                                <tr key={v.venta_id} className="border-t border-gray-100">
                                                                                    <td className="py-1 font-mono text-gray-700">#{v.venta_id}</td>
                                                                                    <td className="py-1 text-gray-600">{v.fecha?.slice(0, 10) || "—"}</td>
                                                                                    <td className="py-1 text-right text-amber-700 font-bold">{formatMoney(v.saldo)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <DeudasAniosAnterioresView
                                                            deudasAnios={i.deuda_anios_anteriores}
                                                            formatearMonto={formatMoney}
                                                            className="mt-4"
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VistaCarteraVencida;
