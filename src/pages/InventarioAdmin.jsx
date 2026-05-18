import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import api from "../utils/api";

function InventarioAdmin() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    costo: "",
    precio_venta: "",
    stock_actual: ""
  });

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    try {
      const res = await api.get(`/inventario`);
      const data = res.data;
      setProductos(data);
    } catch (error) {
      console.error("Error cargando inventario", error);
      Swal.fire("Error", "No se pudo cargar el inventario", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || formData.costo === "" || formData.precio_venta === "" || formData.stock_actual === "") {
      Swal.fire("Atención", "Todos los campos son obligatorios", "warning");
      return;
    }

    try {
      const isEditing = editingId !== null;
      const url = isEditing ? `/inventario/${editingId}` : `/inventario`;
      
      const payload = {
        nombre: formData.nombre,
        costo: parseFloat(formData.costo),
        precio_venta: parseFloat(formData.precio_venta),
        stock_actual: parseInt(formData.stock_actual, 10)
      };

      const res = isEditing 
        ? await api.put(url, payload)
        : await api.post(url, payload);

      if (res.status >= 200 && res.status < 300) {
        Swal.fire("Éxito", isEditing ? "Producto actualizado" : "Producto creado", "success");
        setFormData({ nombre: "", costo: "", precio_venta: "", stock_actual: "" });
        setShowForm(false);
        setEditingId(null);
        cargarInventario();
      } else {
        Swal.fire("Error", "Ocurrió un error", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "No se pudo guardar", "error");
    }
  };

  const eliminarProducto = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/inventario/${id}`);
        if (res.status >= 200 && res.status < 300) {
          Swal.fire("Eliminado", "Producto eliminado correctamente", "success");
          cargarInventario();
        }
      } catch {
        Swal.fire("Error", "Error al eliminar producto", "error");
      }
    }
  };

  const editarProducto = (prod) => {
    setFormData({
      nombre: prod.nombre,
      costo: prod.costo,
      precio_venta: prod.precio_venta,
      stock_actual: prod.stock_actual
    });
    setEditingId(prod.id);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Inventario de Productos</h1>
          <p className="text-gray-600">Control de stock, costos y utilidades de productos físicos (Sudaderas, útiles, etc.)</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            if(showForm) {
              setFormData({ nombre: "", costo: "", precio_venta: "", stock_actual: "" });
              setEditingId(null);
            }
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow transition font-medium"
        >
          {showForm ? "Cancelar" : "+ Nuevo Producto"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">{editingId ? "Editar Producto" : "Registrar Nuevo Producto"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Descripción</label>
              <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario ($)</label>
              <input type="number" step="0.01" value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta ($)</label>
              <input type="number" step="0.01" value={formData.precio_venta} onChange={e => setFormData({...formData, precio_venta: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
              <input type="number" value={formData.stock_actual} onChange={e => setFormData({...formData, stock_actual: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500" required />
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productos.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">No hay productos en inventario</td></tr>
                ) : (
                  productos.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{p.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.stock_actual <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {p.stock_actual} und.
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">${p.costo.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-purple-700">${p.precio_venta.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">${p.utilidad_unitaria.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-purple-600 font-medium">{p.margen_utilidad}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => editarProducto(p)} className="text-purple-700 hover:text-purple-900 mr-3">Editar</button>
                        <button onClick={() => eliminarProducto(p.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
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

export default InventarioAdmin;
