import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import VistaCarteraVencida from "../components/carteraTiposPago/VistaCarteraVencida";
import useCarteraVencida from "../hooks/carteraTiposPago/useCarteraVencida";
import { construirCsvCartera } from "../utils/carteraTiposPago/cartera";
import { nombreCompleto } from "../utils/carteraTiposPago/formatos";

function CarteraVencidaAdmin() {
    const navigate = useNavigate();
    const cartera = useCarteraVencida();
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
        anchor.download = `cartera_vencida_${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <VistaCarteraVencida
            {...cartera}
            expandido={expandido}
            reporteImpresion={reporteImpresion}
            onCerrarReporte={() => setReporteImpresion(null)}
            onActualizar={() => window.location.reload()}
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
