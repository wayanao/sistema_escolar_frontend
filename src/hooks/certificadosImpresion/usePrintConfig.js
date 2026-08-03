import { useEffect, useState } from "react";

import { getBranding, getPlantillaActiva } from "../../services/printingService";

let brandingCache = null;
let brandingPromise = null;
const plantillaCache = new Map();
const plantillaPromise = new Map();

export function invalidatePrintCache() {
  brandingCache = null;
  brandingPromise = null;
  plantillaCache.clear();
  plantillaPromise.clear();
}

async function fetchBrandingOnce() {
  if (brandingCache) return brandingCache;
  if (!brandingPromise) {
    brandingPromise = getBranding()
      .then((data) => {
        brandingCache = data;
        return data;
      })
      .catch((error) => {
        brandingPromise = null;
        throw error;
      });
  }
  return brandingPromise;
}

async function fetchPlantillaOnce(tipo) {
  if (plantillaCache.has(tipo)) return plantillaCache.get(tipo);
  if (!plantillaPromise.has(tipo)) {
    const promise = getPlantillaActiva(tipo)
      .then((data) => {
        plantillaCache.set(tipo, data);
        return data;
      })
      .catch((error) => {
        plantillaPromise.delete(tipo);
        throw error;
      });
    plantillaPromise.set(tipo, promise);
  }
  return plantillaPromise.get(tipo);
}

export default function usePrintConfig(tipo) {
  const [state, setState] = useState({
    branding: brandingCache,
    plantilla: plantillaCache.get(tipo) || null,
    loading: !brandingCache || !plantillaCache.has(tipo),
    error: null,
  });

  useEffect(() => {
    let cancelado = false;

    Promise.all([fetchBrandingOnce(), fetchPlantillaOnce(tipo)])
      .then(([branding, plantilla]) => {
        if (cancelado) return;
        setState({ branding, plantilla, loading: false, error: null });
      })
      .catch((error) => {
        if (cancelado) return;
        setState((prev) => ({ ...prev, loading: false, error }));
      });

    return () => {
      cancelado = true;
    };
  }, [tipo]);

  return state;
}
