import { useCallback, useState, useEffect } from "react";
import AsistenciaRow from "../components/AsistenciaRow";
import api from "../utils/api";


function Asistencia() {

const [fecha] = useState(localStorage.getItem("fechaAsistencia") || "");
const [asistencia, setAsistencia] = useState({});
const [historial, setHistorial] = useState([]);
const [estudiantes, setEstudiantes] = useState([]);
const [clases, setClases] = useState([]);
const asignacionId = localStorage.getItem("asignacionId");
const periodo = localStorage.getItem("periodo") || "1";

const profesorStorage = localStorage.getItem("profesor");
const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
const profesorId = profesor?.id;



const cargarEstudiantes = useCallback(async () => {
  if (!asignacionId) {
    alert("No hay asignación seleccionada. Ve al Dashboard.");
    window.location.href = "/";
    return;
  }
  try {
    const res = await api.get(`/planilla-excel/${asignacionId}/${periodo}`);
    const data = res.data;
    

    setEstudiantes(data.data || []);
    console.log("DATA.DATA:", data.data);
    } catch (error) {
    console.error("Error cargando estudiantes", error);
  }
}, [asignacionId, periodo]);

const cargarClases = useCallback(async () => {
  if (!profesorId) return;
  try {
    const res = await api.get(`/mis-clases/${profesorId}`);
    const data = res.data;
    setClases(data);
  } catch (error) {
    console.error("Error cargando clases", error);
  } 
}, [profesorId]);

const cargarHistorial = useCallback(async () => {

    const res = await api.get(`/asistencia/historial/${asignacionId}/${periodo}`);
    const data = res.data;

    setHistorial(data);
    }, [asignacionId, periodo]);


      useEffect(() => {
    if (!profesorId) {
      window.location.href = "/login";
      return;
    }
  
    if (asignacionId && periodo) {
      cargarEstudiantes();
      cargarHistorial();
    }
  
    cargarClases();
  
  }, [asignacionId, periodo, profesorId, cargarEstudiantes, cargarHistorial, cargarClases]);




      // 🎯 Guardar asistencia
      const guardarAsistencia = async () => {

      // ❌ validar fecha
          if (!fecha) {
            alert("Selecciona una fecha");
            return;
          }
      
        // ❌ validar que TODOS tengan estado
        for (let est of estudiantes) {
          if (!asistencia[est.estudiante_id]) {
            alert(`Falta marcar asistencia de: ${est.apellido} ${est.nombre}`);
            return;
          }
        } 


      
        // ✅ construir data SOLO si todo está bien
        const data = estudiantes.map(est => ({
          estudiante_id: est.estudiante_id,
          asignacion_id: parseInt(asignacionId),
          fecha: fecha,
          estado: asistencia[est.estudiante_id],
          periodo: parseInt(periodo)
        }));
      
        console.log("ENVIANDO:", data);
        


          // 🔥 enviar al backend
        try {
          await api.post(`/asistencia`, data);
          
            alert("Asistencia guardada 🚀");
            setAsistencia({});
            await cargarHistorial();
          
          } catch (error) {
            console.error(error);
            alert("Error guardando asistencia");
          }
        };

        

            // 🎯 Marcar asistencia localmente
        const marcar = (id, estado) => {
            setAsistencia(prev => ({
              ...prev,
              [id]: estado
          }));
        };


      // 🎯 Contar asistencias e inasistencias
    const selectedClase = clases.find(c => c.id == asignacionId);

    return (
      <div className="w-full p-4 sm:p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            📅 Gestión de Asistencia
          </h1>
          <p className="text-gray-600">
            Registra la asistencia de tus estudiantes
          </p>
        </div>

        {/* Información del curso */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 border border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Información del Curso</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Materia</p>
              <p className="text-gray-900">{selectedClase ? selectedClase.materia : "No seleccionada"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Salón</p>
              <p className="text-gray-900">{selectedClase ? selectedClase.curso : "No seleccionado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Período</p>
              <p className="text-gray-900">{periodo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Fecha</p>
              <p className="text-gray-900">{fecha || "No especificada"}</p>
            </div>
          </div>
        </div>

        {/* Fecha 
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 border border-gray-200">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Asistencia</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={fecha}
              onChange={(e) => {
                const newFecha = e.target.value;
                setFecha(newFecha);
                localStorage.setItem("fechaAsistencia", newFecha);
              }}
            />
          </div>
        </div>*/}

        {/* Lista de Estudiantes */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 border border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Lista de Estudiantes</h2>
          <div className="space-y-4">
            {estudiantes.map(est => {
              const hist = historial.find(h => h.estudiante_id === est.estudiante_id);
              const estConHistorial = { ...est, historial: hist ? hist.historial : [] };
              return (
              <AsistenciaRow
                key={est.estudiante_id}
                est={estConHistorial}
                asistencia={asistencia}
                marcar={marcar}
              />
              );
            })}
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-center">
          <button
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-base sm:text-lg font-medium"
            onClick={guardarAsistencia}
          >
            Guardar Asistencia
          </button>
        </div>
      </div>
    );
}

  export default Asistencia;
