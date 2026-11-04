import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import auligoLogoNav from "../../assets/auligo-logo-nav.png";
import { MODOS_MENU, obtenerIniciales } from "../../utils/autenticacion/menuLateral";
import {
  esRutaNavegacionActiva,
  obtenerUbicacionNavegacion,
} from "../../utils/autenticacion/navegacion";
import IconoMenu from "./IconoMenu";

// El menú lateral con su marco. En celular: barra oscura arriba y un menú que
// se desliza desde la izquierda. Desde tablet: el menú a la izquierda (riel o
// abierto, según `modo`) y una barra blanca sobre el contenido. Solo presenta:
// el modo lo decide useMenuLateral y los permisos, el backend.
//
// El morado es el oscuro de la landing (#2a1150), elegido con el usuario el
// 2026-11-04; el verde lima del logo marca la página actual.
const ACTIVO = "bg-purple-500/25 font-semibold text-white";
const INACTIVO = "text-[#cbc3dd] hover:bg-white/5 hover:text-white";
const PANEL_FLOTANTE =
  "absolute z-40 min-w-[228px] rounded-xl border border-white/10 bg-[#36195f] p-1.5 shadow-[0_18px_40px_rgba(10,4,25,0.35)]";
// Alto de cada fila: en celular, 44 px para el dedo.
const ALTO_FILA = {
  [MODOS_MENU.ABIERTO]: "min-h-10 text-sm",
  [MODOS_MENU.CELULAR]: "min-h-11 text-[15px]",
};
const ALTO_HIJO = {
  [MODOS_MENU.ABIERTO]: "min-h-9 text-[13.5px]",
  [MODOS_MENU.CELULAR]: "min-h-11 text-[14.5px]",
};

function useCerrarAlSalir(abierto, contenedorRef, cerrar) {
  useEffect(() => {
    if (!abierto) return undefined;
    const cerrarFuera = (event) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target)) cerrar();
    };
    const cerrarEscape = (event) => {
      if (event.key === "Escape") cerrar();
    };
    document.addEventListener("mousedown", cerrarFuera);
    document.addEventListener("keydown", cerrarEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarFuera);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, [abierto, contenedorRef, cerrar]);
}

