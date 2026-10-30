import { useState } from "react";
import ObservadorImprimible from "./ObservadorImprimible";
import VentanaFirmaAnotacion from "./VentanaFirmaAnotacion";
import VistaObservadorEstudiante from "./VistaObservadorEstudiante";
import useAnioLectivo from "../../hooks/anioLectivo/useAnioLectivo";
import useFirmaAnotacion from "../../hooks/observador/useFirmaAnotacion";
import useObservadorEstudiante, {
  ERROR_ESTUDIANTE_NO_EXISTE,
} from "../../hooks/observador/useObservadorEstudiante";
import {
  AGRUPACION_DIMENSION,
  PERIODO_TODOS,
  titularObservador,
} from "../../utils/observador/anotaciones";
import {
  anotacionesParaImprimir,
  OPCIONES_IMPRESION_ADMIN,
} from "../../utils/observador/impresion";

/**
 * El observador de un estudiante dentro de la ficha del admin.
 *
 * **Monta la misma vista que ve la profesora**, no una copia parecida: agrupada
 * por dimensión, con el color de cada profesor, el selector de periodo, el
 * cambio a vista por fecha y la impresión. Reutilizarla entera es lo único que
 * garantiza que el coordinador vea exactamente lo mismo; una segunda pantalla
 * acabaría diciendo otra cosa.
 *
 * Tres diferencias, todas porque **el admin no escribe**:
 *
 * - no hay «Nueva anotación» ni `[Editar]` -el servidor responde `403` a las
 *   dos cosas, y esto solo evita enseñar botones que no funcionarían-;
 * - solo puede imprimir el **documento general**: no tiene anotaciones propias,
 *   así que «Solo mis anotaciones» le saldría siempre en blanco;
 * - no hay «Volver a la lista» ni título: la ficha ya dice de quién es.
 *
 * Lo que sí puede es **tomar la firma del acudiente** (decisión 3 de
 * `docs/funcionalidades/FIRMA_OBSERVADOR.md`): firmar no cambia el texto de
 * nadie. El botón sale donde el servidor dice `puede_firmar`.
 *
 * Y una que no es de permisos: muestra la bitácora del año lectivo que mira el
 * admin (`useAnioLectivo`); la profesora ve siempre la del año activo.
 *
 * Es un **conector**: enlaza el hook con la vista y guarda el estado local de
 * la sección, como `NotificacionesPlaneadores` en su módulo.
 */
export default function ObservadorEnFichaAdmin({ estudiante }) {
  const [periodo, setPeriodo] = useState(PERIODO_TODOS);
  const [agrupacion, setAgrupacion] = useState(AGRUPACION_DIMENSION);
  const [imprimiendo, setImprimiendo] = useState(null);
  const { parametros } = useAnioLectivo();

  const { nivel, anotaciones, cargando, error, recargar } = useObservadorEstudiante({
    estudianteId: estudiante?.id,
    periodo,
    parametrosAnio: parametros,
  });

  const firma = useFirmaAnotacion({
    estudianteId: estudiante?.id,
    anotaciones,
    onFirmada: recargar,
  });

  const alumno = titularObservador({ ...estudiante, nivel });

  const mensajeError = error
    ? (error === ERROR_ESTUDIANTE_NO_EXISTE
      ? "No encontramos a ese estudiante."
      : "No se pudo consultar el observador. Intenta de nuevo.")
    : null;

  return imprimiendo ? (
    <ObservadorImprimible
      alumno={alumno}
      periodo={periodo}
      agrupacion={agrupacion}
      anotaciones={anotacionesParaImprimir(anotaciones, imprimiendo, null)}
      opcion={imprimiendo}
      profesor={null}
      onVolver={() => setImprimiendo(null)}
    />
  ) : (
    <div className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
            Observador
          </p>
          <h3 className="text-lg font-bold text-amber-900">
            Observaciones del estudiante
          </h3>
        </div>
        <span className="w-fit rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800">
          {anotaciones.length} {anotaciones.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-white p-3 sm:max-h-96">
        <VistaObservadorEstudiante
          periodo={periodo}
          onCambiarPeriodo={setPeriodo}
          agrupacion={agrupacion}
          onCambiarAgrupacion={setAgrupacion}
          onImprimir={setImprimiendo}
          opcionesImpresion={OPCIONES_IMPRESION_ADMIN}
          anotaciones={anotaciones}
          cargando={cargando}
          error={mensajeError}
          onReintentar={recargar}
          onFirmar={firma.abrir}
          onFirmarPeriodo={firma.abrirPeriodo}
        />
      </div>

      {firma.abierta && <VentanaFirmaAnotacion titulo={alumno} {...firma.propsVentana} />}
    </div>
  );
}
