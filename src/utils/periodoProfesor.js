const PERIODO_DEFAULT = "1";

const obtenerProfesorId = () => {
  try {
    const profesor = JSON.parse(localStorage.getItem("profesor") || "null");
    return profesor?.id ? String(profesor.id) : "";
  } catch {
    return "";
  }
};

const obtenerClavePeriodoProfesor = () => {
  const profesorId = obtenerProfesorId();
  return profesorId ? `periodo_profesor_${profesorId}` : "";
};

export const obtenerPeriodoProfesor = (respaldo = PERIODO_DEFAULT) => {
  const clave = obtenerClavePeriodoProfesor();
  const periodoProfesor = clave ? localStorage.getItem(clave) : "";
  return periodoProfesor || localStorage.getItem("periodo") || respaldo;
};

export const guardarPeriodoProfesor = (periodo) => {
  const valor = String(periodo || PERIODO_DEFAULT);
  const clave = obtenerClavePeriodoProfesor();

  localStorage.setItem("periodo", valor);
  if (clave) {
    localStorage.setItem(clave, valor);
  }

  return valor;
};
