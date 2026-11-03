import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroCar3D } from '../HeroCar3D';

function mockMatchMedia(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      media: '',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  );
}

describe('HeroCar3D', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('usa el SVG como fallback cuando no hay WebGL', async () => {
    mockMatchMedia(true);
    const { container } = render(<HeroCar3D minWidth={1280} variant="catalogo" />);

    await waitFor(() => {
      expect(container.querySelector('img[src="/images/hero-car.svg"]')).toBeInTheDocument();
    });
  });

  it('no monta nada cuando el viewport no alcanza el breakpoint', () => {
    mockMatchMedia(false);
    const { container } = render(<HeroCar3D minWidth={1280} variant="catalogo" />);

    expect(container).toBeEmptyDOMElement();
  });
});
