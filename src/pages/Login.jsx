import { Link } from "react-router-dom";
// Logo claro: va sobre el panel morado.
import auligoLogoNav from "../assets/auligo-logo-nav.png";
import IlustracionAulaLogin from "../components/autenticacion/IlustracionAulaLogin";
import LoginFormView from "../components/autenticacion/LoginFormView";
import { useComandoLogin } from "../hooks/autenticacion/useComandoLogin";
import useFuentesLogin from "../hooks/autenticacion/useFuentesLogin";
import { RUTAS_SESION } from "../utils/autenticacion/sesion";

// Diseño del usuario (2026-11-05): panel morado con el dibujo del aula a la
// izquierda y el formulario a la derecha, desde 1024 px (computador y tablet
// acostada). Más angosto (celular y tablet vertical) el panel es solo una
// franja con el logo y el lema, y el formulario queda enseguida sin tener que
// bajar: con el dibujo encima, en la tablet vertical quedaba abajo.
function Login() {
  useFuentesLogin();
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
    <div
      className="notranslate login-fuente flex min-h-[100svh] flex-col bg-[#f3edfc] text-[#1e1530] lg:flex-row"
      translate="no"
    >
      <section
        aria-label="Bienvenida"
        className="login-panel flex min-w-0 flex-col gap-3 px-6 py-5 text-white md:px-12 lg:flex-[1_1_560px] lg:gap-6 lg:py-10"
      >
        <img src={auligoLogoNav} alt="Auligo" className="block h-8 w-auto self-start lg:h-10" />

        <div className="hidden flex-auto items-center justify-center lg:flex">
          <IlustracionAulaLogin />
        </div>

        <p
          className="login-titulo login-entrada m-0 text-2xl font-extrabold leading-[1.05] lg:text-[40px]"
          style={{ animationDelay: "300ms" }}
        >
          Tu aula, tu camino, <span className="text-[#bef264]">tu futuro.</span>
        </p>
      </section>

      <main className="flex min-w-0 flex-1 flex-col px-6 py-6 md:px-12 lg:flex-[999_1_480px] lg:px-6 lg:py-10">
        <Link
          to={RUTAS_SESION.PORTADA}
          className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-lg text-[15px] font-extrabold text-[#562897] no-underline transition hover:text-[#36195f] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#562897]"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Volver al inicio
        </Link>

        <div className="flex flex-auto items-center justify-center py-4 md:py-6">
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
      </main>
    </div>
  );
}

export default Login;
