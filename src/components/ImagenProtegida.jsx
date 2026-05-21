import { useEffect, useState } from "react";
import api from "../utils/api";

function normalizarRutaImagen(path) {
  if (!path) return "";
  if (path.startsWith("blob:") || path.startsWith("data:")) return path;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      return `${url.pathname}${url.search}`;
    } catch {
      return path;
    }
  }

  return `/${path.replaceAll("\\", "/").replace(/^\/+/, "")}`;
}

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

    api
      .get(normalizarRutaImagen(path), { responseType: "blob" })
      .then((res) => {
        if (!activo) return;
        objectUrl = URL.createObjectURL(res.data);
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

