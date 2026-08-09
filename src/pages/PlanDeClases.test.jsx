import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const ASIGNACION_ID = 44;
const CLASE_ASIGNADA = {
  id: ASIGNACION_ID,
  materia: 'Matemáticas',
  curso: '5A',
  jornada: 'Mañana',
};

function crearPlanGuardado(overrides = {}) {
  return {
    id: 91,
    asignacion_id: ASIGNACION_ID,
    periodo: 1,
    unidad: 'Números',
    proposito: 'Resolver situaciones',
    clase: 'Apertura y desarrollo',
    estandar: 'Pensamiento numérico',
    dba: 'Compara cantidades',
    competencias: 'Trabajo individual',
    actividad_casa: 'Ejercicios',
    tema: 'Fracciones',
    fecha: '2026-07-25',
    imagen1: null,
    imagen2: null,
    estado_revision: 'revisado',
    version_revision: 2,
    total_observaciones: 0,
    observaciones_no_vistas: 0,
    ...overrides,
  };
}

function prepararApi(planActual = null) {
  apiMock.get.mockImplementation((url, config = {}) => {
    if (url === '/mis-clases/7') {
      return Promise.resolve({ data: [CLASE_ASIGNADA] });
    }

    if (url === `/plan-de-clases/${ASIGNACION_ID}` && config.params?.fecha) {
      return Promise.resolve({ data: planActual });
    }

    if (url === `/plan-de-clases/${ASIGNACION_ID}`) {
      return Promise.resolve({ data: [] });
    }

    return Promise.reject(new Error(`Consulta no simulada: ${url}`));
  });
  apiMock.patch.mockResolvedValue({ data: {} });
  apiMock.delete.mockResolvedValue({ data: {} });
}

async function abrirPlaneador() {
  render(
    <MemoryRouter initialEntries={['/plan-de-clases']}>
      <PlanDeClases />
    </MemoryRouter>,
  );

  return screen.findByPlaceholderText('Tema central de la clase');
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('profesor', JSON.stringify({ id: 7, nombre: 'Docente' }));
  localStorage.setItem('asignacionId', String(ASIGNACION_ID));
  localStorage.setItem('periodo', '1');

  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: true,
  });
  window.alert = vi.fn();
  window.confirm = vi.fn();
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

describe('guardado del plan de clases del profesor', () => {
  it('envía versión cero cuando crea un plan nuevo', async () => {
    prepararApi();
    apiMock.post.mockResolvedValue({
      data: {
        id: 92,
        mensaje: 'Plan guardado desde la prueba.',
      },
    });
    const user = userEvent.setup();

    await abrirPlaneador();
    await user.click(screen.getByRole('button', { name: 'Guardar y enviar' }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    const [url, formData] = apiMock.post.mock.calls[0];
    expect(url).toBe('/plan-de-clases');
    expect(formData.get('asignacion_id')).toBe(String(ASIGNACION_ID));
    expect(formData.get('version_esperada')).toBe('0');
    expect(await screen.findByText('Plan guardado desde la prueba.')).toBeInTheDocument();
  });

  it('conserva los cambios locales cuando otra pestaña guardó primero', async () => {
    prepararApi(crearPlanGuardado());
    apiMock.post.mockRejectedValue({
      response: {
        status: 409,
        data: {
          detail: {
            mensaje: 'El plan fue actualizado en otra pestaña.',
            version_actual: 3,
          },
        },
      },
    });
    swalFireMock.mockResolvedValue({ isConfirmed: false });
    const user = userEvent.setup();

    const tema = await abrirPlaneador();
    await user.clear(tema);
    await user.type(tema, 'Fracciones equivalentes editadas');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(swalFireMock).toHaveBeenCalledTimes(1));
    const [, formData] = apiMock.post.mock.calls[0];
    expect(formData.get('version_esperada')).toBe('2');
    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Este plan cambió en otra pestaña',
        confirmButtonText: 'Cargar versión reciente',
      }),
    );
    expect(tema).toHaveValue('Fracciones equivalentes editadas');
    expect(
      await screen.findByText('Tus cambios siguen visibles, pero todavía no se han guardado.'),
    ).toBeInTheDocument();
  });

  it('avisa que no hay internet sin limpiar el formulario', async () => {
    prepararApi();
    apiMock.post.mockRejectedValue({
      code: 'ERR_NETWORK',
      request: {},
    });
    swalFireMock.mockResolvedValue({ isConfirmed: false });
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    const user = userEvent.setup();

    const tema = await abrirPlaneador();
    await user.type(tema, 'Geometría conservada sin conexión');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(swalFireMock).toHaveBeenCalledTimes(1));
    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sin conexión a internet',
        confirmButtonText: 'Intentar de nuevo',
        cancelButtonText: 'Seguir editando',
      }),
    );
    expect(tema).toHaveValue('Geometría conservada sin conexión');
    expect(
      await screen.findByText('El plan sigue sin guardar. Tus cambios continúan en pantalla.'),
    ).toBeInTheDocument();
  });

  it('repite el mismo guardado cuando el profesor elige intentar de nuevo', async () => {
    prepararApi();
    apiMock.post
      .mockRejectedValueOnce({
        code: 'ERR_NETWORK',
        request: {},
      })
      .mockResolvedValueOnce({
        data: {
          id: 93,
          mensaje: 'Plan guardado después de reconectar.',
        },
      });
    swalFireMock.mockResolvedValue({ isConfirmed: true });
    const user = userEvent.setup();

    await abrirPlaneador();
    await user.click(screen.getByRole('button', { name: 'Guardar y enviar' }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(2));
    const primerEnvio = apiMock.post.mock.calls[0][1];
    const segundoEnvio = apiMock.post.mock.calls[1][1];
    expect(primerEnvio.get('version_esperada')).toBe('0');
    expect(segundoEnvio.get('version_esperada')).toBe('0');
    expect(await screen.findByText('Plan guardado después de reconectar.')).toBeInTheDocument();
  });
});
