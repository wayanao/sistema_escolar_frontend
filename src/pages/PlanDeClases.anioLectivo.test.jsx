import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Año lectivo, fase 7, paso 7.4: "Usar un plan del año pasado" en la página
// completa, con las peticiones reales simuladas. El botón aparece solo al
// crear un plan y si el backend trae planes; elegir uno llena solo el texto y
// el plan se guarda por el POST de siempre, como uno nuevo.

const { apiMock, swalFireMock } = vi.hoisted(() => ({
  apiMock: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
  swalFireMock: vi.fn(),
}));

vi.mock('../utils/api', () => ({
  default: apiMock,
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: swalFireMock,
  },
}));

vi.mock('../hooks/planeaciones/useImagenProtegida', () => ({
  useImagenProtegida: () => ({
    url: '',
    cargando: false,
    error: '',
  }),
}));

import PlanDeClases from './PlanDeClases';

const ASIGNACION_ID = 200;
const BOTON = { name: 'Usar un plan del año pasado' };
const URL_LISTA = `/plan-de-clases/${ASIGNACION_ID}/anio-anterior`;
const PLANES_2026 = [
  { id: 1, fecha: '2026-02-10', periodo: 1, unidad: 'Números', tema: 'Conteo' },
  { id: 3, fecha: '2026-03-03', periodo: 1, unidad: 'Sumas', tema: 'Sumar' },
];
const TEXTO_PLAN_1 = {
  id: 1,
  unidad: 'Números',
  proposito: 'Contar',
  clase: 'Conteo con fichas',
  estandar: 'E1',
  dba: 'D1',
  competencias: 'C1',
  actividad_casa: 'Contar en casa',
  tema: 'Conteo',
};

function prepararApi({ planActual = null, planes = PLANES_2026 } = {}) {
  apiMock.get.mockImplementation((url, config = {}) => {
    if (url === '/mis-clases/8') {
      return Promise.resolve({
        data: [{ id: ASIGNACION_ID, materia: 'MATEMÁTICAS', curso: 'PRIMERO A', jornada: 'Mañana' }],
      });
    }
    if (url === `/plan-de-clases/${ASIGNACION_ID}` && config.params?.fecha) {
      return Promise.resolve({ data: planActual });
    }
    if (url === `/plan-de-clases/${ASIGNACION_ID}`) {
      return Promise.resolve({ data: [] });
    }
    if (url === URL_LISTA) {
      return Promise.resolve({ data: planes });
    }
    if (url === `${URL_LISTA}/1`) {
      return Promise.resolve({ data: TEXTO_PLAN_1 });
    }
    // Nombres de los cuadros (NOMBRES_CUADROS_PLAN.md): el colegio no
    // renombró ninguno.
    if (url === '/plan-de-clases/cuadros') {
      return Promise.resolve({ data: { cuadros: [] } });
    }

    return Promise.reject(new Error(`Consulta no simulada: ${url}`));
  });
}

const llamadasA = (url) => apiMock.get.mock.calls.filter(([llamada]) => llamada === url);

async function abrirPlaneador() {
  render(
    <MemoryRouter initialEntries={['/plan-de-clases?fecha=2027-02-15']}>
      <PlanDeClases />
    </MemoryRouter>,
  );
  return screen.findByPlaceholderText('Tema central de la clase');
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('profesor', JSON.stringify({ id: 8, nombre: 'Docente' }));
  localStorage.setItem('asignacionId', String(ASIGNACION_ID));
  localStorage.setItem('periodo', '1');
  swalFireMock.mockResolvedValue({ isConfirmed: true });
  window.alert = vi.fn();
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  window.requestAnimationFrame = vi.fn((callback) => {
    callback();
    return 1;
  });
  window.scrollTo = vi.fn();
});

