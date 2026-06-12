import { useState } from "react";
import IdentidadInstitucional from "../components/admin/IdentidadInstitucional";
import PlantillasAdmin from "../components/admin/PlantillasAdmin";

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

      {tab === "identidad" && <IdentidadInstitucional />}
      {tab === "plantillas" && <PlantillasAdmin />}
    </div>
  );
}