function MenuLateralView({
  items,
  rutaInicio,
  etiqueta,
  nombre,
  rol,
  modo,
  puedeAlternar,
  onAlternarMenu,
  onCerrarSesion,
  renderNotificaciones,
  renderSelectorAnio,
  children,
}) {
  const { pathname } = useLocation();
  const [menuCelularAbierto, setMenuCelularAbierto] = useState(false);
  const botonMenuRef = useRef(null);
  const enCelular = modo === MODOS_MENU.CELULAR;
  const enRiel = modo === MODOS_MENU.RIEL;
  const ubicacion = obtenerUbicacionNavegacion(items, pathname);

  const cerrarMenuCelular = useCallback(() => {
    setMenuCelularAbierto(false);
    botonMenuRef.current?.focus();
  }, []);

  return (
    <div className="md:flex md:min-h-screen">
      {enCelular ? (
        <BarraCelular
          rutaInicio={rutaInicio}
          menuAbierto={menuCelularAbierto}
          botonMenuRef={botonMenuRef}
          onAbrirMenu={() => setMenuCelularAbierto(true)}
          onNavegar={cerrarMenuCelular}
          renderNotificaciones={renderNotificaciones}
          renderSelectorAnio={renderSelectorAnio}
        />
      ) : (
        <aside
          className={`sticky top-0 z-30 flex h-screen shrink-0 flex-col bg-[#2a1150] py-4 text-[#cbc3dd] transition-[width] duration-200 motion-reduce:transition-none print:hidden ${
            enRiel ? "w-[92px] px-2" : "w-[264px] overflow-y-auto px-3"
          }`}
        >
          <Link
            to={rutaInicio}
            aria-label="Ir al inicio de Auligo"
            className={`mb-4 flex h-12 shrink-0 items-center rounded-lg ${enRiel ? "justify-center" : "px-2"}`}
          >
            {/* En el riel solo cabe la «A» con el birrete, el comienzo del logo. */}
            <img
              src={auligoLogoNav}
              alt="Auligo"
              className={enRiel ? "h-[34px] w-[26px] object-cover object-left" : "h-[34px] w-auto"}
            />
          </Link>
          <nav aria-label={etiqueta} className="flex-1">
            <ListaMenu items={items} variante={modo} pathname={pathname} />
          </nav>
          <TarjetaUsuario
            nombre={nombre}
            rol={rol}
            compacta={enRiel}
            onCerrarSesion={onCerrarSesion}
          />
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {!enCelular && (
          <BarraSuperior
            ubicacion={ubicacion}
            modo={modo}
            puedeAlternar={puedeAlternar}
            onAlternarMenu={onAlternarMenu}
            onNavegar={cerrarMenuCelular}
            renderNotificaciones={renderNotificaciones}
            renderSelectorAnio={renderSelectorAnio}
          />
        )}
        {children}
      </div>

      {enCelular && menuCelularAbierto && (
        <MenuCelular
          items={items}
          etiqueta={etiqueta}
          pathname={pathname}
          nombre={nombre}
          rol={rol}
          onCerrar={cerrarMenuCelular}
          onCerrarSesion={onCerrarSesion}
        />
      )}
    </div>
  );
}

function ListaMenu({ items, variante, pathname, onElegir }) {
  // Un grupo que nadie ha tocado está abierto si tiene la página actual.
  const [gruposAbiertos, setGruposAbiertos] = useState({});
  const [flotante, setFlotante] = useState(null);
  const listaRef = useRef(null);
  const enRiel = variante === MODOS_MENU.RIEL;
  const flotanteAbierto = enRiel ? flotante : null;
  const cerrarFlotante = useCallback(() => setFlotante(null), []);

  useCerrarAlSalir(Boolean(flotanteAbierto), listaRef, cerrarFlotante);

  const elegir = () => {
    setFlotante(null);
    onElegir?.();
  };

  return (
    <ul ref={listaRef} className={`flex flex-col ${enRiel ? "gap-1" : "gap-0.5"}`}>
      {items.map((item) => {
        if (item.type !== "group") {
          return (
            <li key={item.id}>
              <EnlaceMenu item={item} variante={variante} onElegir={elegir} />
            </li>
          );
        }

        const contieneActivo = esRutaNavegacionActiva(item, pathname);

        if (enRiel) {
          const abierto = flotanteAbierto === item.id;
          const idPanel = `menu-flotante-${item.id}`;
          return (
            <li key={item.id} className="relative">
              <button
                type="button"
                aria-expanded={abierto}
                aria-controls={abierto ? idPanel : undefined}
                onClick={() => setFlotante(abierto ? null : item.id)}
                className={`group flex w-full flex-col items-center gap-1 rounded-xl py-1.5 text-center text-[11px] leading-tight transition ${
                  contieneActivo ? "font-semibold text-white" : "font-medium text-[#cbc3dd] hover:text-white"
                }`}
              >
                <span
                  className={`flex h-[30px] w-[52px] items-center justify-center rounded-full transition ${
                    contieneActivo ? "bg-purple-500/25" : abierto ? "bg-white/5" : "group-hover:bg-white/5"
                  }`}
                >
                  <IconoMenu nombre={item.icono} />
                </span>
                <span>{item.label}</span>
              </button>
              {abierto && (
                <div id={idPanel} className={`${PANEL_FLOTANTE} left-[calc(100%+14px)] top-[-6px]`}>
                  <p className="px-2.5 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9d8fb8]">
                    {item.label}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {item.children.map((hijo) => (
                      <li key={hijo.id}>
                        <NavLink
                          to={hijo.to}
                          end={hijo.end}
                          translate={hijo.translate}
                          onClick={elegir}
                          className={({ isActive }) =>
                            `flex min-h-10 items-center whitespace-nowrap rounded-lg px-2.5 text-sm transition ${
                              isActive ? ACTIVO : INACTIVO
                            }`
                          }
                        >
                          {hijo.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        }

        const abierto = gruposAbiertos[item.id] ?? contieneActivo;
        const idLista = `menu-grupo-${variante}-${item.id}`;
        return (
          <li key={item.id}>
            <button
              type="button"
              aria-expanded={abierto}
              aria-controls={abierto ? idLista : undefined}
              onClick={() => setGruposAbiertos((actuales) => ({ ...actuales, [item.id]: !abierto }))}
              className={`flex w-full items-center gap-3 rounded-lg px-3 text-left transition hover:bg-white/5 ${ALTO_FILA[variante]} ${
                contieneActivo ? "font-semibold text-white" : "font-medium text-[#cbc3dd] hover:text-white"
              }`}
            >
              <IconoMenu nombre={item.icono} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <IconoMenu
                nombre="abajo"
                className={`h-4 w-4 shrink-0 opacity-70 transition-transform motion-reduce:transition-none ${abierto ? "" : "-rotate-90"}`}
              />
            </button>
            {abierto && (
              <ul
                id={idLista}
                className="mb-1.5 ml-[21px] mt-0.5 flex flex-col gap-0.5 border-l border-white/[0.12] pl-2.5"
              >
                {item.children.map((hijo) => (
                  <li key={hijo.id}>
                    <NavLink
                      to={hijo.to}
                      end={hijo.end}
                      translate={hijo.translate}
                      onClick={elegir}
                      className={({ isActive }) =>
                        `relative flex items-center rounded-lg px-3 transition ${ALTO_HIJO[variante]} ${
                          isActive ? ACTIVO : INACTIVO
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-y-2 -left-[11px] w-[3px] rounded bg-lime-300"
                            />
                          )}
                          {hijo.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function EnlaceMenu({ item, variante, onElegir }) {
  if (variante === MODOS_MENU.RIEL) {
    return (
      <NavLink
        to={item.to}
        end={item.end}
        translate={item.translate}
        onClick={onElegir}
        className={({ isActive }) =>
          `group flex flex-col items-center gap-1 rounded-xl py-1.5 text-center text-[11px] leading-tight transition ${
            isActive ? "font-semibold text-white" : "font-medium text-[#cbc3dd] hover:text-white"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex h-[30px] w-[52px] items-center justify-center rounded-full transition ${
                isActive ? "bg-purple-500/25" : "group-hover:bg-white/5"
              }`}
            >
              <IconoMenu nombre={item.icono} />
            </span>
            <span>{item.label}</span>
          </>
        )}
      </NavLink>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      translate={item.translate}
      onClick={onElegir}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-lg px-3 transition ${ALTO_FILA[variante]} ${
          isActive ? ACTIVO : `font-medium ${INACTIVO}`
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-lime-300" />
          )}
          <IconoMenu nombre={item.icono} />
          <span className="min-w-0 truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function Avatar({ nombre, rol }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-lime-300 text-[13px] font-extrabold text-[#2a1150]"
    >
      {obtenerIniciales(nombre) || obtenerIniciales(rol)}
    </span>
  );
}

function TarjetaUsuario({ nombre, rol, compacta, onCerrarSesion }) {
  const [abierta, setAbierta] = useState(false);
  const contenedorRef = useRef(null);
  const cerrar = useCallback(() => setAbierta(false), []);

  useCerrarAlSalir(abierta, contenedorRef, cerrar);

  return (
    <div ref={contenedorRef} className="relative mt-4 shrink-0 border-t border-white/[0.08] pt-3">
      {abierta && (
        <div
          className={`${PANEL_FLOTANTE} ${
            compacta ? "bottom-0 left-[calc(100%+14px)]" : "bottom-[calc(100%+8px)] left-0 right-0"
          }`}
        >
          <button
            type="button"
            onClick={onCerrarSesion}
            className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-semibold text-rose-300 transition hover:bg-white/5"
          >
            <IconoMenu nombre="salir" className="h-[18px] w-[18px] shrink-0" />
            Cerrar sesión
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setAbierta((actual) => !actual)}
        aria-expanded={abierta}
        aria-label={`${nombre ? `${nombre}, ` : ""}${rol}. Opciones de la cuenta`}
        className={`flex min-h-[52px] w-full items-center gap-2.5 rounded-[10px] text-left text-white transition hover:bg-white/5 ${
          compacta ? "justify-center" : "px-2"
        } ${abierta ? "bg-white/5" : ""}`}
      >
        <Avatar nombre={nombre} rol={rol} />
        {!compacta && (
          <>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold">{nombre || rol}</span>
              {nombre ? <span className="text-xs text-[#9d8fb8]">{rol}</span> : null}
            </span>
            <IconoMenu nombre="arribaAbajo" className="h-4 w-4 shrink-0 opacity-60" />
          </>
        )}
      </button>
    </div>
  );
}

function BarraSuperior({
  ubicacion,
  modo,
  puedeAlternar,
  onAlternarMenu,
  onNavegar,
  renderNotificaciones,
  renderSelectorAnio,
}) {
  const textoAlternar = modo === MODOS_MENU.ABIERTO ? "Encoger menú" : "Abrir menú";

  return (
    <header className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 print:hidden sm:px-6">
      {puedeAlternar && (
        <>
          <button
            type="button"
            onClick={onAlternarMenu}
            aria-label={textoAlternar}
            title={textoAlternar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <IconoMenu nombre="panel" />
          </button>
          <span aria-hidden="true" className="h-5 w-px bg-slate-200" />
        </>
      )}
      {ubicacion && (
        <nav aria-label="Ubicación" className="flex min-w-0 items-center gap-1.5 text-sm">
          {ubicacion.seccion && (
            <>
              <span className="whitespace-nowrap text-slate-500">{ubicacion.seccion}</span>
              <IconoMenu nombre="derecha" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            </>
          )}
          <span aria-current="page" className="truncate font-semibold text-slate-900">
            {ubicacion.pagina}
          </span>
        </nav>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {renderSelectorAnio ? renderSelectorAnio({ tono: "claro" }) : null}
        {renderNotificaciones(onNavegar, { tono: "claro" })}
      </div>
    </header>
  );
}

function BarraCelular({
  rutaInicio,
  menuAbierto,
  botonMenuRef,
  onAbrirMenu,
  onNavegar,
  renderNotificaciones,
  renderSelectorAnio,
}) {
  return (
    <header className="relative z-30 flex h-[60px] items-center gap-1.5 bg-[#2a1150] pl-1 pr-1.5 text-white print:hidden">
      <button
        ref={botonMenuRef}
        type="button"
        onClick={onAbrirMenu}
        aria-label="Abrir menú"
        aria-expanded={menuAbierto}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition hover:bg-white/10"
      >
        <IconoMenu nombre="menu" className="h-[22px] w-[22px]" />
      </button>
      <Link to={rutaInicio} aria-label="Ir al inicio de Auligo" className="flex shrink-0 items-center">
        <img src={auligoLogoNav} alt="Auligo" className="h-7 w-auto" />
      </Link>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        {renderSelectorAnio ? renderSelectorAnio({ tono: "oscuro" }) : null}
        {renderNotificaciones(onNavegar, { tono: "oscuro" })}
      </div>
    </header>
  );
}

function MenuCelular({ items, etiqueta, pathname, nombre, rol, onCerrar, onCerrarSesion }) {
  const cerrarRef = useRef(null);

  // Al abrir: el foco va a la X, Escape cierra y la página de atrás no se mueve.
  useEffect(() => {
    cerrarRef.current?.focus();
    const cerrarEscape = (event) => {
      if (event.key === "Escape") onCerrar();
    };
    const desbordeAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", cerrarEscape);
    return () => {
      document.body.style.overflow = desbordeAnterior;
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 print:hidden">
      <div aria-hidden="true" onClick={onCerrar} className="absolute inset-0 bg-[rgba(10,4,25,0.55)]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        className="absolute inset-y-0 left-0 flex w-[304px] max-w-[85vw] flex-col bg-[#2a1150] text-[#cbc3dd] shadow-[12px_0_40px_rgba(10,4,25,0.45)]"
      >
        <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-white/[0.08] pl-5 pr-2">
          <img src={auligoLogoNav} alt="Auligo" className="h-7 w-auto" />
          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="flex h-11 w-11 items-center justify-center rounded-lg transition hover:bg-white/10 hover:text-white"
          >
            <IconoMenu nombre="cerrar" className="h-[22px] w-[22px]" />
          </button>
        </div>
        <nav aria-label={etiqueta} className="min-h-0 flex-1 overflow-y-auto p-3">
          <ListaMenu items={items} variante={MODOS_MENU.CELULAR} pathname={pathname} onElegir={onCerrar} />
        </nav>
        <div className="shrink-0 border-t border-white/[0.08] p-3">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <Avatar nombre={nombre} rol={rol} />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold text-white">{nombre || rol}</span>
              {nombre ? <span className="text-xs text-[#9d8fb8]">{rol}</span> : null}
            </span>
          </div>
          <button
            type="button"
            onClick={onCerrarSesion}
            className="mt-1 flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[15px] font-semibold text-rose-300 transition hover:bg-white/5"
          >
            <IconoMenu nombre="salir" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default MenuLateralView;
