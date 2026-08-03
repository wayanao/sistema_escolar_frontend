import { useState } from "react";
import IdentidadInstitucionalView from "../components/certificadosImpresion/admin/IdentidadInstitucionalView";
import PlantillasAdminView from "../components/certificadosImpresion/admin/PlantillasAdminView";
import useIdentidadInstitucional from "../hooks/certificadosImpresion/useIdentidadInstitucional";
import usePlantillasAdmin from "../hooks/certificadosImpresion/usePlantillasAdmin";

const TABS = [
  { key: "identidad", label: "Identidad institucional" },
  { key: "plantillas", label: "Plantillas de impresión" },
];

export default function BrandingAdmin() {
  const [tab, setTab] = useState("identidad");

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">Diseño de impresos</h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Personaliza los logos, datos institucionales y el estilo de cada documento que imprime el sistema.
        </p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-3 py-2.5 text-sm font-semibold border-b-2 transition sm:px-4 ${
              tab === t.key
                ? "text-purple-700 border-purple-600"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "identidad" && <IdentidadInstitucionalPanel />}
      {tab === "plantillas" && <PlantillasAdminPanel />}
    </div>
  );
}

function IdentidadInstitucionalPanel() {
  const identidad = useIdentidadInstitucional();

  return (
    <IdentidadInstitucionalView
      branding={identidad.branding}
      guardando={identidad.guardando}
      loading={identidad.loading}
      mensaje={identidad.mensaje}
      onCambiarCampo={identidad.cambiarCampo}
      onEliminarLogo={identidad.eliminarLogo}
      onGuardar={identidad.guardar}
      onSubirLogo={identidad.subirLogo}
    />
  );
}

function PlantillasAdminPanel() {
  const plantillasAdmin = usePlantillasAdmin();

  return (
    <PlantillasAdminView
      config={plantillasAdmin.config}
      loading={plantillasAdmin.loading}
      mensaje={plantillasAdmin.mensaje}
      plantillas={plantillasAdmin.plantillas}
      seleccionada={plantillasAdmin.seleccionada}
      tipoActivo={plantillasAdmin.tipoActivo}
      onActivar={plantillasAdmin.activar}
      onActualizarCampoConfig={plantillasAdmin.actualizarCampoConfig}
      onDuplicar={plantillasAdmin.duplicar}
      onEliminar={plantillasAdmin.eliminar}
      onGuardarConfig={plantillasAdmin.guardarConfig}
      onSeleccionarPlantilla={plantillasAdmin.seleccionarPlantilla}
      onCambiarTipoActivo={plantillasAdmin.setTipoActivo}
    />
  );
}
