import {
  TIPOS_DOCUMENTO_ACUDIENTE,
  TIPOS_DOCUMENTO_ESTUDIANTE,
} from "../../../constants/documentosEstudiante";
import {
  GRUPOS_SISBEN,
  NIVELES_SISBEN,
  OPCIONES_TIENE_SISBEN,
  SUBGRUPOS_SISBEN,
  ZONAS_RESIDENCIA,
} from "../../../constants/sisben";
import { actualizarCampoEstudiante } from "../../../utils/estudiantesObservador/estudiantes";
import SpinnerView from "../../anioLectivo/SpinnerView";

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
  // Lo que dice el botón mientras guarda (Estudiantes pasa "Creando
  // estudiante..." al crear). Sin él, "Guardando...", como siempre.
  textoGuardando = "Guardando...",
  // El título recibe el foco cuando la página lleva la pantalla a la ficha.
  tituloRef,
}) {
  if (!visible) return null;

  const actualizar = (campo, valor) => {
    setEstudianteData(actualizarCampoEstudiante(estudianteData, campo, valor));
  };
  const conSisben = estudianteData.sisben === "si";
  const subgrupos = SUBGRUPOS_SISBEN[estudianteData.sisben_grupo] ?? [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2
        ref={tituloRef}
        tabIndex={-1}
        className="text-xl font-semibold mb-4 text-left focus:outline-none"
      >
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
        {/* Lugar de residencia por partes (SISBEN_RESIDENCIA.md, paso S3).
            La dirección sigue en un área de texto: lo ya escrito en varias
            líneas no pierde sus saltos al guardar. */}
        <Seccion titulo="Lugar de residencia" />
        <Campo
          label="Dirección (calle o carrera y número)"
          htmlFor="estudiante-direccion"
          className="md:col-span-2"
        >
          <textarea
            id="estudiante-direccion"
            value={estudianteData.direccion ?? ""}
            onChange={(e) => actualizar("direccion", e.target.value)}
            className={inputClass}
            rows="2"
            maxLength={255}
            placeholder="Ej.: Calle 12 # 8-45"
          />
        </Campo>
        <Campo label="Barrio o vereda" htmlFor="estudiante-barrio">
          <input
            id="estudiante-barrio"
            type="text"
            value={estudianteData.barrio ?? ""}
            onChange={(e) => actualizar("barrio", e.target.value)}
            className={inputClass}
            maxLength={150}
          />
        </Campo>
        <Campo label="Municipio" htmlFor="estudiante-municipio">
          <input
            id="estudiante-municipio"
            type="text"
            value={estudianteData.municipio ?? ""}
            onChange={(e) => actualizar("municipio", e.target.value)}
            className={inputClass}
            maxLength={100}
          />
        </Campo>
        <Campo label="Zona" htmlFor="estudiante-zona_residencia">
          <select
            id="estudiante-zona_residencia"
            value={estudianteData.zona_residencia ?? ""}
            onChange={(e) => actualizar("zona_residencia", e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccione...</option>
            {ZONAS_RESIDENCIA.map(({ valor, etiqueta }) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Punto de referencia" htmlFor="estudiante-punto_referencia">
          <input
            id="estudiante-punto_referencia"
            type="text"
            value={estudianteData.punto_referencia ?? ""}
            onChange={(e) => actualizar("punto_referencia", e.target.value)}
            className={inputClass}
            maxLength={255}
            placeholder="Ej.: frente a la tienda La Esquina"
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
        {/* SISBÉN (SISBEN_RESIDENCIA.md, paso S3). La clasificación solo se
            pide si tiene SISBÉN; el backend vuelve a revisar todo. */}
        <Campo label="¿Tiene SISBÉN?" htmlFor="estudiante-sisben">
          <select
            id="estudiante-sisben"
            value={estudianteData.sisben ?? ""}
            onChange={(e) => actualizar("sisben", e.target.value)}
            className={inputClass}
          >
            {OPCIONES_TIENE_SISBEN.map(({ valor, etiqueta }) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        {conSisben && (
          <>
            <Campo label="Grupo del SISBÉN IV" htmlFor="estudiante-sisben_grupo">
              <select
                id="estudiante-sisben_grupo"
                value={estudianteData.sisben_grupo ?? ""}
                onChange={(e) => actualizar("sisben_grupo", e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccione...</option>
                {GRUPOS_SISBEN.map(({ valor, etiqueta }) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Subgrupo del SISBÉN IV" htmlFor="estudiante-sisben_subgrupo">
              <select
                id="estudiante-sisben_subgrupo"
                value={estudianteData.sisben_subgrupo ?? ""}
                onChange={(e) => actualizar("sisben_subgrupo", e.target.value)}
                className={inputClass}
                disabled={subgrupos.length === 0}
              >
                <option value="">
                  {subgrupos.length === 0 ? "Primero elige el grupo" : "Seleccione..."}
                </option>
                {subgrupos.map((subgrupo) => (
                  <option key={subgrupo} value={subgrupo}>
                    {subgrupo}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo
              label="Nivel del SISBÉN III (si aplica)"
              htmlFor="estudiante-sisben_nivel"
            >
              <select
                id="estudiante-sisben_nivel"
                value={estudianteData.sisben_nivel ?? ""}
                onChange={(e) => actualizar("sisben_nivel", e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccione...</option>
                {NIVELES_SISBEN.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
            </Campo>
          </>
        )}
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

        {/* Sin "Estudios Anteriores" ni la ocupación del padre y de la madre
            (2026-10-13, entrevista de admisión, paso E6): solo sirven para
            admitir y pasaron a la entrevista; al matricular se copian aquí.
            Los campos siguen en el cuerpo: vacíos al crear y, al editar, lo
            que ya tenía. Se ven en la ficha, en "Datos de admisión". */}
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
            {TIPOS_DOCUMENTO_ACUDIENTE.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
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
        <Campo label="Teléfono del Padre">
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
            {TIPOS_DOCUMENTO_ACUDIENTE.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
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
        <Campo label="Teléfono de la Madre">
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
            className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:cursor-wait disabled:opacity-75"
          >
            {guardando ? (
              <>
                <SpinnerView />
                {textoGuardando}
              </>
            ) : (
              textoBoton ??
              (editingId !== null ? "Actualizar Estudiante" : "Crear Estudiante")
            )}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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

function Campo({ label, htmlFor, className = "", children }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
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
