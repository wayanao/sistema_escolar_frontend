// Dibujo del aula del login, tal como el diseño del usuario (2026-11-05): tres
// niños en sus pupitres (uno levanta la mano), el tablero y tres etiquetas
// flotando. Solo se ve al lado del formulario (desde 1024 px); más angosto va
// primero el formulario. Las animaciones están en index.css (`login-*`) y se quedan
// quietas si el equipo pide menos movimiento.

const ETIQUETAS = [
  {
    texto: "Boletines",
    posicion: "left-[-20px] top-[38%]",
    colores: "bg-white text-[#36195f]",
    fondoIcono: "bg-[#bef264]",
    trazo: "#36195f",
    retraso: "0s",
    icono: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
        <path d="m9 15 2 2 4-4" />
      </>
    ),
  },
  {
    texto: "Horarios",
    posicion: "right-[12%] top-[-14px]",
    colores: "bg-white text-[#36195f]",
    fondoIcono: "bg-[#ede9fe]",
    trazo: "#562897",
    retraso: "-1.8s",
    icono: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    texto: "Planeadores",
    posicion: "bottom-[18%] right-[-16px]",
    colores: "bg-[#36195f] text-white",
    fondoIcono: "bg-[#bef264]",
    trazo: "#36195f",
    retraso: "-3.2s",
    icono: (
      <>
        <path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2.5z" />
        <path d="M8 7h7M8 11h5" />
      </>
    ),
  },
];

