import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import api from "../utils/api";

const API = import.meta.env.VITE_API_URL;

function AdministrarTiposPago() {
  const [tiposPagos, setTiposPagos] = useState([]);
  const [nuevoTipoPago, setNuevoTipoPago] = useState("");
  const [valorTipoPago, setValorTipoPago] = useState("");
  const [editingTipoId, setEditingTipoId] = useState(null);

  useEffect(() => {
    cargarTiposPagos();
  }, []);

  const cargarTiposPagos = async () => {
    try {
      const res = await api.get(`/tipos-pagos`);
      const data = res.data;
      setTiposPagos(data);
    } catch (error) {
      console.error("Error cargando tipos de pagos:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevoTipoPago.trim()) return;

    try {
      const isEditing = editingTipoId !== null;
      const url = isEditing ? `${API}/tipos-pagos/${editingTipoId}` : `${API}/tipos-pagos`;
      const method = isEditing ? "PUT" : "POST";
      
      const payload = { nombre: nuevoTipoPago.trim(), valor: parseFloat(valorTipoPago) || 0 };
      const endpoint = isEditing ? `/tipos-pagos/${editingTipoId}` : `/tipos-pagos`;
      const res = isEditing ? await api.put(endpoint, payload) : await api.post(endpoint, payload);
      
      if (res.status >= 200 && res.status < 300) {
        Swal.fire('Éxito', isEditing ? 'Tipo de pago actualizado' : 'Tipo de pago creado', 'success');
        setNuevoTipoPago("");
        setValorTipoPago("");
        setEditingTipoId(null);
        cargarTiposPagos();
      } else {
        Swal.fire('Error', 'Error al guardar o ya existe', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Error de conexión', 'error');
    }
  };

  const handleEdit = (tp) => {
    setEditingTipoId(tp.id);
    setNuevoTipoPago(tp.nombre);
    setValorTipoPago(tp.valor);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará este tipo de pago.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar'
    });
    
    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/tipos-pagos/${id}`);
        if (res.status >= 200 && res.status < 300) {
          Swal.fire('Eliminado', '', 'success');
          cargarTiposPagos();
          if (editingTipoId === id) {
            setEditingTipoId(null);
            setNuevoTipoPago("");
            setValorTipoPago("");
          }
        }
      } catch (e) {
        Swal.fire('Error', '', 'error');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        💳 Administrar Tipos de Pago y Valores
      </h2>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Concepto de Pago
            </label>
            <input
              type="text"
              value={nuevoTipoPago}
              onChange={(e) => setNuevoTipoPago(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Matrícula, Copias..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor / Costo
            </label>
            <input
              type="number"
              step="0.01"
              value={valorTipoPago}
              onChange={(e) => setValorTipoPago(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium"
          >
            {editingTipoId ? "Actualizar Concepto" : "Guardar Concepto"}
          </button>
          {editingTipoId && (
            <button
              type="button"
              onClick={() => { setEditingTipoId(null); setNuevoTipoPago(""); setValorTipoPago(""); }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
      
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Conceptos Existentes</h3>
        <div className="flex flex-wrap gap-2">
          {tiposPagos.map(tp => (
            <div key={tp.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
              <div>
                <span className="font-medium text-gray-800 block text-sm">{tp.nombre}</span>
                <span className="text-xs text-green-600 font-semibold">${tp.valor}</span>
              </div>
              <div className="flex flex-col gap-1 ml-2">
                <button onClick={() => handleEdit(tp)} className="text-purple-600 hover:text-purple-700 text-xs" title="Editar">✏️</button>
                <button onClick={() => handleDelete(tp.id)} className="text-red-500 hover:text-red-700 text-xs" title="Eliminar">❌</button>
              </div>
            </div>
          ))}
          {tiposPagos.length === 0 && <span className="text-gray-500 text-sm">No hay conceptos registrados</span>}
        </div>
      </div>
    </div>
  );
}

export default AdministrarTiposPago;