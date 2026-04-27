import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const API = import.meta.env.VITE_API_URL;

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

  useEffect(() => {
    cargarDatos();
  }, []);

  if (!usuario || usuario.rol !== "admin") {
    navigate("/login");
    return null;
  }

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [estRes, cursosRes] = await Promise.all([
        api.get(`/estudiantes`),
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
  };

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
      const url = isEditing ? `${API}/estudiantes/${editingId}` : `${API}/estudiantes`;
      const method = isEditing ? "PUT" : "POST";

      const parsedUrl = url.replace(API, "");
      const res = await (method === "PUT" ? api.put(parsedUrl, dataToSend) : api.post(parsedUrl, dataToSend));

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
    estudiante.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const verDetalles = async (estudiante) => {
    setSelectedEstudiante(estudiante);
    setLoadingDetalles(true);
    try {
      const res = await api.get(`/estudiantes/${estudiante.id}/detalles`);
      const data = res.data;
      setDetallesEstudiante(data);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Curso *
              </label>
              <select
                value={estudianteData.curso_id}
                onChange={(e) => setEstudianteData({ ...estudianteData, curso_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <textarea
                value={estudianteData.direccion}
                onChange={(e) => setEstudianteData({ ...estudianteData, direccion: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datos Médicos / Alergias
              </label>
              <textarea
                value={estudianteData.datos_medicos}
                onChange={(e) => setEstudianteData({ ...estudianteData, datos_medicos: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paz y Salvo
              </label>
              <select
                value={estudianteData.paz_salvo_anterior}
                onChange={(e) => setEstudianteData({ ...estudianteData, paz_salvo_anterior: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Documento (Padre)
              </label>
              <select
                value={estudianteData.tipo_documento_padre}
                onChange={(e) => setEstudianteData({ ...estudianteData, tipo_documento_padre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Documento (Madre)
              </label>
              <select
                value={estudianteData.tipo_documento_madre}
                onChange={(e) => setEstudianteData({ ...estudianteData, tipo_documento_madre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {estudiante.apellido.charAt(0)}{estudiante.nombre.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 border-b border-transparent hover:border-blue-500 text-left capitalize">
                            {estudiante.apellido} {estudiante.nombre} <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{cursos.find(c => c.id === estudiante.curso_id)?.nombre || "N/A"}</span>
                        </div>
                        <div className="text-xs text-gray-500 text-left">
                          Click para ver detalles
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cargarEstudianteAEditar(estudiante.id);
                      }}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md transition-colors"
                    >
                      ✏️ Editar
                    </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8 relative flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center capitalize">
                  Resumen de {selectedEstudiante.apellido} {selectedEstudiante.nombre}
                  <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
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

            <div className="p-6 overflow-y-auto flex-1">
              {loadingDetalles ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : detallesEstudiante ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Info */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">👨‍🏫 Rendimiento</h3>
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
                  <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">📝 Observaciones del Estudiante</h3>
                    {detallesEstudiante.observaciones && detallesEstudiante.observaciones.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {detallesEstudiante.observaciones.map((obs, i) => (
                          <div key={i} className="bg-white p-3 rounded shadow-sm border border-yellow-200">
                              <div className="flex justify-between items-center mb-3">
                                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">📅 Periodo {obs.periodo} | 👨‍🏫 {obs.profesor} | 📚 {obs.materia}</span>
                                  {obs.fecha && <span className="text-xs text-gray-400">{obs.fecha}</span>}
                                </div>
                              <div className="flex flex-col gap-2 mt-2">
                                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                  <p className="text-xs font-bold text-blue-800 uppercase">CONDUCTUAL</p>
                                  <p className="text-sm text-gray-700">{obs.conductual}</p>
                                </div>
                                <div className="bg-green-50 p-2 rounded border border-green-100">
                                  <p className="text-xs font-bold text-green-800 uppercase">COGNITIVO</p>
                                  <p className="text-sm text-gray-700">{obs.cognitivo}</p>
                                </div>
                                <div className="bg-purple-50 p-2 rounded border border-purple-100">
                                  <p className="text-xs font-bold text-purple-800 uppercase">LENGUAJE</p>
                                  <p className="text-sm text-gray-700">{obs.lenguaje}</p>
                                </div>
                              </div>
                                </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No hay observaciones registradas</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No se pudo cargar la información.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
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

export default EstudiantesAdmin;

