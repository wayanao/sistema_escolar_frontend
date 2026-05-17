import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const formatMoney = (v) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

function Admin() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const [resumenCartera, setResumenCartera] = useState(null);

  useEffect(() => {
    if (!usuario || usuario.rol !== "admin") return;
    api
      .get("/cartera/mora/resumen")
      .then((res) => setResumenCartera(res.data))
      .catch((err) => console.error("Error cargando resumen cartera:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!usuario || usuario.rol !== "admin") {
    navigate("/login");
    return null;
  }

  const cards = [
    {
      title: "Gestión de Pagos",
      description: "Administrar pagos y finanzas del sistema",
      icon: "💰",
      path: "/admin/pagos",
      color: "bg-green-500",
    },
    {
      title: "Gestión de Estudiantes",
      description: "Administrar estudiantes y matrículas",
      icon: "👨‍🎓",
      path: "/admin/estudiantes",
      color: "bg-blue-500",
    },
    {
      title: "Gestión Académica",
      description: "Administrar profesores, cursos, asignaciones y horarios.",
      icon: "🎓",
      path: "/admin",
      color: "bg-orange-500",
    },
    {
      title: "Reportes",
      description: "Ver reportes y estadísticas del sistema",
      icon: "📊",
      path: "/admin/reportes",
      color: "bg-purple-500",
    },
  ];

  const hayMora = resumenCartera && resumenCartera.total_estudiantes > 0;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
        <p className="text-gray-600">Bienvenido, {usuario.nombre}</p>
      </div>

      {/* Card destacada: Cartera Vencida */}
      <div
        onClick={() => navigate("/admin/cartera-vencida")}
        className={`relative overflow-hidden rounded-xl shadow-lg cursor-pointer mb-6 transition-transform hover:scale-[1.01] ${
          hayMora
            ? "bg-gradient-to-r from-rose-600 via-red-600 to-orange-600"
            : "bg-gradient-to-r from-emerald-600 to-teal-600"
        }`}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-10 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-xl w-14 h-14 flex items-center justify-center text-3xl">
              {hayMora ? "⚠️" : "✅"}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold opacity-90">
                Cartera vencida
              </p>
              <h3 className="text-xl sm:text-2xl font-bold">
                {hayMora ? formatMoney(resumenCartera.total_deuda) : "Cartera al día"}
              </h3>
              <p className="text-sm opacity-90 mt-1">
                {hayMora
                  ? `${resumenCartera.total_estudiantes} estudiantes en mora · Mora: ${formatMoney(
                      resumenCartera.total_mora
                    )}`
                  : "No hay estudiantes en mora actualmente."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hayMora && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                {resumenCartera.total_estudiantes} en mora
              </span>
            )}
            <span className="bg-white text-rose-700 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap">
              Ver reporte →
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.path)}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200"
          >
            <div className="p-6">
              <div
                className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
              >
                <span className="text-2xl">{card.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-gray-600">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Admin;