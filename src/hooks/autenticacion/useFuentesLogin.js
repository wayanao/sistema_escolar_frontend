import { useEffect } from "react";

export const ID_FUENTES_LOGIN = "fuentes-login";
export const URL_FUENTES_LOGIN =
  "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&family=Caveat:wght@700&display=swap";

// Las fuentes del diseño del login (Baloo 2, Nunito y Caveat), de Google
// Fonts. Se piden solo al abrir el login, para no cargarlas en el resto de la
// aplicación; mientras llegan (o si no llegan) se ve la letra del sistema. Al
// salir se dejan puestas: volver al login no las pide otra vez.
export default function useFuentesLogin() {
  useEffect(() => {
    if (document.getElementById(ID_FUENTES_LOGIN)) return;
    const enlace = document.createElement("link");
    enlace.id = ID_FUENTES_LOGIN;
    enlace.rel = "stylesheet";
    enlace.href = URL_FUENTES_LOGIN;
    document.head.appendChild(enlace);
  }, []);
}