function EtiquetaFlotante({ texto, posicion, colores, fondoIcono, trazo, retraso, icono }) {
  return (
    <span
      className={`login-etiqueta absolute z-[2] flex items-center gap-2 rounded-full py-2.5 pl-2.5 pr-4 text-sm font-extrabold shadow-[0_12px_24px_-10px_rgba(20,6,50,0.6)] ${posicion} ${colores}`}
      style={{ animationDelay: retraso }}
    >
      <span aria-hidden="true" className={`flex h-[30px] w-[30px] items-center justify-center rounded-full ${fondoIcono}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={trazo} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {icono}
        </svg>
      </span>
      {texto}
    </span>
  );
}

export default function IlustracionAulaLogin() {
  return (
    <div className="login-entrada relative w-full max-w-[720px]">
      {ETIQUETAS.map((etiqueta) => (
        <EtiquetaFlotante key={etiqueta.texto} {...etiqueta} />
      ))}

      <svg
        role="img"
        aria-label="Ilustración de un aula con tres niños sentados en sus pupitres, uno levanta la mano"
        viewBox="0 0 720 600"
        className="block h-auto w-full rounded-[28px] shadow-[0_30px_60px_-30px_rgba(15,4,40,0.8)]"
      >
        <rect x="0" y="0" width="720" height="600" rx="28" fill="#7b4fd0" />
        <rect x="0" y="420" width="720" height="180" fill="#4a2391" />
        <rect x="0" y="408" width="720" height="14" fill="#3b1a78" />
        <path d="M0 572 L720 572 L720 600 L0 600 Z" fill="#3b1a78" />
        <g opacity="0.35" stroke="#3b1a78" strokeWidth="2">
          <path d="M0 460 H720" />
          <path d="M0 510 H720" />
        </g>

        {/* Ventana */}
        <g>
          <rect x="36" y="62" width="128" height="160" rx="10" fill="#ffffff" />
          <rect x="46" y="72" width="108" height="140" rx="4" fill="#e9dcff" />
          <circle cx="122" cy="108" r="18" fill="#bef264" />
          <path d="M46 178 Q80 150 110 172 Q132 158 154 170 L154 212 L46 212 Z" fill="#c4b0f0" />
          <path d="M100 72 V212 M46 142 H154" stroke="#ffffff" strokeWidth="7" />
        </g>

        {/* Tablero */}
        <g>
          <rect x="206" y="56" width="320" height="176" rx="10" fill="#b8814f" />
          <rect x="218" y="68" width="296" height="152" rx="4" fill="#2b1352" />
          <text x="244" y="128" fontFamily="Caveat, cursive" fontSize="50" fontWeight="700" fill="#ffffff">
            ¡Hola, clase!
          </text>
          <text x="252" y="190" fontFamily="Caveat, cursive" fontSize="32" fontWeight="700" fill="#bef264">
            2 + 3 = 5
          </text>
          <path d="M420 176 l10 -14 l10 14 l-16 -9 h12 z" fill="none" stroke="#f9a8d4" strokeWidth="3" strokeLinejoin="round" />
          <path d="M454 160 q8 -12 16 0 q8 -12 16 0 q0 12 -16 22 q-16 -10 -16 -22 z" fill="none" stroke="#ffffff" strokeWidth="3" />
          <rect x="250" y="226" width="232" height="10" rx="3" fill="#8f6038" />
          <rect x="290" y="219" width="22" height="7" rx="2" fill="#ffffff" />
          <rect x="320" y="219" width="16" height="7" rx="2" fill="#f9a8d4" />
        </g>

        {/* Reloj y cartelera */}
        <g>
          <circle cx="612" cy="110" r="40" fill="#ffffff" />
          <circle cx="612" cy="110" r="33" fill="#f3edfc" />
          <path d="M612 110 V88 M612 110 L628 118" stroke="#2b1352" strokeWidth="5" strokeLinecap="round" />
          <circle cx="612" cy="110" r="4" fill="#2b1352" />
        </g>
        <g>
          <rect x="570" y="176" width="86" height="58" rx="6" fill="#bef264" />
          <path d="M584 196 H642 M584 212 H628" stroke="#4a2391" strokeWidth="4" strokeLinecap="round" />
          <circle cx="613" cy="180" r="5" fill="#e11d48" />
        </g>

        {/* Niña con moños */}
        <g className="login-balanceo">
          <circle cx="112" cy="292" r="20" fill="#2b1a12" />
          <circle cx="228" cy="292" r="20" fill="#2b1a12" />
          <circle cx="112" cy="292" r="7" fill="#f472b6" />
          <circle cx="228" cy="292" r="7" fill="#f472b6" />
          <path d="M118 450 Q118 372 170 364 Q222 372 222 450 Z" fill="#bef264" />
          <path d="M156 364 Q170 380 184 364" fill="none" stroke="#86b832" strokeWidth="4" />
          <rect x="160" y="340" width="20" height="26" fill="#8d5a3b" />
          <circle cx="170" cy="300" r="50" fill="#8d5a3b" />
          <path d="M120 296 Q124 242 170 244 Q216 242 220 296 Q204 266 172 268 Q150 270 136 284 Q128 290 120 296 Z" fill="#2b1a12" />
          <g className="login-parpadeo">
            <ellipse cx="152" cy="306" rx="9" ry="12" fill="#1e0f33" />
            <ellipse cx="188" cy="306" rx="9" ry="12" fill="#1e0f33" />
            <circle cx="155" cy="301" r="3.5" fill="#ffffff" />
            <circle cx="191" cy="301" r="3.5" fill="#ffffff" />
          </g>
          <path d="M140 288 Q151 282 160 288 M180 288 Q189 282 200 288" fill="none" stroke="#2b1a12" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="138" cy="324" rx="9" ry="6" fill="#f472b6" opacity="0.45" />
          <ellipse cx="202" cy="324" rx="9" ry="6" fill="#f472b6" opacity="0.45" />
          <path d="M156 328 Q170 344 184 328 Z" fill="#7a1f3d" />
        </g>

        {/* Niño que levanta la mano */}
        <g className="login-balanceo" style={{ animationDelay: "-1.1s" }}>
          <g className="login-saludo" style={{ transformOrigin: "398px 392px" }}>
            <path d="M398 392 Q420 330 432 262" fill="none" stroke="#ffffff" strokeWidth="22" strokeLinecap="round" />
            <circle cx="434" cy="248" r="15" fill="#f1c7a3" />
          </g>
          <path d="M308 450 Q308 372 360 364 Q412 372 412 450 Z" fill="#ffffff" />
          <path d="M326 400 H394" stroke="#a78bfa" strokeWidth="8" />
          <path d="M330 420 H390" stroke="#a78bfa" strokeWidth="8" />
          <rect x="350" y="340" width="20" height="26" fill="#f1c7a3" />
          <circle cx="360" cy="298" r="50" fill="#f1c7a3" />
          <path d="M310 292 Q306 244 340 240 L346 226 L362 240 L374 222 L384 242 Q414 248 410 292 Q396 266 368 266 Q336 264 310 292 Z" fill="#d9772e" />
          <g className="login-parpadeo" style={{ animationDelay: "-1.5s" }}>
            <ellipse cx="343" cy="306" rx="9" ry="12" fill="#1e0f33" />
            <ellipse cx="377" cy="306" rx="9" ry="12" fill="#1e0f33" />
            <circle cx="346" cy="301" r="3.5" fill="#ffffff" />
            <circle cx="380" cy="301" r="3.5" fill="#ffffff" />
          </g>
          <path d="M332 286 Q342 279 352 286 M368 286 Q378 279 388 286" fill="none" stroke="#a24f16" strokeWidth="3" strokeLinecap="round" />
          <circle cx="336" cy="320" r="2" fill="#c97b52" />
          <circle cx="342" cy="324" r="2" fill="#c97b52" />
          <circle cx="378" cy="324" r="2" fill="#c97b52" />
          <circle cx="384" cy="320" r="2" fill="#c97b52" />
          <path d="M344 328 Q360 342 376 328" fill="none" stroke="#7a1f3d" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Niña con gafas */}
        <g className="login-balanceo" style={{ animationDelay: "-2.2s" }}>
          <circle cx="508" cy="270" r="22" fill="#3a2117" />
          <circle cx="530" cy="250" r="22" fill="#3a2117" />
          <circle cx="556" cy="242" r="22" fill="#3a2117" />
          <circle cx="582" cy="250" r="22" fill="#3a2117" />
          <circle cx="604" cy="270" r="22" fill="#3a2117" />
          <circle cx="500" cy="298" r="18" fill="#3a2117" />
          <circle cx="612" cy="298" r="18" fill="#3a2117" />
          <path d="M506 450 Q506 372 556 364 Q606 372 606 450 Z" fill="#f9a8d4" />
          <path d="M540 366 L556 384 L572 366" fill="#ffffff" />
          <rect x="546" y="340" width="20" height="26" fill="#c58b62" />
          <circle cx="556" cy="302" r="48" fill="#c58b62" />
          <path d="M512 290 Q520 258 556 260 Q592 258 600 290 Q584 276 556 278 Q528 276 512 290 Z" fill="#3a2117" />
          <g className="login-parpadeo" style={{ animationDelay: "-3s" }}>
            <ellipse cx="539" cy="310" rx="8" ry="11" fill="#1e0f33" />
            <ellipse cx="573" cy="310" rx="8" ry="11" fill="#1e0f33" />
            <circle cx="542" cy="305" r="3" fill="#ffffff" />
            <circle cx="576" cy="305" r="3" fill="#ffffff" />
          </g>
          <circle cx="539" cy="310" r="17" fill="none" stroke="#562897" strokeWidth="4" />
          <circle cx="573" cy="310" r="17" fill="none" stroke="#562897" strokeWidth="4" />
          <path d="M556 308 H556" stroke="#562897" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="526" cy="332" rx="8" ry="5" fill="#f472b6" opacity="0.45" />
          <ellipse cx="586" cy="332" rx="8" ry="5" fill="#f472b6" opacity="0.45" />
          <path d="M546 336 Q556 344 566 336" fill="none" stroke="#7a1f3d" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Pupitres y útiles */}
        <g>
          <rect x="86" y="438" width="168" height="20" rx="6" fill="#d39a64" />
          <rect x="96" y="458" width="148" height="70" rx="6" fill="#a8703f" />
          <rect x="276" y="438" width="168" height="20" rx="6" fill="#d39a64" />
          <rect x="286" y="458" width="148" height="70" rx="6" fill="#a8703f" />
          <rect x="472" y="438" width="168" height="20" rx="6" fill="#d39a64" />
          <rect x="482" y="458" width="148" height="70" rx="6" fill="#a8703f" />
          <g fill="#4a2391">
            <rect x="100" y="516" width="12" height="56" rx="3" />
            <rect x="228" y="516" width="12" height="56" rx="3" />
            <rect x="290" y="516" width="12" height="56" rx="3" />
            <rect x="418" y="516" width="12" height="56" rx="3" />
            <rect x="486" y="516" width="12" height="56" rx="3" />
            <rect x="614" y="516" width="12" height="56" rx="3" />
          </g>
          <rect x="118" y="420" width="62" height="18" rx="3" fill="#562897" />
          <rect x="124" y="406" width="54" height="14" rx="3" fill="#bef264" />
          <path d="M306 432 L392 424" stroke="#facc15" strokeWidth="8" strokeLinecap="round" />
          <path d="M392 424 L402 423" stroke="#2b1352" strokeWidth="8" strokeLinecap="round" />
          <rect x="320" y="426" width="58" height="12" rx="2" fill="#ffffff" />
          <circle cx="600" cy="420" r="16" fill="#e11d48" />
          <path d="M600 404 Q604 394 612 392" fill="none" stroke="#5b3a1a" strokeWidth="3" strokeLinecap="round" />
          <path d="M602 400 Q612 394 616 402 Q608 406 602 400 Z" fill="#84cc16" />
          <circle cx="594" cy="414" r="4" fill="#ffffff" opacity="0.6" />
        </g>

        {/* Avión de papel, estrellas y la "A+" */}
        <g className="login-avion">
          <path d="M548 34 L600 22 L572 58 L566 44 Z" fill="#ffffff" />
          <path d="M566 44 L600 22" stroke="#c4b0f0" strokeWidth="2" />
          <path d="M540 50 q-20 6 -40 0" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 6" opacity="0.7" />
        </g>
        <path className="login-destello" d="M182 30 Q184 38 192 40 Q184 42 182 50 Q180 42 172 40 Q180 38 182 30 Z" fill="#bef264" />
        <path className="login-destello" style={{ animationDelay: "-0.8s" }} d="M466 252 Q468 260 476 262 Q468 264 466 272 Q464 264 456 262 Q464 260 466 252 Z" fill="#ffffff" />
        <path className="login-destello" style={{ animationDelay: "-1.6s" }} d="M30 262 Q32 270 40 272 Q32 274 30 282 Q28 274 20 272 Q28 270 30 262 Z" fill="#f9a8d4" />
        <g className="login-flotar">
          <circle cx="668" cy="318" r="30" fill="#bef264" />
          <text x="668" y="330" textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontWeight="800" fontSize="30" fill="#36195f">
            A+
          </text>
        </g>
      </svg>
    </div>
  );
}
