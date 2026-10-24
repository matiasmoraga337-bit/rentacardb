import { env } from '../config/env';
import { sendMail } from '../config/mailer';
import * as notificacionRepo from '../repositories/notificacion.repository';
import * as outboxRepo from '../repositories/outbox.repository';

let timer: NodeJS.Timeout | null = null;
let ejecutando = false;

function parsePayload(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function mensajeEvento(evento: outboxRepo.OutboxEventoRow): { asunto: string; cuerpo: string } {
  const payload = parsePayload(evento.payload);
  switch (evento.tipoEvento) {
    case 'ReservaCreada':
      return {
        asunto: 'Reserva registrada',
        cuerpo: `Tu reserva #${String(payload.id_reserva ?? evento.agregadoId)} fue registrada.`,
      };
    case 'ReservaConfirmada':
      return {
        asunto: 'Reserva confirmada',
        cuerpo: `Tu reserva #${String(payload.id_reserva ?? evento.agregadoId)} fue confirmada.`,
      };
    case 'ReservaEstadoCambiado':
      return {
        asunto: 'Actualizacion de reserva',
        cuerpo: `La reserva #${String(payload.id_reserva ?? evento.agregadoId)} cambio a ${String(
          payload.nuevo_estado ?? 'otro estado',
        )}.`,
      };
    case 'ReembolsoSolicitado':
      return {
        asunto: 'Reembolso solicitado',
        cuerpo: `Se registro un reembolso de $${String(payload.monto ?? 0)} para tu reserva.`,
      };
    case 'ReembolsoCompletado':
      return {
        asunto: 'Reembolso completado',
        cuerpo: `Tu reembolso de $${String(payload.monto ?? 0)} fue completado.`,
      };
    case 'DepositoLiberado':
      return {
        asunto: 'Deposito liberado',
        cuerpo: `Se libero un deposito de $${String(payload.monto ?? 0)}.`,
      };
    case 'MensajeEnviado':
      return {
        asunto: 'Nuevo mensaje',
        cuerpo: 'Tienes un nuevo mensaje en RentaCarDB.',
      };
    default:
      return {
        asunto: `Evento ${evento.tipoEvento}`,
        cuerpo: `Se registro el evento ${evento.tipoEvento} #${evento.agregadoId}.`,
      };
  }
}

async function procesarEvento(evento: outboxRepo.OutboxEventoRow): Promise<void> {
  const destinatario = await outboxRepo.resolverDestinatario(evento);
  if (!destinatario) {
    console.warn(`Outbox ${evento.id}: sin destinatario para ${evento.tipoEvento}.`);
    return;
  }

  const { asunto, cuerpo } = mensajeEvento(evento);
  let idNotificacion: number | null = null;

  if (evento.tipoEvento !== 'MensajeEnviado') {
    const existe = await notificacionRepo.existeNotificacionReciente(
      destinatario.idUsuario,
      evento.tipoEvento,
      cuerpo,
    );
    if (!existe) {
      idNotificacion = await notificacionRepo.crearNotificacion({
        idUsuario: destinatario.idUsuario,
        tipo: evento.tipoEvento,
        canal: 'PUSH',
        destinatario: destinatario.email,
        asunto,
        cuerpo,
      });
    }
  }

  try {
    await sendMail({
      to: destinatario.email,
      subject: asunto,
      html: `<p>Hola ${destinatario.nombre},</p><p>${cuerpo}</p><p>RentaCarDB</p>`,
      text: cuerpo,
    });
    if (idNotificacion) {
      await notificacionRepo.marcarEnviada(idNotificacion, true);
    }
  } catch (error) {
    if (idNotificacion) {
      await notificacionRepo
        .marcarEnviada(idNotificacion, false, (error as Error).message.slice(0, 500))
        .catch((markError: unknown) =>
          console.error(
            `No se pudo marcar la notificacion ${idNotificacion} como fallida:`,
            (markError as Error).message,
          ),
        );
    }
    throw error;
  }
}

async function tick(): Promise<void> {
  if (ejecutando) return;
  ejecutando = true;
  try {
    const eventos = await outboxRepo.obtenerPendientes(env.OUTBOX_BATCH_SIZE);
    for (const evento of eventos) {
      try {
        await procesarEvento(evento);
        await outboxRepo.marcarEventoProcesado({
          idEvento: evento.id,
          exito: true,
          lockId: evento.lockId,
        });
      } catch (error) {
        const mensaje = (error as Error).message.slice(0, 2000);
        console.error(`Outbox ${evento.id} fallo:`, mensaje);
        await outboxRepo.marcarEventoProcesado({
          idEvento: evento.id,
          exito: false,
          lockId: evento.lockId,
          error: mensaje,
        });
      }
    }
  } catch (error) {
    console.error('Job outbox fallo:', (error as Error).message);
  } finally {
    ejecutando = false;
  }
}

export function startOutboxJob(): void {
  if (!env.OUTBOX_JOB_ENABLED || timer) return;

  timer = setInterval(() => void tick(), env.OUTBOX_JOB_INTERVAL_MS);
  timer.unref();
  void tick();
  console.log(`Job outbox activo cada ${env.OUTBOX_JOB_INTERVAL_MS} ms.`);
}

export function stopOutboxJob(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
