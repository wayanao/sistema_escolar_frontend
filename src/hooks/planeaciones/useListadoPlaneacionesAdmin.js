import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listarPlaneacionesAdmin,
  listarProfesoresPlaneaciones,
} from "../../services/planeacionesApi";
import {
  crearParametrosPlanes,
  ESTADOS_FILTRABLES,
  normalizarRespuestaPlanes,
  PAGE_SIZE,
} from "../../utils/planeaciones/admin";

export default function useListadoPlaneacionesAdmin({
  searchParams,
  setSearchParams,
}) {
  const vistaInicial = ["realizadas", "programadas", "todas"].includes(
    searchParams.get("vista"),
  )
    ? searchParams.get("vista")
    : "programadas";
  const estadoInicial = ESTADOS_FILTRABLES.includes(
    searchParams.get("estado"),
  )
    ? searchParams.get("estado")
    : "";
  const paginaInicial = Math.max(
    1,
    Number(searchParams.get("pagina")) || 1,
  );
  const crearFiltrosIniciales = () => ({
    profesor_id: searchParams.get("profesor_id") || "",
    busqueda: searchParams.get("busqueda") || "",
  });

  const [profesores, setProfesores] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [total, setTotal] = useState(0);
  const [vista, setVista] = useState(vistaInicial);
  const [estado, setEstado] = useState(estadoInicial);
  const [pagina, setPagina] = useState(paginaInicial);
  const [filtros, setFiltros] = useState(crearFiltrosIniciales);
  const [filtrosAplicados, setFiltrosAplicados] = useState(
    crearFiltrosIniciales,
  );
  const [cargando, setCargando] = useState(
    Boolean(vistaInicial && estadoInicial),
  );
  const [conteoPendientes, setConteoPendientes] = useState(null);
  const [error, setError] = useState("");

  const seleccionCompleta = Boolean(vista && estado);
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const desde = total === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(pagina * PAGE_SIZE, total);

  const queryActual = useMemo(() => {
    const query = new URLSearchParams();
    if (vista) query.set("vista", vista);
    if (estado) query.set("estado", estado);
    if (seleccionCompleta && pagina > 1) {
      query.set("pagina", String(pagina));
    }
    Object.entries(filtrosAplicados).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    return query;
  }, [estado, filtrosAplicados, pagina, seleccionCompleta, vista]);

  useEffect(() => {
    setSearchParams(queryActual, { replace: true });
  }, [queryActual, setSearchParams]);

  useEffect(() => {
    const termino = filtros.busqueda.trim();
    const siguienteBusqueda = termino.length >= 2 ? termino : "";

    if (siguienteBusqueda === filtrosAplicados.busqueda) return undefined;

    const timeoutId = window.setTimeout(
      () => {
        setFiltrosAplicados((actual) =>
          actual.busqueda === siguienteBusqueda
            ? actual
            : { ...actual, busqueda: siguienteBusqueda },
        );
        setPagina(1);
      },
      siguienteBusqueda ? 120 : 0,
    );

    return () => window.clearTimeout(timeoutId);
  }, [filtros.busqueda, filtrosAplicados.busqueda]);

  useEffect(() => {
    let activo = true;

    listarProfesoresPlaneaciones()
      .then((data) => {
        if (activo) setProfesores(Array.isArray(data) ? data : []);
      })
      .catch((requestError) =>
        console.error("Error cargando profesores", requestError),
      );

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!vista || !estado) {
      setPlanes([]);
      setTotal(0);
      setError("");
      setCargando(false);
      return undefined;
    }

    const controller = new AbortController();

    const cargar = async () => {
      setCargando(true);
      setError("");

      try {
        const params = crearParametrosPlanes({
          vista,
          filtros: filtrosAplicados,
          estado,
          limit: PAGE_SIZE,
          offset: (pagina - 1) * PAGE_SIZE,
        });
        const data = await listarPlaneacionesAdmin(params, {
          signal: controller.signal,
        });
        const respuesta = normalizarRespuestaPlanes(data);
        setPlanes(respuesta.items);
        setTotal(respuesta.total);
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") {
          console.error("Error cargando planeadores", requestError);
          setPlanes([]);
          setTotal(0);
          setError(
            "No fue posible cargar las planeaciones. Intenta nuevamente.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    };

    void cargar();
    return () => controller.abort();
  }, [estado, filtrosAplicados, pagina, vista]);

  useEffect(() => {
    if (!vista) {
      setConteoPendientes(null);
      return undefined;
    }

    const controller = new AbortController();

    const cargarConteos = async () => {
      setConteoPendientes(null);

      try {
        const data = await listarPlaneacionesAdmin(
          crearParametrosPlanes({
            vista,
            filtros: filtrosAplicados,
            estado: "pendiente",
            limit: 1,
            offset: 0,
          }),
          { signal: controller.signal },
        );

        if (!controller.signal.aborted) {
          setConteoPendientes(normalizarRespuestaPlanes(data).total);
        }
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") {
          console.error(
            "Error cargando contadores de planeaciones",
            requestError,
          );
        }
      }
    };

    void cargarConteos();
    return () => controller.abort();
  }, [filtrosAplicados, vista]);

  useEffect(() => {
    if (!cargando && pagina > totalPaginas) setPagina(totalPaginas);
  }, [cargando, pagina, totalPaginas]);

  const cambiarVista = useCallback((siguienteVista) => {
    setVista(siguienteVista);
    setPagina(1);
  }, []);

  const cambiarEstado = useCallback((siguienteEstado) => {
    setEstado(siguienteEstado);
    setPagina(1);
  }, []);

  const cambiarProfesor = useCallback((profesorId) => {
    setFiltros((actual) => ({ ...actual, profesor_id: profesorId }));
    setFiltrosAplicados((actual) => ({
      ...actual,
      profesor_id: profesorId,
    }));
    setPagina(1);
  }, []);

  const cambiarBusqueda = useCallback((busqueda) => {
    setFiltros((actual) => ({ ...actual, busqueda }));

    if (!busqueda.trim()) {
      setFiltrosAplicados((actual) =>
        actual.busqueda ? { ...actual, busqueda: "" } : actual,
      );
      setPagina(1);
    }
  }, []);

  const limpiarBusqueda = useCallback(() => {
    setFiltros((actual) => ({ ...actual, busqueda: "" }));
    setFiltrosAplicados((actual) => ({ ...actual, busqueda: "" }));
    setPagina(1);
  }, []);

  const limpiarFiltros = useCallback(() => {
    const vacios = { profesor_id: "", busqueda: "" };
    setFiltros(vacios);
    setFiltrosAplicados(vacios);
    setVista("");
    setEstado("");
    setPagina(1);
  }, []);

  return {
    profesores,
    planes,
    total,
    vista,
    estado,
    pagina,
    filtros,
    filtrosAplicados,
    cargando,
    conteoPendientes,
    error,
    seleccionCompleta,
    totalPaginas,
    desde,
    hasta,
    queryActual,
    cambiarVista,
    cambiarEstado,
    cambiarPagina: setPagina,
    cambiarProfesor,
    cambiarBusqueda,
    limpiarBusqueda,
    limpiarFiltros,
  };
}
