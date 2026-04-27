function AsistenciaRow({ est, asistencia, marcar }) {

return (
    <div className="flex justify-between p-2 border mb-2">

        <div className="flex items-center gap-4">
            
            <div className="flex items-center gap-4">

                  {/* NOMBRE */}
                <span className="font-medium capitalize">
                    {est.apellido} {est.nombre}
                </span>

                  {/* INASISTENCIAS */}
                <p className="text-sm text-red-600 font-semibold">
                    Inasistencias: {
                    (est.historial || []).filter(h => h.estado === "ausente").length
                    }
                </p>

                  {/* ASISTENCIAS */}
                {/* <p className="text-sm text-green-600 font-semibold">
                    Asistida: {
                    (est.historial || []).filter(h => h.estado === "presente").length
                    }
                </p>*/}

            </div>

        </div>

    <div className="flex gap-2">

        <button
            className={`w-8 h-8 border rounded flex items-center justify-center text-sm ${
            asistencia[est.estudiante_id] === "presente"
            ? "bg-green-500 text-white"
            : "bg-gray-200"
        }`}
            onClick={() => marcar(est.estudiante_id, "presente")}
        >
            ✔
        </button>
        
        <button
            className={`w-8 h-8 border rounded flex items-center justify-center text-sm ${
            asistencia[est.estudiante_id] === "ausente"
            ? "bg-red-500 text-white"
            : "bg-gray-200"
        }`}

        onClick={() => marcar(est.estudiante_id, "ausente")}
        >
        ✖
        </button>
    </div>
    
</div>
);
}

export default AsistenciaRow;