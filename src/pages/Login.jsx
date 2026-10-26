import { Link } from "react-router-dom";
import FondoMarca from "../components/FondoMarca";
import LoginFormView from "../components/autenticacion/LoginFormView";
import { useComandoLogin } from "../hooks/autenticacion/useComandoLogin";
import { RUTAS_SESION } from "../utils/autenticacion/sesion";

// Gotas de vidrio alrededor de la tarjeta: tamaño, posición y desfase de su
// flotación. Las que quedan detrás de la tarjeta se ven a través del vidrio.
const GOTAS = [
  "-right-8 -top-10 h-28 w-28 sm:-right-16 sm:-top-14 sm:h-36 sm:w-36",
  "-bottom-8 -left-8 h-20 w-20 sm:-bottom-12 sm:-left-16 sm:h-28 sm:w-28 [--retraso:-3s]",
  "-bottom-5 right-10 h-9 w-9 [--retraso:-5s]",
  "-left-5 top-28 h-7 w-7 sm:-left-9 [--retraso:-7s]",
];

// Burbujas sueltas por toda la pantalla, para que el espacio alrededor de la
// tarjeta no se vea vacío. Cada una lleva su ritmo y su desfase para no
// moverse a la vez; las pequeñas, algo borrosas y transparentes, se sienten
// más lejos. En el celular solo quedan las que no saturan.
const BURBUJAS_SUELTAS = [
  "left-[7%] top-[12%] h-16 w-16 [--duracion:13s]",
  "left-[15%] top-[58%] h-28 w-28 [--duracion:17s] [--retraso:-5s]",
  "left-[4%] bottom-[8%] h-10 w-10 opacity-80 [--duracion:12s] [--retraso:-2s]",
  "left-[27%] top-[26%] hidden h-6 w-6 opacity-70 blur-[1px] sm:block [--duracion:11s] [--retraso:-7s]",
  "left-[30%] bottom-[16%] hidden h-8 w-8 opacity-75 sm:block [--duracion:15s] [--retraso:-9s]",
  "left-[38%] top-[4%] hidden h-4 w-4 opacity-60 blur-[1px] sm:block [--duracion:10s] [--retraso:-3s]",
  "right-[8%] top-[15%] h-20 w-20 [--duracion:16s] [--retraso:-4s]",
  "right-[17%] bottom-[11%] h-24 w-24 [--duracion:18s] [--retraso:-11s]",
  "right-[5%] top-[50%] hidden h-9 w-9 opacity-80 sm:block [--duracion:12s] [--retraso:-6s]",
  "right-[27%] top-[7%] hidden h-5 w-5 opacity-70 blur-[1px] sm:block [--duracion:11s] [--retraso:-1s]",
  "right-[29%] bottom-[5%] hidden h-7 w-7 opacity-70 sm:block [--duracion:14s] [--retraso:-8s]",
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

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {BURBUJAS_SUELTAS.map((clases) => (
          <span key={clases} className={`gota-agua burbuja-deriva absolute ${clases}`} />
        ))}
      </div>

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
