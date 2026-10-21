import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import VistaCarteraVencida from "../components/carteraTiposPago/VistaCarteraVencida";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useCarteraVencida from "../hooks/carteraTiposPago/useCarteraVencida";
import { construirCsvCartera } from "../utils/carteraTiposPago/cartera";
import { nombreCompleto } from "../utils/carteraTiposPago/formatos";
import { fechaIsoColombia } from "../utils/fechaColombia";

function CarteraVencidaAdmin() {
    const navigate = useNavigate();
    const { anioSeleccionado, parametros } = useAnioLectivo();
    const cartera = useCarteraVencida({ parametrosAnio: parametros });
    const [expandido, setExpandido] = useState(null);
    const [reporteImpresion, setReporteImpresion] = useState(null);
    // Dónde estaba la lista al abrir un impreso, para volver ahí con "Atrás".
    const posicionLista = useRef(0);
    const volviendoALaLista = useRef(false);

    const fechaCorte = useMemo(
        () =>
            new Date().toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric",
            }),
        []
    );

    // El impreso reemplaza la lista: se muestra desde arriba, y al cerrarlo la
    // lista vuelve a quedar donde estaba (en el estudiante que se imprimió).
    useEffect(() => {
        if (reporteImpresion) {
            window.scrollTo({ top: 0, behavior: "auto" });
        } else if (volviendoALaLista.current) {
            volviendoALaLista.current = false;
            window.scrollTo({ top: posicionLista.current, behavior: "auto" });
        }
    }, [reporteImpresion]);

    const abrirReporte = (reporte) => {
        posicionLista.current = window.scrollY;
        setReporteImpresion(reporte);
    };

    const cerrarReporte = () => {
        volviendoALaLista.current = true;
        setReporteImpresion(null);
    };

    const abrirReporteEstudiante = (item) => {
        abrirReporte({
            tipo: "estudiante",
            nombre: nombreCompleto(item),
            fechaCorte,
            anioLectivo: anioSeleccionado?.anio ?? null,
            items: [item],
        });
    };

    const abrirReporteCurso = () => {
        if (!cartera.cursoSeleccionado || cartera.itemsFiltrados.length === 0) return;
        abrirReporte({
            tipo: "curso",
            nombre: cartera.cursoSeleccionado.nombre,
            fechaCorte,
            anioLectivo: anioSeleccionado?.anio ?? null,
            items: cartera.itemsFiltrados,
        });
    };

    const exportarCSV = () => {
        const blob = new Blob([construirCsvCartera(cartera.itemsFiltrados)], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        const anioArchivo = anioSeleccionado?.anio
            ? `_${anioSeleccionado.anio}`
            : "";
        anchor.download = `cartera_vencida${anioArchivo}_${fechaIsoColombia()}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    // "Actualizar" vuelve a pedir la cartera del año que se mira, sin recargar
    // la página: se conservan los filtros y la fila abierta. Hasta el
    // 2026-10-21, en el año activo recargaba la página entera.
    return (
        <VistaCarteraVencida
            {...cartera}
            expandido={expandido}
            reporteImpresion={reporteImpresion}
            onCerrarReporte={cerrarReporte}
            onActualizar={cartera.recargar}
            onExportar={exportarCSV}
            onImprimirCurso={abrirReporteCurso}
            onImprimirEstudiante={abrirReporteEstudiante}
            onCobrar={(item) =>
                navigate("/admin/pagos", {
                    state: { estudiante_id: item.estudiante_id, ...parametros },
                })
            }
            onToggleExpandido={(estudianteId) =>
                setExpandido((prev) => (prev === estudianteId ? null : estudianteId))
            }
        />
    );
}

export default CarteraVencidaAdmin;
