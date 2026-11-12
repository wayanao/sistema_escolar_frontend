// Contratos puros de «Pagan siempre a tiempo» y «Los que mejor pagan» (panel
// del admin), a partir de `GET /cartera/puntualidad`. Qué cuenta como «a
// tiempo», quién entra al ranking y el orden los decide el backend
// (`app/services/puntualidad.py`); aquí solo se normaliza y se arma el texto.
import { capitalizarNombreVisible } from "../nombres";
import { inicialesDe } from "./admin";

export const MENSAJE_ERROR_PUNTUALIDAD = "No se pudo cargar quién paga a tiempo.";

// Cuántos cursos se ven antes de «Ver los N cursos».
export const CURSOS_PUNTUALES_VISIBLES = 5;

const numero = (valor) => {
    const convertido = Number(valor);
    return Number.isFinite(convertido) ? convertido : 0;
};

const lista = (valor) => (Array.isArray(valor) ? valor : []);

// El porcentaje sin decimales. Nunca dice 100 % si alguien se atrasó ni 0 %
// si al menos uno paga siempre a tiempo.
export const porcentajeVisible = (parte, total) => {
    if (!(total > 0)) return 0;
    const redondeado = Math.round((100 * parte) / total);
    if (parte > 0 && redondeado === 0) return 1;
    if (parte < total && redondeado === 100) return 99;
    return redondeado;
};

const estudiantePuntual = (item, indice) => {
    const dias = item?.dias_antes_promedio;
    return {
        estudianteId: item?.estudiante_id ?? `estudiante-${indice}`,
        puesto: indice + 1,
        nombre: capitalizarNombreVisible(`${item?.nombre || ""} ${item?.apellido || ""}`) || "Estudiante",
        iniciales: inicialesDe(item?.nombre, item?.apellido),
        curso: item?.curso_nombre || "Sin curso",
        cuotasVencidas: numero(item?.cuotas_vencidas),
        cuotasATiempo: numero(item?.cuotas_a_tiempo),
        diasAntes: dias === null || dias === undefined || !Number.isFinite(Number(dias)) ? null : Number(dias),
        siempreATiempo: Boolean(item?.siempre_a_tiempo),
    };
};

// La respuesta del backend, con valores seguros aunque falte algo.
export const normalizarPuntualidad = (data) => ({
    totalEstudiantes: numero(data?.total_estudiantes),
    siempreATiempo: numero(data?.siempre_a_tiempo),
    mejores: lista(data?.mejores).map(estudiantePuntual),
    cursos: lista(data?.cursos).map((curso, indice) => {
        const estudiantes = numero(curso?.estudiantes);
        const siempre = numero(curso?.siempre_a_tiempo);
        return {
            cursoId: curso?.curso_id ?? `curso-${indice}`,
            puesto: indice + 1,
            nombre: curso?.curso_nombre || "Sin curso",
            estudiantes,
            siempreATiempo: siempre,
            porcentaje: porcentajeVisible(siempre, estudiantes),
            mejores: lista(curso?.mejores).map(estudiantePuntual),
        };
    }),
});

const plural = (cantidad, singular, varios) => (cantidad === 1 ? singular : varios);

// Lo que sigue a «142 de 286» en el anillo. Sin verbo, sirve igual para 0, 1
// o muchos.
export const textoSinAtrasos = (total) =>
    `${plural(total, "estudiante", "estudiantes")} sin atrasarse ni un mes este año.`;

// «12 de 20 pagan siempre a tiempo», en la fila de cada curso.
export const textoCursoPuntual = (curso) =>
    `${curso.siempreATiempo} de ${curso.estudiantes} ${plural(curso.siempreATiempo, "paga", "pagan")} siempre a tiempo`;

// Cuántos días antes del límite suele pagar (promedio de sus cuotas a tiempo;
// negativo = en los días de gracia).
export const textoCostumbreDePago = (diasAntes) => {
    if (diasAntes === null || diasAntes === undefined) return "";
    const dias = Math.round(diasAntes);
    if (dias >= 30) return "Suele adelantar sus pagos";
    if (dias >= 1) return `Suele pagar ${dias} ${plural(dias, "día", "días")} antes`;
    if (dias === 0) return "Suele pagar el día límite";
    return "Suele pagar en los días de gracia";
};

// La línea de cada estudiante del ranking. Nadie del ranking debe, así que
// las cuotas que no pagó a tiempo las pagó tarde.
export const detallePuntual = (estudiante) => {
    if (estudiante.siempreATiempo) return textoCostumbreDePago(estudiante.diasAntes);
    const tarde = Math.max(0, estudiante.cuotasVencidas - estudiante.cuotasATiempo);
    return `Pagó tarde ${tarde} ${plural(tarde, "cuota", "cuotas")}`;
};

// «10 de 10»: sus cuotas vencidas pagadas a tiempo.
export const textoCuotasATiempo = (estudiante) =>
    `${estudiante.cuotasATiempo} de ${estudiante.cuotasVencidas}`;

// La frase bajo un ranking (del colegio o de un curso): cuántos más pagan
// siempre a tiempo fuera de la lista, o que los de la lista no son todos
// puntuales. `siempreATiempo` es el total del colegio o del curso.
export const textoDespuesDelRanking = (siempreATiempo, mejores) => {
    const enLista = mejores.length;
    if (!enLista) return "";
    const puntualesEnLista = mejores.filter((estudiante) => estudiante.siempreATiempo).length;
    if (siempreATiempo > puntualesEnLista) {
        const mas = siempreATiempo - puntualesEnLista;
        return `Y ${mas} ${plural(mas, "más paga", "más pagan")} siempre a tiempo.`;
    }
    if (siempreATiempo === enLista) {
        return enLista === 1 ? "Nadie más paga siempre a tiempo." : "Son todos los que pagan siempre a tiempo.";
    }
    if (siempreATiempo > 0) {
        return `Solo ${siempreATiempo} ${plural(siempreATiempo, "paga", "pagan")} siempre a tiempo; los demás de la lista se atrasaron alguna vez.`;
    }
    return "Nadie paga siempre a tiempo; estos son los que menos se atrasan.";
};
