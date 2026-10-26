import { Link } from "react-router-dom";
import FondoMarca from "../components/FondoMarca";
import LoginFormView from "../components/autenticacion/LoginFormView";
import { useComandoLogin } from "../hooks/autenticacion/useComandoLogin";
import { RUTAS_SESION } from "../utils/autenticacion/sesion";

// Gotas de vidrio alrededor de la tarjeta: tamaño, posición y desfase de su
// flotación. Las que quedan detrás de la tarjeta se ven a través del vidrio.
const GOTAS = [
  "-right-8 -top-10 h-28 w-28 sm:-right-16 sm:-top-14 sm:h-36 sm:w-36",
  "-bottom-8 -left-8 h-20 w-20 sm:-bottom-12 sm:-left-16 sm:h-28 sm:w-28 [animation-delay:-3s]",
  "-bottom-5 right-10 h-9 w-9 [animation-delay:-5s]",
  "-left-5 top-28 h-7 w-7 sm:-left-9 [animation-delay:-7s]",
];

function Login() {
  const {
    email,
    password,
    codigoColegio,
    formError,
    isSubmitting,
    isTakingLong,
    loginSucceeded,
    actualizarEmail,
    actualizarPassword,
    actualizarCodigoColegio,
    iniciarSesion,
  } = useComandoLogin();

  return (
    <main
      className="notranslate relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-slate-950 px-4 py-10"
      translate="no"
    >
      <FondoMarca animado />

      <div className="relative w-full max-w-[400px]">
        <Link
          to={RUTAS_SESION.PORTADA}
          className="mb-5 inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-sm font-semibold text-purple-100/75 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m6-6-6 6 6 6" />
          </svg>
          Volver al inicio
        </Link>

        <div className="relative">
          {GOTAS.map((clases) => (
            <span
              key={clases}
              aria-hidden="true"
              className={`gota-agua gota-flotar pointer-events-none absolute ${clases}`}
            />
          ))}

          <section className="vidrio-gota relative rounded-[30px] p-6 sm:p-8">
            <div className="relative">
              <LoginFormView
                email={email}
                password={password}
                codigoColegio={codigoColegio}
                formError={formError}
                isSubmitting={isSubmitting}
                isTakingLong={isTakingLong}
                loginSucceeded={loginSucceeded}
                actualizarEmail={actualizarEmail}
                actualizarPassword={actualizarPassword}
                actualizarCodigoColegio={actualizarCodigoColegio}
                iniciarSesion={iniciarSesion}
              />
            </div>
          </section>
        </div>

        <p className="mt-7 text-center text-sm font-semibold tracking-wide text-purple-100/70">
          Tu aula, tu camino, <span className="text-lime-300">tu futuro.</span>
        </p>
      </div>
    </main>
  );
}

export default Login;
