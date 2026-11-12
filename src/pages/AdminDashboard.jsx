import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import MuroCumpleanos from "../components/dashboards/MuroCumpleanos";
import AccesosAdmin from "../components/dashboards/admin/AccesosAdmin";
import EncabezadoPanelAdmin from "../components/dashboards/admin/EncabezadoPanelAdmin";
import TarjetaDeudaPorCurso from "../components/dashboards/admin/TarjetaDeudaPorCurso";
import TarjetaMayoresDeudores from "../components/dashboards/admin/TarjetaMayoresDeudores";
import TarjetaMejoresPagadores from "../components/dashboards/admin/TarjetaMejoresPagadores";
import TarjetaPorCobrar from "../components/dashboards/admin/TarjetaPorCobrar";
import useDashboardAdmin from "../hooks/dashboards/useDashboardAdmin";
import {
  RUTA_CARTERA_VENCIDA,
  RUTA_PAGOS,
  deudaPorCurso,
  mayoresDeudores,
} from "../utils/dashboards/admin";
import { fechaLargaColombia } from "../utils/fechaColombia";

function Admin() {
  const navigate = useNavigate();
  const {
    esAdministrador,
    nombreAdmin,
    resumenCartera,
    cargandoCartera,
    errorCartera,
    puntualidad,
    cargandoPuntualidad,
    errorPuntualidad,
    cumpleanos,
    loadingCumpleanos,
    errorCumpleanos,
  } = useDashboardAdmin();
  // «Ocultar valores» tapa los montos cuando hay alguien al lado mirando la
  // pantalla. No se guarda: al volver a entrar se ven de nuevo.
  const [valoresOcultos, setValoresOcultos] = useState(false);

  // Se devuelve el redirect en vez de llamar a navigate durante el render.
  if (!esAdministrador) {
    return <Navigate to="/login" />;
  }

  const estadoCartera = { cargando: cargandoCartera, error: errorCartera, valoresOcultos };
  const estadoPuntualidad = { puntualidad, cargando: cargandoPuntualidad, error: errorPuntualidad };

  // Orden de la maqueta Mosaico (aprobada el 2026-11-11), con un cambio que
  // pidió el usuario el 2026-11-12: sin el anillo «Pagan siempre a tiempo» y
  // con los accesos en su lugar. Arriba lo que se debe y los accesos; luego los
  // que más deben junto a los que mejor pagan; la deuda por curso; y el muro de
  // cumpleaños al final.
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto w-full max-w-[1200px]">
        <EncabezadoPanelAdmin
          nombreAdmin={nombreAdmin}
          fechaDeHoy={fechaLargaColombia()}
          valoresOcultos={valoresOcultos}
          onAlternarValores={() => setValoresOcultos((oculto) => !oculto)}
        />

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-5">
            <TarjetaPorCobrar className="flex-[2_1_520px]" resumen={resumenCartera} {...estadoCartera} />
            <AccesosAdmin className="flex-[1_1_300px]" onAbrir={navigate} />
          </div>

          <div className="flex flex-wrap gap-5">
            <TarjetaMayoresDeudores
              className="flex-[1_1_420px]"
              deudores={mayoresDeudores(resumenCartera)}
              {...estadoCartera}
              onCobrar={(estudianteId) => navigate(RUTA_PAGOS, { state: { estudiante_id: estudianteId } })}
              onVerCartera={() => navigate(RUTA_CARTERA_VENCIDA)}
            />
            <TarjetaMejoresPagadores className="flex-[1_1_420px]" {...estadoPuntualidad} />
          </div>

          <TarjetaDeudaPorCurso cursos={deudaPorCurso(resumenCartera)} {...estadoCartera} />

          <MuroCumpleanos
            estudiantes={cumpleanos}
            loading={loadingCumpleanos}
            error={errorCumpleanos}
            emptyText="Esta semana no hay estudiantes activos de cumpleaños."
          />
        </div>
      </div>
    </div>
  );
}

export default Admin;
