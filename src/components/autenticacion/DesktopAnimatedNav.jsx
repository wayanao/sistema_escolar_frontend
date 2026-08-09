import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  esRutaNavegacionActiva,
  obtenerIdItemNavegacionActivo,
} from "../../utils/autenticacion/navegacion";

function ChevronIcon() {
  return (
    <svg className="desktop-nav-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function DesktopAnimatedNav({ items, variant, dropdownLinkClass, ariaLabel }) {
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const itemRefs = useRef(new Map());
  const restoreTimerRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });
  const [isRestoring, setIsRestoring] = useState(false);

  const activeItemId = useMemo(() => {
    return obtenerIdItemNavegacionActivo(items, pathname);
  }, [items, pathname]);

  const setItemRef = useCallback(
    (id) => (node) => {
      if (node) {
        itemRefs.current.set(id, node);
      } else {
        itemRefs.current.delete(id);
      }
    },
    [],
  );

  const moveIndicator = useCallback((id) => {
    const navNode = navRef.current;
    const itemNode = id ? itemRefs.current.get(id) : null;

    if (!navNode || !itemNode) {
      setIndicator((current) => ({ ...current, visible: false }));
      return;
    }

    const navRect = navNode.getBoundingClientRect();
    const itemRect = itemNode.getBoundingClientRect();

    setIndicator({
      left: itemRect.left - navRect.left,
      width: itemRect.width,
      visible: true,
    });
  }, []);

  useLayoutEffect(() => {
    moveIndicator(activeItemId);
  }, [activeItemId, moveIndicator]);

  useEffect(() => {
    const handleResize = () => moveIndicator(activeItemId);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeItemId, moveIndicator]);

  useEffect(() => {
    return () => window.clearTimeout(restoreTimerRef.current);
  }, []);

  const previewIndicator = (id) => {
    window.clearTimeout(restoreTimerRef.current);
    setIsRestoring(false);
    moveIndicator(id);
  };

  const restoreActiveIndicator = () => {
    window.clearTimeout(restoreTimerRef.current);
    setIsRestoring(true);
    moveIndicator(activeItemId);
    restoreTimerRef.current = window.setTimeout(() => setIsRestoring(false), 780);
  };

  return (
    <nav
      ref={navRef}
      className={`desktop-animated-nav desktop-animated-nav--${variant}${isRestoring ? " is-restoring" : ""}`}
      aria-label={ariaLabel}
      onMouseLeave={restoreActiveIndicator}
    >
      <span
        className="desktop-nav-indicator"
        style={{
          "--indicator-x": `${indicator.left}px`,
          "--indicator-width": `${indicator.width}px`,
          opacity: indicator.visible ? 1 : 0,
        }}
        aria-hidden="true"
      />

      {items.map((item) => {
        const active = esRutaNavegacionActiva(item, pathname);
        const itemClassName = `desktop-nav-item${active ? " is-active" : ""}`;

        if (item.type === "group") {
          return (
            <div key={item.id} className="desktop-nav-group group">
              <button
                ref={setItemRef(item.id)}
                type="button"
                className={itemClassName}
                aria-haspopup="menu"
                onMouseEnter={() => previewIndicator(item.id)}
                onFocus={() => previewIndicator(item.id)}
              >
                <span>{item.label}</span>
                <ChevronIcon />
              </button>

              <div className="desktop-nav-dropdown absolute left-0 top-full hidden min-w-[190px] rounded-lg border py-2 text-gray-800 shadow-xl group-hover:block group-focus-within:block">
                {item.children.map((child) => (
                  <NavLink
                    key={child.id}
                    end={child.end}
                    className={dropdownLinkClass}
                    to={child.to}
                    translate={child.translate}
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            ref={setItemRef(item.id)}
            to={item.to}
            className={itemClassName}
            aria-current={active ? "page" : undefined}
            translate={item.translate}
            onMouseEnter={() => previewIndicator(item.id)}
            onFocus={() => previewIndicator(item.id)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default DesktopAnimatedNav;
