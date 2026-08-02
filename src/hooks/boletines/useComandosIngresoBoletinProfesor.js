import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { guardarBoletinProfesor } from "../../services/boletinesApi";
import {
  aplicarLogrosEnGrupo,
  construirPayloadBoletin,
  obtenerTextoLimpio,
} from "../../utils/boletines/ingresoBoletin";

export default function useComandosIngresoBoletinProfesor({
  asignacionId,
  periodo,
  estudiantes,
  datosIniciales,
  estadoGuardadoInicial,
}) {
  const [datosBoletin, setDatosBoletin] = useState(datosIniciales);
  const [estadoGuardado, setEstadoGuardado] = useState(estadoGuardadoInicial);
  const [guardandoTodos, setGuardandoTodos] = useState(false);

  useEffect(() => {
    setDatosBoletin(datosIniciales);
    setEstadoGuardado(estadoGuardadoInicial);
  }, [datosIniciales, estadoGuardadoInicial]);

  const primerEstudianteConFormulario = useMemo(
    () => estudiantes.find((estudiante) => datosBoletin[estudiante.estudiante_id]),
    [datosBoletin, estudiantes],
  );

  const actualizarObservacion = (estudianteId, index, texto) => {
    setDatosBoletin((actual) => {
      const nuevo = { ...actual };
      const datosEstudiante = { ...nuevo[estudianteId] };
      const observaciones = [...datosEstudiante.observaciones];
      observaciones[index] = { ...observaciones[index], observacion: texto };
      datosEstudiante.observaciones = observaciones;
      nuevo[estudianteId] = datosEstudiante;
      return nuevo;
    });

    setEstadoGuardado((actual) => ({
      ...actual,
      [estudianteId]: {
        ...(actual[estudianteId] || {}),
        modificado: true,
      },
    }));
  };

  const aplicarLogrosATodos = async (estudianteIdOrigen) => {
    const origen = datosBoletin[estudianteIdOrigen];
    const observacionesOrigen = origen?.observaciones || [];
    const observacionesConTexto = observacionesOrigen.filter((observacion) =>
      obtenerTextoLimpio(observacion.observacion),
    );

    if (observacionesConTexto.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin logros para copiar",
        text: "Escribe al menos un logro en este estudiante antes de aplicarlo al grupo.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Aplicar logros al grupo",
      text: "Se copiarán los logros de este estudiante a los demás estudiantes del periodo actual. Luego podrás modificar casos individuales antes de guardar.",
      icon: "question",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Solo campos vacíos",
      denyButtonText: "Sobrescribir todos",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#7c3aed",
      denyButtonColor: "#475569",
    });

    if (!result.isConfirmed && !result.isDenied) return;

    const soloVacios = result.isConfirmed;
    const {
      datosBoletin: nuevosDatosBoletin,
      estudiantesModificados,
    } = aplicarLogrosEnGrupo(datosBoletin, estudianteIdOrigen, soloVacios);

    if (estudiantesModificados.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin cambios",
        text: soloVacios
          ? "No había campos vacíos para completar."
          : "Los estudiantes ya tienen esos mismos logros.",
      });
      return;
    }

    setDatosBoletin(nuevosDatosBoletin);
    setEstadoGuardado((actual) => {
      const nuevo = { ...actual };
      estudiantesModificados.forEach((estudianteId) => {
        nuevo[estudianteId] = {
          ...(nuevo[estudianteId] || {}),
          modificado: true,
        };
      });
      return nuevo;
    });

    Swal.fire({
      icon: "success",
      title: "Logros aplicados",
      text: `Se actualizaron ${estudiantesModificados.length} estudiante(s). Puedes revisar y modificar casos especiales antes de guardar.`,
      timer: 2200,
      showConfirmButton: false,
    });
  };

  const aplicarLogrosDelPrimerEstudiante = async () => {
    if (!primerEstudianteConFormulario) {
      Swal.fire({
        icon: "warning",
        title: "Sin estudiante base",
        text: "Carga un curso con estudiantes antes de aplicar logros al grupo.",
      });
      return;
    }

    await aplicarLogrosATodos(primerEstudianteConFormulario.estudiante_id);
  };

  const obtenerEstadoVisual = (estudianteId) => {
    const estado = estadoGuardado[estudianteId] || {};

    if (estado.modificado) {
      return {
        label: "Cambios sin guardar",
        detail: "Hay ediciones pendientes",
        badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
        dotClass: "bg-amber-500",
        buttonText: "Guardar cambios",
      };
    }

    if (estado.guardado) {
      return {
        label: "Guardado",
        detail: estado.guardadoEn
          ? `Actualizado ${estado.guardadoEn}`
          : "Informe registrado",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
        dotClass: "bg-emerald-500",
        buttonText: "Actualizar resumen",
      };
    }

    return {
      label: "Pendiente",
      detail: "Aún no se ha guardado",
      badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
      dotClass: "bg-slate-400",
      buttonText: "Guardar resumen",
    };
  };

  const guardarBoletinEstudiante = async (estudianteId) => {
    const payload = construirPayloadBoletin({
      datosBoletin,
      estudianteId,
      asignacionId,
      periodo,
    });
    if (!payload) return;

    try {
      await guardarBoletinProfesor(payload);
      setEstadoGuardado((actual) => ({
        ...actual,
        [estudianteId]: {
          guardado: true,
          modificado: false,
          guardadoEn: new Date().toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      }));
      Swal.fire({
        icon: "success",
        title: "Boletín guardado",
        text: "Datos enviados al Admin correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire(
        "Error",
        "No se pudo guardar la información del boletín",
        "error",
      );
      console.error(error);
    }
  };

  const guardarTodosBoletines = async () => {
    const estudiantesConDatos = estudiantes.filter(
      (estudiante) => datosBoletin[estudiante.estudiante_id],
    );

    if (estudiantesConDatos.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin estudiantes para guardar",
        text: "Carga un curso con estudiantes antes de guardar.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Guardar todo el grupo",
      text: "Se guardará la información actual de cada estudiante. Las modificaciones individuales se conservarán.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, guardar todo",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#7c3aed",
    });

    if (!result.isConfirmed) return;

    setGuardandoTodos(true);

    try {
      let guardados = 0;

      for (const estudiante of estudiantesConDatos) {
        const payload = construirPayloadBoletin({
          datosBoletin,
          estudianteId: estudiante.estudiante_id,
          asignacionId,
          periodo,
        });
        if (!payload) continue;

        await guardarBoletinProfesor(payload);
        guardados += 1;
      }

      const guardadoEn = new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      });

      setEstadoGuardado((actual) => {
        const nuevo = { ...actual };
        estudiantesConDatos.forEach((estudiante) => {
          nuevo[estudiante.estudiante_id] = {
            guardado: true,
            modificado: false,
            guardadoEn,
          };
        });
        return nuevo;
      });

      Swal.fire({
        icon: "success",
        title: "Grupo guardado",
        text: `Se guardaron ${guardados} estudiante(s).`,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        "No se pudo guardar todo el grupo. Revisa la conexión e intenta nuevamente.",
        "error",
      );
    } finally {
      setGuardandoTodos(false);
    }
  };

  return {
    datosBoletin,
    estadoGuardado,
    guardandoTodos,
    primerEstudianteConFormulario,
    actualizarObservacion,
    aplicarLogrosATodos,
    aplicarLogrosDelPrimerEstudiante,
    guardarBoletinEstudiante,
    guardarTodosBoletines,
    obtenerEstadoVisual,
  };
}
