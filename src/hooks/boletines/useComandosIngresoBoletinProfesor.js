import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { MORADO_BOTON } from "../../constants/colores";

import { guardarBoletinProfesor } from "../../services/boletinesApi";
import {
  AVISO_PORCENTAJES_INCOMPLETOS,
  MENSAJE_PORCENTAJES_INCOMPLETOS,
  aplicarBorrador,
  aplicarLogrosEnGrupo,
  construirBorrador,
  construirPayloadBoletin,
  estudiantesConCambiosSinGuardar,
  mensajeCambiosSinGuardar,
  mensajeGuardadoGrupoIncompleto,
  obtenerTextoLimpio,
} from "../../utils/boletines/ingresoBoletin";
import useBorradorBoletinProfesor from "./useBorradorBoletinProfesor";

export default function useComandosIngresoBoletinProfesor({
  asignacionId,
  periodo,
  estudiantes,
  datosIniciales,
  estadoGuardadoInicial,
  porcentajesIncompletos = false,
  cargadoPara = null,
}) {
  const [datosBoletin, setDatosBoletin] = useState(datosIniciales);
  const [estadoGuardado, setEstadoGuardado] = useState(estadoGuardadoInicial);
  const [guardandoTodos, setGuardandoTodos] = useState(false);
  // Porcentajes, paso B4c (PB11): el aviso se acepta una vez por clase y
  // periodo; al cambiar de clase o periodo, vuelve a preguntar.
  const avisoAceptadoRef = useRef(false);

  // Borrador: lo escrito y no guardado se va copiando en el navegador, para
  // encontrarlo al volver a esta clase y periodo aunque se haya salido.
  const {
    clave: claveBorrador,
    activo: borradorActivo,
    leerBorrador,
    escribirBorrador,
  } = useBorradorBoletinProfesor({ cargadoPara });
  const [borradorRecuperado, setBorradorRecuperado] = useState(null);
  // Solo lo que hace el profesor va al borrador; lo que llega del servidor no.
  const cambioDelProfesorRef = useRef(false);

  useEffect(() => {
    const borrador = leerBorrador(claveBorrador);
    const conBorrador = aplicarBorrador({
      datosBoletin: datosIniciales,
      estadoGuardado: estadoGuardadoInicial,
      borrador,
    });
    cambioDelProfesorRef.current = false;
    setDatosBoletin(conBorrador.datosBoletin);
    setEstadoGuardado(conBorrador.estadoGuardado);
    setBorradorRecuperado(
      conBorrador.recuperados.length > 0
        ? { cantidad: conBorrador.recuperados.length, actualizado: borrador?.actualizado || null }
        : null,
    );
    avisoAceptadoRef.current = false;
  }, [claveBorrador, datosIniciales, estadoGuardadoInicial, leerBorrador]);

  useEffect(() => {
    if (!cambioDelProfesorRef.current) return;
    escribirBorrador(
      claveBorrador,
      construirBorrador(datosBoletin, estadoGuardado, new Date().toISOString()),
    );
  }, [claveBorrador, datosBoletin, escribirBorrador, estadoGuardado]);

  /** `true` si se puede guardar: sin porcentajes incompletos, o si el profesor aceptó. */
  const confirmarPorcentajesIncompletos = async () => {
    if (!porcentajesIncompletos || avisoAceptadoRef.current) return true;
    const respuesta = await Swal.fire({
      icon: "warning",
      title: "Porcentajes incompletos",
      text: MENSAJE_PORCENTAJES_INCOMPLETOS,
      showCancelButton: true,
      confirmButtonText: "Guardar igual",
      cancelButtonText: "Cancelar",
      confirmButtonColor: MORADO_BOTON,
    });
    if (!respuesta?.isConfirmed) return false;
    avisoAceptadoRef.current = true;
    return true;
  };

  const cantidadConCambios = estudiantesConCambiosSinGuardar(estadoGuardado).length;

  // Sin borrador (el navegador no deja guardar), recargar o cerrar la pestaña
  // con cambios sin guardar hace que el navegador pregunte. Con borrador no
  // hace falta: lo escrito sigue ahí al volver. (Salir por el menú no se puede
  // frenar: la app usa BrowserRouter, sin useBlocker.)
  useEffect(() => {
    if (cantidadConCambios === 0 || borradorActivo) return undefined;
    const alSalir = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", alSalir);
    return () => window.removeEventListener("beforeunload", alSalir);
  }, [borradorActivo, cantidadConCambios]);

  /**
   * `true` si se puede cambiar de clase o de periodo: sin cambios pendientes,
   * con borrador (no se pierden), o si el profesor acepta perderlos.
   */
  const confirmarDescartarCambios = async () => {
    if (cantidadConCambios === 0 || borradorActivo) return true;
    const respuesta = await Swal.fire({
      icon: "warning",
      title: "Tienes cambios sin guardar",
      text: mensajeCambiosSinGuardar(cantidadConCambios),
      showCancelButton: true,
      confirmButtonText: "Cambiar sin guardar",
      cancelButtonText: "Quedarme",
      confirmButtonColor: "#475569",
      cancelButtonColor: MORADO_BOTON,
      focusCancel: true,
    });
    return Boolean(respuesta?.isConfirmed);
  };

  /** Borra lo que no se ha guardado y vuelve a lo último guardado. */
  const descartarBorrador = async () => {
    const respuesta = await Swal.fire({
      icon: "warning",
      title: "Descartar lo que no has guardado",
      text: `Se borra lo que no has guardado ${
        cantidadConCambios === 1 ? "de un estudiante" : `de ${cantidadConCambios} estudiantes`
      } y vuelve lo último guardado.`,
      showCancelButton: true,
      confirmButtonText: "Descartar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#475569",
      cancelButtonColor: MORADO_BOTON,
      focusCancel: true,
    });
    if (!respuesta?.isConfirmed) return;

    cambioDelProfesorRef.current = false;
    escribirBorrador(claveBorrador, null);
    setDatosBoletin(datosIniciales);
    setEstadoGuardado(estadoGuardadoInicial);
    setBorradorRecuperado(null);
  };

  const primerEstudianteConFormulario = useMemo(
    () => estudiantes.find((estudiante) => datosBoletin[estudiante.estudiante_id]),
    [datosBoletin, estudiantes],
  );

  const actualizarObservacion = (estudianteId, index, texto) => {
    cambioDelProfesorRef.current = true;
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
      confirmButtonColor: MORADO_BOTON,
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

    cambioDelProfesorRef.current = true;
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
    if (!(await confirmarPorcentajesIncompletos())) return;

    try {
      await guardarBoletinProfesor(payload);
      // Guardado: sale del borrador.
      cambioDelProfesorRef.current = true;
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

    // Porcentajes, paso B4c (PB11): con porcentajes incompletos, el aviso va
    // en esta misma confirmación para no abrir dos ventanas seguidas.
    const avisarPorcentajes = porcentajesIncompletos && !avisoAceptadoRef.current;
    const textoGrupo =
      "Se guardará la información actual de cada estudiante. Las modificaciones individuales se conservarán.";
    const result = await Swal.fire({
      title: "Guardar todo el grupo",
      text: avisarPorcentajes ? `${AVISO_PORCENTAJES_INCOMPLETOS} ${textoGrupo}` : textoGrupo,
      icon: avisarPorcentajes ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: "Sí, guardar todo",
      cancelButtonText: "Cancelar",
      confirmButtonColor: MORADO_BOTON,
    });

    if (!result.isConfirmed) return;
    if (avisarPorcentajes) avisoAceptadoRef.current = true;

    setGuardandoTodos(true);

    // Los que ya quedaron guardados se marcan aunque el grupo se detenga a
    // la mitad: así el profesor sabe cuáles faltan.
    const guardadosIds = [];
    const marcarGuardados = () => {
      if (guardadosIds.length === 0) return;
      cambioDelProfesorRef.current = true;
      const guardadoEn = new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setEstadoGuardado((actual) => {
        const nuevo = { ...actual };
        guardadosIds.forEach((estudianteId) => {
          nuevo[estudianteId] = {
            guardado: true,
            modificado: false,
            guardadoEn,
          };
        });
        return nuevo;
      });
    };

    let estudianteEnCurso = null;
    try {
      for (const estudiante of estudiantesConDatos) {
        const payload = construirPayloadBoletin({
          datosBoletin,
          estudianteId: estudiante.estudiante_id,
          asignacionId,
          periodo,
        });
        if (!payload) continue;

        estudianteEnCurso = estudiante;
        await guardarBoletinProfesor(payload);
        guardadosIds.push(estudiante.estudiante_id);
      }

      marcarGuardados();
      Swal.fire({
        icon: "success",
        title: "Grupo guardado",
        text: `Se guardaron ${guardadosIds.length} estudiante(s).`,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      marcarGuardados();
      Swal.fire({
        icon: "error",
        title: guardadosIds.length > 0 ? "Grupo guardado a medias" : "Error",
        text: mensajeGuardadoGrupoIncompleto({
          guardados: guardadosIds.length,
          total: estudiantesConDatos.length,
          nombreFallido: estudianteEnCurso?.nombre || "un estudiante",
          error,
        }),
        confirmButtonColor: MORADO_BOTON,
      });
    } finally {
      setGuardandoTodos(false);
    }
  };

  return {
    // Se avisa mientras quede algo recuperado sin guardar.
    borradorRecuperado: cantidadConCambios > 0 ? borradorRecuperado : null,
    datosBoletin,
    descartarBorrador,
    estadoGuardado,
    guardandoTodos,
    primerEstudianteConFormulario,
    actualizarObservacion,
    aplicarLogrosATodos,
    aplicarLogrosDelPrimerEstudiante,
    confirmarDescartarCambios,
    guardarBoletinEstudiante,
    guardarTodosBoletines,
    obtenerEstadoVisual,
  };
}
