import { useCallback, useRef, useState } from "react";
import Swal from "sweetalert2";
import pagosApi from "../../services/pagosApi";
import {
  leerValorPersonalizado,
  mensajeDeErrorAnio,
  normalizarValoresPago,
} from "../../utils/anioLectivo";

const BORRADOR_VACIO = Object.freeze({ valor: "", motivo: "" });

// Con valor personalizado, el campo trae ese valor; sin él, queda vacío.
const borradoresDe = (filas) =>
  Object.fromEntries(
    filas.map((fila) => [
      fila.tipoPagoId,
      {
        valor: fila.personalizado ? String(fila.valorPersonalizado) : "",
        motivo: fila.motivo,
      },
    ])
  );

// Valores personalizados con el recuadro "Valores de pago" de matricular
// (paso 3, 2026-11-03): una fila por concepto que se le cobra en el año del
// pago, con el precio de su curso. Las filas se piden al abrir el recuadro
// (`GET /estudiantes/:id/valores-pago`); guardar y quitar usan las mismas
// rutas de antes. Después de un cambio se actualizan lo que debe y sus meses,
// porque el valor cambia lo que se cobra.
export default function useValoresPersonalizadosPago({
  selectedEstudiante,
  parametrosAnio,
  actualizarValoresPersonalizados,
  cargarDeudasEstudiante,
  cargarOpcionesVencidas,
}) {
  const [filasValoresPago, setFilasValoresPago] = useState([]);
  const [borradoresValoresPago, setBorradoresValoresPago] = useState({});
  const [cargandoValoresPago, setCargandoValoresPago] = useState(false);
  const [guardandoTipoId, setGuardandoTipoId] = useState(null);
  const [mensajeValoresPago, setMensajeValoresPago] = useState("");
  const [errorValoresPago, setErrorValoresPago] = useState("");
  // Cada apertura o reinicio cambia el turno: una respuesta de otro turno
  // (otro estudiante u otro año) se descarta.
  const turno = useRef(0);

  const reiniciarValorPersonalizado = useCallback(() => {
    turno.current += 1;
    setFilasValoresPago([]);
    setBorradoresValoresPago({});
    setCargandoValoresPago(false);
    setGuardandoTipoId(null);
    setMensajeValoresPago("");
    setErrorValoresPago("");
  }, []);

  const pedirFilas = (estudianteId) =>
    parametrosAnio?.anio_lectivo_id
      ? pagosApi.obtenerValoresPagoEstudiante(estudianteId, { parametrosAnio })
      : pagosApi.obtenerValoresPagoEstudiante(estudianteId);

  const mostrarFilas = (datos) => {
    const filas = normalizarValoresPago(datos);
    setFilasValoresPago(filas);
    setBorradoresValoresPago(borradoresDe(filas));
  };

  const abrirValoresPago = async () => {
    if (!selectedEstudiante) return;
    turno.current += 1;
    const miTurno = turno.current;
    setFilasValoresPago([]);
    setBorradoresValoresPago({});
    setMensajeValoresPago("");
    setErrorValoresPago("");
    setCargandoValoresPago(true);
    try {
      const datos = await pedirFilas(selectedEstudiante.id);
      if (turno.current === miTurno) mostrarFilas(datos);
    } catch (error) {
      if (turno.current === miTurno) {
        setErrorValoresPago(
          mensajeDeErrorAnio(error, "No se pudieron cargar los valores de pago.")
        );
      }
    } finally {
      if (turno.current === miTurno) setCargandoValoresPago(false);
    }
  };

  const cambiarBorradorValorPago = (tipoPagoId, campo, valor) =>
    setBorradoresValoresPago((actuales) => ({
      ...actuales,
      [tipoPagoId]: { ...(actuales[tipoPagoId] ?? BORRADOR_VACIO), [campo]: valor },
    }));

  // Después de guardar o quitar. Si se eligió otro estudiante mientras tanto,
  // no se toca nada de lo que se ve. Si solo falla la recarga de la lista, el
  // cambio no se presenta como fallido.
  const trasCambio = async (estudianteId, miTurno, texto) => {
    if (turno.current !== miTurno) return;
    cargarDeudasEstudiante(estudianteId);
    cargarOpcionesVencidas(estudianteId);
    setMensajeValoresPago(texto);
    try {
      const datos = await pedirFilas(estudianteId);
      if (turno.current === miTurno) mostrarFilas(datos);
    } catch {
      if (turno.current === miTurno) {
        setErrorValoresPago("El cambio se guardó, pero no se pudo actualizar la lista.");
      }
    }
  };

  const guardarValorPago = async (tipoPagoId) => {
    const fila = filasValoresPago.find((item) => item.tipoPagoId === tipoPagoId);
    if (!selectedEstudiante || !fila) return;
    const borrador = borradoresValoresPago[tipoPagoId] ?? BORRADOR_VACIO;
    const { valido, valor } = leerValorPersonalizado(borrador.valor);
    if (!valido) {
      setMensajeValoresPago("");
      setErrorValoresPago(`Escribe un valor de cero o más para ${fila.nombre}.`);
      return;
    }

    const estudiante = selectedEstudiante;
    const miTurno = turno.current;
    setMensajeValoresPago("");
    setErrorValoresPago("");
    setGuardandoTipoId(tipoPagoId);
    try {
      const data = await pagosApi.guardarValorPersonalizado(estudiante.id, tipoPagoId, {
        valor,
        motivo: borrador.motivo,
        activo: true,
      });
      if (turno.current === miTurno) actualizarValoresPersonalizados(data.valores || []);
    } catch (error) {
      console.error("Error guardando valor personalizado:", error);
      if (turno.current === miTurno) {
        setErrorValoresPago(
          mensajeDeErrorAnio(error, `No se pudo guardar el valor de ${fila.nombre}.`)
        );
        setGuardandoTipoId(null);
      }
      return;
    }
    await trasCambio(
      estudiante.id,
      miTurno,
      `Se guardó el valor de ${fila.nombre} para ${estudiante.nombre}.`
    );
    if (turno.current === miTurno) setGuardandoTipoId(null);
  };

  const volverAlPrecio = async (tipoPagoId) => {
    const fila = filasValoresPago.find((item) => item.tipoPagoId === tipoPagoId);
    if (!selectedEstudiante || !fila) return;
    const estudiante = selectedEstudiante;
    const miTurno = turno.current;
    const result = await Swal.fire({
      title: "¿Volver al precio del curso?",
      text: `${estudiante.nombre} volverá a pagar el precio del curso en ${fila.nombre}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Volver al precio",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    setMensajeValoresPago("");
    setErrorValoresPago("");
    setGuardandoTipoId(tipoPagoId);
    try {
      await pagosApi.quitarValorPersonalizado(estudiante.id, tipoPagoId);
      if (turno.current === miTurno) {
        actualizarValoresPersonalizados((actuales) =>
          actuales.filter((item) => Number(item.tipo_pago_id) !== Number(tipoPagoId))
        );
      }
    } catch (error) {
      console.error("Error quitando valor personalizado:", error);
      if (turno.current === miTurno) {
        setErrorValoresPago(
          mensajeDeErrorAnio(error, `No se pudo quitar el valor de ${fila.nombre}.`)
        );
        setGuardandoTipoId(null);
      }
      return;
    }
    await trasCambio(
      estudiante.id,
      miTurno,
      `${fila.nombre} vuelve al precio del curso para ${estudiante.nombre}.`
    );
    if (turno.current === miTurno) setGuardandoTipoId(null);
  };

  return {
    filasValoresPago,
    borradoresValoresPago,
    cargandoValoresPago,
    guardandoTipoId,
    mensajeValoresPago,
    errorValoresPago,
    reiniciarValorPersonalizado,
    abrirValoresPago,
    cambiarBorradorValorPago,
    guardarValorPago,
    volverAlPrecio,
  };
}
