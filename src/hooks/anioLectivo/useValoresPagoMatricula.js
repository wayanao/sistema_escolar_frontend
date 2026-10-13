import { useCallback, useEffect, useRef, useState } from "react";
import pagosApi from "../../services/pagosApi";
import {
  leerValorPersonalizado,
  mensajeDeErrorAnio,
  normalizarValoresPago,
} from "../../utils/anioLectivo";

const confirmarConVentana = (texto) => window.confirm(texto);

const BORRADOR_VACIO = Object.freeze({ valor: "", motivo: "" });

// Con valor personalizado, el campo trae ese valor; sin él, queda vacío.
function borradoresDe(filas) {
  return Object.fromEntries(
    filas.map((fila) => [
      fila.tipoPagoId,
      {
        valor: fila.personalizado ? String(fila.valorPersonalizado) : "",
        motivo: fila.motivo,
      },
    ]),
  );
}

// "Valores de pago" al matricular (2026-10-12): lo que se le cobra a un
// estudiante en el año en preparación y su valor personalizado. Lee con
// `GET /estudiantes/{id}/valores-pago` y guarda o quita con las mismas rutas
// y el mismo cuerpo de Pagos. El backend decide los precios y valida (que el
// concepto sea del curso del estudiante y que el año se pueda editar).
export default function useValoresPagoMatricula(
  anioPreparacion,
  { onCambio, confirmar = confirmarConVentana } = {},
) {
  const anioLectivoId = anioPreparacion?.id ?? null;
  const [estudiante, setEstudiante] = useState(null);
  const [filas, setFilas] = useState([]);
  const [borradores, setBorradores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [guardandoTipoId, setGuardandoTipoId] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  // Cada apertura o cierre cambia el turno: la respuesta de otro turno (otro
  // estudiante, o un recuadro ya cerrado) se descarta.
  const turno = useRef(0);

  const cerrar = useCallback(() => {
    turno.current += 1;
    setEstudiante(null);
    setFilas([]);
    setBorradores({});
    setCargando(false);
    setGuardandoTipoId(null);
    setMensaje("");
    setError("");
  }, []);

  // Si el año en preparación deja de serlo (por ejemplo, al activarlo), el
  // recuadro se cierra.
  const anioAbierto = useRef(anioLectivoId);
  useEffect(() => {
    if (anioAbierto.current === anioLectivoId) return;
    anioAbierto.current = anioLectivoId;
    cerrar();
  }, [anioLectivoId, cerrar]);

  const pedirFilas = useCallback(
    (estudianteId) =>
      pagosApi.obtenerValoresPagoEstudiante(estudianteId, {
        parametrosAnio: { anio_lectivo_id: anioLectivoId },
      }),
    [anioLectivoId],
  );

  const mostrar = useCallback((datos) => {
    const nuevas = normalizarValoresPago(datos);
    setFilas(nuevas);
    setBorradores(borradoresDe(nuevas));
  }, []);

  const abrir = useCallback(
    async (alumno) => {
      if (!anioLectivoId) return;
      turno.current += 1;
      const miTurno = turno.current;
      setEstudiante(alumno);
      setFilas([]);
      setBorradores({});
      setMensaje("");
      setError("");
      setCargando(true);
      try {
        const datos = await pedirFilas(alumno.id);
        if (turno.current === miTurno) mostrar(datos);
      } catch (err) {
        if (turno.current === miTurno) {
          setError(mensajeDeErrorAnio(err, "No se pudieron cargar los valores de pago."));
        }
      } finally {
        if (turno.current === miTurno) setCargando(false);
      }
    },
    [anioLectivoId, mostrar, pedirFilas],
  );

  const cambiarBorrador = useCallback((tipoPagoId, campo, valor) => {
    setBorradores((actuales) => ({
      ...actuales,
      [tipoPagoId]: { ...(actuales[tipoPagoId] ?? BORRADOR_VACIO), [campo]: valor },
    }));
  }, []);

  // Después de guardar o quitar: avisa a la página (el resumen cuenta los
  // valores especiales) y vuelve a pedir la lista. Si solo falla la recarga,
  // el cambio no se presenta como fallido.
  const trasCambio = useCallback(
    async (alumno, miTurno, texto) => {
      onCambio?.();
      if (turno.current !== miTurno) return;
      setMensaje(texto);
      try {
        const datos = await pedirFilas(alumno.id);
        if (turno.current === miTurno) mostrar(datos);
      } catch {
        if (turno.current === miTurno) {
          setError("El cambio se guardó, pero no se pudo actualizar la lista.");
        }
      }
    },
    [mostrar, onCambio, pedirFilas],
  );

  // Escribe en el backend y, si sale bien, sigue con `trasCambio`. Un rechazo
  // se muestra con su mensaje.
  const escribir = useCallback(
    async (tipoPagoId, accion, respaldo, textoExito) => {
      const alumno = estudiante;
      const miTurno = turno.current;
      setMensaje("");
      setError("");
      setGuardandoTipoId(tipoPagoId);
      try {
        await accion();
      } catch (err) {
        if (turno.current === miTurno) {
          setError(mensajeDeErrorAnio(err, respaldo));
          setGuardandoTipoId(null);
        }
        return;
      }
      await trasCambio(alumno, miTurno, textoExito);
      if (turno.current === miTurno) setGuardandoTipoId(null);
    },
    [estudiante, trasCambio],
  );

  const guardar = useCallback(
    async (tipoPagoId) => {
      const fila = filas.find((item) => item.tipoPagoId === tipoPagoId);
      if (!estudiante || !fila) return;
      const borrador = borradores[tipoPagoId] ?? BORRADOR_VACIO;
      const { valido, valor } = leerValorPersonalizado(borrador.valor);
      if (!valido) {
        setMensaje("");
        setError(`Escribe un valor de cero o más para ${fila.nombre}.`);
        return;
      }
      await escribir(
        tipoPagoId,
        () =>
          pagosApi.guardarValorPersonalizado(estudiante.id, tipoPagoId, {
            valor,
            motivo: borrador.motivo,
            activo: true,
          }),
        `No se pudo guardar el valor de ${fila.nombre}.`,
        `Se guardó el valor de ${fila.nombre} para ${estudiante.nombre}.`,
      );
    },
    [borradores, escribir, estudiante, filas],
  );

  const volverAlPrecio = useCallback(
    async (tipoPagoId) => {
      const fila = filas.find((item) => item.tipoPagoId === tipoPagoId);
      if (!estudiante || !fila) return;
      const confirmado = confirmar(
        `¿Quitar el valor personalizado de ${fila.nombre}? ${estudiante.nombre} volverá a pagar el precio del curso.`,
      );
      if (!confirmado) return;
      await escribir(
        tipoPagoId,
        () => pagosApi.quitarValorPersonalizado(estudiante.id, tipoPagoId),
        `No se pudo quitar el valor de ${fila.nombre}.`,
        `${fila.nombre} vuelve al precio del curso para ${estudiante.nombre}.`,
      );
    },
    [confirmar, escribir, estudiante, filas],
  );

  return {
    estudiante,
    filas,
    borradores,
    cargando,
    guardandoTipoId,
    mensaje,
    error,
    abrir,
    cerrar,
    cambiarBorrador,
    guardar,
    volverAlPrecio,
  };
}
