import { expect, test } from '@playwright/test';
import { login } from './helpers';

test.describe('Catálogo público', () => {
  test('carga vehículos y filtra por región', async ({ page }) => {
    const mapRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('mapa-chile-regiones-horizontal.svg')) {
        mapRequests.push(request.url());
      }
    });

    await page.goto('/catalogo');

    await expect(
      page.getByRole('heading', { name: 'Vehículos disponibles' }),
    ).toBeVisible();
    await expect(page.locator('article').first()).toBeVisible();
    await expect(page.locator('.mapa-chile')).toBeVisible();
    await expect.poll(() => mapRequests.length).toBeGreaterThan(0);

    const region = page.getByLabel('Región', { exact: true });
    await region.selectOption('16');
    await expect(page).toHaveURL(/region=16/);
    await expect(page.locator('article').first()).toBeVisible();

    await region.selectOption('');
    await expect(page).not.toHaveURL(/region=/);
    await expect(page.locator('article').first()).toBeVisible();
  });

  test('muestra el estado vacío con datos de prueba', async ({ page }) => {
    await page.goto('/catalogo?data=empty');
    await expect(page.getByText('Sin resultados')).toBeVisible();
  });

  test('abre la ficha y navega la galería', async ({ page }) => {
    await page.goto('/catalogo/2');

    await expect(page.getByRole('heading', { name: 'Hyundai Tucson' })).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'Hyundai Tucson, foto 1 de 3' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Ver foto 2' }).click();
    await expect(
      page.getByRole('img', { name: 'Hyundai Tucson, foto 2 de 3' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Foto siguiente' }).click();
    await expect(
      page.getByRole('img', { name: 'Hyundai Tucson, foto 3 de 3' }),
    ).toBeVisible();
  });
});

test.describe('Autenticación', () => {
  test('inicia sesión como administrador', async ({ page }) => {
    await login(page, 'admin@rentacar.cl', 'Admin1234!');
    await expect(page.getByRole('heading', { name: 'Hola, Admin' })).toBeVisible();
  });

  test('inicia sesión como cliente', async ({ page }) => {
    await login(page, 'demo@rentacar.cl', 'Demo1234!');
    await expect(page.getByRole('heading', { name: 'Hola, Cliente' })).toBeVisible();
  });

  test('el cliente ve su licencia en el perfil', async ({ page }) => {
    await login(page, 'demo@rentacar.cl', 'Demo1234!');
    await page.goto('/perfil');
    await expect(page.getByRole('heading', { name: 'Licencia de conducir' })).toBeVisible();
  });
});

test.describe('Favoritos y feedback', () => {
  test('agrega un favorito y muestra el toast', async ({ page }) => {
    await login(page, 'demo@rentacar.cl', 'Demo1234!');
    await page.goto('/catalogo');

    await page.getByRole('button', { name: /favoritos/i }).first().click();
    await expect(
      page.getByRole('status').filter({ hasText: /favoritos/i }),
    ).toBeVisible();
  });
});

test.describe('Administración', () => {
  test('muestra proveedores en el panel admin', async ({ page }) => {
    await login(page, 'admin@rentacar.cl', 'Admin1234!');
    await page.goto('/admin/proveedores');

    await expect(page.getByRole('heading', { name: 'Proveedores' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'AutoDemo' })).toBeVisible();
  });

  test('muestra reportes SQL y alertas del panel', async ({ page }) => {
    await login(page, 'admin@rentacar.cl', 'Admin1234!');

    await page.goto('/admin/reportes');
    await expect(page.getByRole('heading', { name: 'Reportes' })).toBeVisible();
    await page.getByRole('tab', { name: 'Liquidaciones' }).click();
    await expect(
      page.getByRole('heading', { name: 'Liquidaciones por proveedor' }),
    ).toBeVisible();
    await page.getByRole('tab', { name: 'Integridad' }).click();
    await expect(page.getByRole('heading', { name: 'Salud de datos' })).toBeVisible();

    await page.goto('/panel');
    await expect(page.getByText('Pagos pendientes').first()).toBeVisible();
    await expect(page.getByText('Vehículos publicados').first()).toBeVisible();
  });

  test('muestra documentos por vencer al proveedor', async ({ page }) => {
    await login(page, 'proveedor@rentacar.cl', 'Proveedor1234!');
    await page.goto('/panel');
    await expect(page.getByText('Documentos por vencer')).toBeVisible();
  });

  test('muestra la tarjeta de mantenimiento del vehiculo', async ({ page }) => {
    await login(page, 'proveedor@rentacar.cl', 'Proveedor1234!');
    await page.goto('/proveedor/vehiculos/1');
    await expect(page.getByRole('heading', { name: 'Mantenimiento' })).toBeVisible();
    await expect(
      page.getByText('Mantenimiento activo e historial del vehiculo.'),
    ).toBeVisible();
  });
});
