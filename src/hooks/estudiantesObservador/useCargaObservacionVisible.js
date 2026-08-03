import { useCallback, useEffect, useRef, useState } from "react";

export default function useCargaObservacionVisible({
  margen = "240px 0px",
} = {}) {
  const elementoRef = useRef(null);
  const observerRef = useRef(null);
  const [habilitado, setHabilitado] = useState(false);

  const observar = useCallback(() => {
    if (habilitado || observerRef.current || !elementoRef.current) return;

    if (typeof IntersectionObserver !== "function") {
      setHabilitado(true);
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((entrada) => entrada.isIntersecting)) return;
        setHabilitado(true);
        observerRef.current?.disconnect();
        observerRef.current = null;
      },
      { rootMargin: margen },
    );
    observerRef.current.observe(elementoRef.current);
  }, [habilitado, margen]);

  useEffect(
    () => () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    },
    [],
  );

  return { elementoRef, habilitado, observar };
}
