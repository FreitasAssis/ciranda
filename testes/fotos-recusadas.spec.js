import { test, expect } from '@playwright/test';
import { abrir, foto, importarFotos, esperarContagem } from './ajuda.js';

/* O navegador não decodifica todo formato. HEIC, que é o padrão do
   iPhone, passa pelo filtro de tipo e some depois, sem uma palavra.
   Quem arrastou trinta fotos e viu vinte e sete precisa saber por quê. */

function heic(nome = 'IMG_0007.HEIC') {
  return { name: nome, mimeType: 'image/heic', buffer: Buffer.from('ftypheic não é imagem que o Chrome abra') };
}

test('avisa quantas fotos ficaram de fora, e por quê', async ({ page }) => {
  await abrir(page);

  await page.setInputFiles('#campo-fotos', [foto(60, 40), heic(), foto(80, 50)]);
  await esperarContagem(page, 2);

  const recado = page.locator('#progresso');
  await expect(recado).toBeVisible();
  await expect(recado).toContainText('1 foto');
  await expect(recado).toContainText('de fora');
  await expect(recado, 'o recado precisa dizer o motivo').toContainText('HEIC');
});

test('concorda o plural quando várias ficam de fora', async ({ page }) => {
  await abrir(page);

  await page.setInputFiles('#campo-fotos', [heic('a.HEIC'), foto(60, 40), heic('b.HEIC')]);
  await esperarContagem(page, 1);

  await expect(page.locator('#progresso')).toContainText('2 fotos');
});

test('importação limpa não deixa recado na tela', async ({ page }) => {
  await abrir(page);
  await importarFotos(page, [foto(60, 40), foto(80, 50)]);

  await expect(page.locator('#progresso')).toBeHidden();
});

test('o recado some quando a importação seguinte dá certo', async ({ page }) => {
  await abrir(page);

  await page.setInputFiles('#campo-fotos', [heic()]);
  await expect(page.locator('#progresso')).toBeVisible();

  await page.setInputFiles('#campo-fotos', [foto(60, 40)]);
  await esperarContagem(page, 1);
  await expect(page.locator('#progresso')).toBeHidden();
});
