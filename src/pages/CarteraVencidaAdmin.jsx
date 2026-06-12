/**
 * CarteraVencidaAdmin
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

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import DocumentoImprimible from "../components/impresion/DocumentoImprimible";

const formatMoney = (v) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(Number(v || 0));

const formatDate = (value) => {
    if (!value) return "—";
    const fecha = new Date(value);
    if (Number.isNaN(fecha.getTime())) return String(value).slice(0, 10);
    return fecha.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
};

const nombreCompleto = (item) =>
    `${item?.apellido || ""} ${item?.nombre || ""}`.trim().replace(/\s+/g, " ");

const calcularTotalesCartera = (lista) =>
    lista.reduce(
        (acc, item) => ({
            total: acc.total + Number(item.total || 0),
            academica: acc.academica + Number(item.deuda_academica || 0),
            inventario: acc.inventario + Number(item.deuda_inventario || 0),
            mora: acc.mora + Number(item.mora || 0),
            cuotas: acc.cuotas + Number(item.cuotas_vencidas || 0),
        }),
        { total: 0, academica: 0, inventario: 0, mora: 0, cuotas: 0 }
    );

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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <DatoResumen label="Académica" value={formatMoney(item.deuda_academica)} />
                    <DatoResumen label="Inventario" value={formatMoney(item.deuda_inventario)} />
                    <DatoResumen label="Mora" value={formatMoney(item.mora)} />
                    <DatoResumen label="Cuotas vencidas" value={item.cuotas_vencidas || 0} accent />
                </div>

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
        purple: "from-purple-600 to-indigo-600",
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
    };
    const meta = map[tipo] || map.academica;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}>
            {meta.label}
        </span>
    );
}

function CarteraVencidaAdmin() {
    const navigate = useNavigate();
    const [resumen, setResumen] = useState(null);
    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtroCurso, setFiltroCurso] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("todos"); // todos | academica | inventario | mora
    const [expandido, setExpandido] = useState(null);
    const [reporteImpresion, setReporteImpresion] = useState(null);

    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            try {
                const [resResumen, resLista] = await Promise.all([
                    api.get("/cartera/mora/resumen"),
                    api.get("/cartera/mora"),
                ]);
                setResumen(resResumen.data);
                setItems(resLista.data || []);
            } catch (e) {
                console.error("Error cargando cartera vencida:", e);
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, []);

    const cursosUnicos = useMemo(() => {
        const map = new Map();
        items.forEach((i) => map.set(i.curso_id, i.curso_nombre));
        return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
    }, [items]);

    const itemsFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return items.filter((i) => {
            if (filtroCurso && String(i.curso_id) !== String(filtroCurso)) return false;
            if (filtroTipo === "academica" && i.deuda_academica <= 0) return false;
            if (filtroTipo === "inventario" && i.deuda_inventario <= 0) return false;
            if (filtroTipo === "mora" && i.mora <= 0) return false;
            if (q) {
                const txt = `${i.nombre} ${i.apellido} ${i.curso_nombre}`.toLowerCase();
                if (!txt.includes(q)) return false;
            }
            return true;
        });
    }, [items, busqueda, filtroCurso, filtroTipo]);

    const totales = useMemo(() => {
        return itemsFiltrados.reduce(
            (acc, i) => ({
                total: acc.total + i.total,
                academica: acc.academica + i.deuda_academica,
                inventario: acc.inventario + i.deuda_inventario,
                mora: acc.mora + i.mora,
            }),
            { total: 0, academica: 0, inventario: 0, mora: 0 }
        );
    }, [itemsFiltrados]);

    const maxDeuda = useMemo(
        () => Math.max(...itemsFiltrados.map((i) => i.total), 1),
        [itemsFiltrados]
    );

    const cursoSeleccionado = useMemo(() => {
        if (!filtroCurso) return null;
        return cursosUnicos.find((curso) => String(curso.id) === String(filtroCurso)) || null;
    }, [cursosUnicos, filtroCurso]);

    const fechaCorte = useMemo(
        () =>
            new Date().toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric",
            }),
        []
    );

    const abrirReporteEstudiante = (item) => {
        setReporteImpresion({
            tipo: "estudiante",
            nombre: nombreCompleto(item),
            fechaCorte,
            items: [item],
        });
    };

    const abrirReporteCurso = () => {
        if (!cursoSeleccionado || itemsFiltrados.length === 0) return;
        setReporteImpresion({
            tipo: "curso",
            nombre: cursoSeleccionado.nombre,
            fechaCorte,
            items: itemsFiltrados,
        });
    };

    const exportarCSV = () => {
        const headers = [
            "Estudiante",
            "Curso",
            "Deuda Académica",
            "Deuda Inventario",
            "Mora",
            "Total",
            "Cuotas Vencidas",
        ];
        const lines = [headers.join(",")];
        itemsFiltrados.forEach((i) => {
            lines.push(
                [
                    `"${i.apellido} ${i.nombre}"`,
                    `"${i.curso_nombre}"`,
                    i.deuda_academica,
                    i.deuda_inventario,
                    i.mora,
                    i.total,
                    i.cuotas_vencidas,
                ].join(",")
            );
        });
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cartera_vencida_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (reporteImpresion) {
        return (
            <div className="bg-gray-100 min-h-screen py-10 px-4 md:px-8 relative">
                <div className="fixed bottom-6 left-6 no-print z-50">
                    <button
                        onClick={() => setReporteImpresion(null)}
                        className="bg-slate-800 text-white px-4 py-3 rounded-full shadow-xl hover:bg-slate-900 transition"
                        title="Volver"
                    >
                        Volver
                    </button>
                </div>

                <DocumentoImprimible
                    tipo="reporte_estudiante"
                    className={`di-documento--cartera di-documento--cartera-${reporteImpresion.tipo}`}
                    titulo="Estado de cuenta"
                    subtitulo={`${reporteImpresion.tipo === "curso" ? "Curso" : "Estudiante"}: ${reporteImpresion.nombre}`}
                >
                    <ReporteCarteraVencida reporte={reporteImpresion} />
                </DocumentoImprimible>
            </div>
        );
    }

    if (cargando) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide font-semibold text-purple-700">Cartera</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📂 Estado de cuenta</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Reporte consolidado de cuotas vencidas académicas y de inventario.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
                    >
                        ↻ Actualizar
                    </button>
                    <button
                        onClick={exportarCSV}
                        disabled={itemsFiltrados.length === 0}
                        className="px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium disabled:opacity-50"
                    >
                        ⬇ Exportar CSV
                    </button>
                    <button
                        onClick={abrirReporteCurso}
                        disabled={!cursoSeleccionado || itemsFiltrados.length === 0}
                        title={cursoSeleccionado ? "Imprimir estado de cuenta del curso seleccionado" : "Selecciona un curso para imprimir"}
                        className="px-3 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Imprimir curso
                    </button>
                </div>
            </div>

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
                                    <th className="px-3 py-3 text-right">Total</th>
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
                                                onClick={() => setExpandido(abierto ? null : i.estudiante_id)}
                                            >
                                                <td className="px-3 py-2 font-medium text-gray-800">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-purple-600 text-xs">{abierto ? "▼" : "▶"}</span>
                                                        <div>
                                                            <p>{i.apellido}, {i.nombre}</p>
                                                            <div className="flex gap-1 mt-0.5">
                                                                {i.deuda_academica > 0 && <BadgeTipoDeuda tipo="academica" />}
                                                                {i.deuda_inventario > 0 && <BadgeTipoDeuda tipo="inventario" />}
                                                                {i.mora > 0 && <BadgeTipoDeuda tipo="mora" />}
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
                                                                abrirReporteEstudiante(i);
                                                            }}
                                                            className="text-xs px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-800 text-white font-semibold whitespace-nowrap"
                                                        >
                                                            Imprimir
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/admin/pagos`, { state: { estudiante_id: i.estudiante_id } });
                                                            }}
                                                            className="text-xs px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold whitespace-nowrap"
                                                        >
                                                            💰 Cobrar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {abierto && (
                                                <tr className="bg-purple-50/30">
                                                    <td colSpan={8} className="px-6 py-4">
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

export default CarteraVencidaAdmin;
