import { useNavigate } from "react-router-dom";

function DashboardAdmin() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  if (!usuario || usuario.rol !== "admin") {
    navigate("/login");
    return null;
  }

  const cards = [
    {
      title: "Pagos",
      description: "Gestión de pagos y finanzas",
      icon: "💰",
      path: "/admin/pagos",
      color: "bg-green-500"
    },
    {
      title: "Estudiantes",
      description: "Administrar estudiantes",
      icon: "👨‍🎓",
      path: "/admin/estudiantes",
      color: "bg-blue-500"
    },
    {
      title: "Reportes",
      description: "Ver reportes del sistema",
      icon: "📊",
      path: "/admin/reportes",
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Panel de Administración
        </h1>
        <p className="text-gray-600">
          Bienvenido, {usuario.nombre}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.path)}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200"
          >
            <div className="p-6">
              <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {card.title}
              </h3>
              <p className="text-gray-600">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardAdmin;