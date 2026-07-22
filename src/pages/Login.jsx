import LoginForm from "../components/LoginForm";
import auligoLogoNav from "../assets/auligo-logo-nav.png";
import fondoLogin from "../assets/login-auligo-original.jpg";

function Login() {
  return (
    <main
      className="notranslate relative min-h-[100svh] overflow-hidden bg-slate-950"
      translate="no"
    >
      <img
        src={fondoLogin}
        alt="Comunidad educativa reunida en una celebración escolar"
        className="absolute inset-0 h-full w-full scale-[1.035] object-cover object-center brightness-[0.76] contrast-[1.08] saturate-[0.86] blur-[1.2px]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-purple-950/95 via-purple-950/72 to-slate-950/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/25" />
      <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-lime-400/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-[100svh] w-full max-w-[1440px] items-center gap-10 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[1fr_500px] lg:gap-16 lg:px-10 xl:px-16">
        <section className="hidden max-w-2xl text-white lg:block">
          <img
            src={auligoLogoNav}
            alt="Auligo"
            className="nav-brand-logo h-16 w-auto object-contain xl:h-[72px]"
          />

          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-purple-50 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.85)]" />
            Gestión escolar en un solo lugar
          </div>

          <h1 className="mt-7 max-w-xl text-5xl font-black leading-[1.06] tracking-tight text-white xl:text-6xl">
            Tu aula,
            <span className="block text-purple-100">tu camino,</span>
            <span className="block text-lime-300">tu futuro.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-100/90 xl:text-lg">
            Una experiencia clara y segura para conectar la gestión académica,
            los docentes y cada proceso de tu institución.
          </p>
        </section>

        <section className="relative isolate mx-auto w-full max-w-[500px] overflow-hidden rounded-[30px] border border-white/60 bg-white/70 p-5 shadow-[0_30px_90px_rgba(15,5,35,0.38),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/25 backdrop-blur-2xl backdrop-saturate-150 sm:p-7 lg:justify-self-end lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/80 via-white/50 to-purple-100/30" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-purple-300/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="relative">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
