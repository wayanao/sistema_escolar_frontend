import ObservadorImprimible from "./ObservadorImprimible";
import useFirmasImpresionObservador from "../../hooks/observador/useFirmasImpresionObservador";

/**
 * El observador impreso con sus firmas guardadas (2026-11-18). Es un
 * **conector**: pide las firmas (`useFirmasImpresionObservador`) y se las pasa
 * a `ObservadorImprimible`, que sigue siendo presentacional.
 *
 * Solo se monta mientras se imprime, así que cada impreso pide las firmas de
 * nuevo. `conFirmaDirector` lo pone solo la ficha del admin: la firma de un
 * profesor solo la ve el admin, en los documentos que imprime el colegio
 * (`FIRMAS_BOLETIN.md`).
 */
export default function ImpresionObservador({
  estudianteId,
  parametrosAnio,
  conFirmaDirector = false,
  ...impreso
}) {
  const firmas = useFirmasImpresionObservador({
    estudianteId,
    periodo: impreso.periodo,
    parametrosAnio,
    conDirector: conFirmaDirector,
  });

  return <ObservadorImprimible {...impreso} {...firmas} />;
}
