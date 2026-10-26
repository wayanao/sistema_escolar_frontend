import useAparecerAlBajar from "../../hooks/landing/useAparecerAlBajar";

// Envuelve un bloque para que aparezca suave la primera vez que se ve.
// `retraso` (en milisegundos) escalona varios bloques seguidos.
function Aparecer({ children, className = "", retraso = 0 }) {
  const [ref, visible] = useAparecerAlBajar();

  return (
    <div
      ref={ref}
      className={`landing-aparecer ${visible ? "es-visible" : ""} ${className}`}
      style={retraso ? { transitionDelay: `${retraso}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export default Aparecer;
