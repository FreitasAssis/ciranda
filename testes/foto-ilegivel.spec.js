import { test, expect } from '@playwright/test';
import { abrir, foto, importarFotos, larguraNoPalco } from './ajuda.js';

/* Uma foto que falhe ao ser lida não pode parar a ciranda. A trava
   "trocando" existe para não sobrepor duas trocas; se ela ficar ligada
   depois de um erro, o slideshow congela e nem as setas respondem —
   no meio de uma festa, com a tela na parede. */

// Larguras distintas: é assim que o teste sabe qual foto está na tela.
const FOTOS = [60, 64, 68, 72, 76, 80, 84, 88].map((l) => foto(l, 40));

test('uma foto ilegível não congela a ciranda', async ({ page }) => {
  await abrir(page);
  await importarFotos(page, FOTOS);

  await page.click('#btn-exibir');
  await expect.poll(() => larguraNoPalco(page)).toBe(60);

  // Deixa a leitura da próxima foto falhar uma vez.
  await page.evaluate(() => {
    window.__falhas = 0;
    window.__criarOriginal = URL.createObjectURL;
    URL.createObjectURL = () => {
      window.__falhas++;
      throw new Error('não deu para criar o endereço');
    };
  });

  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => window.__falhas > 0);

  await page.evaluate(() => { URL.createObjectURL = window.__criarOriginal; });

  // A ciranda tem que continuar respondendo à seta seguinte.
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => larguraNoPalco(page), {
    message: 'a ciranda congelou depois da foto ilegível'
  }).toBe(84);
});

test('a troca automática continua depois de uma foto ilegível', async ({ page }) => {
  await abrir(page);
  await importarFotos(page, FOTOS);

  // Três segundos por foto para o teste não ficar longo.
  await page.locator('#campo-intervalo').fill('3');
  await page.locator('#campo-intervalo').dispatchEvent('input');

  await page.click('#btn-exibir');
  await expect.poll(() => larguraNoPalco(page)).toBe(60);

  await page.evaluate(() => {
    window.__falhas = 0;
    window.__criarOriginal = URL.createObjectURL;
    URL.createObjectURL = () => {
      window.__falhas++;
      throw new Error('não deu para criar o endereço');
    };
  });

  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => window.__falhas > 0);
  await page.evaluate(() => { URL.createObjectURL = window.__criarOriginal; });

  // Sem tocar em tecla nenhuma, o relógio da exibição tem que voltar a rodar.
  await expect.poll(() => larguraNoPalco(page), {
    timeout: 15000,
    message: 'a troca automática não voltou depois do erro'
  }).not.toBe(60);
});
