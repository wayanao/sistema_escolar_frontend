import { textoDatosGlobo } from "../../utils/dashboards/cumpleanos";
import { sombraContorno } from "../../utils/dashboards/globos";

const FORMA_GLOBO = "50% 50% 50% 50% / 42% 42% 58% 58%";

/**
 * Un globo de cumpleaños con todo adentro: el día, el nombre (letra gótica con
 * borde) y el curso con los años. Debajo, el nudo y la cinta rizada. Brillo y
 * sombra para que se vea inflado. Solo dibuja: el movimiento lo pone quien lo
 * usa con sus clases (`globo-flotar`, `globo-vaiven`).
 */
function GloboCumpleanos({ globo, grande = false, className = "", style }) {
  const { claro, base, oscuro, tinta } = globo.paleta;
  const sombraDatos = tinta === "#ffffff" ? "0 1px 2px rgba(0, 0, 0, 0.45)" : "0 1px 0 rgba(255, 255, 255, 0.6)";

  return (
    <span className={`flex w-full flex-col items-center ${className}`} style={style}>
      <span
        className="relative flex aspect-[118/140] w-full flex-col items-center justify-center gap-0.5 px-[11%] pb-[17%] pt-[13%] text-center"
        style={{
          borderRadius: FORMA_GLOBO,
          background: `radial-gradient(circle at 34% 28%, ${claro} 0%, ${base} 40%, ${oscuro} 100%)`,
          color: tinta,
          boxShadow:
            "inset -6px -10px 16px rgba(0, 0, 0, 0.18), inset 5px 6px 12px rgba(255, 255, 255, 0.2), 0 10px 18px rgba(42, 17, 80, 0.16)",
        }}
      >
        <span
          aria-hidden="true"
          className="absolute left-[16%] top-[9%] h-[30%] w-[21%] rotate-[-28deg] rounded-full"
          style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0) 70%)" }}
        />
        <span
          aria-hidden="true"
          className="absolute bottom-[19%] right-[17%] h-[9%] w-[10%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0) 70%)" }}
        />
        {globo.esHoy ? (
          <span className="relative rounded-full bg-white px-2 py-px text-[11px] font-extrabold uppercase tracking-[0.12em]" style={{ color: oscuro }}>
            {globo.etiqueta}
          </span>
        ) : (
          <span className="relative text-[10.5px] font-extrabold uppercase leading-tight tracking-[0.08em]" style={{ textShadow: sombraDatos }}>
            {globo.etiqueta}
          </span>
        )}
        <span
          className={`letra-gotica relative font-extrabold leading-[1.02] text-white ${grande ? "text-[18px]" : "text-[16px]"}`}
          style={{ textShadow: `${sombraContorno(oscuro)}, 0 3px 5px rgba(0, 0, 0, 0.3)` }}
          translate="no"
        >
          {globo.nombre}
        </span>
        <span
          className={`relative font-bold leading-tight ${grande ? "text-[12px]" : "text-[11px]"}`}
          style={{ textShadow: sombraDatos }}
        >
          {textoDatosGlobo(globo)}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="-mt-0.5 block h-[7px] w-[10px]"
        style={{ background: oscuro, clipPath: "polygon(28% 0, 72% 0, 100% 100%, 0 100%)" }}
      />
      <svg aria-hidden="true" viewBox="0 0 20 46" width="18" height="42" className="block">
        <path
          d="M10 0C16 4 16 10 10 12C4 14 4 20 10 22C16 24 16 30 10 32C6 34 8 40 10 46"
          fill="none"
          stroke={base}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default GloboCumpleanos;
