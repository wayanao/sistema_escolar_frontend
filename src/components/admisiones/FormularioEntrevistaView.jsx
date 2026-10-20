import { OPCIONES_PAZ_Y_SALVO } from "../../constants/documentosEstudiante";
import { CampoArea, CampoSelect, CampoTexto, Subtitulo } from "./CamposAdmision";

const OPCIONES_PAZ = OPCIONES_PAZ_Y_SALVO.map((opcion) => ({ valor: opcion, etiqueta: opcion }));

// La entrevista con la familia (paso E4). Estudios anteriores y ocupación de
// los padres salieron de la ficha del estudiante (decisión 6): al matricular
// se copian allá. Solo presenta.
//
// Desde el 2026-10-20 (a pedido del usuario), aquí solo queda quién, cuándo y
// quiénes asistieron. "Estudios anteriores" y lo de la familia van en las
// secciones que se abren y se cierran, con las preguntas del anexo (ver
// `FichaAdmisionView` y `CuestionarioAdmisionView`).
export default function FormularioEntrevistaView({ formulario, deshabilitado, onCambiar }) {
  const { texto } = camposDe({ formulario, deshabilitado, onCambiar });

  return (
    <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
      <Subtitulo>Entrevista</Subtitulo>
      {texto("fecha_entrevista", "Fecha de la entrevista", { tipo: "date" })}
      {texto("entrevistador", "Quién entrevistó")}
      {texto("asistentes", "Quiénes asistieron", { ancho: true })}
    </div>
  );
}

function camposDe({ formulario, deshabilitado, onCambiar }) {
  const comunes = { deshabilitado, onCambiar };
  return {
    texto: (campo, etiqueta, extra = {}) => (
      <CampoTexto campo={campo} etiqueta={etiqueta} valor={formulario[campo]} {...comunes} {...extra} />
    ),
    area: (campo, etiqueta) => (
      <CampoArea campo={campo} etiqueta={etiqueta} valor={formulario[campo]} {...comunes} />
    ),
    comunes,
  };
}

// El contenido de la sección "Estudios anteriores".
export function CamposEstudiosAnteriores({ formulario, deshabilitado, onCambiar }) {
  const { texto, area, comunes } = camposDe({ formulario, deshabilitado, onCambiar });

  return (
    <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
      {texto("colegio_anterior", "Colegio anterior", { ancho: true })}
      {texto("anio_cursado_anterior", "Año cursado")}
      {texto("pre_escolar_anterior", "Preescolar")}
      {texto("ebp_anterior", "EBP")}
      <CampoSelect
        campo="paz_salvo_anterior"
        etiqueta="Paz y salvo"
        valor={formulario.paz_salvo_anterior}
        opciones={OPCIONES_PAZ}
        vacio="Seleccione..."
        {...comunes}
      />
      {area("motivo_retiro_anterior", "Motivo del retiro")}
    </div>
  );
}

// Lo de la familia de la entrevista, al inicio de la sección "Familia".
export function CamposFamiliaEntrevista({ formulario, deshabilitado, onCambiar }) {
  const { texto, area } = camposDe({ formulario, deshabilitado, onCambiar });

  return (
    <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
      {texto("ocupacion_padre", "Ocupación del padre")}
      {texto("ocupacion_madre", "Ocupación de la madre")}
      {texto("vive_con", "Con quién vive el aspirante", { ancho: true })}
      {area("expectativas", "Por qué eligen el colegio y qué esperan")}
      {area("observaciones", "Observaciones de quien entrevista")}
    </div>
  );
}
