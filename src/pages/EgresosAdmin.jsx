import React, { useState, useEffect } from "react";
import api from "../utils/api";

const EgresosAdmin = () => {
  const [egresos, setEgresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formulario
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [categoria, setCategoria] = useState("Compras Institucionales");
  const [notas, setNotas] = useState("");

  const categorias = ["Compras Institucionales", "Pago de Servicios", "Mantenimiento", "Otros"];

  const cargarEgresos = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/egresos/");
      setEgresos(res.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los egresos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEgresos();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/egresos/", {
        concepto,
        monto: parseFloat(monto),
        fecha: fecha || new Date().toISOString().split("T")[0],
        categoria,
        notas
      });
      // Limpiar formulario y recargar
      setConcepto("");
      setMonto("");
      setNotas("");
      setFecha("");
      cargarEgresos();
    } catch (err) {
      console.error(err);
      alert("No se pudo registrar el egreso.");
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este egreso?")) return;
    try {
      await api.delete(`/api/egresos/${id}`);
      cargarEgresos();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar.");
    }
  };

  const totalMonto = egresos.reduce((acc, curr) => acc + curr.monto, 0);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Control de Egresos y Gastos</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Registrar Nuevo Egreso</h2>
        <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Concepto / Motivo</label>
            <input
              type="text"
              required
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej. Compra de papelería"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ej. 150.50"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Categoría</label>
            <select
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Fecha (Opcional, hoy por defecto)</label>
            <input
              type="date"
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">Notas adicionales</label>
            <textarea
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Aprobado por el director. Número de factura..."
              rows="2"
            ></textarea>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Registrar Egreso
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Historial de Egresos</h2>
          <span className="text-lg font-bold text-red-600 bg-red-100 px-3 py-1 rounded">
            Total Egresos: ${totalMonto.toFixed(2)}
          </span>
        </div>

        {loading ? (
          <p>Cargando egresos...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Concepto</th>
                  <th className="px-4 py-2 text-left">Categoría</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                  <th className="px-4 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {egresos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">No hay egresos registrados.</td>
                  </tr>
                ) : (
                  egresos.map((egreso) => (
                    <tr key={egreso.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{egreso.fecha}</td>
                      <td className="px-4 py-2 font-medium">{egreso.concepto}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{egreso.categoria}</td>
                      <td className="px-4 py-2 text-right font-bold text-red-600">${egreso.monto.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleEliminar(egreso.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Eliminar
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
    </div>
  );
};

export default EgresosAdmin;