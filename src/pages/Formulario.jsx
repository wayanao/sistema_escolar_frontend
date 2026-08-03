import { useEffect } from "react";
import Observaciones from "../components/estudiantesObservador/Observaciones";
import VistaPlanillaObservador from "../components/estudiantesObservador/VistaPlanillaObservador";
import usePlanillaObservador from "../hooks/estudiantesObservador/usePlanillaObservador";
import { obtenerPeriodoProfesor } from "../utils/periodoProfesor";

function ObservacionesPage() {
  const asignacionId = localStorage.getItem("asignacionId");
  const periodo = obtenerPeriodoProfesor();
  const {
    busqueda,
    setBusqueda,
    filtrados,
    error,
    buscarEstudiantes: aplicarBusqueda,
  } = usePlanillaObservador(asignacionId);

  useEffect(() => {
    if (asignacionId) return;
    alert("Selecciona una asignación primero en la página principal");
    window.location.href = "/";
  }, [asignacionId]);

  useEffect(() => {
    if (error) console.error("Error cargando estudiantes", error);
  }, [error]);

  const buscarEstudiantes = () => {
    if (!aplicarBusqueda()) {
      alert("Cargando estudiantes o no hay estudiantes en esta asignación.");
    }
  };

  return (
    <VistaPlanillaObservador
      busqueda={busqueda}
      onCambiarBusqueda={setBusqueda}
      onBuscar={buscarEstudiantes}
    >
      {filtrados.map((estudiante) => (
        <Observaciones
          key={estudiante.estudiante_id}
          estudiante={estudiante}
          asignacionId={asignacionId}
          periodo={periodo}
        />
      ))}
    </VistaPlanillaObservador>
  );
}

export default ObservacionesPage;
