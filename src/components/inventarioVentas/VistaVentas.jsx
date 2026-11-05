import {
    claseEstadoVenta,
    claseFilaVenta,
    claseTotalVenta,
    esVentaAnulada,
    subtotalItemCarrito,
} from "../../utils/inventarioVentas/ventas";

function VistaVentas({
    inventario,
    cargando,
    carrito,
    totalVenta,
    onAgregarAlCarrito,
    onCambiarCantidad,
    onQuitarDelCarrito,
    busquedaEstudiante,
    onCambiarBusqueda,
    mostrarDropdownEstudiantes,
    onMostrarDropdown,
    onOcultarDropdown,
    estudiantesFiltrados,
    onSeleccionarEstudiante,
    onProcesarVenta,
    registrandoVenta,
    hayEstudianteEnHistorial,
    ventasDelEstudiante,
    onAnularVenta,
    ultimaVenta,
    onAbrirVolante,
}) {
return (
    <div className="p-6">
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Caja / Cargar Productos al Estudiante</h1>
            {ultimaVenta && (
                <button onClick={onAbrirVolante} className="bg-purple-600 hover:bg-purple-800 text-white font-semibold py-2 px-4 rounded shadow-sm flex items-center gap-2 transition-all">
                    🖨️ Imprimir Volante de Pago #{ultimaVenta.id}
                </button>
            )}
        </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Catálogo de ventas a la izquierda */}
                <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Productos en Inventario</h2>
                    {cargando ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>
                    ) : (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {inventario.map(prod => (
                            <div key={prod.id} className="border rounded p-4 flex justify-between items-center hover:shadow-md transition">
                                <div>
                                    <h3 className="font-bold text-lg">{prod.nombre}</h3>
                                    <p className="text-gray-600 text-sm">Stock: {prod.stock_actual} unid.</p>
                                    <p className="text-purple-700 font-bold">${prod.precio_venta.toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => onAgregarAlCarrito(prod.id)}
                                    className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded font-bold"
                                >
                                    + Añadir
                                </button>
                            </div>
                        ))}
                    </div>
                    {inventario.length === 0 && <p className="text-gray-500">No hay productos activos con stock actualmente.</p>}
                    </>
                    )}
                </div>

              {/* Panel de Carrito de Compras a la derecha */}
                <div className="bg-gray-50 shadow rounded-lg p-6 border-2 border-dashed border-gray-200 flex flex-col h-full">
                    <h2 className="text-xl font-bold mb-4 border-b pb-2">Cargar Productos (Carrito)</h2>

                    <div className="flex-grow overflow-auto mb-4">
                        {carrito.length === 0 ? (
                            <p className="text-gray-400 text-center mt-10">Agrega productos al carrito...</p>
                        ) : (
                            <ul className="space-y-3">
                                {carrito.map(item => (
                                    <li key={item.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.nombre}</p>
                                            <p className="text-xs text-gray-500">${item.precio_venta.toLocaleString()} c/u</p>
                                        </div>
                                        <div className="flex items-center gap-2 mr-3 border rounded px-1">
                                            <button onClick={() => onCambiarCantidad(item.id, -1)} className="px-1 text-red-500 font-bold">-</button>
                                            <span className="w-4 text-center font-bold">{item.cantidad}</span>
                                            <button onClick={() => onCambiarCantidad(item.id, 1)} className="px-1 text-green-500 font-bold">+</button>
                                        </div>
                                        <div className="font-bold text-right w-16">
                                            ${subtotalItemCarrito(item).toLocaleString()}
                                        </div>
                                        <button onClick={() => onQuitarDelCarrito(item.id)} className="text-red-500 hover:text-red-700 ml-2">🗑️</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-xl font-bold text-purple-900 mb-4">
                            <span>Total de Venta:</span>
                            <span>${totalVenta.toLocaleString()}</span>
                        </div>
                        <div className="mb-3 relative">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Cliente / Estudiante</label>
                            <input
                                type="text"
                                className="w-full border rounded p-2 text-sm focus:ring uppercase"
                                placeholder="Buscar por nombre..."
                                value={busquedaEstudiante}
                                onChange={(e) => onCambiarBusqueda(e.target.value)}
                                onFocus={onMostrarDropdown}
                                onBlur={() => setTimeout(onOcultarDropdown, 200)}
                            />
                            {mostrarDropdownEstudiantes && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto mt-1">
                                    {estudiantesFiltrados
                                        .map(e => (
                                            <li
                                                key={e.id}
                                                className="p-2 text-sm cursor-pointer hover:bg-purple-100 uppercase"
                                                onMouseDown={() => onSeleccionarEstudiante(e)}
                                            >
                                                {e.apellido} {e.nombre} - Cód: {e.id}
                                            </li>
                                        ))
                                    }
                                </ul>
                            )}
                        </div>
                            <button
                                onClick={onProcesarVenta}
                                disabled={registrandoVenta}
                                className="w-full bg-purple-600 hover:bg-purple-800 text-white font-medium py-2.5 px-4 rounded-md mt-4 transition duration-200 shadow-sm flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>➕</span> {registrandoVenta ? "Cargando..." : "Cargar al Estudiante"}
                            </button>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Registro de Cargos Recientes</h2>
                <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left w-24">Venta #</th>
                            <th className="px-4 py-2 text-left w-40">Fecha</th>
                            <th className="px-4 py-2 text-left">Detalle del Cargo (Productos)</th>
                            <th className="px-4 py-2 text-center w-32">Estado</th>
                            <th className="px-4 py-2 text-right w-36">Total Cargo</th>
                            <th className="px-4 py-2 text-right w-28">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hayEstudianteEnHistorial ? (
                            ventasDelEstudiante
                                .map(v => (
                                    <tr key={v.id} className={`border-b ${claseFilaVenta(v.estado)}`}>
                                        <td className="px-4 py-3 align-top">{v.id}</td>
                                        <td className="px-4 py-3 align-top">{v.fecha.substring(0, 16)}</td>
                                        <td className="px-4 py-3">
                                            {v.detalles && v.detalles.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {v.detalles.map((d, i) => (
                                                        <li key={i} className="text-sm text-gray-700 flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                                                            <span><span className="font-bold text-gray-900">{d.cantidad}x</span> {d.producto}</span>
                                                            <span className="text-gray-500">${d.subtotal.toLocaleString()}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-sm text-gray-500 italic">Sin detalles</span>
                                            )}
                                            {esVentaAnulada(v) && (
                                                <p className="mt-2 text-xs text-red-700">
                                                    Motivo: {v.motivo_anulacion || "Sin motivo registrado"}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center align-top">
                                            <span className={`px-2 py-1 rounded text-xs ${claseEstadoVenta(v.estado)}`}>
                                                {v.estado}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 text-right font-bold align-top ${claseTotalVenta(v.estado)}`}>
                                            ${v.total.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right align-top">
                                            {!esVentaAnulada(v) ? (
                                                <button
                                                    onClick={() => onAnularVenta(v)}
                                                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                                                >
                                                    Anular
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">Anulada</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                        ) : (
                            <tr><td colSpan="6" className="text-center py-4 text-gray-500">Selecciona o carga productos a un estudiante para ver su historial</td></tr>
                        )}
                        {hayEstudianteEnHistorial && ventasDelEstudiante.length === 0 && (
                            <tr><td colSpan="6" className="text-center py-4 text-gray-500">Este estudiante no tiene cargos previos</td></tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    </div>
    );
}

export default VistaVentas;
