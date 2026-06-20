import { useState,useEffect } from "react";
import Observaciones from "../components/Observaciones";
import api from "../utils/api";

function ObservacionesPage() {

  // 🔥 ejemplo temporal (luego lo conectamos mejor)
  const [busqueda, setBusqueda] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  
  const asignacionId = localStorage.getItem("asignacionId");
  const periodo = localStorage.getItem("periodo") || "1";
  const cargarEstudiantes = async () => {

  const asignacionId = localStorage.getItem("asignacionId");

  if (!asignacionId) {
    alert("Selecciona una asignación primero en la página principal");
    window.location.href = "/";
    return;
  }

  try {
    const res = await api.get(`/planilla/${asignacionId}`)
    const data = res.data;

    setEstudiantes(data);

    

  } catch (error) {
    console.error("Error cargando estudiantes", error);
  }
};

    useEffect(() => {
  cargarEstudiantes();
}, []);

  // 🔥 buscar
  const buscarEstudiantes = () => {
    if (!estudiantes || estudiantes.length === 0) {
      alert("Cargando estudiantes o no hay estudiantes en esta asignación.");
      return;
    }
    const filtrados = (estudiantes || []).filter(e =>
      (e.nombre.trim() + " " + e.apellido.trim())
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
    setFiltrados(filtrados);
  };

  useEffect(() => {
    setFiltrados(estudiantes || []);
  }, [estudiantes]);

  return (
    <div className="p-4">

      <h1 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
        📝 Observador del estudiante
      </h1>

        <form onSubmit={(e) => { e.preventDefault(); buscarEstudiantes(); }} className="mb-4">
          <input
            placeholder="Buscar estudiante..."
            className="border p-2 mr-2"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            Buscar
          </button>
      </form>

      {filtrados.map(e => (
        <div key={e.estudiante_id} className="border p-3 mb-3">

          

          {/* 🔥 aquí luego ponemos el formulario */}

          <Observaciones
        estudiante={e}
        asignacionId={asignacionId}
        periodo={periodo}
      />

        </div>
      ))}

    </div>
  );
}

export default ObservacionesPage;
