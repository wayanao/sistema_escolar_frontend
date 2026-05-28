import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

function ReportesAdmin() {
  const navigate = useNavigate();
  const [reporteGeneral, setReporteGeneral] = useState(null);
  const [loading, setLoading] = useState(true);

  const [detalleMes, setDetalleMes] = useState(null);
  const [loadingDetalleMes, setLoadingDetalleMes] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState("");
  
  // Rango fechas
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [rangoSeleccionado, setRangoSeleccionado] = useState(false);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const detalleIngresos = Array.isArray(detalleMes) ? detalleMes : [];
  const totalValidoDetalle = detalleIngresos.reduce((sum, pago) => sum + Number(pago.monto_valido ?? (pago.anulado ? 0 : pago.monto) ?? 0), 0);
  const totalAnuladoDetalle = detalleIngresos.reduce((sum, pago) => sum + (pago.anulado ? Number(pago.monto || 0) : 0), 0);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    const refrescarAlVolver = () => {
      if (document.visibilityState === "visible") {
        cargarDatosIniciales();
      }
    };

    document.addEventListener("visibilitychange", refrescarAlVolver);
    return () => document.removeEventListener("visibilitychange", refrescarAlVolver);
  }, []);

  if (!usuario || usuario.rol !== "admin") {
    navigate("/login");
    return null;
  }

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const reporteRes = await api.get(`/reportes/general`);
      const reporteData = reporteRes.data;

      setReporteGeneral(reporteData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error al cargar datos del reporte");
    } finally {
      setLoading(false);
    }
  };

  const cargarDetalleMes = async (mes) => {
    try {
      setLoadingDetalleMes(true);
      setMesSeleccionado(mes);
      setRangoSeleccionado(false);
      const res = await api.get(`/reportes/ingresos-mes/${mes}`);
      setDetalleMes(res.data);
    } catch (error) {
      console.error("Error cargando detalle del mes:", error);
      alert("Error al cargar detalle del mes");
    } finally {
      setLoadingDetalleMes(false);
    }
  };

  const cargarDetalleRango = async () => {
    if (!fechaInicio || !fechaFin) {
      alert("Selecciona fecha de inicio y fin");
      return;
    }
    if (fechaInicio > fechaFin) {
      alert("La fecha de inicio no puede ser mayor a la fecha de fin");
      return;
    }
    try {
      setLoadingDetalleMes(true);
      setMesSeleccionado("");
      setRangoSeleccionado(true);
      const res = await api.get(`/reportes/ingresos-rango?inicio=${fechaInicio}&fin=${fechaFin}`);
      setDetalleMes(res.data);
    } catch (error) {
      console.error("Error cargando detalle por rango:", error);
      alert("Error al cargar detalle por rango o el rango excede las llamadas");
    } finally {
      setLoadingDetalleMes(false);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reportes y Estadísticas
            </h1>
            <p className="text-gray-600">
              Visualiza reportes y estadísticas del sistema escolar
            </p>
          </div>
          <button
            onClick={cargarDatosIniciales}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            Actualizar reportes
          </button>
        </div>
      </div>

      {/* Estadísticas Generales */}
      {reporteGeneral && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">👨‍🎓</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reporteGeneral.estadisticas_generales.total_estudiantes}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Profesores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reporteGeneral.estadisticas_generales.total_profesores}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📚</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cursos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reporteGeneral.estadisticas_generales.total_cursos}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Ingresos</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${reporteGeneral.estadisticas_generales.total_ingresos.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg border-2 border-orange-200">
                <span className="text-2xl">💵</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(reporteGeneral.estadisticas_generales.ingresos_hoy || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estudiantes por Curso */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Estudiantes por Curso</h2>
          <div className="space-y-3">
            {reporteGeneral?.estudiantes_por_curso.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{item.curso}</span>
                <span className="bg-purple-100 text-purple-900 px-2 py-1 rounded-full text-sm font-medium">
                  {item.cantidad} estudiantes
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ingresos Mensuales */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Ingresos Mensuales</h2>
          <div className="space-y-3">
            {reporteGeneral?.ingresos_mensuales.map((item, index) => (
              <div key={index} 
                className={`flex justify-between items-center p-3 rounded-lg cursor-pointer border transition-colors ${
                  mesSeleccionado === item.mes && !rangoSeleccionado
                    ? "bg-purple-50 border-purple-600 text-purple-900 shadow-sm"
                    : "bg-gray-50 border-transparent hover:bg-gray-200"
                }`}
                onClick={() => cargarDetalleMes(item.mes)}
                title="Haga clic para ver el detalle del mes"
              >
                <span className={`font-medium underline ${
                  mesSeleccionado === item.mes && !rangoSeleccionado ? "text-purple-900" : "text-purple-700"
                }`}>
                  {new Date(item.mes + '-01').toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                  ${item.total.toLocaleString()}
                </span>
              </div>
            ))}
            {(!reporteGeneral?.ingresos_mensuales || reporteGeneral.ingresos_mensuales.length === 0) && (
              <p className="text-gray-500 text-center py-4">No hay datos de ingresos</p>
            )}
          </div>
          
          <hr className="my-6 border-gray-200" />
          <h3 className="text-lg font-medium mb-3">Buscar por Fecha</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Desde</label>
              <input 
                type="date" 
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Hasta</label>
              <input 
                type="date" 
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={cargarDetalleRango}
                disabled={loadingDetalleMes}
                className="w-full sm:w-auto bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle de Ingresos Mostrado */}
      {detalleMes && (
        <div className={`mt-8 bg-white rounded-lg shadow-md p-6 border ${
          mesSeleccionado || rangoSeleccionado ? "border-purple-200" : "border-transparent"
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Detalle de Ingresos:{' '}
              {mesSeleccionado ? 
                new Date(mesSeleccionado + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) 
                : rangoSeleccionado ? ` ${fechaInicio} a ${fechaFin}` : ''
              }
            </h2>
            <button 
              onClick={() => setDetalleMes(null)}
              className="text-gray-500 hover:text-gray-700 font-bold text-xl"
            >
              &times;
            </button>
          </div>
          
          {loadingDetalleMes ? (
          <div className="text-center py-4">Cargando detalles...</div>
          ) : detalleIngresos.length > 0 ? (
            <>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-xs font-semibold uppercase text-green-700">Total válido</p>
                <p className="text-xl font-bold text-green-800">${totalValidoDetalle.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-semibold uppercase text-red-700">Total anulado</p>
                <p className="text-xl font-bold text-red-800">${totalAnuladoDetalle.toLocaleString()}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detalleIngresos.map((pago) => (
                    <tr key={pago.id} className={pago.anulado ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pago.fecha}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pago.estudiante}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${pago.anulado ? "text-red-600 line-through" : "text-green-600"}`}>
                        ${pago.monto.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {pago.anulado ? (
                          <span className="inline-block rounded bg-red-100 px-2 py-1 font-bold text-red-700">
                            Anulado
                          </span>
                        ) : (
                          <span className="inline-block rounded bg-green-100 px-2 py-1 font-bold text-green-700">
                            Pagado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>{pago.descripcion}</div>
                        {pago.anulado && pago.motivo_anulacion && (
                          <div className="mt-1 text-xs text-red-700">Motivo: {pago.motivo_anulacion}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {pago.tipo_pago ? (
                          <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {pago.tipo_pago}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay pagos registrados para este mes.
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default ReportesAdmin;
