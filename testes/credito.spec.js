import { test, expect } from '@playwright/test';
import { abrir, foto, importarFotos } from './ajuda.js';

/* A assinatura fica na tela de ajustes, que é onde tem gente olhando.
   Na tela de exibição ela não pode aparecer: aquilo vai para a TV de um
   casamento ou para a vitrine de uma loja. */

test('a tela de ajustes assina com link para o portfólio', async ({ page }) => {
  await abrir(page);

  const link = page.locator('#config a[href="https://luizfreitas.com.br/"]');
  await expect(link).toBeVisible();
  await expect(link).toHaveText('Luiz Freitas');
  await expect(page.locator('.credito')).toContainText('Desenvolvido por');
});

test('o link abre em outra aba sem entregar a página de origem', async ({ page }) => {
  await abrir(page);

  const link = page.locator('#config a[href="https://luizfreitas.com.br/"]');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
});

test('a assinatura não aparece na tela de exibição', async ({ page }) => {
  await abrir(page);
  await importarFotos(page, [foto(60, 40), foto(80, 50)]);

  await page.click('#btn-exibir');
  await expect(page.locator('#exibicao')).toBeVisible();

  await expect(page.locator('.credito')).toBeHidden();
});
