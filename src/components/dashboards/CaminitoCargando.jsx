/**
 * El «caminito» que se va llenando mientras llegan los datos de un cuadro
 * (pedido del usuario el 2026-11-12): la misma barrita morada de la tarjeta de
 * espera (`.ventana-espera__barra`), dentro de cada cuadro y sin letras. Se
 * llena rápido al comienzo y cada vez más despacio, sin llegar al final, porque
 * no se sabe cuánto tarda el servidor. `etiqueta` no se ve: la leen los
 * lectores de pantalla.
 */
function CaminitoCargando({ etiqueta, className = "" }) {
  return (
    <div role="progressbar" aria-label={etiqueta} className={`caminito-cargando ${className}`}>
      <div />
    </div>
  );
}

export default CaminitoCargando;
