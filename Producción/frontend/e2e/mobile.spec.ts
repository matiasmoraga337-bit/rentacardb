import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { login } from './helpers';

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) -
      window.innerWidth,
  );
  expect(overflow, `desborde horizontal de ${overflow}px`).toBeLessThanOrEqual(1);
}

async function expectNoSeriousViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const violations = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );

  expect(
    violations,
    violations
      .map(
        (violation) =>
          `${violation.id}: ${violation.help}\n${violation.nodes
            .map((node) => `  ${node.target.join(' ')}`)
            .join('\n')}`,
      )
      .join('\n\n'),
  ).toEqual([]);
}

test.describe('Catálogo móvil', () => {
  test('carga, filtra por región y abre los filtros sin desbordar', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page.getByRole('heading', { name: 'Vehículos disponibles' })).toBeVisible();
    await expect(page.locator('article')).toHaveCount(2);
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Filtros' }).click();
    await expect(page.getByLabel('Tipo de vehículo')).toBeVisible();

    const region = page.getByLabel('Región', { exact: true });
    await region.selectOption('16');
    await expect(page).toHaveURL(/region=16/);
    await expect(page.locator('article')).toHaveCount(2);

    await region.selectOption('1');
    await expect(page.getByText('Sin resultados')).toBeVisible();
  });

  test('soporta nombres y proveedores largos sin desbordar', async ({ page }) => {
    await page.goto('/catalogo?data=worst');
    await expect(page.locator('article').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('la ficha y la galería se adaptan al ancho móvil', async ({ page }) => {
    await page.goto('/catalogo/2');
    await expect(page.getByRole('heading', { name: 'Hyundai Tucson' })).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'Hyundai Tucson, foto 1 de 3' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Ver foto 2' }).click();
    await expect(
      page.getByRole('img', { name: 'Hyundai Tucson, foto 2 de 3' }),
    ).toBeVisible();
  });

  test('el menú lateral atrapa el foco y cierra con Escape', async ({ page }) => {
    await login(page, 'admin@rentacar.cl', 'Admin1234!');

    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const dialog = page.getByRole('dialog', { name: 'Menu de navegacion' });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label')))
      .toBe('Cerrar menu');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('catálogo móvil sin violaciones graves de accesibilidad', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page.getByRole('heading', { name: 'Vehículos disponibles' })).toBeVisible();
    await expectNoSeriousViolations(page);
  });
});
