import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import useCargaObservacionVisible from "../../hooks/estudiantesObservador/useCargaObservacionVisible";
import useObservacionEstudiante from "../../hooks/estudiantesObservador/useObservacionEstudiante";
import FormularioObservacionEstudiante from "./FormularioObservacionEstudiante";
import DocumentoImprimible from "../impresion/DocumentoImprimible";
import { obtenerPeriodoProfesor } from "../../utils/periodoProfesor";

function Observaciones({ estudiante, asignacionId, periodo }) {
  const [vistaImpresion, setVistaImpresion] = useState(false);
  const { elementoRef, habilitado, observar } =
    useCargaObservacionVisible();

  const profesor = JSON.parse(localStorage.getItem("profesor") || "{}");
  const periodoActivo = parseInt(obtenerPeriodoProfesor(periodo || "1"), 10) || 1;
  const {
    conductual,
    cognitivo,
    lenguaje,
    cambiarConductual,
    cambiarCognitivo,
    cambiarLenguaje,
    guardando,
    estadoGuardado,
    errorCarga,
    reintentar,
    guardar: guardarObservacionActual,
  } = useObservacionEstudiante({
    estudianteId: estudiante.estudiante_id,
    asignacionId,
    periodo: periodoActivo,
    habilitado,
  });

  useEffect(() => {
    observar();
  }, [observar]);

  useEffect(() => {
    if (errorCarga) console.error("Error cargando observación", errorCarga);
  }, [errorCarga]);

  const obtenerEstadoVisual = () => {
    if (errorCarga) {
      return {
        label: "No se pudo cargar",
        detail: "Reintenta la consulta antes de editar",
        badgeClass: "border-rose-200 bg-rose-50 text-rose-800",
        dotClass: "bg-rose-500",
        buttonText: "Guardar observación",
      };
    }

    if (estadoGuardado.cargando) {
      return {
        label: "Verificando",
        detail: "Consultando registro",
        badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
        dotClass: "bg-slate-400",
        buttonText: "Guardar Observación",
      };
    }

    if (estadoGuardado.modificado) {
      return {
        label: "Cambios sin guardar",
        detail: "Hay ediciones pendientes",
        badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
        dotClass: "bg-amber-500",
        buttonText: "Guardar cambios",
      };
    }

    if (estadoGuardado.guardado) {
      return {
        label: "Guardado",
        detail: estadoGuardado.guardadoEn ? `Actualizado ${estadoGuardado.guardadoEn}` : "Observador registrado",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
        dotClass: "bg-emerald-500",
        buttonText: "Actualizar observación",
      };
    }

    return {
      label: "Pendiente",
      detail: "Aún no se ha guardado",
      badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
      dotClass: "bg-slate-400",
      buttonText: "Guardar observación",
    };
  };

  const guardar = async () => {
    const resultado = await guardarObservacionActual();

    if (resultado.estado === "vacio") {
      await Swal.fire({
        icon: "warning",
        title: "Escribe una observación",
        text: "Puedes guardar una sola dimensión, pero al menos una debe tener contenido.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#6d28d9",
      });
      return;
    }

    if (resultado.estado === "exito") {
      await Swal.fire({
        icon: "success",
        title: "Observación guardada",
        text: `Se guardaron ${resultado.dimensionesDiligenciadas} de 3 dimensiones para ${estudiante.nombre} ${estudiante.apellido}.`,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#6d28d9",
      });
      return;
    }

    console.error(resultado.error);
    await Swal.fire({
      icon: "error",
      title: "No se pudo guardar",
      text: typeof resultado.detalle === "string" ? resultado.detalle : "Revisa la conexión e intenta nuevamente.",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#6d28d9",
    });
  };

  const firmas = [
    {
      nombre: `${profesor.nombre || ""} ${profesor.apellido || ""}`.trim() || "Profesor",
      cargo: "Firma del Profesor",
    },
    { nombre: "Acudiente", cargo: "Firma del Acudiente" },
  ];

  if (vistaImpresion) {
    return (
      <div ref={elementoRef} className="fixed inset-0 bg-slate-100 z-50 overflow-auto">
        <div className="fixed top-4 left-4 no-print z-[60]">
          <button
            onClick={() => setVistaImpresion(false)}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-900"
          >
            ← Volver
          </button>
        </div>
        <DocumentoImprimible
          tipo="observaciones"
          titulo="Reporte de Observaciones"
          subtitulo={`Estudiante: ${estudiante.nombre} ${estudiante.apellido} · Periodo ${periodo}`}
          firmas={firmas}
        >
          <div className="space-y-4">
            <section>
              <h3 className="font-bold uppercase text-sm tracking-wider text-slate-700 mb-2">
                Dimensión Conductual / Disciplinario
              </h3>
              <div className="border border-slate-300 rounded p-3 bg-slate-50 whitespace-pre-wrap text-sm min-h-[60px]">
                {conductual || "---"}
              </div>
            </section>
            <section>
              <h3 className="font-bold uppercase text-sm tracking-wider text-slate-700 mb-2">
                Dimensión Cognitiva
              </h3>
              <div className="border border-slate-300 rounded p-3 bg-slate-50 whitespace-pre-wrap text-sm min-h-[60px]">
                {cognitivo || "---"}
              </div>
            </section>
            <section>
              <h3 className="font-bold uppercase text-sm tracking-wider text-slate-700 mb-2">
                Dimensión del Lenguaje
              </h3>
              <div className="border border-slate-300 rounded p-3 bg-slate-50 whitespace-pre-wrap text-sm min-h-[60px]">
                {lenguaje || "---"}
              </div>
            </section>
          </div>
        </DocumentoImprimible>
      </div>
    );
  }

  const estadoVisual = obtenerEstadoVisual();

  return (
    <div ref={elementoRef}>
      <FormularioObservacionEstudiante
        estudiante={estudiante}
        periodo={periodoActivo}
        conductual={conductual}
        cognitivo={cognitivo}
        lenguaje={lenguaje}
        onCambiarConductual={cambiarConductual}
        onCambiarCognitivo={cambiarCognitivo}
        onCambiarLenguaje={cambiarLenguaje}
        guardando={guardando}
        estadoVisual={estadoVisual}
        cargando={estadoGuardado.cargando}
        errorCarga={errorCarga}
        onGuardar={guardar}
        onImprimir={() => setVistaImpresion(true)}
        onReintentar={reintentar}
      />
    </div>
  );
}

export default Observaciones;
