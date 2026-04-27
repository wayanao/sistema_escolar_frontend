import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";

const VentasAdmin = () => {
    const [inventario, setInventario] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [ventasAnteriores, setVentasAnteriores] = useState([]);
    const [loading, setLoading] = useState(true);

  // Carrito de compras
    const [carrito, setCarrito] = useState([]);
    const [estudianteId, setEstudianteId] = useState("");
    const [busquedaEstudiante, setBusquedaEstudiante] = useState("");
    const [mostrarDropdownEstudiantes, setMostrarDropdownEstudiantes] = useState(false);
    const [notas, setNotas] = useState("");
    const [estudianteFiltroId, setEstudianteFiltroId] = useState(null);

    // Imprimir volante
    const [ultimaVenta, setUltimaVenta] = useState(null);

    const cargarDatos = async () => {
    try {
        setLoading(true);
        const [resVentas, resInv, resEst] = await Promise.all([
        api.get("/api/ventas/"),
        api.get("/inventario"),
        api.get("/estudiantes")
        ]);
        setVentasAnteriores(resVentas.data);
        setInventario(resInv.data.filter(i => i.stock_actual > 0)); // Solo vender lo que hay
        setEstudiantes(resEst.data);
        } catch (err) {
            console.error(err);
            alert("Error cargando base de datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
    cargarDatos();
    }, []);

    const handleAgregarAlCarrito = (productoId) => {
    const prod = inventario.find(i => i.id === parseInt(productoId));
    if (!prod) return;

    // Verificar si ya está en carrito
    const existe = carrito.find(item => item.id === prod.id);
    if (existe) {
        if(existe.cantidad < prod.stock_actual) {
            setCarrito(carrito.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item));
        } else {
            alert("No hay más stock disponible de este producto.");
        }
        } else {
        setCarrito([...carrito, { ...prod, cantidad: 1 }]);
        }
    };

    const handleRemoverCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
    };

    const cambiarCantidad = (id, delta) => {
        setCarrito(carrito.map(item => {
        if (item.id === id) {
            const nuevaCant = item.cantidad + delta;
            if (nuevaCant > 0 && nuevaCant <= item.stock_actual) {
                return { ...item, cantidad: nuevaCant };
            }
        }
        return item;
        }));
    };

  const totalVenta = carrito.reduce((acc, curr) => acc + (curr.precio_venta * curr.cantidad), 0);

    const handleProcesarVenta = async () => {
        if (carrito.length === 0) {
            alert("El carrito está vacío.");
            return;
        }
        if (!estudianteId || estudianteId === "publico") {
            alert("Por favor selecciona un estudiante válido. Ya no se permiten cargos a Público General.");
            return;
        }

        try {
            const payload = {
            estudiante_id: parseInt(estudianteId),
            tipo_venta: "Credito", // Siempre a crédito/pendiente
            total: totalVenta,
            notas: notas,
            detalles: carrito.map(item => ({
                inventario_id: item.id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_venta,
                subtotal: item.precio_venta * item.cantidad
            }))
            };

            const res = await api.post("/api/ventas/", payload);
        
            // Armamos un objeto manual para imprimirlo sin recargar
            const estudianteObj = estudiantes.find(e => e.id === parseInt(estudianteId));
            let nombreVolante = estudianteObj ? `${estudianteObj.apellido} ${estudianteObj.nombre}` : "Desconocido";
        
            setUltimaVenta({
                id: res.data.id,
                cliente: nombreVolante,
                tipo_venta: "Cargo Pendiente",
                total: totalVenta,
                detalles: [...carrito],
                fecha: new Date().toLocaleDateString()
            });

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

    const currentStudent = estudiantes.find(e => e.id === parseInt(estudianteId));

  // Función para imprimir volante usando la ventana de impresión del navegador
const imprimirVolante = () => {
      window.print();
  };

return (
    <div className="p-6">

      {/* SECCIÓN SOLO VISIBLE AL IMPRIMIR */}
    <div className="print-area bg-white z-[9999] relative">
        {ultimaVenta && (
            <div className="border-2 border-gray-800 p-8 w-full max-w-2xl mx-auto mt-10 relative overflow-hidden bg-white z-10">
                {/* MARCA DE AGUA FORZADA CON IMG */}
                <img 
                    src="https://img.freepik.com/free-vector/hand-drawn-school-elements-pattern_23-2149504543.jpg" 
                    alt="Fondo"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
                    style={{ opacity: 0.25 }}
                />

                <div className="text-center mb-6 relative z-10">
                    <h1 className="text-3xl font-bold uppercase">VOLANTE DE PAGO</h1>
                    <h2 className="text-xl">Escuela Demo</h2>
                    <p className="text-gray-600">Cargo #{ultimaVenta.id} - {ultimaVenta.fecha}</p>
                </div>
                
                <div className="mb-6 flex justify-between relative z-10 bg-white/80 p-2 rounded">
                    <div>
                        <p><strong>Cliente:</strong> <span className="capitalize">{ultimaVenta.cliente}</span></p>
                        <p><strong>Condición:</strong> {ultimaVenta.tipo_venta}</p>
                    </div>
                </div>
                <div className="relative z-10 bg-white/90 p-4 rounded shadow-sm">
                  <table className="w-full text-left border-collapse mb-4">
                      <thead>
                        <tr className="border-b-2 border-gray-800">
                            <th className="py-2">Cant</th>
                            <th className="py-2">Descripción</th>
                            <th className="py-2 text-right">P. Unitario</th>
                            <th className="py-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ultimaVenta.detalles.map((p, idx) => (
                            <tr key={idx} className="border-b">
                                <td className="py-2">{p.cantidad}</td>
                                <td className="py-2">{p.nombre}</td>
                                <td className="py-2 text-right">${p.precio_venta.toLocaleString()}</td>
                                <td className="py-2 text-right font-bold">${(p.precio_venta * p.cantidad).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="3" className="py-4 text-right text-xl font-bold">TOTAL A PAGAR:</td>
                            <td className="py-4 text-right text-xl font-bold">${ultimaVenta.total.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="text-center mt-10 text-gray-500 text-sm relative z-10 font-medium">
                    <p>Gracias por contribuir con nuestra institución</p>
                </div>
            </div>
        )}
    </div>

    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Caja / Cargar Productos al Estudiante</h1>
            {ultimaVenta && (
                <button onClick={imprimirVolante} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded shadow-sm flex items-center gap-2 transition-all">
                    🖨️ Imprimir Volante de Pago #{ultimaVenta.id}
                </button>
            )}
        </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Catálogo de ventas a la izquierda */}
                <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Productos en Inventario</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {inventario.map(prod => (
                            <div key={prod.id} className="border rounded p-4 flex justify-between items-center hover:shadow-md transition">
                                <div>
                                    <h3 className="font-bold text-lg">{prod.nombre}</h3>
                                    <p className="text-gray-600 text-sm">Stock: {prod.stock_actual} unid.</p>
                                    <p className="text-blue-600 font-bold">${prod.precio_venta.toLocaleString()}</p>
                                </div>
                                <button 
                                    onClick={() => handleAgregarAlCarrito(prod.id)}
                                    className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded font-bold"
                                >
                                    + Añadir
                                </button>
                            </div>
                        ))}
                    </div>
                    {inventario.length === 0 && <p className="text-gray-500">No hay productos con stock actualmente.</p>}
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
                                            <button onClick={() => cambiarCantidad(item.id, -1)} className="px-1 text-red-500 font-bold">-</button>
                                            <span className="w-4 text-center font-bold">{item.cantidad}</span>
                                            <button onClick={() => cambiarCantidad(item.id, 1)} className="px-1 text-green-500 font-bold">+</button>
                                        </div>
                                        <div className="font-bold text-right w-16">
                                            ${(item.cantidad * item.precio_venta).toLocaleString()}
                                        </div>
                                        <button onClick={() => handleRemoverCarrito(item.id)} className="text-red-500 hover:text-red-700 ml-2">🗑️</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>  
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-xl font-bold text-blue-800 mb-4">
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
                                onChange={(e) => {
                                    setBusquedaEstudiante(e.target.value);
                                    setMostrarDropdownEstudiantes(true);
                                    setEstudianteId(""); // Resetear ID si cambia el texto
                                }}
                                onFocus={() => setMostrarDropdownEstudiantes(true)}
                                onBlur={() => setTimeout(() => setMostrarDropdownEstudiantes(false), 200)}
                            />
                            {mostrarDropdownEstudiantes && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto mt-1">
                                    {estudiantes
                                        .filter(e => `${e.apellido} ${e.nombre}`.toLowerCase().includes(busquedaEstudiante.toLowerCase()))
                                        .map(e => (
                                            <li 
                                                key={e.id} 
                                                className="p-2 text-sm cursor-pointer hover:bg-blue-100 uppercase"
                                                onMouseDown={() => {
                                                    setEstudianteId(e.id.toString());
                                                    setBusquedaEstudiante(`${e.apellido} ${e.nombre}`);
                                                    setMostrarDropdownEstudiantes(false);
                                                }}
                                            >
                                                {e.apellido} {e.nombre} - Cód: {e.id}
                                            </li>
                                        ))
                                    }
                                </ul>
                            )}
                        </div>  
                            <button 
                                onClick={handleProcesarVenta}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-md mt-4 transition duration-200 shadow-sm flex justify-center items-center gap-2"
                            >
                                <span>➕</span> Cargar al Estudiante
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
                        </tr>
                    </thead>
                    <tbody>
                        {estudianteId || estudianteFiltroId ? (
                            ventasAnteriores
                                .filter(v => v.estudiante_id === (estudianteId ? parseInt(estudianteId) : estudianteFiltroId))
                                .map(v => (
                                    <tr key={v.id} className="border-b hover:bg-gray-50">
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
                                        </td>
                                        <td className="px-4 py-3 text-center align-top">
                                            <span className={`px-2 py-1 rounded text-xs ${v.estado === 'Pendiente' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {v.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-red-600 align-top">${v.total.toLocaleString()}</td>
                                    </tr>
                                ))
                        ) : (
                            <tr><td colSpan="5" className="text-center py-4 text-gray-500">Selecciona o carga productos a un estudiante para ver su historial</td></tr>
                        )}
                        {(estudianteId || estudianteFiltroId) && ventasAnteriores.filter(v => v.estudiante_id === (estudianteId ? parseInt(estudianteId) : estudianteFiltroId)).length === 0 && (
                            <tr><td colSpan="5" className="text-center py-4 text-gray-500">Este estudiante no tiene cargos previos</td></tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    </div>
    );
};

export default VentasAdmin;