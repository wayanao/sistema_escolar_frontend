import { useState } from "react";
import Swal from "sweetalert2";
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
    const [estudianteFiltroId, setEstudianteFiltroId] = useState(null);
    const [ultimaVenta, setUltimaVenta] = useState(null);
    const [registrandoVenta, setRegistrandoVenta] = useState(false);

    const agregarAlCarrito = (productoId) => {
        const prod = inventario.find(i => i.id === parseInt(productoId));
        if (!prod) return;

        // Verificar si ya está en carrito
        const resultado = agregarProductoAlCarrito(carrito, prod);
        if (resultado.sinStock) {
            Swal.fire("Atención", "No hay más stock disponible de este producto.", "warning");
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
        // Evita registrar dos cargos si se vuelve a pulsar mientras la
        // petición sigue en vuelo.
        if (registrandoVenta) return;

        if (carrito.length === 0) {
            Swal.fire("Atención", "El carrito está vacío.", "warning");
            return;
        }
        if (!estudianteId || estudianteId === "publico") {
            Swal.fire(
                "Atención",
                "Por favor selecciona un estudiante válido. Ya no se permiten cargos a Público General.",
                "warning"
            );
            return;
        }

        setRegistrandoVenta(true);
        try {
            // Siempre a crédito/pendiente. El backend acepta `notas`, pero la
            // caja no tiene control para escribirlas, así que viaja vacío.
            const payload = construirPayloadVenta({ estudianteId, carrito, notas: "" });

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

            Swal.fire("Éxito", "Productos cargados a la cuenta del estudiante exitosamente", "success");
            setEstudianteFiltroId(parseInt(estudianteId));
            setCarrito([]);
            setEstudianteId("");
            setBusquedaEstudiante("");
            cargarDatos(); // Refrescar stock e historial
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Error procesando la venta", "error");
        } finally {
            setRegistrandoVenta(false);
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
        registrandoVenta,
        procesarVenta,
    };
};

export default useCarritoVenta;
