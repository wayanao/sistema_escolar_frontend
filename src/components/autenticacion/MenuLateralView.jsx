import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import auligoLogoNav from "../../assets/auligo-logo-nav.png";
import { MODOS_MENU, obtenerIniciales } from "../../utils/autenticacion/menuLateral";
import {
  esRutaNavegacionActiva,
  obtenerUbicacionNavegacion,
  repartirBarraInferior,
} from "../../utils/autenticacion/navegacion";
import IconoMenu from "./IconoMenu";

// El menú lateral con su marco. En celular: barra oscura arriba y un menú que
// se desliza desde la izquierda, o, si llega `barraInferior`, una barra abajo
// con esas pantallas y «Más» para el resto. Desde tablet: el menú a la
// izquierda (riel o abierto, según `modo`) y una barra blanca sobre el
// contenido. Solo presenta: el modo lo decide useMenuLateral y los permisos,
// el backend.
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
// Alto de la barra de abajo del celular (`h-[4.5rem]`). La página deja ese
// espacio al final (`pb-[4.5rem]`), y lo que se queda pegado abajo, como
// «Guardar asistencia», lo lee de --alto-barra-inferior para quedar encima.
const ALTO_BARRA_INFERIOR = "4.5rem";

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

// Mientras un panel cubre la pantalla: el foco va a su botón de cerrar,
// Escape lo cierra y la página de atrás no se mueve.
function usePanelEncima(botonCerrarRef, onCerrar) {
  useEffect(() => {
    botonCerrarRef.current?.focus();
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
  }, [botonCerrarRef, onCerrar]);
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
  barraInferior,
  children,
}) {
  const { pathname } = useLocation();
  const [menuCelularAbierto, setMenuCelularAbierto] = useState(false);
  const [masAbierto, setMasAbierto] = useState(false);
  const botonMenuRef = useRef(null);
  const botonMasRef = useRef(null);
  const enCelular = modo === MODOS_MENU.CELULAR;
  const enRiel = modo === MODOS_MENU.RIEL;
  const conBarraInferior = enCelular && Boolean(barraInferior?.length);
  const ubicacion = obtenerUbicacionNavegacion(items, pathname);
  // Sin grupos que abran un panel al lado, el riel puede desplazarse en una
  // pantalla baja: el del profesor es más largo que el del admin.
  const rielDesplazable = !items.some((item) => item.type === "group" && !item.siempreAbierto);

  const cerrarMenuCelular = useCallback(() => {
    setMenuCelularAbierto(false);
    botonMenuRef.current?.focus();
  }, []);
  const cerrarMas = useCallback(() => {
    setMasAbierto(false);
    botonMasRef.current?.focus();
  }, []);
  const alNavegar = conBarraInferior ? cerrarMas : cerrarMenuCelular;

  return (
    <div className="md:flex md:min-h-screen">
      {enCelular ? (
        <BarraCelular
          rutaInicio={rutaInicio}
          conMenu={!conBarraInferior}
          menuAbierto={menuCelularAbierto}
          botonMenuRef={botonMenuRef}
          onAbrirMenu={() => setMenuCelularAbierto(true)}
          onNavegar={alNavegar}
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
          <nav
            aria-label={etiqueta}
            className={enRiel && rielDesplazable ? "min-h-0 flex-1 overflow-y-auto" : "flex-1"}
          >
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

      <div
        className={`flex min-w-0 flex-1 flex-col ${conBarraInferior ? "pb-[4.5rem]" : ""}`}
        style={conBarraInferior ? { "--alto-barra-inferior": ALTO_BARRA_INFERIOR } : undefined}
      >
        {!enCelular && (
          <BarraSuperior
            ubicacion={ubicacion}
            modo={modo}
            puedeAlternar={puedeAlternar}
            onAlternarMenu={onAlternarMenu}
            onNavegar={alNavegar}
            renderNotificaciones={renderNotificaciones}
            renderSelectorAnio={renderSelectorAnio}
          />
        )}
        {children}
      </div>

      {enCelular && !conBarraInferior && menuCelularAbierto && (
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
      {conBarraInferior && (
        <BarraInferior
          items={items}
          ids={barraInferior}
          etiqueta={etiqueta}
          pathname={pathname}
          masAbierto={masAbierto}
          botonMasRef={botonMasRef}
          onAbrirMas={() => setMasAbierto(true)}
        />
      )}
      {conBarraInferior && masAbierto && (
        <HojaMas
          items={items}
          ids={barraInferior}
          nombre={nombre}
          rol={rol}
          onCerrar={cerrarMas}
          onCerrarSesion={onCerrarSesion}
        />
      )}
    </div>
  );
}

function Separador() {
  return (
    <li aria-hidden="true">
      <span className="mx-2 my-2 block h-px bg-white/10" />
    </li>
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
      {items.map((item, indice) => {
        if (item.type !== "group") {
          // Una línea separa lo suelto que viene después de los títulos.
          const trasTitulos = Boolean(items[indice - 1]?.siempreAbierto);
          return (
            <Fragment key={item.id}>
              {trasTitulos && <Separador />}
              <li>
                <EnlaceMenu item={item} variante={variante} onElegir={elegir} />
              </li>
            </Fragment>
          );
        }

        if (item.siempreAbierto) {
          // En el riel el título no cabe: una línea lo reemplaza.
          const idTitulo = `menu-titulo-${variante}-${item.id}`;
          return (
            <li key={item.id}>
              {enRiel ? (
                <span aria-hidden="true" className="mx-2 my-2 block h-px bg-white/10" />
              ) : (
                <p
                  id={idTitulo}
                  className="mb-1 mt-3.5 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9d8fb8]"
                >
                  {item.label}
                </p>
              )}
              <ul
                aria-labelledby={enRiel ? undefined : idTitulo}
                aria-label={enRiel ? item.label : undefined}
                className={`flex flex-col ${enRiel ? "gap-1" : "gap-0.5"}`}
              >
                {item.children.map((hijo) => (
                  <li key={hijo.id}>
                    <EnlaceMenu item={hijo} variante={variante} onElegir={elegir} />
                  </li>
                ))}
              </ul>
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
  conMenu,
  menuAbierto,
  botonMenuRef,
  onAbrirMenu,
  onNavegar,
  renderNotificaciones,
  renderSelectorAnio,
}) {
  // Va por encima de la barra de abajo para que la ventana de la campana,
  // que baja hasta casi el final de la pantalla, no quede tapada.
  return (
    <header
      className={`relative z-40 flex h-[60px] items-center gap-1.5 bg-[#2a1150] pr-1.5 text-white print:hidden ${
        conMenu ? "pl-1" : "pl-4"
      }`}
    >
      {conMenu && (
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
      )}
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
  usePanelEncima(cerrarRef, onCerrar);

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

function PastillaBarra({ activa, icono }) {
  return (
    <span
      className={`flex h-[30px] w-[52px] items-center justify-center rounded-full transition ${
        activa ? "bg-purple-100" : ""
      }`}
    >
      <IconoMenu nombre={icono} className="h-[22px] w-[22px] shrink-0" />
    </span>
  );
}

function BarraInferior({ items, ids, etiqueta, pathname, masAbierto, botonMasRef, onAbrirMas }) {
  const { abajo, resto } = repartirBarraInferior(items, ids);
  // «Más» se marca si está abierto o si la página actual vive ahí.
  const enMas = masAbierto || resto.some((destino) => esRutaNavegacionActiva(destino, pathname));
  const estiloBoton = (activo) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] leading-none transition ${
      activo ? "font-bold text-purple-700" : "font-medium text-slate-500 hover:text-slate-800"
    }`;

  return (
    <nav
      aria-label={etiqueta}
      className="fixed inset-x-0 bottom-0 z-30 flex h-[4.5rem] items-stretch border-t border-slate-200 bg-white px-1 print:hidden"
    >
      {abajo.map((destino) => (
        <NavLink
          key={destino.id}
          to={destino.to}
          end={destino.end}
          translate={destino.translate}
          className={({ isActive }) => estiloBoton(isActive)}
        >
          {({ isActive }) => (
            <>
              <PastillaBarra activa={isActive} icono={destino.icono} />
              <span className="max-w-full truncate px-0.5">{destino.label}</span>
            </>
          )}
        </NavLink>
      ))}
      <button
        ref={botonMasRef}
        type="button"
        onClick={onAbrirMas}
        aria-expanded={masAbierto}
        aria-haspopup="dialog"
        className={estiloBoton(enMas)}
      >
        <PastillaBarra activa={enMas} icono="menu" />
        <span>Más</span>
      </button>
    </nav>
  );
}

function HojaMas({ items, ids, nombre, rol, onCerrar, onCerrarSesion }) {
  const cerrarRef = useRef(null);
  const { resto } = repartirBarraInferior(items, ids);
  usePanelEncima(cerrarRef, onCerrar);

  return (
    <div className="fixed inset-0 z-50 print:hidden">
      <div aria-hidden="true" onClick={onCerrar} className="absolute inset-0 bg-[rgba(10,4,25,0.45)]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Más opciones"
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[20px] bg-white px-3 pb-5 pt-2 shadow-[0_-12px_40px_rgba(10,4,25,0.25)]"
      >
        <span aria-hidden="true" className="mx-auto mt-1 h-1 w-10 shrink-0 rounded-full bg-slate-300" />
        <div className="flex shrink-0 items-center justify-between pl-3">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Más opciones</p>
          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar más opciones"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <IconoMenu nombre="cerrar" />
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {resto.map((destino) => (
            <li key={destino.id}>
              <NavLink
                to={destino.to}
                end={destino.end}
                translate={destino.translate}
                onClick={onCerrar}
                className={({ isActive }) =>
                  `flex min-h-[52px] items-center gap-3.5 rounded-xl px-3 text-[15px] text-slate-900 transition ${
                    isActive ? "bg-purple-100 font-bold" : "font-medium hover:bg-slate-50"
                  }`
                }
              >
                <IconoMenu nombre={destino.icono} className="h-[22px] w-[22px] shrink-0 text-purple-700" />
                {destino.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <span aria-hidden="true" className="mx-3 my-2 block h-px shrink-0 bg-slate-200" />
        <div className="flex shrink-0 items-center gap-2.5 px-3 py-1.5">
          <Avatar nombre={nombre} rol={rol} />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold text-slate-900">{nombre || rol}</span>
            {nombre ? <span className="text-xs text-slate-500">{rol}</span> : null}
          </span>
        </div>
        <button
          type="button"
          onClick={onCerrarSesion}
          className="flex min-h-[52px] w-full shrink-0 items-center gap-3.5 rounded-xl px-3 text-left text-[15px] font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          <IconoMenu nombre="salir" className="h-[22px] w-[22px] shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default MenuLateralView;
