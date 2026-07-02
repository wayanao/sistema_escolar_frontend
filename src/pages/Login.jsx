import LoginForm from "../components/LoginForm";
import fondoLogin from "../assets/fondologin.jpg";

function Login() {
    return (
        <div className="notranslate min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8" translate="no">
            <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center">
                <div className="grid w-full overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
                    <section className="relative min-h-[280px] overflow-hidden bg-slate-900 lg:min-h-[720px]">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${fondoLogin})` }}
                            aria-hidden="true"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/45 to-purple-950/65" />
                        <div className="relative flex h-full min-h-[280px] flex-col justify-between p-6 text-white sm:p-8 lg:min-h-[720px] lg:p-10">
                            <div className="w-max rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
                                Scholarix
                            </div>

                            <div className="max-w-xl">
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-100">
                                    Gestion academica inteligente
                                </p>
                                <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                                    Organizando el futuro academico.
                                </h1>
                                <p className="mt-5 max-w-lg text-base leading-7 text-slate-100 sm:text-lg">
                                    Administra clases, estudiantes, pagos, reportes y procesos docentes desde un entorno claro, moderno y seguro.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="flex items-center justify-center bg-slate-50 px-5 py-8 sm:px-8 lg:px-12">
                        <LoginForm />
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Login;


