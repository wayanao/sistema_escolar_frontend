import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
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
    const [cargando, setCargando] = useState(true);

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true);
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
            Swal.fire("Error", "Error cargando base de datos", "error");
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    return { inventario, estudiantes, ventasAnteriores, cargando, cargarDatos };
};

export default useConsultasVentas;
