import React from 'react';
import TablaNotas from './TablaNotas';

const Materia = ({ materia, onUpdateNota }) => {
  
  // Calcular rendimiento (desempeño)
  const getDesempeno = (promedio) => {
    if (promedio >= 4.6) return "SUPERIOR";
    if (promedio >= 4.0) return "ALTO";
    if (promedio >= 3.0) return "BÁSICO";
    return "BAJO";
  };

  const getStyleDesempeno = (promedio) => {
    if (promedio >= 4.0) return "text-green-700 bg-green-50 px-2 py-1 rounded";
    if (promedio >= 3.0) return "text-yellow-700 bg-yellow-50 px-2 py-1 rounded";
    return "text-red-700 bg-red-50 font-bold px-2 py-1 rounded animate-pulse";
  };

  return (
    <div className="bg-white border rounded shadow-sm border-gray-200 overflow-hidden mb-6 flex flex-col page-break-inside-avoid">
      <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-b border-gray-200">
        <div>
          <h3 className="font-extrabold text-blue-900 uppercase tracking-wider">{materia.area}</h3>
          <p className="text-xs text-gray-500">Docente: {materia.docente}</p>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase font-bold text-gray-500 mr-2">Desempeño</span>
          <span className={`text-xs font-black tracking-wide ${getStyleDesempeno(materia.promedio)}`}>
            {getDesempeno(materia.promedio)}
          </span>
        </div>
      </div>
      
      <div className="p-0 flex-1">
        <TablaNotas 
          actividades={materia.actividades} 
          materiaId={materia.id}
          onUpdateNota={onUpdateNota} 
        />
      </div>

      <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
        <span className="font-bold text-gray-700 uppercase tracking-widest text-sm">Promedio Final</span>
        <span className={`text-2xl font-black ${materia.promedio >= 3 ? 'text-blue-600' : 'text-red-600'}`}>
          {materia.promedio.toFixed(1)}
        </span>
      </div>
    </div>
  );
};

export default Materia;