import { apiFetch } from '@/lib/api';

export interface Pago {
  id: number;
  reservaId: number;
  arriendoId: number | null;
  cargoExtraId: number | null;
  tipoOperacion: string;
  metodo: string;
  estado: string;
  monto: number;
  moneda: string;
  referencia: string | null;
  fechaPago: string | null;
  fechaConfirmacion: string | null;
}

export interface IniciarWebPayResponse {
  ID_pago: number;
  token_ws: string;
  url: string;
  monto: number;
  ID_reserva: number;
}

export interface TransaccionWebPay {
  idTransaccion: number;
  token: string;
  monto: number;
  estadoTransaccion: string;
  idPago: number;
  idReserva: number;
  idCliente: number;
  idProveedor: number;
  estadoReserva: string;
  totalReserva: number;
}

export interface ConfirmarWebPayResponse {
  ID_transaccion_simulada: number;
  ID_pago: number;
  ID_reserva: number;
  aprobada: boolean;
}

export const fetchPagos = (reserva: number): Promise<Pago[]> =>
  apiFetch<Pago[]>(`/pagos?reserva=${reserva}`);

export const iniciarWebPay = (ID_reserva: number): Promise<IniciarWebPayResponse> =>
  apiFetch<IniciarWebPayResponse>('/pagos/webpay/iniciar', {
    method: 'POST',
    body: JSON.stringify({ ID_reserva }),
  });

export const fetchTransaccion = (token: string): Promise<TransaccionWebPay> =>
  apiFetch<TransaccionWebPay>(`/pagos/webpay/transaccion/${token}`);

export const confirmarWebPay = (
  token_ws: string,
  aprobada: boolean,
): Promise<ConfirmarWebPayResponse> =>
  apiFetch<ConfirmarWebPayResponse>('/pagos/webpay/confirmar', {
    method: 'POST',
    body: JSON.stringify({ token_ws, aprobada }),
  });
