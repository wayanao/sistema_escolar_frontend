import React, { useCallback, useState, useEffect } from "react";
import api from "../utils/api";

const PrestamosAdmin = () => {
    const [prestamos, setPrestamos] = useState([]);
    const [profesores, setProfesores] = useState([]);
    const [loadingProfesores, setLoadingProfesores] = useState(true);
    const [loadingPrestamos, setLoadingPrestamos] = useState(false);
    const [historialConsultado, setHistorialConsultado] = useState(false);
    const [error, setError] = useState(null);

  // Formulario
    const [profesorId, setProfesorId] = useState("");
    const [monto, setMonto] = useState("");
    const [fecha, setFecha] = useState("");
    const [notas, setNotas] = useState("");
    const [profesorFiltro, setProfesorFiltro] = useState("");

    const cargarProfesores = useCallback(async () => {
        try {
            setLoadingProfesores(true);
            setError(null);
            const resProfesores = await api.get("/profesores");
            setProfesores(resProfesores.data);
        } 
        catch (err) {
            console.error(err);
            setError("Error al cargar los profesores o trabajadores.");
        } 
        finally {
            setLoadingProfesores(false);
        }
    }, []);

    const cargarPrestamos = useCallback(async (filtroProfesor) => {
        if (!filtroProfesor) {
            setPrestamos([]);
            setHistorialConsultado(false);
            return;
        }

        try {
            setLoadingPrestamos(true);
            setError(null);
            setHistorialConsultado(true);
            const resPrestamos = await api.get("/api/prestamos/", {
                params: { profesor_id: filtroProfesor },
            });
            setPrestamos(Array.isArray(resPrestamos.data) ? resPrestamos.data : []);
        }
        catch (err) {
            console.error(err);
            setError("Error al cargar el historial de préstamos.");
        }
        finally {
            setLoadingPrestamos(false);
        }
    }, []);

  useEffect(() => {
    cargarProfesores();
  }, [cargarProfesores]);

  const obtenerNombreProfesor = (id) => {
    const profesor = profesores.find((prof) => String(prof.id) === String(id));
    if (!profesor) {
      return "Profesor seleccionado";
    }
    return `${profesor.apellido} ${profesor.nombre}`;
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!profesorId) {
      alert("Por favor, selecciona un profesor o trabajador.");
      return;
    }

    const montoNumero = Number(monto);
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      alert("El monto del préstamo debe ser mayor que 0.");
      return;
    }

    const fechaPrestamo = fecha || new Date().toISOString().split("T")[0];
    const notasLimpias = notas.trim();
    const nombreProfesor = obtenerNombreProfesor(profesorId);
    const confirmar = window.confirm(
      `¿Seguro que deseas registrar este préstamo?\n\nProfesor o trabajador: ${nombreProfesor}\nMonto: $${montoNumero.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nFecha: ${fechaPrestamo}\n\nUna vez creado no se puede eliminar; solo se podrá saldar.`
    );

    if (!confirmar) {
      return;
    }

    try {
      await api.post("/api/prestamos/", {
        profesor_id: parseInt(profesorId),
        monto: montoNumero,
        fecha: fechaPrestamo,
        estado: "Pendiente",
        notas: notasLimpias
      });
      // Limpiar formulario y recargar
      setProfesorFiltro(profesorId);
      setProfesorId("");
      setMonto("");
      setNotas("");
      setFecha("");
      cargarPrestamos(profesorId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "No se pudo registrar el préstamo.");
    }
  };

  const handleEstado = async (id, nuevoEstado) => {
    if (!window.confirm(`¿Marcar este préstamo como ${nuevoEstado}?`)) return;
    try {
      await api.put(`/api/prestamos/${id}/estado`, { estado: nuevoEstado });
      cargarPrestamos(profesorFiltro);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el estado.");
    }
  };

  const filtrarPorProfesor = () => {
    if (!profesorFiltro) {
      alert("Selecciona un profesor o trabajador para ver su historial.");
      return;
    }
    cargarPrestamos(profesorFiltro);
  };

  const limpiarFiltro = () => {
    setProfesorFiltro("");
    setPrestamos([]);
    setHistorialConsultado(false);
  };

  const totalPendiente = prestamos
    .filter(p => p.estado === "Pendiente")
    .reduce((acc, curr) => acc + curr.monto, 0);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Préstamos a Profesores o Trabajadores</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Registrar Nuevo Préstamo</h2>
        <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Profesor o trabajador</label>
            <select
              required
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={profesorId}
              onChange={(e) => setProfesorId(e.target.value)}
              disabled={loadingProfesores}
            >
              <option value="">-- Seleccionar --</option>
              {profesores.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.apellido} {prof.nombre} - {prof.documento_identidad}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Monto del Préstamo ($)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ej. 1000.00"
            />
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
              placeholder="Ej. Descuento programado para la siguiente quincena..."
              rows="2"
            ></textarea>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 transition"
            >
              Registrar Préstamo
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Historial de Préstamos</h2>
            <p className="text-sm text-gray-500">
              El historial se carga solo cuando seleccionas un profesor o trabajador.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Profesor o trabajador</label>
              <select
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={profesorFiltro}
                onChange={(e) => {
                  const value = e.target.value;
                  setProfesorFiltro(value);
                  cargarPrestamos(value);
                }}
                disabled={loadingProfesores}
              >
                <option value="">Selecciona para ver historial</option>
                {profesores.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.apellido} {prof.nombre}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={filtrarPorProfesor}
              className="self-end rounded bg-purple-600 px-4 py-2 font-semibold text-white transition hover:bg-purple-700"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={limpiarFiltro}
              className="self-end rounded bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-300"
            >
              Limpiar
            </button>
          </div>
          <span className="text-lg font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded">
            Total por Cobrar: ${totalPendiente.toFixed(2)}
          </span>
        </div>

        {loadingPrestamos ? (
          <p>Cargando préstamos...</p>
        ) : !historialConsultado ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="font-semibold text-gray-700">Selecciona un profesor o trabajador para ver su historial de préstamos.</p>
            <p className="mt-1 text-sm text-gray-500">El historial no se carga automáticamente al abrir la página.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Profesor</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                  <th className="px-4 py-2 text-center">Estado</th>
                  <th className="px-4 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {prestamos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">No hay préstamos registrados.</td>
                  </tr>
                ) : (
                  prestamos.map((prestamo) => (
                    <tr key={prestamo.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{prestamo.fecha}</td>
                      <td className="px-4 py-2 font-medium capitalize">{prestamo.profesor_nombre}</td>
                      <td className="px-4 py-2 text-right font-bold">${prestamo.monto.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          prestamo.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {prestamo.estado}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {prestamo.estado === 'Pendiente' && (
                          <button
                            onClick={() => handleEstado(prestamo.id, 'Pagado')}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                            title="Marcar como recuperado"
                          >
                            Saldar
                          </button>
                        )}
                        {prestamo.estado !== 'Pendiente' && (
                          <span className="text-xs text-gray-400">Saldado</span>
                        )}
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

export default PrestamosAdmin;
