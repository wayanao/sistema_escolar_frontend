import { useEffect, useLayoutEffect, useRef } from "react";
import {
  avisoRangoPesos,
  limpiarPesos,
  posicionTrasDigitos,
  separarMiles,
} from "../utils/formatoPesos";

// Campo para escribir pesos. Muestra los puntos de miles mientras se escribe
// ("150.000") y entrega a `onCambiar` solo los dígitos ("150000"), así el
// estado y lo que se envía al backend siguen iguales. Pedido por el usuario el
// 2026-10-31 para que nadie confunda 150.000 con 150. Un campo de texto no
// tiene `min` ni `max`: los revisa aquí y el navegador avisa al enviar.
export default function CampoPesos({ valor, onCambiar, min, max, ...props }) {
  const ref = useRef(null);
  const digitosAntesDelCursor = useRef(null);
  const texto = separarMiles(valor);

  // Al poner o quitar un punto, el cursor saltaría al final.
  useLayoutEffect(() => {
    const campo = ref.current;
    const digitos = digitosAntesDelCursor.current;
    digitosAntesDelCursor.current = null;
    if (digitos === null || !campo || campo.ownerDocument.activeElement !== campo) return;
    const posicion = posicionTrasDigitos(texto, digitos);
    campo.setSelectionRange(posicion, posicion);
  }, [texto]);

  useEffect(() => {
    ref.current?.setCustomValidity(avisoRangoPesos(valor, { min, max }));
  }, [valor, min, max]);

  const cambiar = (event) => {
    const escrito = event.target.value;
    const cursor = event.target.selectionStart ?? escrito.length;
    digitosAntesDelCursor.current = limpiarPesos(escrito.slice(0, cursor)).length;
    onCambiar(limpiarPesos(escrito));
  };

  return (
    <input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={texto}
      onChange={cambiar}
    />
  );
}
