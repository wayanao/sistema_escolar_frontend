import { useEffect, useRef, useState } from "react";

const hayObservador = () =>
    typeof window !== "undefined" && typeof window.IntersectionObserver === "function";

// Marca un elemento como visible la primera vez que entra en pantalla, para
// animar su aparición. Sin IntersectionObserver (navegadores viejos o pruebas)
// se muestra de una vez: el contenido nunca se queda escondido.
const useAparecerAlBajar = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(() => !hayObservador());

    useEffect(() => {
        const elemento = ref.current;
        if (visible || !elemento) return undefined;

        const observador = new window.IntersectionObserver(
            (entradas) => {
                if (entradas.some((entrada) => entrada.isIntersecting)) {
                    setVisible(true);
                    observador.disconnect();
                }
            },
            { threshold: 0.12 },
        );
        observador.observe(elemento);
        return () => observador.disconnect();
    }, [visible]);

    return [ref, visible];
};

export default useAparecerAlBajar;
