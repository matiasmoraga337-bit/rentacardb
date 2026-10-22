import { type NextFunction, type Request, type Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const SQL_ERROR_MAP: Record<number, { status: number; code: string }> = {
  51101: { status: 400, code: 'RUT_INVALIDO' },
  51102: { status: 400, code: 'NOMBRES_VACIOS' },
  51103: { status: 400, code: 'EMAIL_INVALIDO' },
  51104: { status: 400, code: 'PASSWORD_INVALIDO' },
  51105: { status: 409, code: 'RUT_DUPLICADO' },
  51106: { status: 409, code: 'EMAIL_DUPLICADO' },
  51107: { status: 400, code: 'ROL_INVALIDO' },
  51120: { status: 400, code: 'TOKEN_INVALIDO' },
  51130: { status: 401, code: 'CREDENCIALES_INVALIDAS' },
  51140: { status: 404, code: 'EMAIL_NO_REGISTRADO' },
  51150: { status: 400, code: 'PASSWORD_INVALIDO' },
  51151: { status: 400, code: 'TOKEN_INVALIDO' },

  70120: { status: 404, code: 'RESERVA_NO_ENCONTRADA' },
  70121: { status: 400, code: 'ESTADO_INVALIDO' },
  70122: { status: 409, code: 'TRANSICION_NO_PERMITIDA' },
  70123: { status: 409, code: 'PAGO_REQUERIDO' },
  70124: { status: 409, code: 'ARRIENDO_REQUERIDO' },

  70200: { status: 400, code: 'FECHAS_INVALIDAS' },
  70201: { status: 400, code: 'FECHA_INICIO_INVALIDA' },
  70202: { status: 400, code: 'IMPUESTO_INVALIDO' },
  70203: { status: 400, code: 'POLITICA_COMBUSTIBLE_INVALIDA' },
  70204: { status: 403, code: 'CLIENTE_INACTIVO' },
  70205: { status: 404, code: 'VEHICULO_NO_DISPONIBLE' },
  70206: { status: 409, code: 'VEHICULO_NO_PUBLICADO' },
  70207: { status: 409, code: 'PROVEEDOR_NO_APROBADO' },
  70208: { status: 409, code: 'VEHICULO_FUERA_SERVICIO' },
  70209: { status: 409, code: 'RESERVA_SOLAPADA' },
  70210: { status: 409, code: 'VEHICULO_BLOQUEADO' },
  70211: { status: 409, code: 'VEHICULO_EN_MANTENIMIENTO' },
  70212: { status: 409, code: 'DOCUMENTOS_VEHICULO_INVALIDOS' },
  70213: { status: 409, code: 'SIN_POLITICA_CANCELACION' },
  70214: { status: 400, code: 'POLITICA_CANCELACION_INVALIDA' },
  70215: { status: 409, code: 'SIN_PRECIO_DISPONIBLE' },
  70216: { status: 500, code: 'CONFIGURACION_ESTADO_INCOMPLETA' },
  70217: { status: 400, code: 'SEDE_RETIRO_NO_HABILITADA' },
  70218: { status: 400, code: 'SEDE_DEVOLUCION_NO_HABILITADA' },
  70219: { status: 400, code: 'DEVOLUCION_OTRA_SEDE_NO_PERMITIDA' },
  70220: { status: 400, code: 'DURACION_MINIMA' },
  70221: { status: 400, code: 'DURACION_MAXIMA' },
  70222: { status: 400, code: 'SEDE_OTRO_PROVEEDOR' },
  70223: { status: 403, code: 'EDAD_MINIMA' },
  70224: { status: 404, code: 'SEDE_NO_ENCONTRADA' },
  70225: { status: 409, code: 'DEPOSITO_INVALIDO' },
  70226: { status: 409, code: 'IDEMPOTENCY_KEY_AJENA' },

  70300: { status: 409, code: 'SIN_PAGOS_APROBADOS' },
  70301: { status: 409, code: 'REEMBOLSO_EXCEDE_SALDO' },
  70302: { status: 404, code: 'RESERVA_NO_ENCONTRADA' },
  70303: { status: 404, code: 'REEMBOLSO_NO_ENCONTRADO' },
  70304: { status: 409, code: 'REEMBOLSO_ESTADO_INVALIDO' },
  70305: { status: 403, code: 'FORBIDDEN' },
  70306: { status: 409, code: 'IDEMPOTENCY_KEY_OTRA_RESERVA' },
  70307: { status: 400, code: 'IDEMPOTENCY_KEY_REQUIRED' },
  70308: { status: 409, code: 'IDEMPOTENCY_KEY_MONTO_DISTINTO' },
  70309: { status: 400, code: 'USUARIO_REQUERIDO' },
  70310: { status: 400, code: 'CANTIDAD_INVALIDA' },
  70311: { status: 400, code: 'MONTO_REEMBOLSO_INVALIDO' },
  70312: { status: 400, code: 'MOTIVO_REEMBOLSO_REQUERIDO' },

  70600: { status: 400, code: 'IDEMPOTENCY_KEY_REQUIRED' },
  70601: { status: 404, code: 'RESERVA_NO_ENCONTRADA' },
  70602: { status: 400, code: 'MONTO_REEMBOLSO_INVALIDO' },
  70603: { status: 409, code: 'CANCELACION_REEMBOLSO_NO_COINCIDE' },
  70604: { status: 400, code: 'USUARIO_REQUERIDO' },

  70900: { status: 409, code: 'RESERVA_SOLAPADA' },
  70901: { status: 409, code: 'VEHICULO_BLOQUEADO' },

  52001: { status: 400, code: 'MONTO_INVALIDO' },
  52002: { status: 400, code: 'TIPO_OPERACION_INVALIDO' },
  52003: { status: 400, code: 'METODO_PAGO_INVALIDO' },
  52004: { status: 404, code: 'RESERVA_NO_ENCONTRADA' },
  52005: { status: 409, code: 'RESERVA_NO_PENDIENTE' },
  52006: { status: 400, code: 'PAGO_RESERVA_PARAMETROS' },
  52007: { status: 409, code: 'MONTO_NO_COINCIDE' },
  52008: { status: 409, code: 'PAGO_YA_APROBADO' },
  52009: { status: 400, code: 'ARRIENDO_REQUERIDO' },
  52010: { status: 400, code: 'PAGO_ARRIENDO_PARAMETROS' },
  52011: { status: 400, code: 'ARRIENDO_NO_CORRESPONDE' },
  52012: { status: 400, code: 'PAGO_EXTRA_PARAMETROS' },
  52013: { status: 400, code: 'ARRIENDO_NO_CORRESPONDE' },
  52014: { status: 400, code: 'CARGO_EXTRA_INVALIDO' },
  52015: { status: 409, code: 'MONTO_NO_COINCIDE' },
  52016: { status: 409, code: 'MONTO_NO_COINCIDE' },
  52030: { status: 400, code: 'MONTO_INVALIDO' },
  52031: { status: 404, code: 'RESERVA_NO_ENCONTRADA' },
  52032: { status: 409, code: 'RESERVA_NO_PENDIENTE' },
  52033: { status: 404, code: 'TRANSACCION_NO_ENCONTRADA' },
  52034: { status: 409, code: 'TRANSACCION_YA_RESUELTA' },
  52035: { status: 409, code: 'RESERVA_NO_PENDIENTE' },
  52036: { status: 409, code: 'PAGO_NO_PENDIENTE' },
  52037: { status: 409, code: 'RESERVA_EXPIRADA' },
  52038: { status: 409, code: 'PAGO_PENDIENTE_INCONSISTENTE' },

  53003: { status: 400, code: 'DATOS_INVALIDOS' },
  53004: { status: 409, code: 'RESERVA_NO_CONFIRMADA' },
  53005: { status: 409, code: 'ARRIENDO_YA_EXISTE' },
  53006: { status: 400, code: 'SEDE_RETIRO_NO_HABILITADA' },
  53007: { status: 400, code: 'DATOS_DEVOLUCION_INVALIDOS' },
  53008: { status: 404, code: 'ARRIENDO_NO_ENCONTRADO' },
  53009: { status: 409, code: 'ARRIENDO_NO_ACTIVO' },
  53010: { status: 400, code: 'KILOMETRAJE_INVALIDO' },
  53011: { status: 400, code: 'SEDE_INVALIDA' },
  53012: { status: 400, code: 'DATOS_INVALIDOS' },
  53013: { status: 400, code: 'DATOS_INVALIDOS' },
  53014: { status: 409, code: 'REQUISITO_NO_CUMPLIDO' },
  53015: { status: 500, code: 'CONFIGURACION_INCOMPLETA' },
  53016: { status: 500, code: 'CONFIGURACION_INCOMPLETA' },
  53017: { status: 500, code: 'CONFIGURACION_INCOMPLETA' },

  60060: { status: 404, code: 'INSPECCION_NO_ENCONTRADA' },
  60061: { status: 400, code: 'SEVERIDAD_INVALIDA' },
  60062: { status: 400, code: 'MONTO_INVALIDO' },
  60063: { status: 409, code: 'DANO_SOLO_DEVOLUCION' },
  60070: { status: 404, code: 'ARRIENDO_NO_ENCONTRADO' },
  60071: { status: 404, code: 'PERSONA_NO_ENCONTRADA' },
  60072: { status: 400, code: 'LICENCIA_INVALIDA' },
  60073: { status: 409, code: 'CONDUCTOR_DUPLICADO' },
  60080: { status: 404, code: 'USUARIO_NO_ENCONTRADO' },
  60081: { status: 404, code: 'PROVEEDOR_NO_ENCONTRADO' },
  60082: { status: 400, code: 'VEHICULO_OTRO_PROVEEDOR' },
  60089: { status: 400, code: 'TIPO_MENSAJE_INVALIDO' },
  60090: { status: 400, code: 'MENSAJE_VACIO' },
  60091: { status: 404, code: 'CONVERSACION_NO_ENCONTRADA' },
  60092: { status: 403, code: 'FORBIDDEN' },
  60093: { status: 400, code: 'MENSAJE_PADRE_INVALIDO' },
  60094: { status: 403, code: 'FORBIDDEN' },
  60095: { status: 404, code: 'USUARIO_NO_ENCONTRADO' },
  60096: { status: 403, code: 'FORBIDDEN' },
  60100: { status: 403, code: 'FORBIDDEN' },

  70410: { status: 400, code: 'HASH_CONTRATO_INVALIDO' },
  70411: { status: 404, code: 'ARRIENDO_NO_ENCONTRADO' },
  70412: { status: 400, code: 'USUARIO_REQUERIDO' },
  70413: { status: 403, code: 'FORBIDDEN' },

  241: { status: 400, code: 'FECHA_INVALIDA' },
  2627: { status: 409, code: 'OPERACION_DUPLICADA' },
  2601: { status: 409, code: 'OPERACION_DUPLICADA' },
  1205: { status: 503, code: 'DEADLOCK_REINTENTAR' },
  8115: { status: 400, code: 'VALOR_FUERA_DE_RANGO' },
};

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  const uploadErr = err as { name?: string; code?: string; message?: string };
  if (uploadErr?.name === 'MulterError') {
    const message =
      uploadErr.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamaño maximo permitido.'
        : 'Error al procesar el archivo subido.';
    res.status(400).json({ error: { code: 'UPLOAD_ERROR', message, details: [] } });
    return;
  }

  const sqlErr = err as { number?: number; message?: string };
  if (sqlErr?.number && SQL_ERROR_MAP[sqlErr.number]) {    const mapped = SQL_ERROR_MAP[sqlErr.number];
    res.status(mapped.status).json({
      error: { code: mapped.code, message: sqlErr.message ?? 'Error de negocio.', details: [] },
    });
    return;
  }

  console.error('Error no controlado:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor.',
      details: env.NODE_ENV === 'development' ? [sqlErr?.message ?? String(err)] : [],
    },
  });
}
