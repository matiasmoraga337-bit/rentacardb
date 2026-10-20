/* -----------------------------------------------------------------------------
   03_fix_triggers_sin_solape.sql

   Quita el ROLLBACK TRANSACTION de los triggers de solapamiento.
   Los triggers se ejecutan con XACT_ABORT ON por defecto y THROW respeta esa
   opcion: la transaccion se revierte automaticamente y se propaga el error de
   negocio (70900/70901) en lugar del error 3609 "The transaction ended in the
   trigger".

   Idempotente: usa CREATE OR ALTER (SQL Server 2016 SP1 o superior).
   Aplicar sobre la base RentaCarDB.
   ----------------------------------------------------------------------------- */
USE [RentaCarDB];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER TRIGGER [dbo].[trg_Reserva_SinSolape]
ON [dbo].[Reserva]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.EstadoReserva eri ON eri.ID_estado_reserva = i.ID_estado_reserva_reserva
        INNER JOIN dbo.Reserva r
            ON r.ID_vehiculo_reserva = i.ID_vehiculo_reserva
           AND r.ID_reserva <> i.ID_reserva
           AND i.fecha_inicio_reserva < r.fecha_fin_reserva
           AND i.fecha_fin_reserva > r.fecha_inicio_reserva
        INNER JOIN dbo.EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
        WHERE eri.nombre_estado_reserva IN ('PENDIENTE','CONFIRMADA','EN_CURSO')
          AND er.nombre_estado_reserva  IN ('PENDIENTE','CONFIRMADA','EN_CURSO')
    )
    BEGIN
        THROW 70900, 'Solapamiento: el vehiculo ya tiene una reserva activa en ese rango de fechas.', 1;
    END
END
GO

CREATE OR ALTER TRIGGER [dbo].[trg_BloqueoVehiculo_SinSolape]
ON [dbo].[BloqueoVehiculo]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.BloqueoVehiculo b
            ON b.ID_vehiculo_bloqueo = i.ID_vehiculo_bloqueo
           AND b.ID_bloqueo <> i.ID_bloqueo
           AND b.activo_bloqueo = 1
           AND i.fecha_inicio_bloqueo < b.fecha_fin_bloqueo
           AND i.fecha_fin_bloqueo > b.fecha_inicio_bloqueo
        WHERE i.activo_bloqueo = 1
    )
    BEGIN
        THROW 70901, 'Solapamiento: el vehiculo ya tiene un bloqueo activo en ese rango de fechas.', 1;
    END
END
GO
