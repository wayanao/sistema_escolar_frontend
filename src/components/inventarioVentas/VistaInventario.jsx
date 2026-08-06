import {
  claseEstadoProducto,
  claseStockProducto,
  ESTADOS_PRODUCTO,
  estadoDeProducto,
  estadoLabel,
  FILTROS_PRODUCTO,
} from "../../utils/inventarioVentas/inventario";

function VistaInventario({
  productos,
  loading,
  estadoFiltro,
  onCambiarFiltro,
  showForm,
  editingId,
  formData,
  onCambiarCampo,
  onAlternarFormulario,
  onSubmit,
  onEditarProducto,
  onCambiarEstadoProducto,
}) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Inventario de Productos</h1>
          <p className="text-gray-600">Control de stock, costos y utilidades de productos físicos (Sudaderas, útiles, etc.)</p>
        </div>
        <button
          onClick={onAlternarFormulario}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow transition font-medium"
        >
          {showForm ? "Cancelar" : "+ Nuevo Producto"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">{editingId ? "Editar Producto" : "Registrar Nuevo Producto"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Descripción</label>
              <input type="text" value={formData.nombre} onChange={e => onCambiarCampo("nombre", e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario ($)</label>
              <input type="number" step="0.01" value={formData.costo} onChange={e => onCambiarCampo("costo", e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta ($)</label>
              <input type="number" step="0.01" value={formData.precio_venta} onChange={e => onCambiarCampo("precio_venta", e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
              <input type="number" value={formData.stock_actual} onChange={e => onCambiarCampo("stock_actual", e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={formData.estado} onChange={e => onCambiarCampo("estado", e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 bg-white">
                {ESTADOS_PRODUCTO.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium shadow-sm w-full md:w-auto">
            {editingId ? "Actualizar Producto" : "Guardar Producto"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
            <select
              value={estadoFiltro}
              onChange={(e) => onCambiarFiltro(e.target.value)}
              className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
            >
              {FILTROS_PRODUCTO.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilidad c/u</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productos.length === 0 ? (
                  <tr><td colSpan="8" className="px-6 py-4 text-center text-gray-500">No hay productos en inventario</td></tr>
                ) : (
                  productos.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{p.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${claseStockProducto(p.stock_actual)}`}>
                          {p.stock_actual} und.
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">${p.costo.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-purple-700">${p.precio_venta.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">${p.utilidad_unitaria.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-purple-600 font-medium">{p.margen_utilidad}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${claseEstadoProducto(estadoDeProducto(p))}`}>
                          {estadoLabel(estadoDeProducto(p))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <select
                            value={estadoDeProducto(p)}
                            onChange={(e) => onCambiarEstadoProducto(p, e.target.value)}
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
                          >
                            {ESTADOS_PRODUCTO.map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </select>
                          <button onClick={() => onEditarProducto(p)} className="text-purple-700 hover:text-purple-900">Editar</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default VistaInventario;
