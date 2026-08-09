import { useEffect, useState } from "react";
import { obtenerEstadoTenant } from "../../services/autenticacionApi";

export function useEstadoTenant() {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadStatus = async () => {
      try {
        const data = await obtenerEstadoTenant();
        if (!mounted) return;

        setNotice(data?.mostrar_aviso ? data : null);
      } catch {
        if (mounted) {
          setNotice(null);
        }
      }
    };

    loadStatus();

    return () => {
      mounted = false;
    };
  }, []);

  return notice;
}
