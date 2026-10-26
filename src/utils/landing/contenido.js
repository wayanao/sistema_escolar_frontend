// Textos de la landing pública. Solo prometen lo que el sistema ya hace: no hay
// portal de padres ni app que se descargue, y `contenido.test.js` lo vigila.
// Tampoco hay contacto todavía: el canal (WhatsApp) se agregará cuando el
// usuario lo decida.

export const SECCIONES_LANDING = [
    { id: "funciones", etiqueta: "Funciones" },
    { id: "un-dia", etiqueta: "Un día con Auligo" },
    { id: "como-empezar", etiqueta: "Cómo empezar" },
    { id: "preguntas", etiqueta: "Preguntas" },
];

export const PORTADA = {
    insignia: "Gestión escolar en un solo lugar",
    titulo: "Todo tu colegio,",
    tituloResaltado: "en un solo lugar.",
    texto:
        "Notas, boletines, asistencia, observador, planeación y cartera conectados. Menos papel, menos Excel y más tiempo para enseñar.",
    garantias: ["Nada que instalar", "Funciona en el celular", "Cada colegio con su información aparte"],
};

// La ventana de la portada imita la planilla con datos inventados: ningún
// estudiante real. Las definitivas cuadran con los porcentajes (30, 30 y 40) y
// el redondeo a una cifra, y la prueba lo comprueba.
export const PLANILLA_DEMO = {
    curso: "9°A · Matemáticas",
    actividades: [
        { nombre: "Taller", porcentaje: 30 },
        { nombre: "Quiz", porcentaje: 30 },
        { nombre: "Examen", porcentaje: 40 },
    ],
    filas: [
        { estudiante: "Valentina Ríos", notas: [4.8, 4.5, 4.6], definitiva: 4.6 },
        { estudiante: "Samuel Torres", notas: [3.9, 4.2, 3.5], definitiva: 3.8 },
        { estudiante: "Mariana Gómez", notas: [4.5, 4.0, 4.8], definitiva: 4.5 },
        { estudiante: "Juan E. Ruiz", notas: [3.0, 2.8, 3.4], definitiva: 3.1 },
        { estudiante: "Sara Castillo", notas: [2.5, 3.2, 2.6], definitiva: 2.8 },
    ],
};

// Escala de 1 a 5: desde 4,0 es alto, desde 3,0 aprueba y por debajo es bajo.
export const nivelNota = (nota) => {
    if (nota >= 4) return "alto";
    if (nota >= 3) return "basico";
    return "bajo";
};

// Las notas se muestran con coma decimal, como en Colombia.
export const formatearNota = (nota) => nota.toFixed(1).replace(".", ",");

export const MODULOS_CINTA = [
    "Planilla de notas",
    "Boletines",
    "Asistencia",
    "Observador",
    "Plan de clases",
    "Malla curricular",
    "Cartera",
    "Pagos",
    "Certificados",
    "Admisiones",
    "Horarios",
    "Nómina",
    "Inventario",
    "Punto de venta",
    "Reportes",
];

export const PROBLEMAS = [
    {
        icono: "boletin",
        titulo: "Boletines en minutos, no en semanas",
        texto: "Las notas del periodo se convierten en boletines listos para imprimir, con el diseño de tu colegio.",
    },
    {
        icono: "cartera",
        titulo: "La cartera, al día",
        texto: "Pagos, cartera vencida y certificados en el mismo lugar, sin perseguir recibos.",
    },
    {
        icono: "tabla",
        titulo: "Adiós al Excel suelto",
        texto: "Planilla, asistencia y observador conectados: cada dato se escribe una sola vez.",
    },
    {
        icono: "estudiante",
        titulo: "Cada estudiante, completo",
        texto: "Notas, asistencia y seguimiento de cada estudiante, sin buscar en cinco archivos.",
    },
];

export const UN_DIA = [
    {
        momento: "7:00 a. m.",
        titulo: "Asistencia",
        texto: "El profesor toma lista en segundos, desde el computador o el celular.",
    },
    {
        momento: "10:00 a. m.",
        titulo: "Notas",
        texto: "Califica por actividades en la planilla y la nota del periodo se calcula sola.",
    },
    {
        momento: "Cada día",
        titulo: "Observador",
        texto: "El seguimiento de cada estudiante queda registrado y a la mano.",
    },
    {
        momento: "Fin de periodo",
        titulo: "Boletines",
        texto: "Salen listos para imprimir, con el escudo y las firmas de tu colegio.",
    },
    {
        momento: "Fin de mes",
        titulo: "Cartera",
        texto: "Rectoría ve quién está al día y quién debe, sin revisar recibo por recibo.",
    },
];

