import { ACCESOS_ADMIN, esTeclaDeActivacion } from "../../../utils/dashboards/admin";

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

function AccesosAdmin({ onAbrir }) {
  const manejarTecla = (event, path) => {
    if (esTeclaDeActivacion(event.key)) {
      event.preventDefault();
      onAbrir(path);
    }
  };

  return (
    <>
      <style>{dashboardCardStyles}</style>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-gray-800">Accesos principales</h2>
        <span className="hidden sm:inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Administración
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {ACCESOS_ADMIN.map((card, index) => (
          <div
            key={index}
            role="button"
            tabIndex={0}
            aria-label={`Abrir ${card.title}`}
            onClick={() => onAbrir(card.path)}
            onKeyDown={(event) => manejarTecla(event, card.path)}
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
    </>
  );
}

export default AccesosAdmin;
