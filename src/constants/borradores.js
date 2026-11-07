/**
 * Borradores que la app guarda en el navegador mientras alguien escribe, para
 * que no se pierda lo que todavía no guardó si sale de la pantalla.
 *
 * Contienen texto de estudiantes, así que "Cerrar sesión" los borra todos (en
 * un computador compartido, el siguiente no debe encontrarlos). Un 401 no los
 * borra: si la sesión venció a mitad de escribir, al volver a entrar siguen ahí.
 */
export const PREFIJO_BORRADOR_BOLETIN = "borrador_boletin:";

export const PREFIJOS_BORRADORES = Object.freeze([PREFIJO_BORRADOR_BOLETIN]);
