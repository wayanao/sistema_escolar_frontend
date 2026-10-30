import { useEffect, useRef, useState } from "react";

/**
 * El recuadro donde el acudiente firma con el dedo, un lápiz o el mouse.
 *
 * Componente propio sobre `<canvas>` y eventos de puntero, **sin librerías
 * nuevas** (`docs/funcionalidades/FIRMA_OBSERVADOR.md`). Avisa con
 * `onCambio(imagen)` cada vez que termina un trazo -la imagen es un PNG en
 * `data:`- y con `onCambio(null)` al borrar, así que nunca deja guardar una
 * firma en blanco.
 *
 * El lienzo tiene un tamaño interno **fijo** y en pantalla se estira al ancho
 * disponible: las coordenadas del dedo se convierten a ese tamaño, así que el
 * trazo cae donde se toca aunque el celular gire. Un PNG así, con trazos
 * oscuros sobre blanco, pesa pocos KB, lejos del límite de 100 KB del servidor.
 *
 * Para empezar de cero con otra anotación, quien lo usa le cambia la `key`.
 */

export const ANCHO_LIENZO = 900;
export const ALTO_LIENZO = 300;

const COLOR_TRAZO = "#0f172a";
const GROSOR_TRAZO = 4;

/** Fondo blanco: la firma se ve igual en pantalla y en el papel. */
function pintarFondo(lienzo) {
  const contexto = lienzo?.getContext?.("2d");
  if (!contexto) return;
  contexto.fillStyle = "#ffffff";
  contexto.fillRect(0, 0, lienzo.width, lienzo.height);
}

export default function RecuadroFirma({ onCambio, deshabilitado = false }) {
  const lienzoRef = useRef(null);
  const trazandoRef = useRef(false);
  const [hayTrazo, setHayTrazo] = useState(false);

  useEffect(() => {
    pintarFondo(lienzoRef.current);
  }, []);

  const punto = (evento) => {
    const lienzo = lienzoRef.current;
    const caja = lienzo.getBoundingClientRect();
    return {
      x: ((evento.clientX - caja.left) * lienzo.width) / (caja.width || lienzo.width),
      y: ((evento.clientY - caja.top) * lienzo.height) / (caja.height || lienzo.height),
    };
  };

  const empezar = (evento) => {
    if (deshabilitado) return;
    const contexto = lienzoRef.current?.getContext?.("2d");
    if (!contexto) return;

    evento.preventDefault();
    // Con la captura, el trazo sigue aunque el dedo salga un momento del
    // recuadro, y termina donde se levante.
    lienzoRef.current.setPointerCapture?.(evento.pointerId);
    trazandoRef.current = true;

    const { x, y } = punto(evento);
    contexto.strokeStyle = COLOR_TRAZO;
    contexto.lineWidth = GROSOR_TRAZO;
    contexto.lineCap = "round";
    contexto.lineJoin = "round";
    contexto.beginPath();
    contexto.moveTo(x, y);
    // Un toque sin mover el dedo también deja un punto.
    contexto.lineTo(x + 0.1, y + 0.1);
    contexto.stroke();
  };

  const seguir = (evento) => {
    if (!trazandoRef.current) return;
    const contexto = lienzoRef.current?.getContext?.("2d");
    if (!contexto) return;

    evento.preventDefault();
    const { x, y } = punto(evento);
    contexto.lineTo(x, y);
    contexto.stroke();
  };

  const terminar = () => {
    if (!trazandoRef.current) return;
    trazandoRef.current = false;
    setHayTrazo(true);
    onCambio?.(lienzoRef.current.toDataURL("image/png"));
  };

  const borrar = () => {
    pintarFondo(lienzoRef.current);
    setHayTrazo(false);
    onCambio?.(null);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={lienzoRef}
        width={ANCHO_LIENZO}
        height={ALTO_LIENZO}
        role="img"
        aria-label="Recuadro para la firma del acudiente"
        onPointerDown={empezar}
        onPointerMove={seguir}
        onPointerUp={terminar}
        onPointerCancel={terminar}
        onPointerLeave={terminar}
        className={`block aspect-[3/1] w-full touch-none rounded-lg border-2 border-dashed bg-white ${
          deshabilitado ? "cursor-not-allowed border-slate-200" : "cursor-crosshair border-slate-400"
        }`}
      />
      <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
        <span>{hayTrazo ? "Firma lista." : "Firme aquí con el dedo, un lápiz o el mouse."}</span>
        <button
          type="button"
          onClick={borrar}
          disabled={!hayTrazo || deshabilitado}
          className="rounded-lg border border-slate-300 px-3 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Borrar
        </button>
      </div>
    </div>
  );
}
