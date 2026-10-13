import {
  OPCIONES_PAZ_Y_SALVO,
  TIPOS_DOCUMENTO_ESTUDIANTE,
} from "../../../constants/documentosEstudiante";

export default function FormularioEstudianteAdmin({
  visible,
  editingId,
  estudianteData,
  setEstudianteData,
  cursos,
  onSubmit,
  onCancelar,
  guardando = false,
  // Matricular desde una admisión (paso E5) usa esta misma ficha con otro
  // título y otro botón. Sin ellos, todo queda como siempre.
  titulo = null,
  textoBoton = null,
}) {
  if (!visible) return null;

  const actualizar = (campo, valor) => {
    setEstudianteData({ ...estudianteData, [campo]: valor });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-left">
        {titulo ??
          (editingId !== null
            ? "✏️ Editar Estudiante"
            : "🎓 Crear Nuevo Estudiante")}
      </h2>
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left"
      >
        <Campo label="Nombre *">
          <input
            type="text"
            value={estudianteData.nombre}
            onChange={(e) => actualizar("nombre", e.target.value)}
            className={inputClass}
            required
          />
        </Campo>
        <Campo label="Apellidos *">
          <input
            type="text"
            value={estudianteData.apellido}
            onChange={(e) => actualizar("apellido", e.target.value)}
            className={inputClass}
            required
          />
        </Campo>
        <Campo label="Tipo de Documento *">
          <select
            value={estudianteData.tipo_documento}
            onChange={(e) => actualizar("tipo_documento", e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Seleccione...</option>
            {TIPOS_DOCUMENTO_ESTUDIANTE.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Documento de Identidad *">
          <input
            type="text"
            value={estudianteData.documento_identidad}
            onChange={(e) => actualizar("documento_identidad", e.target.value)}
            className={inputClass}
            required
          />
        </Campo>
        <Campo label="Lugar de Expedición">
          <input
            type="text"
            value={estudianteData.lugar_expedicion}
            onChange={(e) => actualizar("lugar_expedicion", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Fecha de Nacimiento">
          <input
            type="date"
            value={estudianteData.fecha_nacimiento}
            onChange={(e) => actualizar("fecha_nacimiento", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Email">
          <input
            type="email"
            value={estudianteData.email}
            onChange={(e) => actualizar("email", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Teléfono">
          <input
            type="tel"
            value={estudianteData.telefono}
            onChange={(e) => actualizar("telefono", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Curso *">
          <select
            value={estudianteData.curso_id}
            onChange={(e) => actualizar("curso_id", e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Seleccionar curso</option>
            {cursos.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.nombre}
              </option>
            ))}
          </select>
        </Campo>
        {/* Sin "Descuento Matrícula" ni "Descuento Mensualidad" (2026-10-12):
            se guardaban en la ficha, pero ningún cobro los usa. El descuento
            de un estudiante se pone como valor personalizado (Pagos, o
            "Valores de pago" al matricular). Los campos siguen en el cuerpo:
            0 al crear y, al editar, el valor que ya tenía. */}
        <Campo label="Dirección" className="md:col-span-2">
          <textarea
            value={estudianteData.direccion}
            onChange={(e) => actualizar("direccion", e.target.value)}
            className={inputClass}
            rows="3"
          />
        </Campo>

        <Seccion titulo="Datos Adicionales y Médicos" />
        <Campo label="Afiliado a EPS">
          <input
            type="text"
            value={estudianteData.eps}
            onChange={(e) => actualizar("eps", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Estrato">
          <input
            type="text"
            value={estudianteData.estrato}
            onChange={(e) => actualizar("estrato", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Jornada">
          <input
            type="text"
            value={estudianteData.jornada}
            onChange={(e) => actualizar("jornada", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Datos Médicos / Alergias" className="md:col-span-2">
          <textarea
            value={estudianteData.datos_medicos}
            onChange={(e) => actualizar("datos_medicos", e.target.value)}
            className={inputClass}
            rows="2"
          />
        </Campo>

        <Seccion titulo="Estudios Anteriores" />
        <Campo label="Nombre Colegio Anterior" className="md:col-span-2">
          <input
            type="text"
            value={estudianteData.colegio_anterior}
            onChange={(e) => actualizar("colegio_anterior", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Año Cursado">
          <input
            type="text"
            value={estudianteData.anio_cursado_anterior}
            onChange={(e) => actualizar("anio_cursado_anterior", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Pre-escolar">
          <input
            type="text"
            value={estudianteData.pre_escolar_anterior}
            onChange={(e) => actualizar("pre_escolar_anterior", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="EBP">
          <input
            type="text"
            value={estudianteData.ebp_anterior}
            onChange={(e) => actualizar("ebp_anterior", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Paz y Salvo">
          <select
            value={estudianteData.paz_salvo_anterior}
            onChange={(e) => actualizar("paz_salvo_anterior", e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccione...</option>
            {OPCIONES_PAZ_Y_SALVO.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Motivo del Retiro" className="md:col-span-2">
          <input
            type="text"
            value={estudianteData.motivo_retiro_anterior}
            onChange={(e) => actualizar("motivo_retiro_anterior", e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Seccion titulo="Información Familiar" />
        <Campo label="Nombre del Padre">
          <input
            type="text"
            value={estudianteData.nombre_padre}
            onChange={(e) => actualizar("nombre_padre", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Tipo Documento (Padre)">
          <select
            value={estudianteData.tipo_documento_padre}
            onChange={(e) => actualizar("tipo_documento_padre", e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccione...</option>
            <option value="Cédula">Cédula</option>
            <option value="Cédula Extranjera">Cédula Extranjera</option>
          </select>
        </Campo>
        <Campo label="Documento (Padre)">
          <input
            type="text"
            value={estudianteData.documento_padre}
            onChange={(e) => actualizar("documento_padre", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Ocupación (Padre)">
          <input
            type="text"
            value={estudianteData.ocupacion_padre}
            onChange={(e) => actualizar("ocupacion_padre", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Teléfono del Padre" className="md:col-span-2">
          <input
            type="tel"
            value={estudianteData.telefono_padre}
            onChange={(e) => actualizar("telefono_padre", e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Campo label="Nombre de la Madre">
          <input
            type="text"
            value={estudianteData.nombre_madre}
            onChange={(e) => actualizar("nombre_madre", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Tipo Documento (Madre)">
          <select
            value={estudianteData.tipo_documento_madre}
            onChange={(e) => actualizar("tipo_documento_madre", e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccione...</option>
            <option value="Cédula">Cédula</option>
            <option value="Cédula Extranjera">Cédula Extranjera</option>
          </select>
        </Campo>
        <Campo label="Documento (Madre)">
          <input
            type="text"
            value={estudianteData.documento_madre}
            onChange={(e) => actualizar("documento_madre", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Ocupación (Madre)">
          <input
            type="text"
            value={estudianteData.ocupacion_madre}
            onChange={(e) => actualizar("ocupacion_madre", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Teléfono de la Madre" className="md:col-span-2">
          <input
            type="tel"
            value={estudianteData.telefono_madre}
            onChange={(e) => actualizar("telefono_madre", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo
          label="Contacto de Emergencia (Nombre y Teléfono)"
          className="md:col-span-2"
        >
          <input
            type="text"
            value={estudianteData.contacto_emergencia}
            onChange={(e) => actualizar("contacto_emergencia", e.target.value)}
            className={inputClass}
          />
        </Campo>

        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={guardando}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando
              ? "Guardando..."
              : textoBoton ??
                (editingId !== null
                  ? "Actualizar Estudiante"
                  : "Crear Estudiante")}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent";

function Campo({ label, className = "", children }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Seccion({ titulo }) {
  return (
    <div className="md:col-span-2 mt-4">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
        {titulo}
      </h3>
    </div>
  );
}
