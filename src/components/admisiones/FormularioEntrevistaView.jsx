import { OPCIONES_PAZ_Y_SALVO } from "../../constants/documentosEstudiante";
import { CampoArea, CampoSelect, CampoTexto, Subtitulo } from "./CamposAdmision";

const OPCIONES_PAZ = OPCIONES_PAZ_Y_SALVO.map((opcion) => ({ valor: opcion, etiqueta: opcion }));

// La entrevista con la familia (paso E4). Estudios anteriores y ocupación de
// los padres salieron de la ficha del estudiante (decisión 6): al matricular
// se copian allá. Solo presenta.
export default function FormularioEntrevistaView({ formulario, deshabilitado, onCambiar }) {
  const comunes = { deshabilitado, onCambiar };
  const texto = (campo, etiqueta, extra = {}) => (
    <CampoTexto campo={campo} etiqueta={etiqueta} valor={formulario[campo]} {...comunes} {...extra} />
  );
  const area = (campo, etiqueta) => (
    <CampoArea campo={campo} etiqueta={etiqueta} valor={formulario[campo]} {...comunes} />
  );

  return (
    <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
      <Subtitulo>Entrevista</Subtitulo>
      {texto("fecha_entrevista", "Fecha de la entrevista", { tipo: "date" })}
      {texto("entrevistador", "Quién entrevistó")}
      {texto("asistentes", "Quiénes asistieron", { ancho: true })}

      <Subtitulo>Estudios anteriores</Subtitulo>
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

      <Subtitulo>Familia</Subtitulo>
      {texto("ocupacion_padre", "Ocupación del padre")}
      {texto("ocupacion_madre", "Ocupación de la madre")}
      {texto("vive_con", "Con quién vive el aspirante", { ancho: true })}
      {area("expectativas", "Por qué eligen el colegio y qué esperan")}
      {area("observaciones", "Observaciones de quien entrevista")}
    </div>
  );
}
