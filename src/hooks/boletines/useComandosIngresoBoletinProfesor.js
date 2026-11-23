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
  contarPlanillaCambiada,
  estudiantesConCambiosSinGuardar,
  mensajeCambiosSinGuardar,
  mensajeCopiarLogros,
  mensajeGuardadoGrupoIncompleto,
  obtenerTextoLimpio,
} from "../../utils/boletines/ingresoBoletin";
import useBorradorBoletinProfesor from "./useBorradorBoletinProfesor";
import { mostrarExito } from "../ventanaExito";

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
  // Avance de "Copiar a todos y guardar": cuántos van de cuántos.
  const [progresoGrupo, setProgresoGrupo] = useState(null);
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
  // Lo último guardado de cada estudiante (lo que trajo el servidor, y luego
  // cada guardado). "Copiar a todos" lo usa para saber qué era una copia.
  const ultimoGuardadoRef = useRef({});

  useEffect(() => {
    const borrador = leerBorrador(claveBorrador);
    const conBorrador = aplicarBorrador({
      datosBoletin: datosIniciales,
      estadoGuardado: estadoGuardadoInicial,
      borrador,
    });
    cambioDelProfesorRef.current = false;
    ultimoGuardadoRef.current = datosIniciales;
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

    // 2026-11-23: lo guardado ya no coincide con la planilla. Decir "Guardado"
    // aquí hizo que nadie notara caritas viejas en el boletín (Jardín A).
    if (estado.desactualizado) {
      return {
        label: "La planilla cambió",
        detail: "Revisa los textos y vuelve a guardar",
        badgeClass: "border-orange-200 bg-orange-50 text-orange-800",
        dotClass: "bg-orange-500",
        buttonText: "Volver a guardar",
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
      ultimoGuardadoRef.current = {
        ...ultimoGuardadoRef.current,
        [estudianteId]: datosBoletin[estudianteId],
      };
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
      mostrarExito({
        title: "Boletín guardado",
        text: "Datos enviados al Admin correctamente.",
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

  const estudiantesParaGuardar = (datos) =>
    estudiantes.filter((estudiante) => datos[estudiante.estudiante_id]);

  const avisarSinEstudiantes = () =>
    Swal.fire({
      icon: "warning",
      title: "Sin estudiantes para guardar",
      text: "Carga un curso con estudiantes antes de guardar.",
    });

  /**
   * Guarda uno por uno a `estudiantesConDatos` con `datos`. Los que quedan
   * guardados se marcan aunque el grupo se detenga a la mitad: así el
   * profesor sabe cuáles faltan.
   */
  const guardarGrupo = async (datos, estudiantesConDatos) => {
    setGuardandoTodos(true);
    setProgresoGrupo({ guardados: 0, total: estudiantesConDatos.length });

    const guardadosIds = [];
    const marcarGuardados = () => {
      if (guardadosIds.length === 0) return;
      cambioDelProfesorRef.current = true;
      const ultimo = { ...ultimoGuardadoRef.current };
      guardadosIds.forEach((estudianteId) => {
        ultimo[estudianteId] = datos[estudianteId];
      });
      ultimoGuardadoRef.current = ultimo;
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
          datosBoletin: datos,
          estudianteId: estudiante.estudiante_id,
          asignacionId,
          periodo,
        });
        if (!payload) continue;

        estudianteEnCurso = estudiante;
        await guardarBoletinProfesor(payload);
        guardadosIds.push(estudiante.estudiante_id);
        setProgresoGrupo({ guardados: guardadosIds.length, total: estudiantesConDatos.length });
      }

      marcarGuardados();
      mostrarExito({
        title: "Grupo guardado",
        text: `Se guardaron ${guardadosIds.length} estudiante(s).`,
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
      setProgresoGrupo(null);
    }
  };

  /**
   * Un solo botón: copia los logros del primer estudiante a los demás (ver
   * `aplicarLogrosEnGrupo`: llena vacíos, actualiza copias, respeta lo escrito
   * a mano) y guarda todo el grupo, con una sola confirmación.
   */
  const copiarLogrosYGuardar = async () => {
    const origen = primerEstudianteConFormulario;
    if (!origen) {
      avisarSinEstudiantes();
      return;
    }

    const observacionesOrigen = datosBoletin[origen.estudiante_id]?.observaciones || [];
    if (!observacionesOrigen.some((observacion) => obtenerTextoLimpio(observacion.observacion))) {
      Swal.fire({
        icon: "warning",
        title: "Sin logros para copiar",
        text: `Escribe al menos un logro en ${origen.nombre} para copiarlo a los demás.`,
        confirmButtonColor: MORADO_BOTON,
      });
      return;
    }

    const estudiantesConDatos = estudiantesParaGuardar(datosBoletin);
    const copia = aplicarLogrosEnGrupo(
      datosBoletin,
      origen.estudiante_id,
      ultimoGuardadoRef.current[origen.estudiante_id]?.observaciones,
    );
    const avisarPorcentajes = porcentajesIncompletos && !avisoAceptadoRef.current;
    const texto = mensajeCopiarLogros({
      nombreOrigen: origen.nombre,
      copiados: copia.estudiantesModificados.length,
      conTextoPropio: copia.estudiantesConTextoPropio.length,
      total: estudiantesConDatos.length,
    });
    const result = await Swal.fire({
      title: "Copiar a todos y guardar",
      text: avisarPorcentajes ? `${AVISO_PORCENTAJES_INCOMPLETOS} ${texto}` : texto,
      icon: avisarPorcentajes ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: "Copiar y guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: MORADO_BOTON,
    });

    if (!result?.isConfirmed) return;
    if (avisarPorcentajes) avisoAceptadoRef.current = true;

    if (copia.estudiantesModificados.length > 0) {
      cambioDelProfesorRef.current = true;
      setDatosBoletin(copia.datosBoletin);
      setEstadoGuardado((actual) => {
        const nuevo = { ...actual };
        copia.estudiantesModificados.forEach((estudianteId) => {
          nuevo[estudianteId] = { ...(nuevo[estudianteId] || {}), modificado: true };
        });
        return nuevo;
      });
    }

    await guardarGrupo(copia.datosBoletin, estudiantesConDatos);
  };

  return {
    // Se avisa mientras quede algo recuperado sin guardar.
    borradorRecuperado: cantidadConCambios > 0 ? borradorRecuperado : null,
    // Estudiantes cuya planilla cambió después de guardar (2026-11-23).
    cantidadPlanillaCambiada: contarPlanillaCambiada(estadoGuardado),
    datosBoletin,
    descartarBorrador,
    estadoGuardado,
    guardandoTodos,
    primerEstudianteConFormulario,
    progresoGrupo,
    actualizarObservacion,
    confirmarDescartarCambios,
    copiarLogrosYGuardar,
    guardarBoletinEstudiante,
    obtenerEstadoVisual,
  };
}
