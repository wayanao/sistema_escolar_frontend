import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const ESTADOS_ESTUDIANTE = [
  { value: "activo", label: "Activo" },
  { value: "retirado", label: "Retirado" },
  { value: "egresado", label: "Egresado" },
  { value: "inactivo", label: "Inactivo" },
];

const FILTROS_ESTUDIANTE = [
  ...ESTADOS_ESTUDIANTE,
  { value: "todos", label: "Todos" },
];

const estadoLabel = (estado) =>
  ESTADOS_ESTUDIANTE.find((item) => item.value === estado)?.label || "Activo";

const estadoClasses = {
  activo: "bg-green-100 text-green-800 border-green-200",
  retirado: "bg-yellow-100 text-yellow-800 border-yellow-200",
  egresado: "bg-blue-100 text-blue-800 border-blue-200",
  inactivo: "bg-gray-100 text-gray-700 border-gray-200",
};

function EstudiantesAdmin() {
  const navigate = useNavigate();
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [detallesEstudiante, setDetallesEstudiante] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState("activo");

  // Formulario de estudiante
  const [estudianteData, setEstudianteData] = useState({
    nombre: "",
    apellido: "",
    tipo_documento: "",
    documento_identidad: "",
    lugar_expedicion: "",
    fecha_nacimiento: "",
    direccion: "",
    telefono: "",
    email: "",
    curso_id: "",
    descuento_matricula: 0,
    descuento_mensualidad: 0,
    datos_medicos: "",
    eps: "",
    estrato: "",
    jornada: "",
    colegio_anterior: "",
    anio_cursado_anterior: "",
    pre_escolar_anterior: "",
    ebp_anterior: "",
    motivo_retiro_anterior: "",
    paz_salvo_anterior: "",
    nombre_padre: "",
    tipo_documento_padre: "",
    documento_padre: "",
    telefono_padre: "",
    ocupacion_padre: "",
    nombre_madre: "",
    tipo_documento_madre: "",
    documento_madre: "",
    telefono_madre: "",
    ocupacion_madre: "",
    contacto_emergencia: ""
  });

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [estRes, cursosRes] = await Promise.all([
        api.get(`/estudiantes`, { params: { estado: estadoFiltro } }),
        api.get(`/cursos`)
      ]);

      const estudiantesData = estRes.data;
      const cursosData = cursosRes.data;

      setEstudiantes(estudiantesData);
      setCursos(cursosData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [estadoFiltro]);

  useEffect(() => {
    if (usuario?.rol === "admin") {
      cargarDatos();
    }
  }, [cargarDatos, usuario?.rol]);

  if (!usuario || usuario.rol !== "admin") {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!estudianteData.nombre || !estudianteData.apellido || !estudianteData.curso_id) {
      alert("Completa los campos obligatorios");
      return;
    }

    const dataToSend = { ...estudianteData };
    // Limpiar strings vacíos para evitar errores de validación en backend
    Object.keys(dataToSend).forEach(key => {
      if (dataToSend[key] === "") {
        dataToSend[key] = null;
      }
    });

    try {
      const isEditing = editingId !== null;
      const endpoint = isEditing ? `/estudiantes/${editingId}` : "/estudiantes";
      const res = await (isEditing ? api.put(endpoint, dataToSend) : api.post(endpoint, dataToSend));

      if ((res.status >= 200 && res.status < 300)) {
        alert(isEditing ? "Estudiante actualizado correctamente" : "Estudiante creado correctamente");
        setEstudianteData({
          nombre: "",
          apellido: "",
          tipo_documento: "",
          documento_identidad: "",
          lugar_expedicion: "",
          fecha_nacimiento: "",
          direccion: "",
          telefono: "",
          email: "",
          curso_id: "",
          descuento_matricula: 0,
          descuento_mensualidad: 0,
          datos_medicos: "",
          eps: "",
          estrato: "",
          jornada: "",
          colegio_anterior: "",
          anio_cursado_anterior: "",
          pre_escolar_anterior: "",
          ebp_anterior: "",
          motivo_retiro_anterior: "",
          paz_salvo_anterior: "",
          nombre_padre: "",
          tipo_documento_padre: "",
          documento_padre: "",
          telefono_padre: "",
          ocupacion_padre: "",
          nombre_madre: "",
          tipo_documento_madre: "",
          documento_madre: "",
          telefono_madre: "",
          ocupacion_madre: "",
          contacto_emergencia: ""
        });
        setEditingId(null);
        setShowForm(false);
        cargarDatos();
      } else {
        alert(isEditing ? "Error al actualizar estudiante" : "Error al crear estudiante");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error en la operación del estudiante");
    }
  };

  const cargarEstudianteAEditar = async (id) => {
    try {
      const res = await api.get(`/estudiantes/${id}`);
      if ((res.status >= 200 && res.status < 300)) {
        const data = res.data;
        // Replace nulls with empty strings to avoid uncontrolled input issues
        const cleanData = {};
        Object.keys(data).forEach(key => {
          cleanData[key] = data[key] === null ? "" : data[key];
        });
        // Remove DB specific non-form fields just in case
        delete cleanData.id;
        delete cleanData.estado;
        delete cleanData.anio_escolar;

        setEstudianteData(cleanData);
        setEditingId(id);
        setShowForm(true);
      } else {
        alert("Error al obtener datos del estudiante");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión");
    }
  };

  const filteredEstudiantes = estudiantes.filter(estudiante =>
    estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estudiante.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estudiante.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estudiante.documento?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cambiarEstadoEstudiante = async (estudiante, nuevoEstado) => {
    const estadoActual = estudiante.estado || "activo";
    if (nuevoEstado === estadoActual) return;

    const accion = nuevoEstado === "activo"
      ? "reactivar"
      : `marcar como ${estadoLabel(nuevoEstado).toLowerCase()}`;

    if (!window.confirm(`¿Deseas ${accion} a ${estudiante.nombre} ${estudiante.apellido}?`)) {
      return;
    }

    try {
      const res = await api.patch(`/estudiantes/${estudiante.id}/estado`, {
        estado: nuevoEstado,
      });
      const estadoActualizado = res.data?.estado || nuevoEstado;

      setEstudiantes((actuales) =>
        actuales
          .map((item) =>
            item.id === estudiante.id
              ? { ...item, estado: estadoActualizado }
              : item
          )
          .filter((item) =>
            estadoFiltro === "todos" ? true : (item.estado || "activo") === estadoFiltro
          )
      );
      if (selectedEstudiante?.id === estudiante.id) {
        setSelectedEstudiante((actual) => ({
          ...actual,
          estado: estadoActualizado,
        }));
      }
    } catch (error) {
      console.error("Error cambiando estado:", error);
      alert("No se pudo cambiar el estado del estudiante");
    }
  };

  const verDetalles = async (estudiante) => {
    setSelectedEstudiante(estudiante);
    setLoadingDetalles(true);
    try {
      const [detallesRes, deudasRes] = await Promise.allSettled([
        api.get(`/estudiantes/${estudiante.id}/detalles`),
        api.get(`/estudiantes/${estudiante.id}/deudas`),
      ]);

      if (detallesRes.status === "rejected" && deudasRes.status === "rejected") {
        throw detallesRes.reason;
      }

      if (detallesRes.status === "rejected") {
        console.error("Error al cargar resumen academico del estudiante", detallesRes.reason);
      }
      if (deudasRes.status === "rejected") {
        console.error("Error al cargar deudas del estudiante", deudasRes.reason);
      }

      const detallesBase = detallesRes.status === "fulfilled" ? detallesRes.value.data : {};
      const deudasData = deudasRes.status === "fulfilled" ? deudasRes.value.data : {};
      const deudas = deudasData.deudas || detallesBase.deudas || [];

      setDetallesEstudiante({
        notas: [],
        promedio_general: 0,
        inasistencias: 0,
        observaciones: [],
        productos_inventario: [],
        ...detallesBase,
        deudas,
        total_deuda:
          deudasData.total_deuda ??
          detallesBase.total_deuda ??
          deudas.reduce((total, deuda) => total + Number(deuda.deuda || 0), 0),
      });
    } catch (error) {
      console.error("Error al cargar detalles", error);
    } finally {
      setLoadingDetalles(false);
    }
  };

  const cerrarModal = () => {
    setSelectedEstudiante(null);
    setDetallesEstudiante(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Estudiantes
        </h1>
        <p className="text-gray-600">
          Administra la información de los estudiantes del sistema
        </p>
      </div>

      {/* Barra de búsqueda y botón */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:max-w-2xl sm:flex-row">
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="w-full sm:w-44 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {FILTROS_ESTUDIANTE.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            if (showForm && editingId) {
              setEstudianteData({
                  nombre: "", apellido: "", tipo_documento: "", documento_identidad: "", lugar_expedicion: "", fecha_nacimiento: "",
                  direccion: "", telefono: "", email: "", curso_id: "", descuento_matricula: 0, descuento_mensualidad: 0, datos_medicos: "", eps: "", estrato: "", jornada: "", colegio_anterior: "", anio_cursado_anterior: "",
                  pre_escolar_anterior: "", ebp_anterior: "", motivo_retiro_anterior: "", paz_salvo_anterior: "", nombre_padre: "",
                  tipo_documento_padre: "", documento_padre: "", telefono_padre: "", ocupacion_padre: "", nombre_madre: "",
                  tipo_documento_madre: "", documento_madre: "", telefono_madre: "", ocupacion_madre: "", contacto_emergencia: ""
              });
              setEditingId(null);
            }
            setShowForm(!showForm);
          }}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
        >
          {showForm ? "Cancelar" : "Nuevo Estudiante"}
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-left">{editingId !== null ? '✏️ Editar Estudiante' : '🎓 Crear Nuevo Estudiante'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={estudianteData.nombre}
                onChange={(e) => setEstudianteData({ ...estudianteData, nombre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                value={estudianteData.apellido}
                onChange={(e) => setEstudianteData({ ...estudianteData, apellido: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento *
              </label>
              <select
                value={estudianteData.tipo_documento}
                onChange={(e) => setEstudianteData({ ...estudianteData, tipo_documento: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Seleccione...</option>
                <option value="Registro Civil">Registro Civil</option>
                <option value="Tarjeta de Identidad">Tarjeta de Identidad</option>
                <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
                <option value="Cédula de Extranjería">Cédula de Extranjería</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento de Identidad *
              </label>
              <input
                type="text"
                value={estudianteData.documento_identidad}
                onChange={(e) => setEstudianteData({ ...estudianteData, documento_identidad: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lugar de Expedición
              </label>
              <input
                type="text"
                value={estudianteData.lugar_expedicion}
                onChange={(e) => setEstudianteData({ ...estudianteData, lugar_expedicion: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={estudianteData.fecha_nacimiento}
                onChange={(e) => setEstudianteData({ ...estudianteData, fecha_nacimiento: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={estudianteData.email}
                onChange={(e) => setEstudianteData({ ...estudianteData, email: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={estudianteData.telefono}
                onChange={(e) => setEstudianteData({ ...estudianteData, telefono: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Curso *
              </label>
              <select
                value={estudianteData.curso_id}
                onChange={(e) => setEstudianteData({ ...estudianteData, curso_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar curso</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descuento Matrícula
              </label>
              <input
                type="number"
                step="0.01"
                value={estudianteData.descuento_matricula}
                onChange={(e) => setEstudianteData({ ...estudianteData, descuento_matricula: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descuento Mensualidad
              </label>
              <input
                type="number"
                step="0.01"
                value={estudianteData.descuento_mensualidad}
                onChange={(e) => setEstudianteData({ ...estudianteData, descuento_mensualidad: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <textarea
                value={estudianteData.direccion}
                onChange={(e) => setEstudianteData({ ...estudianteData, direccion: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
              />
            </div>
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Datos Adicionales y Médicos</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Afiliado a EPS
              </label>
              <input
                type="text"
                value={estudianteData.eps}
                onChange={(e) => setEstudianteData({ ...estudianteData, eps: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estrato
              </label>
              <input
                type="text"
                value={estudianteData.estrato}
                onChange={(e) => setEstudianteData({ ...estudianteData, estrato: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jornada
              </label>
              <input
                type="text"
                value={estudianteData.jornada}
                onChange={(e) => setEstudianteData({ ...estudianteData, jornada: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datos Médicos / Alergias
              </label>
              <textarea
                value={estudianteData.datos_medicos}
                onChange={(e) => setEstudianteData({ ...estudianteData, datos_medicos: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="2"
              />
            </div>

            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Estudios Anteriores</h3>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Colegio Anterior
              </label>
              <input
                type="text"
                value={estudianteData.colegio_anterior}
                onChange={(e) => setEstudianteData({ ...estudianteData, colegio_anterior: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año Cursado
              </label>
              <input
                type="text"
                value={estudianteData.anio_cursado_anterior}
                onChange={(e) => setEstudianteData({ ...estudianteData, anio_cursado_anterior: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pre-escolar
              </label>
              <input
                type="text"
                value={estudianteData.pre_escolar_anterior}
                onChange={(e) => setEstudianteData({ ...estudianteData, pre_escolar_anterior: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                EBP
              </label>
              <input
                type="text"
                value={estudianteData.ebp_anterior}
                onChange={(e) => setEstudianteData({ ...estudianteData, ebp_anterior: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paz y Salvo
              </label>
              <select
                value={estudianteData.paz_salvo_anterior}
                onChange={(e) => setEstudianteData({ ...estudianteData, paz_salvo_anterior: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccione...</option>
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo del Retiro
              </label>
              <input
                type="text"
                value={estudianteData.motivo_retiro_anterior}
                onChange={(e) => setEstudianteData({ ...estudianteData, motivo_retiro_anterior: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Información Familiar</h3>
            </div>
            {/* Padre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Padre
              </label>
              <input
                type="text"
                value={estudianteData.nombre_padre}
                onChange={(e) => setEstudianteData({ ...estudianteData, nombre_padre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Documento (Padre)
              </label>
              <select
                value={estudianteData.tipo_documento_padre}
                onChange={(e) => setEstudianteData({ ...estudianteData, tipo_documento_padre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccione...</option>
                <option value="Cédula">Cédula</option>
                <option value="Cédula Extranjera">Cédula Extranjera</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento (Padre)
              </label>
              <input
                type="text"
                value={estudianteData.documento_padre}
                onChange={(e) => setEstudianteData({ ...estudianteData, documento_padre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ocupación (Padre)
              </label>
              <input
                type="text"
                value={estudianteData.ocupacion_padre}
                onChange={(e) => setEstudianteData({ ...estudianteData, ocupacion_padre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono del Padre
              </label>
              <input
                type="tel"
                value={estudianteData.telefono_padre}
                onChange={(e) => setEstudianteData({ ...estudianteData, telefono_padre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Madre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Madre
              </label>
              <input
                type="text"
                value={estudianteData.nombre_madre}
                onChange={(e) => setEstudianteData({ ...estudianteData, nombre_madre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Documento (Madre)
              </label>
              <select
                value={estudianteData.tipo_documento_madre}
                onChange={(e) => setEstudianteData({ ...estudianteData, tipo_documento_madre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccione...</option>
                <option value="Cédula">Cédula</option>
                <option value="Cédula Extranjera">Cédula Extranjera</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento (Madre)
              </label>
              <input
                type="text"
                value={estudianteData.documento_madre}
                onChange={(e) => setEstudianteData({ ...estudianteData, documento_madre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ocupación (Madre)
              </label>
              <input
                type="text"
                value={estudianteData.ocupacion_madre}
                onChange={(e) => setEstudianteData({ ...estudianteData, ocupacion_madre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de la Madre
              </label>
              <input
                type="tel"
                value={estudianteData.telefono_madre}
                onChange={(e) => setEstudianteData({ ...estudianteData, telefono_madre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contacto de Emergencia (Nombre y Teléfono)
              </label>
              <input
                type="text"
                value={estudianteData.contacto_emergencia}
                onChange={(e) => setEstudianteData({ ...estudianteData, contacto_emergencia: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                {editingId !== null ? 'Actualizar Estudiante' : 'Crear Estudiante'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setEstudianteData({
                    nombre: "", apellido: "", tipo_documento: "", documento_identidad: "", lugar_expedicion: "", fecha_nacimiento: "",
                    direccion: "", telefono: "", email: "", curso_id: "", descuento_matricula: 0, descuento_mensualidad: 0, datos_medicos: "", eps: "", estrato: "", jornada: "", colegio_anterior: "", anio_cursado_anterior: "",
                    pre_escolar_anterior: "", ebp_anterior: "", motivo_retiro_anterior: "", paz_salvo_anterior: "", nombre_padre: "",
                    tipo_documento_padre: "", documento_padre: "", telefono_padre: "", ocupacion_padre: "", nombre_madre: "",
                    tipo_documento_madre: "", documento_madre: "", telefono_madre: "", ocupacion_madre: "", contacto_emergencia: ""
                  });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Estudiantes */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            Lista de Estudiantes ({filteredEstudiantes.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre del Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEstudiantes.map((estudiante) => (
                <tr key={estudiante.id} className="hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => verDetalles(estudiante)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {estudiante.apellido.charAt(0)}{estudiante.nombre.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 border-b border-transparent hover:border-purple-500 text-left capitalize">
                            {estudiante.apellido} {estudiante.nombre} <span className="ml-2 text-xs bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full">{cursos.find(c => c.id === estudiante.curso_id)?.nombre || "N/A"}</span>
                        </div>
                        <div className="text-xs text-gray-500 text-left">
                          Click para ver detalles
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoClasses[estudiante.estado || "activo"] || estadoClasses.activo}`}>
                      {estadoLabel(estudiante.estado || "activo")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <select
                        value={estudiante.estado || "activo"}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          cambiarEstadoEstudiante(estudiante, e.target.value);
                        }}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
                      >
                        {ESTADOS_ESTUDIANTE.map((estado) => (
                          <option key={estado.value} value={estado.value}>
                            {estado.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cargarEstudianteAEditar(estudiante.id);
                        }}
                        className="text-purple-700 hover:text-purple-900 bg-purple-50 px-3 py-1 rounded-md transition-colors"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEstudiantes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">👨‍🎓</div>
            <p>No se encontraron estudiantes</p>
          </div>
        )}
      </div>

      {/* Modal de Detalles del Estudiante */}
      {selectedEstudiante && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-3 sm:my-8 relative flex flex-col max-h-[94vh] sm:max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-start justify-between gap-3 bg-gray-50 rounded-t-lg">
                <h2 className="min-w-0 text-lg sm:text-2xl font-bold text-gray-800 flex flex-col gap-2 capitalize sm:flex-row sm:items-center">
                  <span className="break-words">Resumen de {selectedEstudiante.apellido} {selectedEstudiante.nombre}</span>
                  <span className="w-fit text-xs sm:text-sm bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1 rounded-full font-medium">
                    {cursos.find(c => c.id === selectedEstudiante.curso_id)?.nombre || "Curso no asignado"}
                  </span>
              </h2>
              <button 
                onClick={cerrarModal} 
                className="text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 sm:p-6 overflow-y-auto flex-1">
              {loadingDetalles ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : detallesEstudiante ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Info */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">👨‍🏫 Rendimiento</h3>
                    <p className="text-sm text-gray-700 mb-2"><strong>Promedio General:</strong> <span className={`font-bold ${detallesEstudiante.promedio_general >= 3.0 ? 'text-green-600' : 'text-red-600'}`}>{detallesEstudiante.promedio_general !== undefined ? detallesEstudiante.promedio_general : 'N/A'}</span></p>
                    <p className="text-sm text-gray-700 mb-2"><strong>Inasistencias Acumuladas:</strong> {detallesEstudiante.inasistencias}</p>
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Promedio de Notas por Materia:</p>
                      {detallesEstudiante.notas && detallesEstudiante.notas.length > 0 ? (
                        <ul className="space-y-1">
                          {detallesEstudiante.notas.map((n, i) => (
                            <li key={i} className="text-sm flex justify-between bg-white px-2 py-1 rounded shadow-sm">
                              <span>{n.materia}</span>
                              <span className={`font-semibold ${n.promedio >= 3.0 ? 'text-green-600' : 'text-red-600'}`}>{n.promedio}</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-xs text-gray-500 italic">No hay notas registradas</p>}
                    </div>
                  </div>

                  {/* Deudas y Estado Financiero */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex flex-col">
                    <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">💰 Estado Financiero</h3>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-red-800 border-b border-red-200 pb-1 mb-2">Pensiones y Colegiatura</h4>
                      {detallesEstudiante.deudas && detallesEstudiante.deudas.length > 0 ? (
                        <>
                          <ul className="space-y-2 mb-2 max-h-40 overflow-y-auto pr-1">
                            {detallesEstudiante.deudas.map((d, i) => (
                              <li key={i} className="text-sm bg-white p-2 rounded shadow-sm border-l-4 border-red-500">
                                <div className="flex justify-between font-semibold text-gray-800">
                                  <span>{d.concepto}</span>
                                  <span className="text-red-600">${d.deuda.toLocaleString()}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Valor base: ${d.valor_total.toLocaleString()} | Pagado: ${d.pagado.toLocaleString()}
                                </div>
                              </li>
                            ))}
                          </ul>
                          <div className="pt-2 border-t border-red-200 flex justify-between items-center">
                            <span className="font-bold text-gray-700">Deuda Total:</span>
                            <span className="font-bold text-red-700 text-lg">${detallesEstudiante.total_deuda?.toLocaleString() || 0}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-green-700 bg-green-100 p-2 rounded-lg">
                          <span>✅</span> <p className="text-sm font-semibold">Sin deudas pendientes.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium text-red-800 border-b border-red-200 pb-1 mb-2">Reporte de Productos del Inventario</h4>
                      {detallesEstudiante.productos_inventario && detallesEstudiante.productos_inventario.length > 0 ? (
                        <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {detallesEstudiante.productos_inventario.map((prod, i) => (
                            <li key={i} className={`text-sm bg-white p-2 rounded shadow-sm border-l-4 ${prod.estado.includes('Pendiente') ? 'border-red-500' : 'border-green-500'}`}>
                                <div className="flex justify-between font-semibold text-gray-800">
                                  <span>{prod.cantidad}x {prod.producto}</span>
                                  <span className={prod.estado.includes('Pendiente') ? 'text-red-600' : 'text-green-600'}>
                                    ${prod.estado.includes('Pendiente') && prod.saldo ? prod.saldo.toLocaleString() : prod.subtotal.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 flex justify-between mt-1">
                                  <span>Fecha: {prod.fecha} {prod.estado === 'Pendiente (Abonado)' ? `(Valor ref: $${prod.subtotal.toLocaleString()})` : ''}</span>
                                  <span className={`font-bold ${prod.estado.includes('Pendiente') ? 'text-red-500' : 'text-green-500'}`}>{prod.estado}</span>
                                </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600 italic">No hay productos registrados.</p>
                      )}
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4">
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Observador</p>
                        <h3 className="text-lg font-bold text-amber-900">Observaciones del estudiante</h3>
                      </div>
                      <span className="w-fit rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800">
                        {detallesEstudiante.observaciones?.length || 0} registros
                      </span>
                    </div>
                    {detallesEstudiante.observaciones && detallesEstudiante.observaciones.length > 0 ? (
                      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1 sm:max-h-72 sm:pr-2">
                        {detallesEstudiante.observaciones.map((obs, i) => (
                          <article key={i} className="overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50 px-3 py-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 flex-wrap gap-1.5">
                                  <ObservacionPill label="Periodo" value={obs.periodo || "N/A"} />
                                  <ObservacionPill label="Materia" value={obs.materia || "Sin materia"} />
                                  <ObservacionPill label="Profesor" value={obs.profesor || "Sin profesor"} />
                                </div>
                                {obs.fecha && (
                                  <span className="w-fit rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                                    {obs.fecha}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3">
                              <ObservacionDimension
                                titulo="Conductual"
                                texto={obs.conductual}
                                className="border-purple-100 bg-purple-50 text-purple-900"
                              />
                              <ObservacionDimension
                                titulo="Cognitivo"
                                texto={obs.cognitivo}
                                className="border-emerald-100 bg-emerald-50 text-emerald-900"
                              />
                              <ObservacionDimension
                                titulo="Lenguaje"
                                texto={obs.lenguaje}
                                className="border-sky-100 bg-sky-50 text-sky-900"
                              />
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-amber-200 bg-white px-4 py-6 text-center text-sm font-medium text-slate-500">
                        No hay observaciones registradas
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No se pudo cargar la información.
                </div>
              )}
            </div>
            <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
              <button 
                onClick={cerrarModal}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ObservacionPill({ label, value }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
      <span className="shrink-0 uppercase tracking-wide text-slate-400">{label}:</span>
      <span className="min-w-0 truncate">{value}</span>
    </span>
  );
}

function ObservacionDimension({ titulo, texto, className }) {
  return (
    <section className={`rounded-lg border p-3 ${className}`}>
      <p className="mb-1 text-[10px] font-black uppercase tracking-widest">{titulo}</p>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
        {texto || "Sin registro"}
      </p>
    </section>
  );
}

export default EstudiantesAdmin;

