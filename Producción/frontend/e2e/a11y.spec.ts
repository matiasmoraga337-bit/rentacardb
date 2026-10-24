import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoSeriousViolations(page: import('@playwright/test').Page) {
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

test.describe('Accesibilidad automatizada', () => {
  test('catálogo sin violaciones graves', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page.getByRole('heading', { name: 'Vehículos disponibles' })).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test('login sin violaciones graves', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test('ficha sin violaciones graves', async ({ page }) => {
    await page.goto('/catalogo/2');
    await expect(page.getByRole('heading', { name: 'Hyundai Tucson' })).toBeVisible();
    await expectNoSeriousViolations(page);
  });
});
