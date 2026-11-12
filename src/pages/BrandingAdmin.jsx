import { useState } from "react";
import IdentidadInstitucionalView from "../components/certificadosImpresion/admin/IdentidadInstitucionalView";
import PlantillasAdminView from "../components/certificadosImpresion/admin/PlantillasAdminView";
import CuadroFirma from "../components/firmas/CuadroFirma";
import useIdentidadInstitucional from "../hooks/certificadosImpresion/useIdentidadInstitucional";
import usePlantillasAdmin from "../hooks/certificadosImpresion/usePlantillasAdmin";
import useEditorFirma from "../hooks/firmas/useEditorFirma";
import useFirmaGuardada from "../hooks/firmas/useFirmaGuardada";

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
      cuadroFirma={<FirmaInstitucionalPanel />}
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

// La firma del rector(a) para el boletín (docs/funcionalidades/FIRMAS_BOLETIN.md,
// paso 2). Se guarda sola, aparte de «Guardar cambios».
function FirmaInstitucionalPanel() {
  const firma = useFirmaGuardada("institucional");
  const editor = useEditorFirma();

  const guardar = async () => {
    const resultado = await firma.guardar(editor.imagen);
    if (resultado.estado === "exito") editor.cerrar();
  };

  return (
    <CuadroFirma
      titulo="Firma del rector(a)"
      descripcion="Sale en los boletines, sobre la raya «Director(a)». Solo la ven los administradores."
      firma={firma.firma}
      cargando={firma.cargando}
      guardando={firma.guardando}
      mensajeError={firma.mensajeError}
      editor={editor}
      onElegirFoto={editor.elegirFoto}
      onAbrirDibujo={editor.abrirDibujo}
      onCambiarDibujo={editor.cambiarDibujo}
      onGuardar={guardar}
      onCancelar={editor.cerrar}
      onQuitar={firma.quitar}
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
