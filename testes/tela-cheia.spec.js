import { test, expect } from '@playwright/test';
import { abrir, foto, musica, importarFotos } from './ajuda.js';

/* O Chrome só concede tela cheia enquanto o clique do usuário ainda vale
   — cerca de cinco segundos. Se a Ciranda pedir tela cheia depois de ler
   o banco e ligar a trilha, uma ciranda pesada perde a janela e a
   exibição abre dentro da aba, que é justamente o que não pode acontecer
   na hora de transmitir para a TV. */

test('pede tela cheia enquanto o clique ainda vale, mesmo com trilha lenta', async ({ page }) => {
  await abrir(page);
  await importarFotos(page, [foto(60, 40), foto(80, 50)]);

  await page.check('input[name="fonte"][value="arquivos"]');
  await page.setInputFiles('#campo-musicas', [musica()]);
  await expect(page.locator('#lista-musicas li')).toHaveCount(1);

  await page.evaluate(() => {
    window.__registro = { ativoNoPedido: null };

    Element.prototype.requestFullscreen = function () {
      window.__registro.ativoNoPedido = navigator.userActivation.isActive;
      return Promise.resolve();
    };

    // Uma faixa grande demora a começar. Seis segundos passam da validade
    // do clique, que no Chrome é de cinco.
    HTMLMediaElement.prototype.play = function () {
      return new Promise((ok) => setTimeout(ok, 6000));
    };
  });

  await page.click('#btn-exibir');

  await page.waitForFunction(() => window.__registro.ativoNoPedido !== null, null, { timeout: 20000 });
  const ativo = await page.evaluate(() => window.__registro.ativoNoPedido);

  expect(ativo, 'a tela cheia foi pedida depois que o clique perdeu a validade').toBe(true);
});
