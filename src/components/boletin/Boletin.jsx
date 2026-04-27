
import React, { useState, useEffect } from 'react';
import Header from './Header';
import api from '../../utils/api';

const mockInstitucion = {
  nombre: "Institución Educativa Moderna",
  lema: "Formando líderes para el futuro",
  nit: "901.234.567-8",
  direccion: "Avenida Principal 456, Ciudad",
  resolucion: "Resolución No. 1234 de 2026"
};

const Boletin = () => {
  const [institucion, setInstitucion] = useState(mockInstitucion);
  const [cargando, setCargando] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [periodo, setPeriodo] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  
  const [boletinData, setBoletinData] = useState(null);
  const [cargandoBoletin, setCargandoBoletin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCursos, resEst] = await Promise.all([
          api.get('/cursos'),
          api.get('/estudiantes')
        ]);
        setCursos(resCursos.data);
        setEstudiantes(resEst.data);
      } catch (error) {
        console.error("Error cargando base de datos", error);
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  const generarBoletin = async (estudianteId) => {
    setCargandoBoletin(true);
    try {
      const res = await api.get(`/boletines/admin/generar/${estudianteId}/${periodo}`);
      setBoletinData(res.data);
    } catch (e) {
      alert("Error al cargar el boletín. " + (e.response?.data?.detail || e.message));
    } finally {
      setCargandoBoletin(false);
    }
  };

  const calcularPromedioGeneral = () => {
    if (!boletinData || !boletinData.materias) return 0;
    const evaluadas = boletinData.materias.filter(m => m.definitiva !== null);
    if (evaluadas.length === 0) return 0;
    const suma = evaluadas.reduce((acc, m) => acc + m.definitiva, 0);
    return (suma / evaluadas.length).toFixed(1);
  };

  const getDesempeno = (definitiva) => {
    if (definitiva === null) return "PENDIENTE";
    if (definitiva >= 4.6) return "SUPERIOR";
    if (definitiva >= 4.0) return "ALTO";
    if (definitiva >= 3.0) return "BÁSICO";
    return "BAJO";
  };

  const getStyles = (definitiva) => {
    if (definitiva === null) return { text: "text-gray-500", bg: "bg-gray-100" };
    if (definitiva >= 4.0) return { text: "text-green-700", bg: "bg-green-50" };
    if (definitiva >= 3.0) return { text: "text-blue-700", bg: "bg-blue-50" };
    return { text: "text-red-700", bg: "bg-red-50" };
  };

  const estudiantesFiltrados = estudiantes.filter(est => {
    const matchCurso = cursoSeleccionado ? est.curso_id === parseInt(cursoSeleccionado) : true;
    const matchBusqueda = (est.nombre + " " + est.apellido + " " + est.documento_identidad).toLowerCase().includes(busqueda.toLowerCase());
    return matchCurso && matchBusqueda;
  });

  if (!boletinData) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Generar Boletines Administrativos</h1>
        <p className="text-gray-600 mb-8">Escoge un estudiante para extraer y consolidar las notas digitadas por los profesores.</p>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <select 
            className="p-3 border rounded-lg shadow-sm w-full md:w-1/3 focus:ring-2 focus:ring-blue-500"
            value={cursoSeleccionado}
            onChange={(e) => setCursoSeleccionado(e.target.value)}
          >
            <option value="">-- Todos los Cursos --</option>
            {cursos.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} ({c.jornada || "Mañana"})</option>
            ))}
          </select>

          <input 
            type="text"
            className="p-3 border rounded-lg shadow-sm w-full md:w-2/3 focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar alumno por nombre, apellido o ID..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select 
            className="p-3 border rounded-lg shadow-sm w-full md:w-32 focus:ring-2 focus:ring-blue-500 border-indigo-300"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            title="Periodo Académico"
          >
            <option value={1}>Per 1</option>
            <option value={2}>Per 2</option>
            <option value={3}>Per 3</option>
            <option value={4}>Per 4</option>
          </select>
        </div>

        {cargando ? (
          <div className="animate-pulse p-10 text-center text-gray-500 font-bold">Cargando base de datos...</div>
        ) : (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="p-4 font-semibold">Documento</th>
                    <th className="p-4 font-semibold">Estudiante</th>
                    <th className="p-4 font-semibold">Curso</th>
                    <th className="p-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {estudiantesFiltrados.map(est => {
                    const cursoObj = cursos.find(c => c.id === est.curso_id);
                    const cursoNombre = cursoObj ? cursoObj.nombre : "Sin Asignar";
                    return (
                      <tr key={est.id} className="hover:bg-blue-50 transition duration-150">
                        <td className="p-4 text-sm text-gray-600">{est.documento_identidad}</td>
                        <td className="p-4 font-bold text-gray-800 uppercase">{est.apellido}, {est.nombre}</td>
                        <td className="p-4 text-sm text-gray-600 font-medium">{cursoNombre}</td>
                        <td className="p-4 text-right">
                          <button 
                            disabled={cargandoBoletin}
                            onClick={() => generarBoletin(est.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md transition transform hover:-translate-y-1 disabled:opacity-50"
                          >
                            {cargandoBoletin ? "⏳ Generando..." : "📄 Generar Boletín"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {estudiantesFiltrados.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-500">No se encontraron estudiantes asociados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-10 px-4 md:px-8 relative">
      <div className="fixed bottom-6 right-6 no-print flex flex-col gap-3 z-50">
        <button
          onClick={() => window.print()}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition"
          title="Imprimir PDF"
        >
          🖨️
        </button>
        <button
          onClick={() => setBoletinData(null)}
          className="bg-slate-800 text-white p-4 rounded-full shadow-xl hover:bg-slate-900 transition"
          title="Volver"
        >
          🔙
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-2xl rounded boletin-print-container" style={{ minHeight: '1122px' }}>
        <Header institucion={institucion} onChangeInstitucion={setInstitucion} />

        {/* Sección Datos Estudiante */}
        <div className="border border-gray-300 rounded mb-8 mt-6">
          <div className="bg-gray-50 border-b border-gray-300 py-2 px-4 uppercase font-bold text-xs tracking-wider text-gray-600">
            Datos del Alumno
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-800">
            <div className="md:col-span-2">
              <span className="font-bold uppercase block text-xs text-gray-500">Apellidos y Nombres:</span>
              <span className="uppercase text-lg tracking-wide font-bold">
                {boletinData.estudiante_apellido}, {boletinData.estudiante_nombre}
              </span>
            </div>
            <div>
              <span className="font-bold uppercase block text-xs text-gray-500">Sistema ID:</span>
              <span>EST-{boletinData.estudiante_id}</span>
            </div>
            <div>
              <span className="font-bold uppercase block text-xs text-gray-500">Grado y Grupo:</span>
              <span className="font-semibold">{boletinData.curso}</span>
            </div>
            <div>
              <span className="font-bold uppercase block text-xs text-gray-500">Periodo:</span>
              <span className="font-semibold">Periodo {boletinData.periodo}</span>
            </div>
            <div>
              <span className="font-bold uppercase block text-xs text-gray-500">Año Lectivo:</span>
              <span className="font-semibold">{new Date().getFullYear()}</span>
            </div>
          </div>
        </div>

        {/* Rendimiento Consolidado */}
        <div className="mb-6 flex justify-between items-end border-b-2 border-gray-800 pb-2">
          <h2 className="text-xl font-extrabold uppercase tracking-widest text-gray-900">
            Resumen de Evaluaciones
          </h2>
          <div className="text-right">
            <span className="uppercase text-xs font-bold text-gray-500 mr-2">Promedio General</span>
            <span className={`text-2xl font-black ${(calcularPromedioGeneral() >= 3.0 || calcularPromedioGeneral() == 0) ? 'text-blue-700' : 'text-red-600'}`}>
              {calcularPromedioGeneral()}
            </span>
          </div>
        </div>

        {/* Materias */}
        <div className="space-y-6">
          {Object.values(
  boletinData.materias.reduce((acc, mat) => {
    if (!acc[mat.materia_id]) {
      acc[mat.materia_id] = {
        ...mat,
        detalles: []
      };
    }

    acc[mat.materia_id].detalles.push(...(mat.detalles || []));

    return acc;
  }, {})
).map((mat) => {
  const styles = getStyles(mat.definitiva);
  const desempeno = getDesempeno(mat.definitiva);

            return (
              <div key={`${mat.materia_id}-${mat.boletin_id}`}className="border border-gray-300 rounded page-break-inside-avoid">
                <div className={`px-4 py-3 flex justify-between items-center border-b border-gray-300 ${styles.bg}`}>
                  <div>
                    <h3 className="font-extrabold uppercase text-gray-800 tracking-wider">
                      {mat.materia}
                    </h3>
                    <p className="text-xs text-gray-600 font-medium uppercase mt-1">
                      Docente: {mat.profesor_nombre} {mat.profesor_apellido || ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase text-gray-500 block">Definitiva</span>
                    <div className="flex items-center gap-3 justify-end">
                      <span className={`text-xs font-black tracking-widest px-2 py-1 rounded bg-white bg-opacity-60 ${styles.text}`}>
                        {desempeno}
                      </span>
                      <span className={`text-2xl font-black ${styles.text}`}>
                        {mat.definitiva !== null ? mat.definitiva.toFixed(1) : "---"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white text-sm">
                  {mat.detalles && mat.detalles.length > 0 ? (
                    <div>
                      <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 border-b pb-1">
                        Logros
                      </h4 >


                      <div className="overflow-x-auto">
                        
                          <table className="w-full border border-gray-300 border-collapse text-sm">
  
                            <thead>
                              <tr className="bg-gray-100 text-gray-600 text-xs uppercase">
                                <th className="text-left px-3 py-2 border border-gray-300">Observación</th>

                                <th className="text-right px-3 py-2 w-20 border border-gray-300">P1</th>
                                <th className="text-right px-3 py-2 w-20 border border-gray-300">P2</th>
                                <th className="text-right px-3 py-2 w-20 border border-gray-300">P3</th>
                                <th className="text-right px-3 py-2 w-20 border border-gray-300">P4</th>
                              </tr>
                            </thead>

                         <tbody>
  {Object.values(
    (mat?.detalles || []).reduce((acc, det) => {
      const key = det.observacion?.trim() || "Sin observación";

      if (!acc[key]) {
        acc[key] = {
          observacion: key,
          notas: { 1: '', 2: '', 3: '', 4: '' }
        };
      }

      if (det.periodo && det.nota !== null && det.nota !== undefined) {
        acc[key].notas[det.periodo] = det.nota.toFixed(1);
      }

      return acc;
    }, {})
  ).map((item, idx) => (
    <tr key={`${item.observacion}-${Object.values(item.notas).join('-')}`} className="border-b">

      <td className="px-3 py-2 text-gray-700 border border-gray-300 break-words whitespace-normal max-w-[300px]">
        {item.observacion}
      </td>

      <td className="px-3 py-2 text-right border border-gray-300">{item.notas[1]}</td>
      <td className="px-3 py-2 text-right border border-gray-300">{item.notas[2]}</td>
      <td className="px-3 py-2 text-right border border-gray-300">{item.notas[3]}</td>
      <td className="px-3 py-2 text-right border border-gray-300">{item.notas[4]}</td>

    </tr>
  ))}
</tbody>
                    
                          </table>
                      
                      </div>
                    </div>
                    ) : 
                    (
                    <div className="text-center py-4 bg-gray-50 text-gray-500 rounded border border-dashed border-gray-300 text-xs uppercase font-semibold">
                      Calificación y observaciones pendientes por ingresar.
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {boletinData.materias.length === 0 && (
            <div className="p-10 text-center font-bold text-gray-400 border-2 border-dashed border-gray-300">
              El curso no tiene asignadas materias o profesores todavía.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Boletin;
