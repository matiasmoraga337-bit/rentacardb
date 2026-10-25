import { expect, test, type Page } from '@playwright/test';
import { login } from './helpers';

function fechaFutura(dias: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dias);
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mes}-${dia}`;
}

async function cerrarSesion(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.removeItem('rentacardb_token'));
}

test.describe('Flujo crítico', () => {
  test('reserva, pago, arriendo, devolución y reseña', async ({ page, request }) => {
    test.setTimeout(120_000);

    const vehiculoId = 1;
    let desde = '';
    let hasta = '';
    for (let intento = 0; intento < 80 && !desde; intento += 1) {
      const offset = 500 + ((Date.now() + intento * 3) % 200);
      const candidatoDesde = fechaFutura(offset);
      const candidatoHasta = fechaFutura(offset + 3);
      const response = await request.get(
        `http://localhost:3000/api/vehiculos/${vehiculoId}/disponibilidad?desde=${candidatoDesde}&hasta=${candidatoHasta}`,
      );
      if (response.ok() && (await response.json()).disponible) {
        desde = candidatoDesde;
        hasta = candidatoHasta;
      }
    }
    expect(desde, 'No se encontro un rango de fechas disponible').not.toBe('');

    await login(page, 'demo@rentacar.cl', 'Demo1234!');
    await page.goto(`/catalogo/${vehiculoId}?desde=${desde}&hasta=${hasta}`);
    await expect(
      page.getByText('Disponible en las fechas seleccionadas'),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole('link', { name: 'Continuar al checkout' }).click();
    await page.waitForURL(`**/checkout/${vehiculoId}?**`);
    await expect(page.getByRole('heading', { name: 'Confirmar reserva' })).toBeVisible();
    await page.getByRole('button', { name: 'Crear reserva' }).click();

    await page.waitForURL(/\/reservas\/\d+\/pagar$/);
    const reservaId = Number(new URL(page.url()).pathname.split('/')[2]);
    await page.getByRole('button', { name: 'Pagar con WebPay' }).click();

    await page.waitForURL(/\/webpay\/confirmar\?/);
    await page.getByRole('button', { name: 'Aprobar pago' }).click();
    await page.waitForURL(new RegExp(`/reservas/${reservaId}$`));
    await expect(page.getByRole('heading', { name: `Reserva #${reservaId}` })).toBeVisible();

    await cerrarSesion(page);
    await login(page, 'proveedor@rentacar.cl', 'Proveedor1234!');
    await page.goto(`/reservas/${reservaId}`);
    await page.getByRole('link', { name: 'Iniciar arriendo' }).click();
    await page.waitForURL(new RegExp(`/proveedor/arriendos/iniciar/${reservaId}$`));
    await expect(page.getByRole('heading', { name: 'Iniciar arriendo' })).toBeVisible();
    await page.getByRole('button', { name: 'Iniciar arriendo' }).click();

    await page.waitForURL(/\/arriendos\/\d+$/);
    const arriendoId = Number(new URL(page.url()).pathname.split('/')[2]);
    await expect(page.getByRole('heading', { name: `Arriendo #${arriendoId}` })).toBeVisible();

    await cerrarSesion(page);
    await login(page, 'demo@rentacar.cl', 'Demo1234!');
    await page.goto(`/arriendos/${arriendoId}`);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Aceptar contrato' }).click();
    await expect(page.getByText('Contrato aceptado. No es necesario aceptarlo nuevamente.')).toBeVisible();

    await cerrarSesion(page);
    await login(page, 'proveedor@rentacar.cl', 'Proveedor1234!');
    await page.goto(`/arriendos/${arriendoId}`);
    await page.getByRole('button', { name: 'Registrar devolucion' }).click();
    await expect(page.getByText('Finalizado', { exact: true }).first()).toBeVisible();

    await cerrarSesion(page);
    await login(page, 'demo@rentacar.cl', 'Demo1234!');
    await page.goto(`/arriendos/${arriendoId}`);
    await expect(page.getByText('Dejar resena')).toBeVisible();
    await page.getByRole('button', { name: '5 estrellas' }).first().click();
    await page.getByRole('button', { name: 'Enviar resena' }).first().click();
    await expect(page.getByText('Reseña enviada.')).toBeVisible();
  });
});


