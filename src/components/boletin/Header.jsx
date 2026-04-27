import React, { useState } from 'react';

const Header = ({ institucion, onChangeInstitucion }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    onChangeInstitucion({
      ...institucion,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="border-b-2 border-gray-800 pb-4 mb-6 relative group">
      {isEditing ? (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4 animate-fade-in no-print">
          <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Modo Edición - Encabezado</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input name="nombre" value={institucion.nombre} onChange={handleChange} className="border p-2 rounded text-sm w-full" placeholder="Nombre de la Institución" />
            <input name="nit" value={institucion.nit} onChange={handleChange} className="border p-2 rounded text-sm w-full" placeholder="NIT" />
            <input name="direccion" value={institucion.direccion} onChange={handleChange} className="border p-2 rounded text-sm w-full" placeholder="Dirección" />
            <input name="resolucion" value={institucion.resolucion} onChange={handleChange} className="border p-2 rounded text-sm w-full" placeholder="Resolución" />
            <input name="lema" value={institucion.lema} onChange={handleChange} className="border p-2 rounded text-sm w-full md:col-span-2" placeholder="Lema institucional" />
          </div>
          <button onClick={() => setIsEditing(false)} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition">Guardar Cambios</button>
        </div>
      ) : (
        <button 
          onClick={() => setIsEditing(true)} 
          className="absolute top-0 right-0 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity no-print"
        >
          ✏️ Editar
        </button>
      )}

      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-widest">{institucion.nombre}</h1>
        {institucion.lema && <p className="text-sm italic text-gray-600 mt-1">"{institucion.lema}"</p>}
        <div className="mt-2 text-xs text-gray-700 uppercase space-x-3">
          <span><strong>NIT:</strong> {institucion.nit}</span>
          <span>•</span>
          <span>{institucion.resolucion}</span>
          <span>•</span>
          <span>{institucion.direccion}</span>
        </div>
        <div className="mt-6 bg-gray-800 text-white w-full py-2">
          <h2 className="text-xl font-bold uppercase tracking-[0.2em]">BOLETÍN ACADÉMICO INFORMATIVO</h2>
        </div>
      </div>
    </div>
  );
};

export default Header;