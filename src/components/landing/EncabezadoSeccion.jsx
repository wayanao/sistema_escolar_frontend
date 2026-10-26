// Encabezado común de las secciones: una etiqueta pequeña, el título y un
// texto opcional. `oscuro` lo adapta a las secciones de fondo morado.
function EncabezadoSeccion({ etiqueta, titulo, texto, oscuro = false, centrado = true }) {
  const alineacion = centrado ? "mx-auto text-center" : "";

  return (
    <div className={`max-w-2xl ${alineacion}`}>
      <p
        className={`text-sm font-bold uppercase tracking-[0.18em] ${oscuro ? "text-lime-300" : "text-purple-600"}`}
      >
        {etiqueta}
      </p>
      <h2
        className={`mt-3 text-balance text-3xl font-black tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1] ${oscuro ? "text-white" : "text-slate-950"}`}
      >
        {titulo}
      </h2>
      {texto ? (
        <p className={`mt-4 text-lg leading-8 ${oscuro ? "text-purple-100/80" : "text-slate-600"}`}>
          {texto}
        </p>
      ) : null}
    </div>
  );
}

export default EncabezadoSeccion;
