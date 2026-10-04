import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import VistaCarteraVencida from "../components/carteraTiposPago/VistaCarteraVencida";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useCarteraVencida from "../hooks/carteraTiposPago/useCarteraVencida";
import { construirCsvCartera } from "../utils/carteraTiposPago/cartera";
import { nombreCompleto } from "../utils/carteraTiposPago/formatos";
import { fechaIsoColombia } from "../utils/fechaColombia";

function CarteraVencidaAdmin() {
    const navigate = useNavigate();
    const { parametros, permisos } = useAnioLectivo();
    const cartera = useCarteraVencida({ parametrosAnio: parametros });
    const [expandido, setExpandido] = useState(null);
    const [reporteImpresion, setReporteImpresion] = useState(null);

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
        if (!cartera.cursoSeleccionado || cartera.itemsFiltrados.length === 0) return;
        setReporteImpresion({
            tipo: "curso",
            nombre: cartera.cursoSeleccionado.nombre,
            fechaCorte,
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
        anchor.download = `cartera_vencida_${fechaIsoColombia()}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    // Mirando el año activo, "Actualizar" recarga la página, como siempre.
    // Mirando otro año, vuelve a pedir la cartera de ese año: recargar la página
    // volvería al año activo sin avisar.
    const actualizar = permisos.esAnioActivo
        ? () => window.location.reload()
        : cartera.recargar;

    // Pagos cobra siempre en el año activo: mirando otro año, "Cobrar" llevaría
    // la deuda de ese año al activo. Vuelve en la fase 5, con el selector "Año
    // del pago".
    const puedeCobrar = permisos.esAnioActivo;

    return (
        <VistaCarteraVencida
            {...cartera}
            puedeCobrar={puedeCobrar}
            expandido={expandido}
            reporteImpresion={reporteImpresion}
            onCerrarReporte={() => setReporteImpresion(null)}
            onActualizar={actualizar}
            onExportar={exportarCSV}
            onImprimirCurso={abrirReporteCurso}
            onImprimirEstudiante={abrirReporteEstudiante}
            onCobrar={(item) =>
                navigate("/admin/pagos", { state: { estudiante_id: item.estudiante_id } })
            }
            onToggleExpandido={(estudianteId) =>
                setExpandido((prev) => (prev === estudianteId ? null : estudianteId))
            }
        />
    );
}

export default CarteraVencidaAdmin;
