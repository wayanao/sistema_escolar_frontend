import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  MEDIOS_PAGO_INGRESO,
  montoIngresoPorMedio,
  montoVisibleIngreso,
  montoVisibleMetodoPago,
  obtenerMediosPago,
} from "../utils/reportesMediosPago";

const hoyISO = () => new Date().toISOString().split("T")[0];

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const nombreMes = (mes) =>
  new Date(`${mes}-01`).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
  });

const finDeMesISO = (mes) => {
  const [year, month] = mes.split("-").map(Number);
  const ultimoDia = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
};

const normalizarLista = (response) => (Array.isArray(response) ? response : response?.items || []);

function ReportesAdmin() {
  const navigate = useNavigate();
  const [reporteGeneral, setReporteGeneral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [detalleTipo, setDetalleTipo] = useState(null);
  const [detalleTitulo, setDetalleTitulo] = useState("");
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [fechaFin, setFechaFin] = useState(hoyISO());
  const [rangoActivo, setRangoActivo] = useState({ inicio: hoyISO(), fin: hoyISO() });
  const [filtroMedioIngreso, setFiltroMedioIngreso] = useState("todos");
  const detalleRef = useRef(null);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  const cargarDatosIniciales = useCallback(async () => {
    try {
      setLoading(true);
      const reporteRes = await api.get("/reportes/general");
      setReporteGeneral(reporteRes.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error al cargar datos del reporte");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  useEffect(() => {
    const refrescarAlVolver = () => {
      if (document.visibilityState === "visible") {
        cargarDatosIniciales();
      }
    };

    document.addEventListener("visibilitychange", refrescarAlVolver);
    return () => document.removeEventListener("visibilitychange", refrescarAlVolver);
  }, [cargarDatosIniciales]);

  useEffect(() => {
    if (!detalle) return;

    requestAnimationFrame(() => {
      detalleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [detalle, detalleTipo]);

  const cargarDetalle = async ({ tipo, inicio, fin, titulo }) => {
    if (!inicio || !fin) {
      alert("Selecciona fecha de inicio y fin");
      return;
    }

    if (inicio > fin) {
      alert("La fecha de inicio no puede ser mayor a la fecha de fin");
      return;
    }

    try {
      setLoadingDetalle(true);
      const endpoint = tipo === "egresos" ? "/reportes/egresos-rango" : "/reportes/ingresos-rango";
      const res = await api.get(endpoint, { params: { inicio, fin } });
      setDetalle(normalizarLista(res.data));
      setDetalleTipo(tipo);
      setDetalleTitulo(titulo || `${inicio} a ${fin}`);
      setRangoActivo({ inicio, fin });
      if (tipo === "ingresos") setFiltroMedioIngreso("todos");
    } catch (error) {
      console.error("Error cargando detalle:", error);
      alert("Error al cargar el detalle seleccionado");
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cargarDetalleMes = async (tipo, mes) => {
    const inicioMes = `${mes}-01`;
    const finMes = finDeMesISO(mes);

    if (tipo === "ingresos") {
      try {
        setLoadingDetalle(true);
        const res = await api.get(`/reportes/ingresos-mes/${mes}`);
        setDetalle(normalizarLista(res.data));
        setDetalleTipo("ingresos");
        setDetalleTitulo(nombreMes(mes));
        setRangoActivo({ inicio: inicioMes, fin: finMes });
        setFiltroMedioIngreso("todos");
      } catch (error) {
        console.error("Error cargando ingresos del mes:", error);
        alert("Error al cargar detalle del mes");
      } finally {
        setLoadingDetalle(false);
      }
      return;
    }

    await cargarDetalle({
      tipo: "egresos",
      inicio: inicioMes,
      fin: finMes,
      titulo: nombreMes(mes),
    });
  };

  const stats = reporteGeneral?.estadisticas_generales || {};
  const ingresosMensuales = useMemo(
    () => reporteGeneral?.ingresos_mensuales || [],
    [reporteGeneral]
  );
  const egresosMensuales = useMemo(
    () => reporteGeneral?.egresos_mensuales || [],
    [reporteGeneral]
  );

  const egresosPorMes = useMemo(
    () => new Map(egresosMensuales.map((item) => [item.mes, Number(item.total || 0)])),
    [egresosMensuales]
  );

  const mesesFinancieros = useMemo(() => {
    const meses = new Set([
      ...ingresosMensuales.map((item) => item.mes),
      ...egresosMensuales.map((item) => item.mes),
    ]);

    return Array.from(meses)
      .sort()
      .reverse()
      .map((mes) => {
        const ingreso = Number(ingresosMensuales.find((item) => item.mes === mes)?.total || 0);
        const egreso = egresosPorMes.get(mes) || 0;
        return {
          mes,
          ingreso,
          egreso,
          balance: ingreso - egreso,
          maximo: Math.max(ingreso, egreso, 1),
        };
      });
  }, [egresosMensuales, egresosPorMes, ingresosMensuales]);

  const detalleIngresos = useMemo(
    () => (detalleTipo === "ingresos" && Array.isArray(detalle) ? detalle : []),
    [detalle, detalleTipo]
  );
  const detalleEgresos = useMemo(
    () => (detalleTipo === "egresos" && Array.isArray(detalle) ? detalle : []),
    [detalle, detalleTipo]
  );
  const detalleIngresosFiltrados = useMemo(() => {
    if (filtroMedioIngreso === "todos") return detalleIngresos;
    return detalleIngresos.filter((pago) =>
      obtenerMediosPago(pago).some((medio) => medio.key === filtroMedioIngreso)
    );
  }, [detalleIngresos, filtroMedioIngreso]);
  const totalDetalleIngresos = detalleIngresosFiltrados.reduce(
    (sum, pago) => sum + montoIngresoPorMedio(pago, filtroMedioIngreso),
    0
  );
  const totalDetalleEgresos = detalleEgresos.reduce((sum, egreso) => sum + Number(egreso.monto || 0), 0);

  if (!usuario || usuario.rol !== "admin") {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Estadísticas</h1>
          <p className="mt-1 text-sm text-gray-600">Panel financiero y operativo del colegio</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={cargarDatosIniciales}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            Actualizar
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() =>
            cargarDetalle({
              tipo: "ingresos",
              inicio: hoyISO(),
              fin: hoyISO(),
              titulo: "Ingresos de hoy",
            })
          }
          className="rounded-lg border border-green-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-green-400 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700">Ingresos hoy</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatoMoneda(stats.ingresos_hoy)}</p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">ING</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            cargarDetalle({
              tipo: "egresos",
              inicio: hoyISO(),
              fin: hoyISO(),
              titulo: "Egresos de hoy",
            })
          }
          className="rounded-lg border border-red-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-400 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700">Egresos hoy</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatoMoneda(stats.egresos_hoy)}</p>
            </div>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">EGR</span>
          </div>
        </button>

        <div className="rounded-lg border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Balance hoy</p>
              <p className={`mt-2 text-2xl font-bold ${Number(stats.balance_hoy || 0) < 0 ? "text-red-700" : "text-gray-900"}`}>
                {formatoMoneda(stats.balance_hoy)}
              </p>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">BAL</span>
          </div>
        </div>

        <div className="rounded-lg border border-purple-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700">Balance general</p>
              <p className={`mt-2 text-2xl font-bold ${Number(stats.balance_general || 0) < 0 ? "text-red-700" : "text-gray-900"}`}>
                {formatoMoneda(stats.balance_general)}
              </p>
            </div>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">GEN</span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Estudiantes</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total_estudiantes || 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Profesores</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total_profesores || 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Ingresos acumulados</p>
          <p className="mt-1 text-xl font-bold text-green-700">{formatoMoneda(stats.total_ingresos)}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            cargarDetalle({
              tipo: "egresos",
              inicio: rangoActivo.inicio,
              fin: rangoActivo.fin,
              titulo: `${rangoActivo.inicio} a ${rangoActivo.fin}`,
            })
          }
          className="rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-red-300 hover:bg-red-50"
        >
          <p className="text-xs font-semibold uppercase text-gray-500">Egresos acumulados</p>
          <p className="mt-1 text-xl font-bold text-red-700">{formatoMoneda(stats.total_egresos)}</p>
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Movimiento mensual</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Últimos meses</span>
          </div>
          <div className="space-y-4">
            {mesesFinancieros.map((item) => (
              <div key={item.mes} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => cargarDetalleMes("ingresos", item.mes)}
                    className="text-left text-sm font-bold capitalize text-purple-700 hover:text-purple-900"
                  >
                    {nombreMes(item.mes)}
                  </button>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => cargarDetalleMes("ingresos", item.mes)}
                      className="rounded bg-green-100 px-2 py-1 text-green-700 hover:bg-green-200"
                    >
                      {formatoMoneda(item.ingreso)}
                    </button>
                    <button
                      type="button"
                      onClick={() => cargarDetalleMes("egresos", item.mes)}
                      className="rounded bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200"
                    >
                      {formatoMoneda(item.egreso)}
                    </button>
                    <span className={`rounded px-2 py-1 ${item.balance < 0 ? "bg-red-50 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                      {formatoMoneda(item.balance)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${Math.max((item.ingreso / item.maximo) * 100, item.ingreso ? 6 : 0)}%` }}
                    ></div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-red-500"
                      style={{ width: `${Math.max((item.egreso / item.maximo) * 100, item.egreso ? 6 : 0)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {mesesFinancieros.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500">No hay movimientos registrados.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Rango de fechas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Desde</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Hasta</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setDetalleTipo("ingresos");
                cargarDetalle({ tipo: "ingresos", inicio: fechaInicio, fin: fechaFin, titulo: `${fechaInicio} a ${fechaFin}` });
              }}
              disabled={loadingDetalle}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              Ingresos
            </button>
            <button
              type="button"
              onClick={() => {
                setDetalleTipo("egresos");
                cargarDetalle({ tipo: "egresos", inicio: fechaInicio, fin: fechaFin, titulo: `${fechaInicio} a ${fechaFin}` });
              }}
              disabled={loadingDetalle}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              Egresos
            </button>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold text-gray-700">Estudiantes por curso</h3>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {(reporteGeneral?.estudiantes_por_curso || []).map((item) => (
                <div key={item.curso} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-gray-800">{item.curso}</span>
                  <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700">
                    {item.cantidad}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {detalle && (
        <div
          ref={detalleRef}
          className={`scroll-mt-6 rounded-lg border bg-white p-5 shadow-sm ${detalleTipo === "egresos" ? "border-red-200" : "border-green-200"}`}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {detalleTipo === "egresos" ? "Detalle de egresos" : "Detalle de ingresos"}
              </h2>
              <p className="text-sm text-gray-600">{detalleTitulo}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {detalleTipo === "ingresos" && (
                <select
                  value={filtroMedioIngreso}
                  onChange={(event) => setFiltroMedioIngreso(event.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  title="Filtrar por medio de pago"
                >
                  {MEDIOS_PAGO_INGRESO.map((medio) => (
                    <option key={medio.value} value={medio.value}>
                      {medio.label}
                    </option>
                  ))}
                </select>
              )}
              <span className={`rounded-lg px-3 py-2 text-sm font-bold ${detalleTipo === "egresos" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                {formatoMoneda(detalleTipo === "egresos" ? totalDetalleEgresos : totalDetalleIngresos)}
              </span>
              <button
                type="button"
                onClick={() => setDetalle(null)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cerrar
              </button>
            </div>
          </div>

          {loadingDetalle ? (
            <div className="py-8 text-center text-sm text-gray-500">Cargando detalle...</div>
          ) : detalleTipo === "egresos" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Concepto</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Categoría</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Origen</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {detalleEgresos.map((egreso) => (
                    <tr key={egreso.id} className="hover:bg-red-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{egreso.fecha}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        <div>{egreso.concepto}</div>
                        {egreso.notas && <div className="mt-1 text-xs font-normal text-gray-500">{egreso.notas}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{egreso.categoria}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-600">{egreso.origen}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-red-700">
                        {formatoMoneda(egreso.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {detalleEgresos.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No hay egresos en este rango.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Estudiante</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Medio de pago</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {detalleIngresosFiltrados.map((pago) => (
                    <tr key={pago.id} className={pago.anulado ? "bg-red-50 hover:bg-red-100" : "hover:bg-green-50"}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{pago.fecha}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{pago.estudiante}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>{pago.descripcion}</div>
                        {pago.anulado && pago.motivo_anulacion && (
                          <div className="mt-1 text-xs text-red-700">Motivo: {pago.motivo_anulacion}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-wrap gap-1.5">
                          {obtenerMediosPago(pago).map((medio, index) => {
                            const montoMetodo = montoVisibleMetodoPago(pago, medio, filtroMedioIngreso);
                            return (
                              <span
                                key={`${medio.tipo}-${index}`}
                                className="rounded-full bg-blue-100 px-2 py-1 font-bold text-blue-700"
                              >
                                {medio.tipo}
                                {montoMetodo !== null ? ` ${formatoMoneda(montoMetodo)}` : ""}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`rounded-full px-2 py-1 font-bold ${pago.anulado ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {pago.anulado ? "Anulado" : "Pagado"}
                        </span>
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-bold ${pago.anulado ? "text-red-600 line-through" : "text-green-700"}`}>
                        {formatoMoneda(montoVisibleIngreso(pago, filtroMedioIngreso))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {detalleIngresosFiltrados.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No hay ingresos para el medio de pago seleccionado.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReportesAdmin;
