// Fondo de la marca: los morados de Auligo, un brillo lima y una trama de
// puntos. Lo comparten el login y la landing para que se sientan como una sola
// marca. Es decorativo, así que los lectores de pantalla lo ignoran.
//
// `animado` hace que los brillos se muevan despacio; con "reducir movimiento"
// activado en el equipo se quedan quietos (ver `src/index.css`).
function FondoMarca({ animado = false }) {
  const brillo = animado ? "fondo-marca-brillo" : "";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-[#21103d] to-slate-950" />
      <div
        className={`absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-purple-600/35 blur-[120px] ${brillo}`}
      />
      <div
        className={`absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-violet-500/20 blur-[110px] ${brillo} [--retraso:-6s]`}
      />
      <div
        className={`absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-lime-400/15 blur-[90px] ${brillo} [--retraso:-12s]`}
      />
      <div className="fondo-marca-trama absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/20" />
    </div>
  );
}

export default FondoMarca;
