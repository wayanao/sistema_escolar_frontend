import { useState } from "react";
import VistaVentas from "../components/inventarioVentas/VistaVentas";
import VolanteVenta from "../components/inventarioVentas/VolanteVenta";
import useAnulacionVenta from "../hooks/inventarioVentas/useAnulacionVenta";
import useCarritoVenta from "../hooks/inventarioVentas/useCarritoVenta";
import useConsultasVentas from "../hooks/inventarioVentas/useConsultasVentas";

const VentasAdmin = () => {
    const { inventario, estudiantes, ventasAnteriores, cargando, cargarDatos } = useConsultasVentas();

    const {
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
    } = useCarritoVenta({ inventario, estudiantes, ventasAnteriores, cargarDatos });

    const { anularVenta } = useAnulacionVenta(cargarDatos);

    // Imprimir volante
    const [vistaVolante, setVistaVolante] = useState(false);

    if (vistaVolante && ultimaVenta) {
        return (
            <VolanteVenta venta={ultimaVenta} onVolver={() => setVistaVolante(false)} />
        );
    }

    return (
        <VistaVentas
            inventario={inventario}
            cargando={cargando}
            carrito={carrito}
            totalVenta={totalVenta}
            onAgregarAlCarrito={agregarAlCarrito}
            onCambiarCantidad={cambiarCantidad}
            onQuitarDelCarrito={quitarDelCarrito}
            busquedaEstudiante={busquedaEstudiante}
            onCambiarBusqueda={cambiarBusquedaEstudiante}
            mostrarDropdownEstudiantes={mostrarDropdownEstudiantes}
            onMostrarDropdown={abrirDropdownEstudiantes}
            onOcultarDropdown={cerrarDropdownEstudiantes}
            estudiantesFiltrados={estudiantesFiltrados}
            onSeleccionarEstudiante={seleccionarEstudiante}
            onProcesarVenta={procesarVenta}
            registrandoVenta={registrandoVenta}
            hayEstudianteEnHistorial={hayEstudianteEnHistorial}
            ventasDelEstudiante={ventasDelEstudiante}
            onAnularVenta={anularVenta}
            ultimaVenta={ultimaVenta}
            onAbrirVolante={() => setVistaVolante(true)}
        />
    );
};

export default VentasAdmin;
