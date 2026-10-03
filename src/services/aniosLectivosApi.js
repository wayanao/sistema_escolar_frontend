import api from "../utils/api";

// Unico punto HTTP del año lectivo. En la fase 5 se suman crear el año,
// copiar cursos, matricular y activar. Devuelve los datos tal cual; quien los
// ordena es `utils/anioLectivo.js`, y quien decide mensajes, los hooks.
//
// El año no viaja en una cabecera ni en la sesion: cada lectura lo pide como
// `?anio_lectivo_id=`, y solo cuando se mira un año que no es el activo.

// `[{ id, anio, estado }]`, el mas reciente primero. El admin recibe todos
// los años; el profesor, solo el activo.
export async function listarAniosLectivos({ signal } = {}) {
  const { data } = signal
    ? await api.get("/anios-lectivos", { signal })
    : await api.get("/anios-lectivos");
  return data;
}
