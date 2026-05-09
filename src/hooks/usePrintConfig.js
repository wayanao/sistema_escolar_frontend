import { useEffect, useState } from "react";
import { getBranding, getPlantillaActiva } from "../services/printingService";

// Cache en memoria a nivel modulo. La identidad institucional rara vez cambia
// dentro de una sesion; recargarla en cada impresion seria desperdicio.
let _brandingCache = null;
let _brandingPromise = null;
const _plantillaCache = new Map();   // tipo -> plantilla
const _plantillaPromise = new Map(); // tipo -> Promise<plantilla>

export function invalidatePrintCache() {
  _brandingCache = null;
  _brandingPromise = null;
  _plantillaCache.clear();
  _plantillaPromise.clear();
}

async function fetchBrandingOnce() {
  if (_brandingCache) return _brandingCache;
  if (!_brandingPromise) {
    _brandingPromise = getBranding()
      .then((data) => { _brandingCache = data; return data; })
      .catch((err) => { _brandingPromise = null; throw err; });
  }
  return _brandingPromise;
}

async function fetchPlantillaOnce(tipo) {
  if (_plantillaCache.has(tipo)) return _plantillaCache.get(tipo);
  if (!_plantillaPromise.has(tipo)) {
    const p = getPlantillaActiva(tipo)
      .then((data) => { _plantillaCache.set(tipo, data); return data; })
      .catch((err) => { _plantillaPromise.delete(tipo); throw err; });
    _plantillaPromise.set(tipo, p);
  }
  return _plantillaPromise.get(tipo);
}

/**
 * Carga el branding del tenant + la plantilla activa para `tipo`.
 * Devuelve { branding, plantilla, loading, error }.
 */
export default function usePrintConfig(tipo) {
  const [state, setState] = useState({
    branding: _brandingCache,
    plantilla: _plantillaCache.get(tipo) || null,
    loading: !_brandingCache || !_plantillaCache.has(tipo),
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

    return () => { cancelado = true; };
  }, [tipo]);

  return state;
}
