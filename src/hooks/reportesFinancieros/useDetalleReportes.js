import { useEffect, useMemo, useRef, useState } from "react";
import { obtenerEgresosRango, obtenerIngresosMes, obtenerIngresosRango } from "../../services/reportesFinancierosApi";
import { normalizarLista } from "../../utils/reportesFinancieros/contratos";
import { finDeMesISO, hoyISO, nombreMes } from "../../utils/reportesFinancieros/formatos";
import { montoIngresoPorMedio, obtenerMediosPago } from "../../utils/reportesFinancieros/mediosPago";

export default function useDetalleReportes() {
  const [detalle, setDetalle] = useState(null);
  const [detalleTipo, setDetalleTipo] = useState(null);
  const [detalleTitulo, setDetalleTitulo] = useState("");
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [fechaFin, setFechaFin] = useState(hoyISO());
  const [rangoActivo, setRangoActivo] = useState({ inicio: hoyISO(), fin: hoyISO() });
  const [filtroMedioIngreso, setFiltroMedioIngreso] = useState("todos");
  const detalleRef = useRef(null);

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
      const datos =
        tipo === "egresos" ? await obtenerEgresosRango(inicio, fin) : await obtenerIngresosRango(inicio, fin);
      setDetalle(normalizarLista(datos));
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
        const datos = await obtenerIngresosMes(mes);
        setDetalle(normalizarLista(datos));
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

  return {
    detalle,
    setDetalle,
    detalleTipo,
    setDetalleTipo,
    detalleTitulo,
    loadingDetalle,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    rangoActivo,
    filtroMedioIngreso,
    setFiltroMedioIngreso,
    detalleRef,
    cargarDetalle,
    cargarDetalleMes,
    detalleEgresos,
    detalleIngresosFiltrados,
    totalDetalleIngresos,
    totalDetalleEgresos,
  };
}
