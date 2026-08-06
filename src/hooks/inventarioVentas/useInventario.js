import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { obtenerInventario } from "../../services/inventarioVentasApi";
import {
    aplicarEstadoProducto,
    ESTADO_PRODUCTO_POR_DEFECTO,
} from "../../utils/inventarioVentas/inventario";

const useInventario = () => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [estadoFiltro, setEstadoFiltro] = useState(ESTADO_PRODUCTO_POR_DEFECTO);

    const cargarInventario = useCallback(async () => {
        try {
            const data = await obtenerInventario(estadoFiltro);
            setProductos(data);
        } catch (error) {
            console.error("Error cargando inventario", error);
            Swal.fire("Error", "No se pudo cargar el inventario", "error");
        } finally {
            setLoading(false);
        }
    }, [estadoFiltro]);

    useEffect(() => {
        cargarInventario();
    }, [cargarInventario]);

    const aplicarEstadoLocal = useCallback(
        (productoId, estado) => {
            setProductos((actuales) =>
                aplicarEstadoProducto(actuales, productoId, estado, estadoFiltro)
            );
        },
        [estadoFiltro]
    );

    return {
        productos,
        loading,
        estadoFiltro,
        setEstadoFiltro,
        cargarInventario,
        aplicarEstadoLocal,
    };
};

export default useInventario;
