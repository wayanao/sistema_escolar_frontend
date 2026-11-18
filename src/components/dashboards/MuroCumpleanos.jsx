import { useRef } from "react";
import useFuenteGotica from "../../hooks/dashboards/useFuenteGotica";
import { MAX_GLOBOS_SUELTOS, globosDeCumpleanos } from "../../utils/dashboards/cumpleanos";
import { banderinesMuro, sombraContorno } from "../../utils/dashboards/globos";
import CaminitoCargando from "./CaminitoCargando";
import GloboCumpleanos from "./GloboCumpleanos";
import GloboDeHoy from "./GloboDeHoy";

// En celular caben tres por fila; en PC crecen para llenar el muro.
const ANCHO_GLOBO = "w-[clamp(96px,9.4vw,124px)]";
const ANCHO_GLOBO_HOY = "w-[clamp(108px,10.6vw,136px)]";
// Alturas e inclinaciones distintas para que no queden en fila como soldados.
const DESFASES = ["mt-0", "mt-3.5", "mt-1", "mt-[18px]", "mt-2"];
const INCLINACIONES = [0, -3, 3, -2, 2.5];

function Serpentina({ derecha = false, colores }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 96 74"
      width="120"
      height="92"
      className={`pointer-events-none absolute -top-1 ${derecha ? "-right-1.5 -scale-x-100" : "-left-1.5"}`}
    >
      <path d="M2 10C16 8 14 26 28 24S38 6 52 10 54 30 68 28 80 14 92 18" fill="none" stroke={colores[0]} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M4 40C14 34 22 50 32 44S40 26 52 32 58 54 70 50" fill="none" stroke={colores[1]} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

// «CUMPLEAÑOS», una letra por banderín, colgando de un cordón.
function Banderines() {
  return (
    <div aria-hidden="true" className="relative mx-auto flex w-fit max-w-full items-start justify-center gap-[clamp(2px,0.4vw,6px)] px-1.5">
      <svg
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        className="absolute -left-3 top-0 h-6 w-[calc(100%+24px)] overflow-visible text-purple-700"
      >
        <path d="M0 3Q50 23 100 3" fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      {banderinesMuro().map((banderin, indice) => (
        <span
          key={indice}
          className="letra-gotica flex aspect-[42/54] w-[clamp(26px,3.6vw,50px)] justify-center pt-[clamp(3px,0.55vw,7px)] text-[clamp(16px,2.1vw,28px)] font-black leading-none text-white"
          style={{
            marginTop: `${banderin.caida}px`,
            background: `linear-gradient(180deg, ${banderin.color} 0%, ${banderin.sombra} 150%)`,
            clipPath: "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)",
            transform: `rotate(${banderin.giro}deg)`,
            transformOrigin: "50% 0",
            textShadow: `${sombraContorno(banderin.sombra)}, 0 2px 0 ${banderin.sombra}`,
          }}
        >
          {banderin.letra}
        </span>
      ))}
    </div>
  );
}

/**
 * Muro de fiestas con los cumpleaños de la semana (pedido del usuario,
 * 2026-11-11), al final del panel del admin y del profesor: banderines de
 * «CUMPLEAÑOS», la cinta «de la semana» y un globo por estudiante con el día,
 * el nombre, el curso y los años. Los que vuelan (`globoVuela`: hoy, mañana y,
 * los viernes, el fin de semana y el lunes) se sueltan y pasean por la
 * pantalla (`GloboDeHoy`, hasta tres, primero los más cercanos); los demás se
 * quedan quietos.
 */
function MuroCumpleanos({ estudiantes = [], loading = false, error = "", emptyText, ahora = new Date(), className = "" }) {
  useFuenteGotica();
  const areaRef = useRef(null);
  const globos = globosDeCumpleanos(estudiantes, ahora);
  let sueltos = 0;

  return (
    <section
      ref={areaRef}
      aria-labelledby="titulo-muro-cumpleanos"
      className={`muro-fiesta relative overflow-hidden rounded-[26px] border border-pink-200 px-3 pb-[18px] pt-2 shadow-sm sm:px-6 ${className}`}
    >
      <h2 id="titulo-muro-cumpleanos" className="sr-only">
        Cumpleaños de la semana
      </h2>
      <Serpentina colores={["#f472b6", "#38bdf8"]} />
      <Serpentina derecha colores={["#fbbf24", "#a78bfa"]} />
      <Banderines />
      <p
        aria-hidden="true"
        className="letra-gotica mx-auto mt-2 w-fit bg-purple-950 px-7 pb-[5px] pt-[3px] text-[clamp(15px,1.7vw,22px)] font-bold leading-tight tracking-[0.04em] text-white"
        style={{ clipPath: "polygon(0 0, 100% 0, 93% 50%, 100% 100%, 0 100%, 7% 50%)" }}
      >
        de la semana
      </p>

      {loading ? (
        <CaminitoCargando etiqueta="Buscando cumpleaños de la semana" className="relative mx-auto mb-2 mt-6 max-w-sm" />
      ) : error ? (
        <p role="alert" className="relative mx-auto mt-4 w-fit rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : !globos.length ? (
        <p className="relative mt-4 text-center text-sm text-slate-600">{emptyText}</p>
      ) : (
        <ul className="relative mt-2.5 flex flex-wrap items-start justify-evenly gap-x-1.5 gap-y-1">
          {globos.map((globo, indice) => {
            const desfase = DESFASES[indice % DESFASES.length];
            if (globo.vuela && sueltos < MAX_GLOBOS_SUELTOS) {
              sueltos += 1;
              return (
                <GloboDeHoy
                  key={globo.id}
                  globo={globo}
                  areaRef={areaRef}
                  orden={sueltos - 1}
                  className={`${ANCHO_GLOBO_HOY} ${desfase}`}
                />
              );
            }
            return (
              <li key={globo.id} className={`${globo.esHoy ? ANCHO_GLOBO_HOY : ANCHO_GLOBO} ${desfase}`}>
                <GloboCumpleanos
                  globo={globo}
                  grande={globo.esHoy}
                  className={globo.esHoy ? "globo-flotar" : ""}
                  style={
                    globo.esHoy
                      ? undefined
                      : { transform: `rotate(${INCLINACIONES[indice % INCLINACIONES.length]}deg)`, transformOrigin: "50% 72%" }
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default MuroCumpleanos;
