import { useEffect, useState } from "react";
import api from "../utils/api";

function TenantStatusBanner() {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadStatus = async () => {
      try {
        const response = await api.get("/tenant/status");
        if (!mounted) return;

        const data = response.data;
        if (data?.mostrar_aviso) {
          setNotice(data);
        } else {
          setNotice(null);
        }
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

  if (!notice) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold">Servicio en mora</p>
          <p className="mt-0.5 text-amber-800">
            {notice.mensaje || "Tu servicio se encuentra en mora. Por favor realiza el pago para evitar suspensión."}
          </p>
        </div>
        <span className="inline-flex w-fit rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-bold uppercase text-amber-800">
          {notice.estado}
        </span>
      </div>
    </div>
  );
}

export default TenantStatusBanner;
