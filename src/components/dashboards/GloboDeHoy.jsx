import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import useGloboSuelto from "../../hooks/dashboards/useGloboSuelto";
import GloboCumpleanos from "./GloboCumpleanos";

const RETRASO_SOLTARSE = 1400;
const RETRASO_ENTRE_GLOBOS = 900;
const FORMA_GLOBO = "50% 50% 50% 50% / 42% 42% 58% 58%";

/**
 * El globo que sale a volar: el de quien cumple hoy (pedido del usuario,
 * 2026-11-11) y, desde el 2026-11-18, también el del día anterior para avisar
 * (`globoVuela` en `utils/dashboards/cumpleanos.js`). Espera un
 * momento en el muro meciéndose, se suelta y pasea por la parte de la pantalla
 * que se está viendo; en el muro queda su silueta con «¡Salió a volar!». Al
 * tocarlo o pasarle el ratón se zarandea de lado a lado. Va en una capa fija
 * por debajo del encabezado, la barra de abajo y los menús, y solo el globo
 * recibe clics: lo de debajo se sigue usando. Sin soporte de animación, o con
 * «reducir movimiento», se queda en el muro.
 */
function GloboDeHoy({ globo, areaRef, orden = 0, className = "" }) {
  const origenRef = useRef(null);
  const globoRef = useRef(null);
  const [meneos, setMeneos] = useState(0);
  const suelto = useGloboSuelto({
    globoRef,
    origenRef,
    areaRef,
    retraso: RETRASO_SOLTARSE + orden * RETRASO_ENTRE_GLOBOS,
  });
  const menear = () => setMeneos((cantidad) => cantidad + 1);

  return (
    <li ref={origenRef} className={`relative ${className}`}>
      <GloboCumpleanos
        globo={globo}
        grande
        className={`globo-flotar transition-opacity duration-300 ${suelto ? "opacity-0" : ""}`}
      />

      {suelto && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 flex aspect-[118/140] flex-col items-center justify-center gap-1 border-2 border-dashed bg-white/70 p-[12%] text-center text-[11px] font-extrabold leading-tight"
          style={{ borderColor: globo.paleta.base, color: globo.paleta.oscuro, borderRadius: FORMA_GLOBO }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
          <span>¡Salió a volar!</span>
          <span className="text-[10px] font-semibold">{globo.nombre}</span>
        </span>
      )}

      {suelto &&
        createPortal(
          <div
            ref={globoRef}
            aria-hidden="true"
            className="pointer-events-none fixed left-0 top-0 z-20"
            style={{ offsetRotate: "0deg", offsetAnchor: "50% 50%" }}
          >
            <button
              type="button"
              tabIndex={-1}
              onClick={menear}
              onMouseEnter={menear}
              className="pointer-events-auto block w-full cursor-pointer border-0 bg-transparent p-0"
            >
              {/* La clave cambia con cada toque: así el zarandeo vuelve a empezar. */}
              <span key={meneos} className={`block ${meneos ? "globo-meneo" : ""}`}>
                <GloboCumpleanos globo={globo} grande className="globo-vaiven" />
              </span>
            </button>
          </div>,
          document.body,
        )}
    </li>
  );
}

export default GloboDeHoy;
