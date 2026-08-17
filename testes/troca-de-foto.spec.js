import { test, expect } from '@playwright/test';
import { abrir, foto, importarFotos } from './ajuda.js';

/* A troca é um crossfade entre duas camadas. Se a camada que entra ganhar
   a classe "visivel" antes da foto estar decodificada, o que aparece por
   um instante é uma camada vazia — o pisca que o README diz não existir. */

async function iniciar(page) {
  await page.click('#btn-exibir');
  await expect(page.locator('#exibicao')).toBeVisible();
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.foto')].some((i) => i.classList.contains('visivel') && i.naturalWidth > 0));
}

function observarTrocas(page) {
  return page.evaluate(() => {
    window.__momentos = [];
    const observador = new MutationObserver((mutacoes) => {
      for (const m of mutacoes) {
        if (m.target.classList.contains('visivel')) {
          window.__momentos.push({ id: m.target.id, largura: m.target.naturalWidth });
        }
      }
    });
    document.querySelectorAll('.foto').forEach((i) =>
      observador.observe(i, { attributes: true, attributeFilter: ['class'] }));
  });
}

test('a camada que entra só aparece com a foto já decodificada', async ({ page }) => {
  await abrir(page);
  await importarFotos(page, [foto(60, 40), foto(80, 50), foto(100, 60)]);
  await iniciar(page);
  await observarTrocas(page);

  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => window.__momentos.length >= 1);

  const momentos = await page.evaluate(() => window.__momentos);
  for (const m of momentos) {
    expect(m.largura, `${m.id} apareceu antes de ter imagem`).toBeGreaterThan(0);
  }
});

test('voltar uma foto também entra já decodificada', async ({ page }) => {
  await abrir(page);
  await importarFotos(page, [foto(60, 40), foto(80, 50), foto(100, 60)]);
  await iniciar(page);
  await observarTrocas(page);

  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => window.__momentos.length >= 1);

  const momentos = await page.evaluate(() => window.__momentos);
  for (const m of momentos) {
    expect(m.largura, `${m.id} apareceu antes de ter imagem`).toBeGreaterThan(0);
  }
});
