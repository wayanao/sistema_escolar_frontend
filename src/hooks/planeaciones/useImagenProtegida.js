import { useEffect, useState } from "react";
import { descargarImagenPlaneacion } from "../../services/planeacionesApi";
import { normalizarRutaImagen } from "../../utils/planeaciones/imagenes";

export function useImagenProtegida(path) {
  const [url, setUrl] = useState("");
  const [cargando, setCargando] = useState(Boolean(path));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!path) {
      setUrl("");
      setCargando(false);
      setError("");
      return undefined;
    }

    let activo = true;
    let objectUrl = "";

    setCargando(true);
    setError("");
    setUrl("");

    descargarImagenPlaneacion(normalizarRutaImagen(path))
      .then((blob) => {
        if (!activo) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => {
        if (!activo) return;
        console.error("Error cargando imagen protegida", err);
        setError("No se pudo cargar la imagen.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  return { url, cargando, error };
}
