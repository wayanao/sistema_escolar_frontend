export const normalizarLista = (response) => (Array.isArray(response) ? response : response?.items || []);
