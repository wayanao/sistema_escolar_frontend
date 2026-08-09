import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useNotificacionesPlaneadores from "../../hooks/planeaciones/useNotificacionesPlaneadores";
import {
  agruparNotificacionesAdmin,
  crearRutaNotificacionProfesor,
  crearRutaPlaneacionesProfesor,
} from "../../utils/planeaciones/notificacionesContratos";
import NotificacionesPlaneadoresVista from "./NotificacionesPlaneadoresVista";

function NotificacionesPlaneadores({ rol, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const contenedorRef = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const {
    total,
    totalProfesores,
    items,
    cargando,
    error,
    cargar,
  } = useNotificacionesPlaneadores(rol);
  const gruposAdmin = useMemo(
    () => (rol === "admin" ? agruparNotificacionesAdmin(items) : []),
    [items, rol],
  );

  useEffect(() => {
    setAbierto(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const cerrarFuera = (event) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
        setAbierto(false);
      }
    };
    const cerrarEscape = (event) => {
      if (event.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", cerrarFuera);
    document.addEventListener("keydown", cerrarEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarFuera);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, []);

  const abrirNotificacion = (item) => {
    setAbierto(false);
    onNavigate?.();
    navigate(crearRutaNotificacionProfesor(item));
  };

  const verPlaneacionesProfesor = (grupo) => {
    setAbierto(false);
    onNavigate?.();
    navigate(crearRutaPlaneacionesProfesor(grupo));
  };

  const verTodos = () => {
    setAbierto(false);
    onNavigate?.();
    navigate(rol === "admin" ? "/admin/planeadores-clases" : "/plan-de-clases");
  };

  return (
    <NotificacionesPlaneadoresVista
      rol={rol}
      abierto={abierto}
      total={total}
      totalProfesores={totalProfesores}
      items={items}
      gruposAdmin={gruposAdmin}
      cargando={cargando}
      error={error}
      contenedorRef={contenedorRef}
      onAlternar={() => setAbierto((actual) => !actual)}
      onReintentar={() => cargar()}
      onAbrirGrupo={verPlaneacionesProfesor}
      onAbrirNotificacion={abrirNotificacion}
      onVerTodos={verTodos}
    />
  );
}

export default NotificacionesPlaneadores;
