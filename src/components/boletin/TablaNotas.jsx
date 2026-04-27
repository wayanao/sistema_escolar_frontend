import React from 'react';

const TablaNotas = ({ actividades, onUpdateNota, materiaId }) => {
  const handleChange = (actividadId, valorStr) => {
    let valor = parseFloat(valorStr);
    
    if (isNaN(valor)) valor = 0;

    if (valor < 0) valor = 0;
    if (valor > 5) valor = 5;

    onUpdateNota(materiaId, actividadId, valor);
  };

  return (
    <div className="w-full">
      <table className="w-full text-left">
        <tbody>
          {actividades.map((actividad, index) => (
            <tr key={actividad.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-100 last:border-b-0`}>
              <td className="py-2 px-3 text-sm text-gray-700 font-medium">      
                {actividad.descripcion}
              </td>
              <td className="py-2 px-3 text-right w-24 align-middle">
                {/* Visible solo en Web para poder editar */}
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={actividad.nota === 0 && !actividad.notaStr ? '' : actividad.nota}
                  onChange={(e) => handleChange(actividad.id, e.target.value)}  
                  className="w-16 border-b-2 text-right bg-transparent text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 no-print"   
                />

                {/* Visible solo al imprimir */}
                <span className="hidden print:inline-block text-sm font-bold">
                  {Number(actividad.nota).toFixed(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaNotas;