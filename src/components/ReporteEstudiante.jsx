function ReporteEstudiante({ estudiante, observacion, profesorNombre }) {

  return (
    <div className="p-10 bg-white text-black">

      <h2 className="text-red-600 font-bold">
        DIMENSIÓN CONDUCTUAL:
      </h2>
      <p>{observacion.conductual}</p>

      <h2 className="text-red-600 font-bold mt-4">
        DIMENSIÓN COGNITIVO:
      </h2>
      <p>{observacion.cognitivo}</p>

      <h2 className="text-red-600 font-bold mt-4">
        DIMENSIÓN DEL LENGUAJE:
      </h2>
      <p>{observacion.lenguaje}</p>

      {/* 🔥 FIRMAS */}
      <div className="mt-16 flex justify-between">
        <div className="text-center">
          _______________________<br />
          {profesorNombre}
        </div>

        <div className="text-center">
          _______________________<br />
          Rectora
        </div>
      </div>
        <button
            onClick={() => window.print()}
            className="bg-green-600 text-white px-3 py-2 rounded mt-4"
            >
            🖨️ Imprimir
        </button>

    </div>
  );
}

export default ReporteEstudiante;