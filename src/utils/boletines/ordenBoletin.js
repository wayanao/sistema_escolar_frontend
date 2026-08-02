export const ordenarPorBoletin = (items) =>
  [...items].sort((a, b) => {
    const ordenA = Number(a.orden_boletin ?? 100);
    const ordenB = Number(b.orden_boletin ?? 100);
    if (ordenA !== ordenB) return ordenA - ordenB;
    return String(a.materia_nombre || "").localeCompare(String(b.materia_nombre || ""));
  });

export const moverMateria = (materias, index, destino) => {
  if (destino < 0 || destino >= materias.length || destino === index) return materias;
  const copia = [...materias];
  const [item] = copia.splice(index, 1);
  copia.splice(destino, 0, item);
  return copia;
};

export const moverMateriaPorDelta = (materias, index, delta) =>
  moverMateria(materias, index, index + delta);

export const moverMateriaAPosicion = (materias, index, posicion) => {
  const destino = Number(posicion) - 1;
  if (Number.isNaN(destino)) return materias;
  return moverMateria(materias, index, destino);
};

export const ordenarMateriasAlfabeticamente = (materias) =>
  [...materias].sort((a, b) =>
    String(a.materia_nombre || "").localeCompare(String(b.materia_nombre || "")),
  );

export const construirPayloadOrden = (materias) => ({
  materias: materias.map((materia) => ({ materia_id: materia.materia_id })),
});
