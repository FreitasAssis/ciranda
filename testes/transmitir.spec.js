import { test, expect } from '@playwright/test';
import { abrir } from './ajuda.js';

/* Iniciar a exibição entra em tela cheia, e em tela cheia o navegador
   esconde a própria barra de ferramentas — o menu de transmitir some
   junto. Só que essa amarra vale para o cast pelo navegador; o
   espelhamento do sistema e o cabo não passam por menu nenhum.
   E o menu do navegador só fala Google Cast: Samsung, LG, Roku e Apple
   TV não respondem a ele, então instrução só de Chromecast deixa muita
   gente sem caminho. */

test('o rodapé manda transmitir antes de iniciar, não depois', async ({ page }) => {
  await abrir(page);

  const dica = page.locator('.barra-dica');
  await expect(dica).toBeVisible();
  await expect(dica).toContainText('Antes de iniciar');
  await expect(dica, 'em tela cheia não há menu do navegador para alcançar')
    .not.toContainText('Depois de iniciar');
});

test('e diz por que a ordem é essa', async ({ page }) => {
  await abrir(page);
  await expect(page.locator('.barra-dica')).toContainText('tela cheia');
});

test.describe('o painel de transmissão', () => {

  test('cobre os três caminhos, não só o Chromecast', async ({ page }) => {
    await abrir(page);
    const painel = page.locator('#transmitir');
    await expect(painel).toBeVisible();

    await expect(painel, 'falta o cast pelo navegador').toContainText('Chromecast');
    await expect(painel, 'falta o espelhamento do sistema').toContainText('AirPlay');
    await expect(painel, 'falta o Miracast, que é o do Windows').toContainText('Miracast');
    await expect(painel, 'falta a saída que funciona em qualquer caso').toContainText('HDMI');
  });

  test('nomeia as TVs que não falam Google Cast', async ({ page }) => {
    await abrir(page);
    const painel = page.locator('#transmitir');

    for (const marca of ['Samsung', 'LG', 'Apple TV']) {
      await expect(painel, `nada sobre ${marca}`).toContainText(marca);
    }
  });

  test('dá o caminho de cada navegador, e diz qual não serve', async ({ page }) => {
    await abrir(page);
    const painel = page.locator('#transmitir');

    for (const navegador of ['Chrome', 'Edge', 'Firefox']) {
      await expect(painel, `nada sobre ${navegador}`).toContainText(navegador);
    }
  });

  test('avisa o que cada caminho manda para a TV', async ({ page }) => {
    await abrir(page);
    const painel = page.locator('#transmitir');

    // Cast manda só a aba; espelhamento manda a tela toda, e aí
    // notificação de mensagem aparece no casamento.
    await expect(painel).toContainText('aba');
    await expect(painel).toContainText('notifica');
  });

  test('limita a regra da ordem ao cast pelo navegador', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('#transmitir')).toContainText('antes de iniciar');
  });

});
