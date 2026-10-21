import { env } from '../config/env';
import { expirarReservas } from '../repositories/reserva.repository';

let timer: NodeJS.Timeout | null = null;

export function startReservasJob(): void {
  if (!env.RESERVAS_JOB_ENABLED || timer) return;

  timer = setInterval(() => {
    void expirarReservas().catch((err: unknown) => {
      console.error('Job de expiracion de reservas fallo:', (err as Error).message);
    });
  }, env.RESERVAS_JOB_INTERVAL_MS);
  timer.unref();

  console.log(
    `Job de expiracion de reservas activo cada ${env.RESERVAS_JOB_INTERVAL_MS} ms.`,
  );
}

export function stopReservasJob(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
