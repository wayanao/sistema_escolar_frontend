import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import api from "../utils/api";
import DocumentoImprimible from "./impresion/DocumentoImprimible";
import { obtenerPeriodoProfesor } from "../utils/periodoProfesor";

function Observaciones({ estudiante, asignacionId, periodo }) {
  const [conductual, setConductual] = useState("");
  const [cognitivo, setCognitivo] = useState("");
  const [lenguaje, setLenguaje] = useState("");
  const [vistaImpresion, setVistaImpresion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [estadoGuardado, setEstadoGuardado] = useState({
    cargando: true,
    guardado: false,
    modificado: false,
    guardadoEn: null,
  });

  const profesor = JSON.parse(localStorage.getItem("profesor") || "{}");
  const periodoActivo = parseInt(obtenerPeriodoProfesor(periodo || "1"), 10) || 1;

  useEffect(() => {
    let activo = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const cargarObservacion = async () => {
      const per = periodoActivo || periodo || 1;
      if (!estudiante?.estudiante_id || !asignacionId) {
        if (activo) {
          setEstadoGuardado({
            cargando: false,
            guardado: false,
            modificado: false,
            guardadoEn: null,
          });
        }
        return;
      }

      setConductual("");
      setCognitivo("");
      setLenguaje("");
      setEstadoGuardado({
        cargando: true,
        guardado: false,
        modificado: false,
        guardadoEn: null,
      });

      try {
        const res = await api.get(`/observaciones/${estudiante.estudiante_id}/${asignacionId}/${per}`, {
          signal: controller.signal,
        });
        if (!activo) return;

        if (res.status >= 200 && res.status < 300) {
          const data = res.data;
          if (data) {
            const conductualGuardado = data.conductual || "";
            const cognitivoGuardado = data.cognitivo || "";
            const lenguajeGuardado = data.lenguaje || "";
            const tieneObservacion = [conductualGuardado, cognitivoGuardado, lenguajeGuardado].some(
              (valor) => String(valor || "").trim().length > 0
            );

            setConductual(conductualGuardado);
            setCognitivo(cognitivoGuardado);
            setLenguaje(lenguajeGuardado);
            setEstadoGuardado({
              cargando: false,
              guardado: tieneObservacion,
              modificado: false,
              guardadoEn: null,
            });
            return;
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error cargando observación", error);
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (!activo) return;

      setEstadoGuardado({
        cargando: false,
        guardado: false,
        modificado: false,
        guardadoEn: null,
      });
    };
    cargarObservacion();

    return () => {
      activo = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [estudiante.estudiante_id, asignacionId, periodo, periodoActivo]);

  const marcarModificado = (setter) => (valor) => {
    setter(valor);
    setEstadoGuardado((prev) => ({
      ...prev,
      modificado: true,
    }));
  };

  const obtenerEstadoVisual = () => {
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
    const valores = {
      conductual: conductual.trim(),
      cognitivo: cognitivo.trim(),
      lenguaje: lenguaje.trim(),
    };
    const dimensionesDiligenciadas = Object.values(valores).filter(Boolean).length;

    if (dimensionesDiligenciadas === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Escribe una observación",
        text: "Puedes guardar una sola dimensión, pero al menos una debe tener contenido.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#6d28d9",
      });
      return;
    }

    setGuardando(true);
    try {
      const res = await api.post(`/observaciones`, {
        estudiante_id: estudiante.estudiante_id,
        asignacion_id: parseInt(asignacionId),
        periodo: periodoActivo,
        ...valores,
      });
      if (!(res.status >= 200 && res.status < 300)) {
        throw new Error("El servidor no confirmó el guardado.");
      }

      setConductual(valores.conductual);
      setCognitivo(valores.cognitivo);
      setLenguaje(valores.lenguaje);
      setEstadoGuardado({
        cargando: false,
        guardado: true,
        modificado: false,
        guardadoEn: new Date().toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      await Swal.fire({
        icon: "success",
        title: "Observación guardada",
        text: `Se guardaron ${dimensionesDiligenciadas} de 3 dimensiones para ${estudiante.nombre} ${estudiante.apellido}.`,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#6d28d9",
      });
    } catch (err) {
      console.error(err);
      const detalle = err.response?.data?.detail;
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: typeof detalle === "string" ? detalle : "Revisa la conexión e intenta nuevamente.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#6d28d9",
      });
    } finally {
      setGuardando(false);
    }
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
      <div className="fixed inset-0 bg-slate-100 z-50 overflow-auto">
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
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mt-4">
      <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold text-gray-900">
            {estudiante.nombre} {estudiante.apellido} (Período {periodoActivo})
          </h3>
          <p className="mt-1 text-xs font-medium text-gray-500">{estadoVisual.detail}</p>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${estadoVisual.badgeClass}`}>
          <span className={`h-2 w-2 rounded-full ${estadoVisual.dotClass}`} aria-hidden="true"></span>
          {estadoVisual.label}
        </span>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dimensión Conductual / Disciplinario</label>
          <textarea
            placeholder="Observaciones sobre el comportamiento del estudiante..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="3"
            value={conductual}
            disabled={guardando}
            onChange={(e) => marcarModificado(setConductual)(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dimensión Cognitiva</label>
          <textarea
            placeholder="Observaciones sobre el desarrollo cognitivo..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="3"
            value={cognitivo}
            disabled={guardando}
            onChange={(e) => marcarModificado(setCognitivo)(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dimensión del Lenguaje</label>
          <textarea
            placeholder="Observaciones sobre el desarrollo del lenguaje..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="3"
            value={lenguaje}
            disabled={guardando}
            onChange={(e) => marcarModificado(setLenguaje)(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando || estadoGuardado.cargando}
          className="inline-flex min-w-44 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
        >
          {guardando && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
          )}
          {guardando ? "Guardando..." : estadoVisual.buttonText}
        </button>

        <button
          type="button"
          onClick={() => setVistaImpresion(true)}
          disabled={guardando}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Imprimir Reporte
        </button>
      </div>
    </div>
  );
}

export default Observaciones;
