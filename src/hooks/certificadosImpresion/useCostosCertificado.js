import { useCallback, useRef, useState } from "react";

// Los costos del certificado de costos educativos mientras se editan sobre la
// hoja. Son solo para esa impresión: no se guardan ni cambian los precios de
// Tipos de pago. Empiezan con lo que paga el estudiante y vuelven a eso con
// cada estudiante (la vista se monta de nuevo).
export default function useCostosCertificado(costosIniciales) {
  const [costos, setCostos] = useState(() => costosIniciales || []);
  const siguienteId = useRef(0);

  const cambiarCosto = useCallback((id, campo, valor) => {
    setCostos((actuales) => actuales.map((costo) => (
      costo.id === id ? { ...costo, [campo]: valor } : costo
    )));
  }, []);

  const quitarCosto = useCallback((id) => {
    setCostos((actuales) => actuales.filter((costo) => costo.id !== id));
  }, []);

  const agregarCosto = useCallback(() => {
    siguienteId.current += 1;
    const id = `nuevo-${siguienteId.current}`;
    setCostos((actuales) => [...actuales, { id, concepto: "", valor: "" }]);
    return id;
  }, []);

  return { costos, agregarCosto, cambiarCosto, quitarCosto };
}
