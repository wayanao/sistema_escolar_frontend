import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { MORADO_BOTON } from "../../constants/colores";
import {
  listarPlanesAnioAnterior,
  obtenerPlanAnioAnterior,
} from "../../services/planeacionesApi";
import { mensajeDeErrorAnio } from "../../utils/anioLectivo";
import {
  crearClaveSinPlanesAnioAnterior,
  mensajePlanBaseUsado,
  normalizarPlanesAnioAnterior,
  textoDePlanBase,
} from "../../utils/planeaciones/profesor";

function anotadaSinPlanes(profesorId, asignacionId) {
  const clave = crearClaveSinPlanesAnioAnterior(profesorId, asignacionId);
  if (!clave) return false;
  try {
    return localStorage.getItem(clave) === "1";
  } catch {
    return false;
  }
}

function anotarSinPlanes(profesorId, asignacionId) {
  const clave = crearClaveSinPlanesAnioAnterior(profesorId, asignacionId);
  if (!clave) return;
  try {
    localStorage.setItem(clave, "1");
  } catch {
    // Si el navegador bloquea localStorage, solo se vuelve a preguntar.
  }
}

/**
 * Año lectivo, fase 7 (paso 7.4): "Usar un plan del año pasado".
 *
 * Al crear un plan (`creando`), pregunta al backend una vez por clase en cada
 * visita. Si no hay planes, lo anota en el navegador y no vuelve a preguntar
 * por esa clase (decisión del usuario del 2026-10-10). Al usar uno, pide su
 * texto y lo entrega a `onUsarTexto`; con cambios sin guardar, confirma antes.
 */
export default function usePlanesAnioAnteriorProfesor({
  profesorId,
  asignacionId,
  creando,
  hayCambios,
  onUsarTexto,
  onMensaje,
}) {
  const [listas, setListas] = useState({});
  const [abierto, setAbierto] = useState(false);
  const [usandoId, setUsandoId] = useState(null);
  const pedidasRef = useRef(new Set());
  const montadoRef = useRef(true);
  const vigenciaRef = useRef(0);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Otra clase u otra fecha: la lista abierta y un texto en camino ya no
    // corresponden.
    vigenciaRef.current += 1;
    setAbierto(false);
  }, [asignacionId, creando]);

  useEffect(() => {
    if (!creando || !asignacionId || !profesorId) return;
    const clave = String(asignacionId);
    if (pedidasRef.current.has(clave) || anotadaSinPlanes(profesorId, asignacionId)) return;

    pedidasRef.current.add(clave);
    listarPlanesAnioAnterior(asignacionId)
      .then((respuesta) => {
        const planes = normalizarPlanesAnioAnterior(respuesta);
        if (planes.length === 0) anotarSinPlanes(profesorId, asignacionId);
        // Cada clase guarda su lista: una respuesta tardía no pisa otra clase.
        if (montadoRef.current) setListas((actual) => ({ ...actual, [clave]: planes }));
      })
      .catch((error) => {
        // Sin respuesta no se anota nada: se vuelve a preguntar más adelante.
        pedidasRef.current.delete(clave);
        console.error("Error consultando los planes del año pasado", error);
      });
  }, [asignacionId, creando, profesorId]);

  const abrir = useCallback(() => setAbierto(true), []);
  const cerrar = useCallback(() => setAbierto(false), []);

  const usar = useCallback(async (plan) => {
    if (!asignacionId || !plan?.id) return;

    if (hayCambios) {
      const confirmacion = await Swal.fire({
        icon: "question",
        title: "¿Reemplazar lo que escribiste?",
        text: "El formulario se llenará con el texto del plan elegido. Lo que escribiste sin guardar se perderá.",
        showCancelButton: true,
        confirmButtonText: "Sí, usar este plan",
        cancelButtonText: "Cancelar",
        confirmButtonColor: MORADO_BOTON,
        reverseButtons: true,
      });
      if (!confirmacion.isConfirmed) return;
    }

    const vigencia = vigenciaRef.current;
    setUsandoId(plan.id);
    try {
      const respuesta = await obtenerPlanAnioAnterior(asignacionId, plan.id);
      if (vigencia !== vigenciaRef.current || !montadoRef.current) return;
      onUsarTexto(textoDePlanBase(respuesta));
      setAbierto(false);
      onMensaje(mensajePlanBaseUsado(plan.fecha));
    } catch (error) {
      if (vigencia !== vigenciaRef.current || !montadoRef.current) return;
      console.error("Error usando un plan del año pasado", error);
      onMensaje(mensajeDeErrorAnio(error, "No se pudo usar ese plan. Intenta nuevamente."));
    } finally {
      if (montadoRef.current) setUsandoId(null);
    }
  }, [asignacionId, hayCambios, onMensaje, onUsarTexto]);

  return {
    planes: listas[String(asignacionId)] || [],
    abierto,
    usandoId,
    abrir,
    cerrar,
    usar,
  };
}
