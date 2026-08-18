import { test, expect } from '@playwright/test';
import { abrir } from './ajuda.js';

/* Iniciar a exibição entra em tela cheia, e em tela cheia o navegador
   esconde a própria barra de ferramentas — o menu de transmitir some
   junto. Só que essa amarra vale para o cast pelo navegador; o
   espelhamento do sistema e o cabo não passam por menu nenhum.
   E o menu do navegador só fala Google Cast: Samsung, LG, Roku e Apple
   TV não respondem a ele, então instrução só de Chromecast deixa muita
   gente sem caminho. */

test('o rodapé aponta o painel, sem impor ordem nenhuma', async ({ page }) => {
  await abrir(page);

  const dica = page.locator('.barra-dica');
  await expect(dica).toBeVisible();
  await expect(dica).toContainText('Transmitir para a TV');
  await expect(dica, 'a exibição não entra mais em tela cheia sozinha')
    .not.toContainText('Antes de iniciar');
});

test('e o painel não impõe mais a ordem, porque a barra do navegador fica à vista', async ({ page }) => {
  await abrir(page);

  const painel = page.locator('#transmitir');
  await expect(painel).not.toContainText('antes de iniciar a exibição');
  await expect(painel.locator('.alerta-ordem')).toHaveCount(0);
});

test.describe('o painel recolhe', () => {

  test('começa encolhido, porque é consulta e não etapa', async ({ page }) => {
    await abrir(page);

    await expect(page.locator('#transmitir')).toBeVisible();
    await expect(page.locator('#transmitir details')).not.toHaveAttribute('open', '');
    await expect(page.locator('#transmitir .sub-titulo').first()).toBeHidden();
  });

  test('o título continua à vista, senão ninguém acha', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('#transmitir summary')).toBeVisible();
    await expect(page.locator('#transmitir summary')).toContainText('Transmitir para a TV');
  });

  test('abre ao clicar no título', async ({ page }) => {
    await abrir(page);

    await page.locator('#transmitir summary').click();

    await expect(page.locator('#transmitir details')).toHaveAttribute('open', '');
    await expect(page.locator('#transmitir .sub-titulo').first()).toBeVisible();
  });

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

  test('diz que dá para ligar a transmissão a qualquer momento', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('#transmitir')).toContainText('qualquer momento');
  });

});
