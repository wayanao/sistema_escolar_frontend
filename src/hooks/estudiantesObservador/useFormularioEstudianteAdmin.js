import { useCallback, useState } from "react";
import {
  actualizarEstudiante,
  crearEstudiante,
  obtenerEstudiante,
} from "../../services/estudiantesObservadorApi";
import {
  crearEstudianteInicial,
  limpiarPayloadEstudiante,
  normalizarEstudianteParaEdicion,
} from "../../utils/estudiantesObservador/estudiantes";

export default function useFormularioEstudianteAdmin({
  recargar,
  crearEstudianteFn = crearEstudiante,
} = {}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [estudianteData, setEstudianteData] = useState(
    crearEstudianteInicial,
  );
  // Mientras espera al servidor, para que el botón lo diga y no se envíe dos
  // veces.
  const [guardando, setGuardando] = useState(false);

  const alternarFormulario = useCallback(() => {
    if (showForm && editingId) {
      setEstudianteData(crearEstudianteInicial());
      setEditingId(null);
    }
    setShowForm((actual) => !actual);
  }, [editingId, showForm]);

  const cancelarFormulario = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setEstudianteData(crearEstudianteInicial());
  }, []);

  const cargarEstudianteAEditar = useCallback(async (estudianteId) => {
    try {
      const estudiante = await obtenerEstudiante(estudianteId);
      setEstudianteData(normalizarEstudianteParaEdicion(estudiante));
      setEditingId(estudianteId);
      setShowForm(true);
      return { estado: "exito" };
    } catch (error) {
      return { estado: "error", error };
    }
  }, []);

  const guardarEstudiante = useCallback(async () => {
    if (
      !estudianteData.nombre ||
      !estudianteData.apellido ||
      !estudianteData.curso_id
    ) {
      return { estado: "validacion" };
    }

    const modo = editingId !== null ? "edicion" : "creacion";
    const payload = limpiarPayloadEstudiante(estudianteData);

    setGuardando(true);
    try {
      if (modo === "edicion") {
        await actualizarEstudiante(editingId, payload);
      } else {
        await crearEstudianteFn(payload);
      }

      setEstudianteData(crearEstudianteInicial());
      setEditingId(null);
      setShowForm(false);
      if (recargar) void recargar();
      return { estado: "exito", modo };
    } catch (error) {
      return { estado: "error", error, modo };
    } finally {
      setGuardando(false);
    }
  }, [crearEstudianteFn, editingId, estudianteData, recargar]);

  return {
    showForm,
    editingId,
    estudianteData,
    setEstudianteData,
    guardando,
    alternarFormulario,
    cancelarFormulario,
    cargarEstudianteAEditar,
    guardarEstudiante,
  };
}
