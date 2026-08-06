import { useCallback, useEffect, useState } from "react";
import {
    obtenerEstudiantesParaVentas,
    obtenerInventario,
    obtenerVentas,
} from "../../services/inventarioVentasApi";
import {
    ESTADO_PRODUCTO_POR_DEFECTO,
} from "../../utils/inventarioVentas/inventario";
import { filtrarCatalogoVendible } from "../../utils/inventarioVentas/ventas";

const useConsultasVentas = () => {
    const [inventario, setInventario] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [ventasAnteriores, setVentasAnteriores] = useState([]);
    // Estado de carga heredado: se escribe pero ninguna vista lo lee.
    const [, setLoading] = useState(true);

    const cargarDatos = useCallback(async () => {
        try {
            setLoading(true);
            const [ventas, inventarioActivo, listaEstudiantes] = await Promise.all([
                obtenerVentas(),
                obtenerInventario(ESTADO_PRODUCTO_POR_DEFECTO),
                obtenerEstudiantesParaVentas(),
            ]);
            setVentasAnteriores(ventas);
            // Solo vender productos activos con stock
            setInventario(filtrarCatalogoVendible(inventarioActivo));
            setEstudiantes(listaEstudiantes);
        } catch (err) {
            console.error(err);
            alert("Error cargando base de datos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    return { inventario, estudiantes, ventasAnteriores, cargarDatos };
};

export default useConsultasVentas;
