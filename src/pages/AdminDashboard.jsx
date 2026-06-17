import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const formatMoney = (v) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

const dashboardCardStyles = `
@keyframes admin-dashboard-card-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.admin-dashboard-card {
  background: var(--card-surface);
  border-color: var(--card-border);
  animation: admin-dashboard-card-in 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
  transition:
    transform 280ms ease,
    box-shadow 280ms ease,
    border-color 280ms ease,
    background 280ms ease;
}

.admin-dashboard-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: var(--card-accent);
}

.admin-dashboard-card::after {
  content: "";
  position: absolute;
  right: -32px;
  top: -36px;
  width: 96px;
  height: 96px;
  border-radius: 999px;
  pointer-events: none;
  background: var(--card-accent-soft);
  opacity: 0.72;
  transform: scale(0.96);
  transition:
    opacity 280ms ease,
    transform 280ms ease;
}

.admin-dashboard-card:hover,
.admin-dashboard-card:focus-visible {
  transform: translateY(-5px);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.13);
  border-color: var(--card-accent);
  background: var(--card-hover);
}

.admin-dashboard-card:hover::after,
.admin-dashboard-card:focus-visible::after {
  opacity: 1;
  transform: scale(1.12);
}

.admin-dashboard-card:active {
  transform: translateY(-2px) scale(0.99);
}

.admin-dashboard-card__icon {
  background: var(--card-accent);
  transition:
    transform 280ms ease,
    filter 280ms ease;
}

.admin-dashboard-card:hover .admin-dashboard-card__icon,
.admin-dashboard-card:focus-visible .admin-dashboard-card__icon {
  transform: scale(1.08) rotate(-2deg);
  filter: saturate(1.1);
}

@media (prefers-reduced-motion: reduce) {
  .admin-dashboard-card,
  .admin-dashboard-card::before,
  .admin-dashboard-card::after,
  .admin-dashboard-card__icon {
    animation: none;
    transition: none;
  }
}
`;

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
      surface: "#ecfdf5",
      hover: "#dcfce7",
      border: "#bbf7d0",
      accent: "#16a34a",
      accentSoft: "rgba(22, 163, 74, 0.13)",
    },
    {
      title: "Gestión de Estudiantes",
      description: "Administrar estudiantes y matrículas",
      icon: "👨‍🎓",
      path: "/admin/estudiantes",
      surface: "#eff6ff",
      hover: "#dbeafe",
      border: "#bfdbfe",
      accent: "#2563eb",
      accentSoft: "rgba(37, 99, 235, 0.13)",
    },
    {
      title: "Gestión Académica",
      description: "Administrar profesores, cursos, asignaciones y horarios.",
      icon: "🎓",
      path: "/admin",
      surface: "#fff7ed",
      hover: "#ffedd5",
      border: "#fed7aa",
      accent: "#ea580c",
      accentSoft: "rgba(234, 88, 12, 0.14)",
    },
    {
      title: "Reportes",
      description: "Ver reportes y estadísticas del sistema",
      icon: "📊",
      path: "/admin/reportes",
      surface: "#f5f3ff",
      hover: "#ede9fe",
      border: "#ddd6fe",
      accent: "#7c3aed",
      accentSoft: "rgba(124, 58, 237, 0.14)",
    },
  ];

  const hayMora = resumenCartera && resumenCartera.total_estudiantes > 0;
  const handleCardKeyDown = (event, path) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(path);
    }
  };

  return (
    <div className="p-6">
      <style>{dashboardCardStyles}</style>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
        <p className="text-gray-600">Bienvenido, {usuario.nombre}</p>
      </div>

      {/* Card destacada: Cartera Vencida */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Abrir cartera vencida"
        onClick={() => navigate("/admin/cartera-vencida")}
        onKeyDown={(event) => handleCardKeyDown(event, "/admin/cartera-vencida")}
        className={`relative overflow-hidden rounded-xl shadow-lg cursor-pointer mb-6 transition-transform hover:scale-[1.01] focus-visible:ring-4 focus-visible:ring-rose-200 outline-none ${
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

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-gray-800">Accesos principales</h2>
        <span className="hidden sm:inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Administración
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            role="button"
            tabIndex={0}
            aria-label={`Abrir ${card.title}`}
            onClick={() => navigate(card.path)}
            onKeyDown={(event) => handleCardKeyDown(event, card.path)}
            className="admin-dashboard-card group relative min-h-[132px] overflow-hidden rounded-lg border shadow-sm cursor-pointer outline-none"
            style={{
              "--card-surface": card.surface,
              "--card-hover": card.hover,
              "--card-border": card.border,
              "--card-accent": card.accent,
              "--card-accent-soft": card.accentSoft,
              animationDelay: `${index * 80}ms`,
            }}
          >
            <div className="relative z-10 flex h-full flex-col justify-between p-4 pl-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="admin-dashboard-card__icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm">
                  <span className="text-xl">{card.icon}</span>
                </div>
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 shadow-sm">
                  Abrir
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold leading-snug text-gray-950">{card.title}</h3>
                <p className="mt-1 text-sm leading-snug text-gray-700">{card.description}</p>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-bold text-gray-700">
                <span>Gestionar módulo</span>
                <span className="text-base leading-none" aria-hidden="true">
                  →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Admin;
