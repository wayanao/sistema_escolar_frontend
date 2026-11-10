import { useEffect, useState } from "react";

const UN_MINUTO = 60 * 1000;

// La hora actual, refrescada cada minuto: con ella el horario marca la clase
// «Ahora» y la «Siguiente» sin recargar la página. No consulta al servidor.
export default function useAhora(intervalo = UN_MINUTO) {
    const [ahora, setAhora] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setAhora(new Date()), intervalo);
        return () => clearInterval(id);
    }, [intervalo]);

    return ahora;
}
