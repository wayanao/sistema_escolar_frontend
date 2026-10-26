import { useRef, useState } from "react";
import Aparecer from "./Aparecer";
import EncabezadoSeccion from "./EncabezadoSeccion";
import IconoLanding from "./IconoLanding";

// Pestañas por rol. Se pueden recorrer con las flechas del teclado, como pide
// el patrón de pestañas accesibles.
function PestanasRoles({ roles }) {
  const [activo, setActivo] = useState(roles[0].id);
  const pestanasRef = useRef({});
  const rol = roles.find((item) => item.id === activo) ?? roles[0];

  const moverCon = (event, indice) => {
    const paso = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!paso) return;
    event.preventDefault();
    const siguiente = roles[(indice + paso + roles.length) % roles.length];
    setActivo(siguiente.id);
    pestanasRef.current[siguiente.id]?.focus();
  };

  return (
    <section id="funciones" className="scroll-mt-24 bg-slate-50 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Aparecer>
          <EncabezadoSeccion
            etiqueta="Funciones"
            titulo="Hecho para cada persona del colegio"
            texto="Cada quien entra con su usuario y encuentra lo suyo, sin pasos de más."
          />
        </Aparecer>

        <Aparecer className="mt-12">
          <div
            role="tablist"
            aria-label="Funciones por rol"
            className="mx-auto flex w-full max-w-md rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
          >
            {roles.map((item, indice) => {
              const seleccionada = item.id === activo;
              return (
                <button
                  key={item.id}
                  ref={(nodo) => {
                    pestanasRef.current[item.id] = nodo;
                  }}
                  type="button"
                  role="tab"
                  id={`pestana-${item.id}`}
                  aria-selected={seleccionada}
                  aria-controls={`panel-${item.id}`}
                  tabIndex={seleccionada ? 0 : -1}
                  onClick={() => setActivo(item.id)}
                  onKeyDown={(event) => moverCon(event, indice)}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    seleccionada
                      ? "bg-gradient-to-r from-purple-700 to-violet-600 text-white shadow-[0_10px_24px_rgba(109,40,217,0.3)]"
                      : "text-slate-600 hover:bg-purple-50 hover:text-purple-800"
                  }`}
                >
                  {item.etiqueta}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`panel-${rol.id}`}
            aria-labelledby={`pestana-${rol.id}`}
            className="mt-10"
          >
            <p className="text-center text-lg font-semibold text-slate-700">{rol.resumen}</p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {rol.funciones.map((funcion) => (
                <li
                  key={funcion.titulo}
                  className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-[0_20px_44px_rgba(88,28,135,0.12)]"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime-100 text-lime-700">
                    <IconoLanding nombre="check" className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-black text-slate-900">{funcion.titulo}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{funcion.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Aparecer>
      </div>
    </section>
  );
}

export default PestanasRoles;
