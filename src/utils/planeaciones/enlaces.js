// Contratos puros para reconocer enlaces dentro del texto libre de una planeación.
const PATRON_ENLACE = /https?:\/\/\S+/gi;
const PUNTUACION_FINAL = /[.,;:!?¡¿)\]}"'»…]+$/;
const ENLACE_CON_DOMINIO = /^https?:\/\/[^\s/]+/i;

function recortarCierreFinal(url) {
  let recortada = url.replace(PUNTUACION_FINAL, "");

  // Un paréntesis de cierre es parte del enlace solo si el enlace abrió uno.
  if (url.endsWith(")") && contarCaracter(url, "(") >= contarCaracter(url, ")")) {
    recortada = url;
  }

  return recortada;
}

function contarCaracter(texto, caracter) {
  return texto.split(caracter).length - 1;
}

/**
 * Parte un texto en tramos de texto plano y enlaces http/https, para que la vista
 * los pinte como enlaces reales sin inyectar HTML.
 */
export function partirTextoConEnlaces(texto) {
  const contenido = String(texto ?? "");
  if (!contenido) return [];

  const partes = [];
  let ultimoIndice = 0;

  for (const coincidencia of contenido.matchAll(PATRON_ENLACE)) {
    const url = recortarCierreFinal(coincidencia[0]);
    if (!ENLACE_CON_DOMINIO.test(url)) continue;

    const inicio = coincidencia.index;
    if (inicio > ultimoIndice) {
      partes.push({ tipo: "texto", valor: contenido.slice(ultimoIndice, inicio) });
    }
    partes.push({ tipo: "enlace", valor: url });
    ultimoIndice = inicio + url.length;
  }

  if (ultimoIndice < contenido.length) {
    partes.push({ tipo: "texto", valor: contenido.slice(ultimoIndice) });
  }

  return partes;
}

const DOMINIOS_YOUTUBE = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
const RUTAS_CON_ID = ["/embed/", "/shorts/", "/live/", "/v/"];
const ID_VIDEO_YOUTUBE = /^[\w-]{11}$/;
const SEGUNDOS_SIMPLES = /^\d+$/;
const SEGUNDOS_CON_UNIDADES = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i;

function extraerIdVideo(url) {
  const host = url.hostname.toLowerCase();
  if (!DOMINIOS_YOUTUBE.has(host)) return "";

  if (host.endsWith("youtu.be")) return url.pathname.split("/")[1] || "";
  if (url.pathname === "/watch") return url.searchParams.get("v") || "";

  const ruta = RUTAS_CON_ID.find((prefijo) => url.pathname.startsWith(prefijo));
  return ruta ? url.pathname.slice(ruta.length).split("/")[0] : "";
}

function extraerSegundosIniciales(url) {
  const valor = url.searchParams.get("t") || url.searchParams.get("start") || "";
  if (!valor) return 0;
  if (SEGUNDOS_SIMPLES.test(valor)) return Number(valor);

  const partes = SEGUNDOS_CON_UNIDADES.exec(valor);
  if (!partes) return 0;

  const [, horas = 0, minutos = 0, segundos = 0] = partes;
  return Number(horas) * 3600 + Number(minutos) * 60 + Number(segundos);
}

/**
 * Reconoce un video de YouTube dentro de un enlace. Devuelve null para
 * cualquier otro enlace, de modo que solo se incruste contenido de YouTube.
 */
export function obtenerVideoYoutube(enlace) {
  let url;
  try {
    url = new URL(String(enlace ?? ""));
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const id = extraerIdVideo(url);
  if (!ID_VIDEO_YOUTUBE.test(id)) return null;

  return { id, inicio: extraerSegundosIniciales(url) };
}

/** URL del reproductor incrustado, en el dominio de YouTube sin cookies. */
export function construirUrlIncrustadaYoutube(video) {
  if (!video?.id) return "";

  const parametros = new URLSearchParams({ rel: "0", modestbranding: "1" });
  if (video.inicio > 0) parametros.set("start", String(video.inicio));

  return `https://www.youtube-nocookie.com/embed/${video.id}?${parametros}`;
}
