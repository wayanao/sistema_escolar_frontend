import React, { useCallback, useState, useEffect } from "react";
import api from "../utils/api";

const hoyISO = () => new Date().toISOString().split("T")[0];

const EgresosAdmin = () => {
  const [egresos, setEgresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fechaDesde, setFechaDesde] = useState(hoyISO());
  const [fechaHasta, setFechaHasta] = useState(hoyISO());

  // Formulario
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [categoria, setCategoria] = useState("Compras Institucionales");
  const [notas, setNotas] = useState("");

  const categorias = ["Compras Institucionales", "Pago de Servicios", "Mantenimiento", "Otros"];

  const cargarEgresos = useCallback(async (filtros = null) => {
    try {
      setLoading(true);
      setError(null);
      const params = filtros || {
        fecha_desde: hoyISO(),
        fecha_hasta: hoyISO(),
      };
      const res = await api.get("/api/egresos/", { params });
      setEgresos(res.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los egresos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEgresos();
  }, [cargarEgresos]);

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      const fechaRegistro = fecha || hoyISO();
      await api.post("/api/egresos/", {
        concepto,
        monto: parseFloat(monto),
        fecha: fechaRegistro,
        categoria,
        notas
      });
      // Limpiar formulario y recargar
      setConcepto("");
      setMonto("");
      setNotas("");
      setFecha("");
      setFechaDesde(fechaRegistro);
      setFechaHasta(fechaRegistro);
      cargarEgresos({ fecha_desde: fechaRegistro, fecha_hasta: fechaRegistro });
    } catch (err) {
      console.error(err);
      alert("No se pudo registrar el egreso.");
    }
  };

  const filtrarHoy = () => {
    const hoy = hoyISO();
    setFechaDesde(hoy);
    setFechaHasta(hoy);
    cargarEgresos({ fecha_desde: hoy, fecha_hasta: hoy });
  };

  const buscarPorFechas = () => {
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      alert("La fecha desde no puede ser mayor que la fecha hasta.");
      return;
    }
    cargarEgresos();
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
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ej. 150.50"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Categoría</label>
            <select
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">Notas adicionales</label>
            <textarea
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Aprobado por el director. Número de factura..."
              rows="2"
            ></textarea>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 transition"
            >
              Registrar Egreso
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Historial de Egresos</h2>
            <p className="text-sm text-gray-500">Por defecto se muestran solo los egresos del día.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="button"
              onClick={buscarPorFechas}
              className="self-end rounded bg-purple-600 px-4 py-2 font-semibold text-white transition hover:bg-purple-700"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={filtrarHoy}
              className="self-end rounded bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-300"
            >
              Hoy
            </button>
          </div>
          <span className="text-lg font-bold text-red-600 bg-red-100 px-3 py-2 rounded">
            Total: ${totalMonto.toFixed(2)}
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
                </tr>
              </thead>
              <tbody>
                {egresos.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">No hay egresos registrados para las fechas seleccionadas.</td>
                  </tr>
                ) : (
                  egresos.map((egreso) => (
                    <tr key={egreso.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{egreso.fecha}</td>
                      <td className="px-4 py-2 font-medium">{egreso.concepto}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{egreso.categoria}</td>
                      <td className="px-4 py-2 text-right font-bold text-red-600">${egreso.monto.toFixed(2)}</td>
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