export const ROLES = [
    {
        id: "rectoria",
        etiqueta: "Rectoría y administración",
        resumen: "Todo el colegio a la vista: lo académico y lo financiero en un mismo lugar.",
        funciones: [
            { titulo: "Boletines y certificados", texto: "Con el diseño, el escudo y las firmas de tu institución." },
            { titulo: "Pagos y cartera", texto: "Registra pagos, define los cobros y sigue la cartera vencida." },
            { titulo: "Admisiones y matrículas", texto: "Recibe aspirantes y matricúlalos en el año lectivo." },
            { titulo: "Cursos y horarios", texto: "Organiza cursos, materias, profesores y horarios." },
            { titulo: "Nómina y gastos", texto: "Lleva la nómina, los egresos y los préstamos." },
            { titulo: "Inventario y ventas", texto: "Controla el inventario y registra cada venta." },
            { titulo: "Reportes", texto: "Reportes financieros para decidir con datos." },
            { titulo: "Años lectivos", texto: "Prepara el año siguiente sin perder la historia." },
        ],
    },
    {
        id: "profesores",
        etiqueta: "Profesores",
        resumen: "Menos papeleo y más tiempo en el aula, desde el computador o el celular.",
        funciones: [
            { titulo: "Planilla de notas", texto: "Por actividades y porcentajes; la nota del periodo se calcula sola." },
            { titulo: "Asistencia", texto: "Toma lista por clase en segundos." },
            { titulo: "Observador", texto: "Registra el seguimiento de cada estudiante." },
            { titulo: "Plan de clases", texto: "Planea tus clases y tenlas a la mano para presentarlas." },
            { titulo: "Malla curricular", texto: "Organiza la planeación del año por periodos." },
            { titulo: "Boletín final", texto: "Ingresa las valoraciones de tus cursos." },
            { titulo: "Rendimiento", texto: "Ve quién necesita apoyo y quién se destaca." },
            { titulo: "Tu panel", texto: "Tu horario, tus clases y los cumpleaños de tus estudiantes." },
        ],
    },
];

export const CONFIANZA = [
    {
        icono: "candado",
        titulo: "Cada colegio, su información aparte",
        texto: "Los datos de tu colegio están separados de los de las demás instituciones.",
    },
    {
        icono: "personas",
        titulo: "Cada quien ve lo suyo",
        texto: "Rectoría, administración y profesores entran con su usuario y ven solo lo que les corresponde.",
    },
    {
        icono: "navegador",
        titulo: "Nada que instalar",
        texto: "Funciona en el navegador, en el computador o en el celular.",
    },
];

export const PASOS = [
    {
        titulo: "Conocemos tu colegio",
        texto: "Te mostramos Auligo y vemos juntos cómo trabaja tu institución.",
    },
    {
        titulo: "Lo configuramos contigo",
        texto: "Cargamos cursos, profesores y estudiantes para que empiecen con todo listo.",
    },
    {
        titulo: "Tu equipo arranca",
        texto: "Capacitamos a rectoría y profesores, y empiezan a trabajar.",
    },
];

export const PREGUNTAS = [
    {
        pregunta: "¿Hay que instalar algo?",
        respuesta: "No. Auligo funciona en el navegador, desde el computador o el celular.",
    },
    {
        pregunta: "¿Quién puede ver la información?",
        respuesta:
            "Cada persona entra con su usuario y ve solo lo que le corresponde. Además, la información de cada colegio está separada de la de los demás.",
    },
    {
        pregunta: "¿Funciona en el celular?",
        respuesta:
            "Sí. Se adapta a la pantalla, así que los profesores pueden tomar asistencia o revisar su horario desde el celular.",
    },
    {
        pregunta: "¿Los boletines salen con el diseño de mi colegio?",
        respuesta: "Sí. Los boletines y certificados llevan el escudo, los datos y las firmas de tu institución.",
    },
    {
        pregunta: "¿Cómo pasamos la información que ya tenemos?",
        respuesta:
            "Al empezar, configuramos contigo cursos, profesores y estudiantes para que arranquen con todo listo.",
    },
];
