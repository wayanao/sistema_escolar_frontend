import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { guardarPeriodoProfesor, obtenerPeriodoProfesor } from "../../utils/periodoProfesor";
import {
  crearClaveCamposRecordados,
  ESTADO_INICIAL_PLAN,
} from "../../utils/planeaciones/profesor";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function crearEstadoGuardado(overrides = {}) {
  return {
    cargando: false,
    guardado: false,
    modificado: false,
    guardadoEn: null,
    ...overrides,
  };
}

function obtenerCamposRecordados(profesorId, asignacionId) {
  const clave = crearClaveCamposRecordados(profesorId, asignacionId);
  if (!clave) return {};

  try {
    const guardado = localStorage.getItem(clave);
    if (!guardado) return {};
    const data = JSON.parse(guardado);

    return {
      unidad: typeof data.unidad === "string" ? data.unidad : "",
      estandar: typeof data.estandar === "string" ? data.estandar : "",
    };
  } catch {
    return {};
  }
}

function guardarCamposRecordados(profesorId, asignacionId, form) {
  const clave = crearClaveCamposRecordados(profesorId, asignacionId);
  if (!clave) return;

  try {
    localStorage.setItem(
      clave,
      JSON.stringify({
        unidad: form.unidad || "",
        estandar: form.estandar || "",
      }),
    );
  } catch {
    // El guardado remoto no debe fallar si el navegador bloquea localStorage.
  }
}

export default function useFormularioPlaneacionProfesor({
  profesorId,
  asignacionId,
  fechaInicial,
}) {
  const [periodo, setPeriodo] = useState(() => obtenerPeriodoProfesor());
  const [fecha, setFecha] = useState(fechaInicial);
  const [form, setForm] = useState(ESTADO_INICIAL_PLAN);
  const [imagenes, setImagenes] = useState({ imagen1: null, imagen2: null });
  const [imagenesGuardadas, setImagenesGuardadas] = useState({
    imagen1: null,
    imagen2: null,
  });
  const [estadoGuardado, setEstadoGuardado] = useState(() =>
    crearEstadoGuardado(),
  );
  const imagenInputRefs = useRef({ imagen1: null, imagen2: null });

  const imagenesSeleccionadas = useMemo(
    () =>
      Object.entries(imagenes).reduce((acc, [slot, imagen]) => {
        if (imagen) {
          acc[slot] = {
            nombre: imagen.name,
            url: URL.createObjectURL(imagen),
          };
        }
        return acc;
      }, {}),
    [imagenes],
  );

  useEffect(() => {
    return () => {
      Object.values(imagenesSeleccionadas).forEach((imagen) =>
        URL.revokeObjectURL(imagen.url),
      );
    };
  }, [imagenesSeleccionadas]);

  useEffect(() => {
    guardarPeriodoProfesor(periodo);
  }, [periodo]);

  const registrarInputImagen = useCallback((slot, element) => {
    imagenInputRefs.current[slot] = element;
  }, []);

  const limpiarInputsImagen = useCallback(() => {
    Object.values(imagenInputRefs.current).forEach((input) => {
      if (input) input.value = "";
    });
  }, []);

  const actualizarCampo = useCallback((campo, valor) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    setEstadoGuardado((actual) => ({ ...actual, modificado: true }));
  }, []);

  const actualizarPeriodo = useCallback((valor) => {
    setPeriodo(valor);
    setEstadoGuardado((actual) => ({ ...actual, modificado: true }));
  }, []);

  const manejarImagen = useCallback((slot, event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setImagenes((actual) => ({ ...actual, [slot]: null }));
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      window.alert("Solo se permiten imagenes PNG, JPG, JPEG o WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      window.alert("La imagen no puede superar 5MB.");
      event.target.value = "";
      return;
    }

    setImagenes((actual) => ({ ...actual, [slot]: file }));
    setEstadoGuardado((actual) => ({ ...actual, modificado: true }));
  }, []);

  const iniciarCarga = useCallback(() => {
    setEstadoGuardado(crearEstadoGuardado({ cargando: true }));
  }, []);

  const cargarDesdePlan = useCallback((plan) => {
    setImagenesGuardadas({
      imagen1: plan.imagen1 || null,
      imagen2: plan.imagen2 || null,
    });
    setPeriodo(String(plan.periodo || "1"));
    setForm({
      unidad: plan.unidad || "",
      proposito: plan.proposito || "",
      clase: plan.clase || "",
      estandar: plan.estandar || "",
      dba: plan.dba || "",
      competencias: plan.competencias || "",
      actividad_casa: plan.actividad_casa || "",
      tema: plan.tema || "",
    });
    setImagenes({ imagen1: null, imagen2: null });
    limpiarInputsImagen();
    setEstadoGuardado(crearEstadoGuardado({ guardado: true }));
  }, [limpiarInputsImagen]);

  const prepararPlanNuevo = useCallback(() => {
    setImagenesGuardadas({ imagen1: null, imagen2: null });
    setImagenes({ imagen1: null, imagen2: null });
    limpiarInputsImagen();
    setForm({
      ...ESTADO_INICIAL_PLAN,
      ...obtenerCamposRecordados(profesorId, asignacionId),
    });
    setEstadoGuardado(crearEstadoGuardado());
  }, [asignacionId, limpiarInputsImagen, profesorId]);

  const marcarCargaFallida = useCallback(() => {
    setEstadoGuardado(crearEstadoGuardado());
  }, []);

  const marcarGuardado = useCallback((guardadoEn) => {
    setImagenes({ imagen1: null, imagen2: null });
    limpiarInputsImagen();
    setEstadoGuardado(crearEstadoGuardado({
      guardado: true,
      guardadoEn: guardadoEn || null,
    }));
  }, [limpiarInputsImagen]);

  const actualizarImagenGuardada = useCallback((slot, valor) => {
    setImagenesGuardadas((actual) => ({ ...actual, [slot]: valor }));
  }, []);

  const recordarCampos = useCallback(() => {
    guardarCamposRecordados(profesorId, asignacionId, form);
  }, [asignacionId, form, profesorId]);

  return {
    periodo,
    fecha,
    form,
    imagenes,
    imagenesGuardadas,
    imagenesSeleccionadas,
    estadoGuardado,
    setFecha,
    actualizarCampo,
    actualizarPeriodo,
    manejarImagen,
    registrarInputImagen,
    iniciarCarga,
    cargarDesdePlan,
    prepararPlanNuevo,
    marcarCargaFallida,
    marcarGuardado,
    actualizarImagenGuardada,
    recordarCampos,
  };
}
