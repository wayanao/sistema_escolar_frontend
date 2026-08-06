import { useState } from "react";
import { registrarVenta } from "../../services/inventarioVentasApi";
import {
    agregarProductoAlCarrito,
    calcularTotalVenta,
    cambiarCantidadEnCarrito,
    construirPayloadVenta,
    construirVolanteVenta,
    estudianteHistorialId,
    filtrarEstudiantesPorBusqueda,
    filtrarVentasPorEstudiante,
    nombreClienteVolante,
    nombreCompletoEstudiante,
    removerDelCarrito,
} from "../../utils/inventarioVentas/ventas";

const useCarritoVenta = ({ inventario, estudiantes, ventasAnteriores, cargarDatos }) => {
    const [carrito, setCarrito] = useState([]);
    const [estudianteId, setEstudianteId] = useState("");
    const [busquedaEstudiante, setBusquedaEstudiante] = useState("");
    const [mostrarDropdownEstudiantes, setMostrarDropdownEstudiantes] = useState(false);
    const [notas, setNotas] = useState("");
    const [estudianteFiltroId, setEstudianteFiltroId] = useState(null);
    const [ultimaVenta, setUltimaVenta] = useState(null);

    const agregarAlCarrito = (productoId) => {
        const prod = inventario.find(i => i.id === parseInt(productoId));
        if (!prod) return;

        // Verificar si ya está en carrito
        const resultado = agregarProductoAlCarrito(carrito, prod);
        if (resultado.sinStock) {
            alert("No hay más stock disponible de este producto.");
            return;
        }
        setCarrito(resultado.carrito);
    };

    const quitarDelCarrito = (id) => {
        setCarrito(removerDelCarrito(carrito, id));
    };

    const cambiarCantidad = (id, delta) => {
        setCarrito(cambiarCantidadEnCarrito(carrito, id, delta));
    };

    const totalVenta = calcularTotalVenta(carrito);

    const historialEstudianteId = estudianteHistorialId(estudianteId, estudianteFiltroId);
    const ventasDelEstudiante = filtrarVentasPorEstudiante(ventasAnteriores, historialEstudianteId);
    const estudiantesFiltrados = filtrarEstudiantesPorBusqueda(estudiantes, busquedaEstudiante);
    const hayEstudianteEnHistorial = Boolean(estudianteId || estudianteFiltroId);

    const abrirDropdownEstudiantes = () => setMostrarDropdownEstudiantes(true);

    const cerrarDropdownEstudiantes = () => setMostrarDropdownEstudiantes(false);

    const cambiarBusquedaEstudiante = (valor) => {
        setBusquedaEstudiante(valor);
        setMostrarDropdownEstudiantes(true);
        setEstudianteId(""); // Resetear ID si cambia el texto
    };

    const seleccionarEstudiante = (estudiante) => {
        setEstudianteId(estudiante.id.toString());
        setBusquedaEstudiante(nombreCompletoEstudiante(estudiante));
        setMostrarDropdownEstudiantes(false);
    };

    const procesarVenta = async () => {
        if (carrito.length === 0) {
            alert("El carrito está vacío.");
            return;
        }
        if (!estudianteId || estudianteId === "publico") {
            alert("Por favor selecciona un estudiante válido. Ya no se permiten cargos a Público General.");
            return;
        }

        try {
            // Siempre a crédito/pendiente
            const payload = construirPayloadVenta({ estudianteId, carrito, notas });

            const ventaRegistrada = await registrarVenta(payload);

            // Armamos un objeto manual para imprimirlo sin recargar
            const estudianteObj = estudiantes.find(e => e.id === parseInt(estudianteId));
            let nombreVolante = nombreClienteVolante(estudianteObj);

            setUltimaVenta(construirVolanteVenta({
                ventaId: ventaRegistrada.id,
                cliente: nombreVolante,
                carrito,
                fecha: new Date().toLocaleDateString()
            }));

            alert("Productos cargados a la cuenta del estudiante exitosamente");
            setEstudianteFiltroId(parseInt(estudianteId));
            setCarrito([]);
            setNotas("");
            setEstudianteId("");
            setBusquedaEstudiante("");
            cargarDatos(); // Refrescar stock e historial
        } catch (err) {
            console.error(err);
            alert("Error procesando la venta");
        }
    };

    return {
        carrito,
        totalVenta,
        agregarAlCarrito,
        quitarDelCarrito,
        cambiarCantidad,
        busquedaEstudiante,
        cambiarBusquedaEstudiante,
        mostrarDropdownEstudiantes,
        abrirDropdownEstudiantes,
        cerrarDropdownEstudiantes,
        estudiantesFiltrados,
        seleccionarEstudiante,
        hayEstudianteEnHistorial,
        ventasDelEstudiante,
        ultimaVenta,
        procesarVenta,
    };
};

export default useCarritoVenta;
