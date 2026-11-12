import { useEffect } from "react";

export const ID_FUENTE_GOTICA = "fuente-gotica";
export const URL_FUENTE_GOTICA =
  "https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@700;800;900&display=swap";

// Letra gótica del muro de cumpleaños (banderines, cinta y nombres), de Google
// Fonts, como las del login (`useFuentesLogin`). Se pide solo cuando aparece
// el muro; mientras llega (o si no llega) se ve una letra con serifa del
// sistema. Al salir se deja puesta: volver al panel no la pide otra vez.
export default function useFuenteGotica() {
  useEffect(() => {
    if (document.getElementById(ID_FUENTE_GOTICA)) return;
    const enlace = document.createElement("link");
    enlace.id = ID_FUENTE_GOTICA;
    enlace.rel = "stylesheet";
    enlace.href = URL_FUENTE_GOTICA;
    document.head.appendChild(enlace);
  }, []);
}