describe('PlanDeClases: usar un plan del año pasado', () => {
  it('al crear un plan, con planes del año pasado, ofrece el botón', async () => {
    prepararApi();
    await abrirPlaneador();

    expect(await screen.findByRole('button', BOTON)).toBeInTheDocument();
    expect(llamadasA(URL_LISTA)).toHaveLength(1);
  });

  it('elegir uno llena solo el texto y se guarda como un plan nuevo de esta fecha', async () => {
    prepararApi();
    apiMock.post.mockResolvedValue({ data: { id: 95, mensaje: 'Plan guardado.' } });
    const user = userEvent.setup();
    const tema = await abrirPlaneador();

    await user.click(await screen.findByRole('button', BOTON));
    const seccion = screen.getByRole('region', { name: 'Planes del año pasado' });
    const lista = within(seccion).getByRole('list');
    expect(within(lista).getAllByRole('listitem')).toHaveLength(2);
    await user.click(within(lista).getAllByRole('button', { name: /Usar el plan del/ })[0]);

    await waitFor(() => expect(tema).toHaveValue('Conteo'));
    expect(screen.getByPlaceholderText('Nombre de la unidad o eje de trabajo')).toHaveValue('Números');
    expect(await screen.findByText(/Se llenó el formulario con el plan del/)).toBeInTheDocument();
    expect(within(seccion).queryByRole('list')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    const [url, formData] = apiMock.post.mock.calls[0];
    expect(url).toBe('/plan-de-clases');
    expect(formData.get('asignacion_id')).toBe(String(ASIGNACION_ID));
    expect(formData.get('version_esperada')).toBe('0');
    expect(formData.get('fecha')).toBe('2027-02-15');
    expect(formData.get('periodo')).toBe('1');
    expect(formData.get('unidad')).toBe('Números');
    expect(formData.get('clase')).toBe('Conteo con fichas');
    expect(formData.get('actividad_casa')).toBe('Contar en casa');
    expect(formData.has('imagen1')).toBe(false);
    expect(formData.has('imagen2')).toBe(false);
  });

  it('con lo escrito sin guardar, pregunta antes de reemplazarlo', async () => {
    prepararApi();
    swalFireMock.mockResolvedValue({ isConfirmed: false });
    const user = userEvent.setup();
    const tema = await abrirPlaneador();
    await user.type(tema, 'Mi tema');

    await user.click(await screen.findByRole('button', BOTON));
    await user.click(screen.getAllByRole('button', { name: /Usar el plan del/ })[0]);

    await waitFor(() => {
      expect(swalFireMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: '¿Reemplazar lo que escribiste?' }),
      );
    });
    expect(tema).toHaveValue('Mi tema');
    expect(llamadasA(`${URL_LISTA}/1`)).toHaveLength(0);
  });

  it('si la fecha ya tiene un plan, no ofrece nada ni pregunta', async () => {
    prepararApi({
      planActual: {
        id: 91,
        asignacion_id: ASIGNACION_ID,
        periodo: 1,
        unidad: 'Repaso',
        tema: 'Repasar',
        fecha: '2027-02-15',
        estado_revision: 'pendiente',
        version_revision: 1,
      },
    });
    const tema = await abrirPlaneador();
    await waitFor(() => expect(tema).toHaveValue('Repasar'));

    expect(screen.queryByRole('button', BOTON)).not.toBeInTheDocument();
    expect(llamadasA(URL_LISTA)).toHaveLength(0);
  });

  it('sin planes del año pasado no hay botón y no vuelve a preguntar en otra visita', async () => {
    prepararApi({ planes: [] });
    const primera = await abrirPlaneador();
    await waitFor(() => expect(llamadasA(URL_LISTA)).toHaveLength(1));
    expect(primera).toBeInTheDocument();
    expect(screen.queryByRole('button', BOTON)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem(`plan_clases_sin_anio_anterior_8_${ASIGNACION_ID}`)).toBe('1');
    });
  });

  it('en una visita nueva, con la clase anotada sin planes, no pregunta', async () => {
    prepararApi();
    localStorage.setItem(`plan_clases_sin_anio_anterior_8_${ASIGNACION_ID}`, '1');
    await abrirPlaneador();

    await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith(
      `/plan-de-clases/${ASIGNACION_ID}`,
      expect.anything(),
    ));
    expect(llamadasA(URL_LISTA)).toHaveLength(0);
    expect(screen.queryByRole('button', BOTON)).not.toBeInTheDocument();
  });
});
