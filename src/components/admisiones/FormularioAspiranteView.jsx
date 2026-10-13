import { TIPOS_DOCUMENTO_ESTUDIANTE } from "../../constants/documentosEstudiante";
import { CampoSelect, CampoTexto, Subtitulo } from "./CamposAdmision";

const OPCIONES_TIPO_DOCUMENTO = TIPOS_DOCUMENTO_ESTUDIANTE.map((tipo) => ({
  valor: tipo,
  etiqueta: tipo,
}));

const opcionesDeCursos = (cursos) =>
  cursos.map((curso) => ({
    valor: String(curso.id),
    etiqueta: curso.jornada ? `${curso.nombre} · ${curso.jornada}` : curso.nombre,
  }));

// Los datos del aspirante y la autorización de datos (Ley 1581 de 2012). Los
// usan "Nuevo aspirante" y la ficha. Solo presenta; no pide religión, estado
// civil de los padres ni nada que pueda discriminar.
export default function FormularioAspiranteView({ formulario, errores, cursos, deshabilitado, onCambiar }) {
  const comunes = { deshabilitado, onCambiar };

  return (
    <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
      <Subtitulo>Aspirante</Subtitulo>
      <CampoTexto campo="nombre" etiqueta="Nombre *" valor={formulario.nombre} error={errores.nombre} {...comunes} />
      <CampoTexto campo="apellido" etiqueta="Apellidos *" valor={formulario.apellido} error={errores.apellido} {...comunes} />
      <CampoSelect
        campo="tipo_documento"
        etiqueta="Tipo de documento"
        valor={formulario.tipo_documento}
        opciones={OPCIONES_TIPO_DOCUMENTO}
        vacio="Seleccione..."
        {...comunes}
      />
      <CampoTexto campo="documento_identidad" etiqueta="Número de documento" valor={formulario.documento_identidad} {...comunes} />
      <CampoTexto campo="fecha_nacimiento" etiqueta="Fecha de nacimiento" tipo="date" valor={formulario.fecha_nacimiento} {...comunes} />
      <CampoSelect
        campo="curso_id"
        etiqueta="Curso al que aspira"
        valor={formulario.curso_id}
        opciones={opcionesDeCursos(cursos)}
        vacio="Sin elegir"
        {...comunes}
      />

      <Subtitulo>Acudiente</Subtitulo>
      <CampoTexto campo="acudiente_nombre" etiqueta="Nombre del acudiente" valor={formulario.acudiente_nombre} {...comunes} />
      <CampoTexto campo="acudiente_parentesco" etiqueta="Parentesco" valor={formulario.acudiente_parentesco} {...comunes} />
      <CampoTexto campo="acudiente_telefono" etiqueta="Teléfono del acudiente" tipo="tel" valor={formulario.acudiente_telefono} {...comunes} />

      <fieldset className="rounded-lg border border-purple-200 bg-purple-50 p-4 md:col-span-2">
        <legend className="px-1 font-semibold text-purple-950">Autorización de datos</legend>
        <p className="text-sm text-purple-900">
          Los datos del aspirante y de su familia se usan solo para la admisión y, si se
          matricula, para su ficha de estudiante. Solo los ve el administrador del colegio.
          Mientras no esté matriculado, la familia puede pedir que se borren (Ley 1581 de
          2012).
        </p>
        <label className="mt-3 flex items-start gap-3 font-semibold text-gray-800">
          <input
            type="checkbox"
            checked={formulario.autoriza_datos}
            disabled={deshabilitado}
            onChange={(evento) => onCambiar("autoriza_datos", evento.target.checked)}
            aria-invalid={errores.autoriza_datos ? true : undefined}
            aria-describedby={errores.autoriza_datos ? "admision-autoriza_datos-error" : undefined}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>La familia autoriza el tratamiento de estos datos *</span>
        </label>
        {errores.autoriza_datos && (
          <p id="admision-autoriza_datos-error" className="mt-1 text-sm text-red-700">
            {errores.autoriza_datos}
          </p>
        )}
        <div className="mt-3">
          <CampoTexto
            campo="autoriza_nombre"
            etiqueta="Quién autoriza *"
            valor={formulario.autoriza_nombre}
            error={errores.autoriza_nombre}
            {...comunes}
          />
        </div>
      </fieldset>
    </div>
  );
}
