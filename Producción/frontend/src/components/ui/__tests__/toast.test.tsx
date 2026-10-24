import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ToastProvider, useToast } from '../toast';

function ToastTrigger() {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast('Vehículo agregado a favoritos.')}>
      Mostrar toast
    </button>
  );
}

describe('ToastProvider', () => {
  it('muestra y cierra una notificación', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Mostrar toast' }));

    expect(screen.getByText('Vehículo agregado a favoritos.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar notificación' }));
    expect(screen.queryByText('Vehículo agregado a favoritos.')).not.toBeInTheDocument();
  });
});
