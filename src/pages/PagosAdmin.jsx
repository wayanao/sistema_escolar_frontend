import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../utils/api";
import FacturaModerna from "../components/FacturaModerna";
import DocumentoImprimible from "../components/impresion/DocumentoImprimible";

const API = import.meta.env.VITE_API_URL;

const obtenerFechaLocal = () => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

function PagosAdmin() {
  const navigate = useNavigate();
  const [estudiantes, setEstudiantes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [tiposPagos, setTiposPagos] = useState([]);
  const [ventasPendientes, setVentasPendientes] = useState([]);
  const [deudasEstudiante, setDeudasEstudiante] = useState([]);
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Formulario de pago mixto
  const [pagoData, setPagoData] = useState({
    estudiante_id: "",
    descripcion: "",
    fecha: obtenerFechaLocal(),
    monto: "",
    venta_id: null,
    metodos: [] // [{ tipo: 'efectivo', monto: '' }, ...]
  });

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  useEffect(() => {
    cargarEstudiantes();
    cargarTiposPagos();
  }, []);

  if (!usuario || usuario.rol !== "admin") {
    navigate("/login");
    return null;
  }

  const cargarEstudiantes = async () => {
    try {
      const res = await api.get("/estudiantes");
      const data = res.data;
      setEstudiantes(data);
    } catch (error) {
      console.error("Error cargando estudiantes:", error);
      Swal.fire('Error', 'Error al cargar estudiantes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarTiposPagos = async () => {
    try {
      const res = await api.get("/tipos-pagos");
      const data = res.data;
      setTiposPagos(data);
    } catch (error) {
      console.error("Error cargando tipos de pagos:", error);
    }
  };

  const cargarHistorialPagos = async (estudianteId) => {
    try {
      const res = await api.get(`/pagos/${estudianteId}`);
      const data = res.data;
      setPagos(data); // Already sorted from backend
    } catch (error) {
      console.error("Error cargando pagos:", error);
      setPagos([]);
    }
  };

  const handleEstudianteSelect = (estudiante) => {
    setSelectedEstudiante(estudiante);
    setPagoData({ ...pagoData, estudiante_id: estudiante.id, venta_id: null });
    cargarHistorialPagos(estudiante.id);
    cargarVentasPendientes(estudiante.id);
    cargarDeudasEstudiante(estudiante.id);
  };

  const cargarDeudasEstudiante = async (estudianteId) => {
    try {
      const res = await api.get(`/estudiantes/${estudianteId}/detalles`);
      setDeudasEstudiante(res.data.deudas || []);
    } catch (error) {
      console.error("Error cargando deudas del estudiante:", error);
      setDeudasEstudiante([]);
    }
  };

  const cargarVentasPendientes = async (estudianteId) => {
    try {
      const res = await api.get(`/api/ventas/pendientes/${estudianteId}`);
      setVentasPendientes(res.data);
    } catch (error) {
      console.error("Error cargando ventas pendientes:", error);
      setVentasPendientes([]);
    }
  };

  const obtenerSaldoSeleccionado = () => {
    if (pagoData.venta_id) {
      const venta = ventasPendientes.find((v) => Number(v.id) === Number(pagoData.venta_id));
      return venta ? Number(venta.total || 0) : null;
    }

    if (!pagoData.descripcion) return null;
    const deuda = deudasEstudiante.find((d) => d.concepto === pagoData.descripcion);
    return deuda ? Number(deuda.deuda || 0) : null;
  };

  const validarMontoContraSaldo = (monto) => {
    const saldo = obtenerSaldoSeleccionado();
    if (saldo === null) return true;

    if (Number(monto) > saldo) {
      Swal.fire(
        'Monto mayor a la deuda',
        `El estudiante solo debe $${saldo.toLocaleString()}. Puedes registrar un abono menor o igual a ese valor.`,
        'warning'
      );
      return false;
    }

    return true;
  };

  const handlePagoSubmit = async (e) => {
    e.preventDefault();
    if (!pagoData.metodos.length || pagoData.metodos.some(m => !m.monto || m.monto <= 0)) {
      Swal.fire('Error', 'Debe ingresar al menos un método y monto válido', 'error');
      return;
    }
    const total = pagoData.metodos.reduce((acc, m) => acc + parseFloat(m.monto || 0), 0);
    if (!pagoData.monto || parseFloat(pagoData.monto) !== total) {
      Swal.fire('Error', 'La suma de los métodos debe ser igual al monto total', 'error');
      return;
    }
    if (!validarMontoContraSaldo(total)) {
      return;
    }
    try {
      const payload = { ...pagoData };
      if (!payload.venta_id) delete payload.venta_id;
      const res = await api.post("/pagos", payload);
      if (res.status >= 200 && res.status < 300) {
        Swal.fire('¡Éxito!', 'Pago registrado correctamente', 'success');
        setShowForm(false);
        setPagoData({
          estudiante_id: "",
          descripcion: "",
          fecha: obtenerFechaLocal(),
          monto: "",
          venta_id: null,
          metodos: []
        });
        cargarHistorialPagos(selectedEstudiante.id);
        cargarVentasPendientes(selectedEstudiante.id);
        cargarDeudasEstudiante(selectedEstudiante.id);
      } else {
        Swal.fire('Error', 'Error al registrar pago', 'error');
      }
    } catch (error) {
      console.error("Error:", error);
      const detalle = error.response?.data?.detail;
      const mensaje =
        typeof detalle === "string"
          ? detalle
          : error.response
            ? "El servidor rechazó el pago. Revisa los datos e intenta nuevamente."
            : "No se pudo conectar con el servidor. Verifica que el backend esté encendido.";
      Swal.fire('Error', mensaje, 'error');
    }
  };

  const [pagoAImprimir, setPagoAImprimir] = useState(null);

  const imprimirFactura = (pago) => {
    if (!selectedEstudiante) return;
    setPagoAImprimir(pago);
  };

  const estudiantesFiltrados = estudiantes.filter(est =>
    (est.nombre + " " + est.apellido).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">💰 Gestión de Pagos</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listado de Estudiantes */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-[calc(100vh-140px)] flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Estudiantes</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2">
            {loading ? (
              <p className="text-gray-500 text-sm">Cargando...</p>
            ) : estudiantesFiltrados.length === 0 ? (
              <p className="text-gray-500 text-sm">No se encontraron estudiantes.</p>
            ) : (
              estudiantesFiltrados.map((estudiante) => (
                <div
                  key={estudiante.id}
                  onClick={() => handleEstudianteSelect(estudiante)}
                  className={"p-3 rounded-lg border cursor-pointer transition-colors " + 
                    (selectedEstudiante?.id === estudiante.id
                      ? "bg-purple-50 border-purple-600 text-purple-900 shadow-sm"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100")
                  }
                >
                  <div className="font-medium capitalize">{estudiante.apellido} {estudiante.nombre}</div>
                  <div className="text-sm text-gray-500">Doc: {estudiante.documento || 'N/A'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel de Pagos */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 h-[calc(100vh-140px)] overflow-y-auto">
          {selectedEstudiante ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold capitalize">
                  Pagos de {selectedEstudiante.apellido} {selectedEstudiante.nombre}
                </h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  {showForm ? "Cancelar" : "+ Nuevo Pago/Factura"}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handlePagoSubmit} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={pagoData.fecha}
                        onChange={(e) => setPagoData({ ...pagoData, fecha: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={pagoData.monto}
                        onChange={(e) => setPagoData({ ...pagoData, monto: e.target.value })}
                        onBlur={(e) => {
                          if (e.target.value) validarMontoContraSaldo(Number(e.target.value));
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        required
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Concepto de Pago</label>
                    <select
                      value={pagoData.venta_id ? `CargoVenta_${pagoData.venta_id}` : pagoData.descripcion}
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        if (selectedVal.startsWith("CargoVenta_")) {
                          const id = parseInt(selectedVal.split("_")[1]);
                          const ventaObj = ventasPendientes.find(v => v.id === id);
                          if (ventaObj) {
                            setPagoData({ 
                              ...pagoData,
                              descripcion: ventaObj.descripcion,
                              monto: ventaObj.total,
                              venta_id: id
                            });
                          }
                        } else {
                          const deudaObj = deudasEstudiante.find(d => d.concepto === selectedVal);
                          const defaultMonto = deudaObj ? deudaObj.deuda : (tiposPagos.find(tp => tp.nombre === selectedVal)?.valor || "");
                          setPagoData({ 
                            ...pagoData,
                            descripcion: selectedVal,
                            monto: defaultMonto,
                            venta_id: null
                          });
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      required
                    >
                      <option value="">-- Seleccione un Concepto --</option>
                      
                      {ventasPendientes.length > 0 && (
                        <optgroup label="Cargos de Inventario (Pendientes)">
                          {ventasPendientes.map(vp => (
                            <option key={`venta_${vp.id}`} value={`CargoVenta_${vp.id}`}>
                              {vp.descripcion} (${vp.total.toLocaleString()})
                            </option>
                          ))}
                        </optgroup>
                      )}

                      <optgroup label="Pensiones, Matrícula y Colegiatura">
                        {deudasEstudiante.length > 0 ? deudasEstudiante.map((d, index) => (
                          <option key={`deuda_${index}`} value={d.concepto}>
                            {d.concepto} (${d.deuda.toLocaleString()}) {d.pagado > 0 ? '- Saldo' : ''}
                          </option>
                        )) : (
                          <option disabled>No hay deudas pendientes</option>
                        )}
                      </optgroup>
                    </select>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Métodos de Pago (puede elegir varios)</label>
                    <div className="flex flex-col gap-2">
                      {['efectivo', 'tarjeta', 'transferencia'].map((tipo) => {
                        const idx = pagoData.metodos.findIndex(m => m.tipo === tipo);
                        const checked = idx !== -1;
                        return (
                          <div key={tipo} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`metodo-${tipo}`}
                              checked={checked}
                              onChange={e => {
                                let nuevosMetodos = [...pagoData.metodos];
                                if (e.target.checked) {
                                  nuevosMetodos.push({ tipo, monto: '', nota: '' });
                                } else {
                                  nuevosMetodos = nuevosMetodos.filter(m => m.tipo !== tipo);
                                }
                                setPagoData({ ...pagoData, metodos: nuevosMetodos });
                              }}
                            />
                            <label htmlFor={`metodo-${tipo}`} className="capitalize w-24">{tipo}</label>
                            {checked && (
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Monto"
                                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white w-32"
                                  value={pagoData.metodos[idx]?.monto || ''}
                                  onChange={e => {
                                    const nuevosMetodos = pagoData.metodos.map(m =>
                                      m.tipo === tipo ? { ...m, monto: e.target.value } : m
                                    );
                                    setPagoData({ ...pagoData, metodos: nuevosMetodos });
                                  }}
                                  required
                                />
                                {tipo === 'transferencia' && (
                                  <input
                                    type="text"
                                    placeholder="Banco o plataforma"
                                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white w-full sm:w-56"
                                    value={pagoData.metodos[idx]?.nota || ''}
                                    onChange={e => {
                                      const nuevosMetodos = pagoData.metodos.map(m =>
                                        m.tipo === tipo ? { ...m, nota: e.target.value } : m
                                      );
                                      setPagoData({ ...pagoData, metodos: nuevosMetodos });
                                    }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                      Registrar Pago
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <h3 className="text-lg font-medium text-gray-700 mt-6 mb-3 border-b pb-2">Historial de Pagos</h3>
              <div className="flex flex-col gap-3">
                {pagos.length === 0 ? (
                  <p className="text-gray-500 italic">No hay pagos registrados para este estudiante.</p>
                ) : (
                  pagos.map((pago) => (
                      <div key={pago.pago_id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-lg">{pago.descripcion}</p>
                          <p className="text-gray-500">{pago.fecha}</p>
                          {pago.tipo_pago && (
                            <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              Método: {pago.tipo_pago}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 text-lg">${pago.monto.toLocaleString()}</p>
                          <button
                            onClick={() => imprimirFactura(pago)}
                            className="mt-2 text-sm text-purple-700 hover:text-purple-800 flex items-center gap-1"
                          >
                            <span>🖨️</span> Imprimir Recibo
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">💰</div>
              <p>Selecciona un estudiante para ver sus pagos</p>
            </div>
          )}
        </div>
      </div>

      {pagoAImprimir && selectedEstudiante && (
        <div className="fixed inset-0 bg-slate-100 z-50 overflow-auto">
          <div className="fixed top-4 left-4 no-print z-[60]">
            <button
              onClick={() => setPagoAImprimir(null)}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-900"
            >
              ← Volver
            </button>
          </div>
          <DocumentoImprimible
            tipo="voucher_pago"
            titulo="Comprobante de Pago"
            subtitulo={`Factura #FAC-${(pagoAImprimir.pago_id || 0).toString().padStart(6, "0")}`}
          >
            <FacturaModerna pago={pagoAImprimir} estudiante={selectedEstudiante} />
          </DocumentoImprimible>
        </div>
      )}
    </div>
  );
}

export default PagosAdmin;
