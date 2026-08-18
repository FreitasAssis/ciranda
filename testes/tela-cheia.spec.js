import { test, expect } from '@playwright/test';
import { abrir, foto, importarFotos } from './ajuda.js';

/* A tela cheia deixou de ser automática. Ela servia ao computador de
   quem opera, não à TV: transmitir aba manda o conteúdo da aba, e a
   barra do navegador nunca vai junto de qualquer jeito. Automática, ela
   escondia o menu de transmitir e obrigava a ligar a transmissão antes
   de começar. Sob demanda, dá para transmitir de dentro da exibição. */

const VIDEO = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

async function exibindo(page, { comTrilha = false } = {}) {
  await page.route('**://*.youtube.com/**', (rota) => rota.abort());
  await abrir(page);
  await importarFotos(page, [foto(60, 40), foto(80, 50)]);

  if (comTrilha) {
    await page.fill('#campo-link', VIDEO);
    await page.click('#btn-add-link');
    await expect(page.locator('#lista-trilha li')).toHaveCount(1);
  }

  await page.click('#btn-exibir');
  await expect(page.locator('#exibicao')).toBeVisible();
}

const emTelaCheia = (page) => page.evaluate(() => !!document.fullscreenElement);

test('iniciar a exibição não entra em tela cheia sozinho', async ({ page }) => {
  await exibindo(page);

  await page.waitForTimeout(600);
  expect(await emTelaCheia(page),
    'em tela cheia o menu de transmitir some, e era isso que travava o fluxo').toBe(false);
});

test('F entra e sai da tela cheia', async ({ page }) => {
  await exibindo(page);

  await page.keyboard.press('f');
  await expect.poll(() => emTelaCheia(page)).toBe(true);

  await page.keyboard.press('f');
  await expect.poll(() => emTelaCheia(page)).toBe(false);
});

test('F funciona mesmo sem trilha do YouTube', async ({ page }) => {
  await exibindo(page, { comTrilha: false });

  await page.keyboard.press('f');
  await expect.poll(() => emTelaCheia(page),
    'tela cheia não tem nada a ver com vídeo').toBe(true);
});

test('o botão faz o mesmo e diz o que faz', async ({ page }) => {
  await exibindo(page, { comTrilha: true });

  const botao = page.locator('#btn-tela');
  await expect(botao).toBeVisible();
  await expect(botao).toHaveText('Tela cheia (F)');

  await botao.click();
  await expect.poll(() => emTelaCheia(page)).toBe(true);
  await expect(botao).toHaveText('Sair da tela cheia (F)');

  await botao.click();
  await expect.poll(() => emTelaCheia(page)).toBe(false);
  await expect(botao).toHaveText('Tela cheia (F)');
});

test.describe('sair da tela cheia', () => {

  test('não encerra a exibição, porque sair é justamente para transmitir', async ({ page }) => {
    await exibindo(page);

    await page.keyboard.press('f');
    await expect.poll(() => emTelaCheia(page)).toBe(true);

    await page.evaluate(() => document.exitFullscreen());
    await expect.poll(() => emTelaCheia(page)).toBe(false);

    await expect(page.locator('#exibicao')).toBeVisible();
    await expect(page.locator('#config')).toBeHidden();
  });

  test('devolve o teclado à Ciranda', async ({ page }) => {
    await exibindo(page, { comTrilha: true });

    await page.keyboard.press('f');
    await expect.poll(() => emTelaCheia(page)).toBe(true);

    // Um clique no player do YouTube prende o foco no iframe.
    await page.evaluate(() => document.querySelector('#som iframe').focus());
    expect(await page.evaluate(() => document.activeElement.tagName)).toBe('IFRAME');

    await page.evaluate(() => document.exitFullscreen());

    await expect.poll(() => page.evaluate(() => document.activeElement.id),
      { message: 'o foco ficou no player e o Esc não chegaria à Ciranda' }).toBe('palco');
  });

  test('e o Esc continua sendo o caminho de volta aos ajustes', async ({ page }) => {
    await exibindo(page);

    await page.keyboard.press('f');
    await expect.poll(() => emTelaCheia(page)).toBe(true);
    await page.evaluate(() => document.exitFullscreen());
    await expect.poll(() => emTelaCheia(page)).toBe(false);

    await page.keyboard.press('Escape');
    await expect(page.locator('#config')).toBeVisible();
  });

});

test('a barra de atalhos anuncia o F mesmo sem trilha', async ({ page }) => {
  await exibindo(page, { comTrilha: false });

  await expect(page.locator('#atalho-tela')).toBeVisible();
});

test('a tela de ajustes lista o F junto das outras teclas', async ({ page }) => {
  await abrir(page);

  await expect(page.locator('#instrucoes').getByText('F', { exact: true })).toBeVisible();
});
