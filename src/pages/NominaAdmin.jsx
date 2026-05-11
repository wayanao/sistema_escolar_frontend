import React, { useState, useEffect } from "react";
import api from "../utils/api";

const NominaAdmin = () => {
    const [empleados, setEmpleados] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEmpleado, setSelectedEmpleado] = useState(null);

    // Form states
    const [salarioBase, setSalarioBase] = useState("");
    const [abonoPrestamo, setAbonoPrestamo] = useState("0");
    const [otrosDescuentos, setOtrosDescuentos] = useState("0");
    const [bonificaciones, setBonificaciones] = useState("0");
    const [notas, setNotas] = useState("");
    const [searchHistorial, setSearchHistorial] = useState("");

    const cargarDatos = async () => {
        setLoading(true);
        setError("");
        try {
            const [resEmpleados, resHistorial] = await Promise.all([
                api.get("/api/nomina/empleados"),
                api.get("/api/nomina/historial")
            ]);
            setEmpleados(resEmpleados.data);
            setHistorial(resHistorial.data);
        } catch (err) {
            console.error("Error al cargar nómina:", err);
            setError("No se pudo cargar la información de nómina.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const openModal = (empleado) => {
        setSelectedEmpleado(empleado);
        setSalarioBase("");
        setAbonoPrestamo("0");
        setOtrosDescuentos("0");
        setBonificaciones("0");
        setNotas("");
        setModalOpen(true);
    };

    const calcularTotal = () => {
        const base = parseFloat(salarioBase) || 0;
        const bono = parseFloat(bonificaciones) || 0;
        const abono = parseFloat(abonoPrestamo) || 0;
        const descuentos = parseFloat(otrosDescuentos) || 0;
        
        return (base + bono) - (abono + descuentos);
    };

    const handlePagar = async (e) => {
        e.preventDefault();
        const totalPagar = calcularTotal();

        if (totalPagar < 0) {
            alert("El total a pagar no puede ser negativo.");
            return;
        }
        
        const abono = parseFloat(abonoPrestamo) || 0;
        if (abono > selectedEmpleado.saldo_prestamos) {
            alert(`El abono al préstamo ($${abono}) no puede ser mayor que su deuda pendiente ($${selectedEmpleado.saldo_prestamos}).`);
            return;
        }

        try {
            await api.post("/api/nomina/pagar", {
                profesor_id: selectedEmpleado.id,
                salario_base: parseFloat(salarioBase),
                deduccion_prestamos: abono,
                otros_descuentos: parseFloat(otrosDescuentos) || 0,
                bonificaciones: parseFloat(bonificaciones) || 0,
                notas: notas
            });

            setModalOpen(false);
            alert("Pago de nómina registrado exitosamente y préstamos abonados.");
            cargarDatos(); // Recargar tablas

        } catch (err) {
            console.error("Error registrando pago:", err);
            alert("Ocurrió un error al procesar el pago de nómina.");
        }
    };

    const historialMostrado = searchHistorial.trim() === "" 
        ? [] 
        : historial.filter(h => h.profesor.toLowerCase().includes(searchHistorial.toLowerCase()));

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Nómina</h1>
            {error && <p className="text-red-600 mb-4 bg-red-50 p-2 rounded">{error}</p>}

            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Estado de Cuenta de Personal</h2>
                
                {loading ? (
                    <p className="text-gray-500">Cargando datos...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto border-collapse">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 border text-left">Documento</th>
                                    <th className="px-4 py-2 border text-left">Personal</th>
                                    <th className="px-4 py-2 border text-right">Saldo Préstamos</th>
                                    <th className="px-4 py-2 border text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {empleados.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4 text-gray-500">
                                            No se encontraron empleados registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    empleados.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-gray-50">
                                            <td className="border px-4 py-2">{emp.documento}</td>
                                            <td className="border px-4 py-2 font-medium capitalize">
                                                {emp.apellido} {emp.nombre}
                                            </td>
                                            <td className={`border px-4 py-2 text-right font-bold ${emp.saldo_prestamos > 0 ? "text-red-600" : "text-green-600"}`}>
                                                ${emp.saldo_prestamos.toFixed(2)}
                                            </td>
                                            <td className="border px-4 py-2 text-center">
                                                <button
                                                    onClick={() => openModal(emp)}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-sm transition"
                                                >
                                                    Realizar Pago
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Historial */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold">Historial de Pagos de Nómina</h2>
                    <input 
                        type="text" 
                        placeholder="Buscar por empleado..."
                        value={searchHistorial}
                        onChange={(e) => setSearchHistorial(e.target.value)}
                        className="border rounded p-2 focus:ring-purple-500 w-full md:w-64"
                    />
                </div>
                
                {loading ? (
                    <p className="text-gray-500">Cargando historial...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto border-collapse">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 border text-left">N° Ref</th>
                                    <th className="px-4 py-2 border text-left">Fecha</th>
                                    <th className="px-4 py-2 border text-left">Personal</th>
                                    <th className="px-4 py-2 border text-right">Salario Base</th>
                                    <th className="px-4 py-2 border text-right text-red-600">Abono Préstamo</th>
                                    <th className="px-4 py-2 border text-right text-green-600">Bono</th>
                                    <th className="px-4 py-2 border text-right font-black">Pagado Neto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchHistorial.trim() === "" ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-6 text-gray-500">
                                            🔍 Escriba el nombre de un empleado para ver su historial de pagos.
                                        </td>
                                    </tr>
                                ) : historialMostrado.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-6 text-gray-500">
                                            No hay pagos registrados para este empleado.
                                        </td>
                                    </tr>
                                ) : (
                                    historialMostrado.map((pago) => (
                                        <tr key={pago.id} className="hover:bg-gray-50 text-sm">
                                            <td className="border px-4 py-2 text-gray-500">#N-{pago.id}</td>
                                            <td className="border px-4 py-2">{pago.fecha}</td>
                                            <td className="border px-4 py-2 capitalize font-medium">{pago.profesor}</td>
                                            <td className="border px-4 py-2 text-right">${pago.salario_base.toFixed(2)}</td>
                                            <td className="border px-4 py-2 text-right text-red-600">${pago.deduccion_prestamos.toFixed(2)}</td>
                                            <td className="border px-4 py-2 text-right text-green-600">${pago.bonificaciones.toFixed(2)}</td>
                                            <td className="border px-4 py-2 text-right font-bold text-lg">${pago.total_pagado.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Pago de Nómina */}
            {modalOpen && selectedEmpleado && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg sm:max-w-xl mx-auto flex flex-col max-h-[95vh]">
                        <div className="bg-purple-700 text-white px-6 py-4 flex justify-between items-center rounded-t-lg shrink-0">
                            <h3 className="text-xl font-bold truncate">Procesar Pago Nómina</h3>
                            <button onClick={() => setModalOpen(false)} className="text-white hover:text-gray-200 ml-4 shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <div className="mb-4 bg-gray-50 p-3 rounded border border-gray-200 flex flex-col sm:flex-row justify-between gap-2 sm:items-center">
                                <div>
                                    <p className="text-sm text-gray-500">Pagando a (Personal)</p>
                                    <p className="font-bold text-gray-800 capitalize truncate max-w-[200px]">{selectedEmpleado.nombre} {selectedEmpleado.apellido}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-sm text-gray-500">Deuda por Préstamos</p>
                                    <p className={`font-bold text-lg ${selectedEmpleado.saldo_prestamos > 0 ? "text-red-500" : "text-green-500"}`}>
                                        ${selectedEmpleado.saldo_prestamos.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handlePagar}>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-gray-700 text-sm font-bold mb-1">Salario Base ($)</label>
                                        <input type="number" required min="0" step="0.01"
                                            className="w-full border rounded p-2 focus:ring-purple-500"
                                            value={salarioBase}
                                            onChange={(e) => setSalarioBase(e.target.value)}
                                            placeholder="Ej. 1500" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-gray-700 text-sm font-bold mb-1">Bonos Adicionales ($)</label>
                                        <input type="number" min="0" step="0.01" disabled={false}
                                            className="w-full border rounded p-2 focus:ring-purple-500 text-green-700"
                                            value={bonificaciones}
                                            onChange={(e) => setBonificaciones(e.target.value)} />
                                    </div>
                                    
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-gray-700 text-sm font-bold mb-1">Abonar a Préstamos ($)</label>
                                        <input type="number" min="0" step="0.01" disabled={selectedEmpleado.saldo_prestamos === 0}
                                            className="w-full border rounded p-2 focus:ring-purple-500 text-red-600 bg-red-50"
                                            value={abonoPrestamo}
                                            onChange={(e) => setAbonoPrestamo(e.target.value)} />
                                        {selectedEmpleado.saldo_prestamos > 0 && <span className="text-xs text-gray-500">Máx: {selectedEmpleado.saldo_prestamos}</span>}
                                    </div>

                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-gray-700 text-sm font-bold mb-1">Otras Deducciones ($)</label>
                                        <input type="number" min="0" step="0.01" 
                                            className="w-full border rounded p-2 focus:ring-purple-500"
                                            value={otrosDescuentos}
                                            onChange={(e) => setOtrosDescuentos(e.target.value)} />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-gray-700 text-sm font-bold mb-1">Concepto / Notas</label>
                                        <input type="text"
                                            className="w-full border rounded p-2 focus:ring-purple-500"
                                            value={notas}
                                            onChange={(e) => setNotas(e.target.value)}
                                            placeholder="Mes de Marzo 2026..." />
                                    </div>
                                </div>
                                
                                <div className="bg-purple-50 p-4 rounded mt-6 mb-6 text-center border border-purple-200">
                                    <p className="text-gray-600 font-semibold mb-1">TOTAL NETO A DEPOSITAR:</p>
                                    <p className="text-4xl font-black text-purple-900">${calcularTotal().toFixed(2)}</p>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setModalOpen(false)}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition">
                                        Cancelar
                                    </button>
                                    <button type="submit" 
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded transition shadow-md">
                                        Confirmar Pago
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NominaAdmin;
