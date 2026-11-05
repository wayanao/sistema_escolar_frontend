import { Link } from "react-router-dom";
// Logo claro: va sobre el fondo morado.
import auligoLogoNav from "../assets/auligo-logo-nav.png";
import IlustracionAulaLogin from "../components/autenticacion/IlustracionAulaLogin";
import LoginFormView from "../components/autenticacion/LoginFormView";
import { useComandoLogin } from "../hooks/autenticacion/useComandoLogin";
import useFuentesLogin from "../hooks/autenticacion/useFuentesLogin";
import { RUTAS_SESION } from "../utils/autenticacion/sesion";

// Diseño del usuario (2026-11-05), con sus ajustes del mismo día. Todo el fondo
// es morado con puntos. Desde 1024 px (computador y tablet acostada) la página
// es una cuadrícula: arriba el logo y "Volver al inicio"; en medio el aula y el
// formulario, centrados en la pantalla, con el formulario centrado en la altura
// del aula; abajo el lema. El aula crece hasta 880 px, hasta donde la deja el
// alto de la pantalla (720 × 600, es decir 1,2; 220 px para orillas, logo y
// lema) o hasta donde cabe junto al formulario (370 px, más la separación y
// las orillas: 48 y 64 hasta 1279 px, para que en la tablet acostada el aula
// no quede pequeña; 80 y 96 desde 1280). Más angosto (celular y tablet
// vertical) todo va en una columna, sin el dibujo, y el formulario queda
// enseguida del logo y el lema: con el dibujo encima, en la tablet vertical
// quedaba abajo. En la tablet vertical el formulario se agranda un 25 %
// (`zoom`) y queda centrado en el espacio que sobra: a 370 px se veía muy
// pequeño (pedido del usuario).
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
      className="notranslate login-fuente login-panel grid min-h-[100svh] grid-cols-1 content-start overflow-hidden px-6 pb-10 pt-5 text-white md:grid-rows-[auto_auto_auto_1fr] md:content-stretch md:px-12 md:pt-8 lg:grid-cols-[min(880px,calc((100svh-220px)*1.2),calc(100vw-482px))_370px] lg:grid-rows-[auto_1fr_auto] lg:justify-center lg:gap-x-12 lg:gap-y-6 lg:px-8 lg:py-10 xl:grid-cols-[min(880px,calc((100svh-220px)*1.2),calc(100vw-546px))_370px] xl:gap-x-20 xl:px-12"
      translate="no"
    >
      <img
        src={auligoLogoNav}
        alt="Auligo"
        className="block h-8 w-auto justify-self-start md:h-10 lg:col-start-1 lg:row-start-1 lg:self-center"
      />

      <p
        className="login-titulo login-entrada m-0 mt-3 text-2xl font-extrabold leading-[1.05] md:text-[34px] lg:col-start-1 lg:row-start-3 lg:mt-0 lg:text-[40px]"
        style={{ animationDelay: "300ms" }}
      >
        Tu aula, tu camino, <span className="text-[#bef264]">tu futuro.</span>
      </p>

      <Link
        to={RUTAS_SESION.PORTADA}
        className="mt-6 inline-flex min-h-[44px] items-center gap-2 justify-self-start rounded-lg text-[15px] font-extrabold text-purple-100 no-underline transition hover:text-white focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#bef264] lg:col-start-2 lg:row-start-1 lg:mt-0"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Volver al inicio
      </Link>

      <div className="hidden items-center lg:col-start-1 lg:row-start-2 lg:flex">
        <IlustracionAulaLogin />
      </div>

      <main className="mt-10 flex justify-center md:self-center md:py-10 lg:col-start-2 lg:row-start-2 lg:mt-0 lg:py-0">
        <div className="relative isolate w-full max-w-[370px] md:max-lg:[zoom:1.25]">
          {/* Luces detrás de la tarjeta: el vidrio necesita color detrás para
              notarse. Lo que se salga lo recorta la página (`overflow-hidden`). */}
          <span aria-hidden="true" className="pointer-events-none absolute -left-16 -top-10 -z-20 h-64 w-64 rounded-full bg-[#bef264]/25 blur-3xl" />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-12 -right-16 -z-20 h-64 w-64 rounded-full bg-pink-400/30 blur-3xl" />

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

          {/* Debajo de la burbuja y fuera del flujo: así no corre el centrado
              del formulario en la altura del aula. */}
          <p className="absolute inset-x-0 top-full m-0 mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-purple-100/75">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bef264" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Acceso solo para personal autorizado
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;
