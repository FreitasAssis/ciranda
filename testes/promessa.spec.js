import { test, expect } from '@playwright/test';
import { abrir } from './ajuda.js';

/* A Ciranda já foi só "transmita a aba do Chrome". Hoje são três
   caminhos — Chromecast pelo navegador, espelhamento pelo sistema e
   cabo — e dois deles não passam por aba nenhuma nem exigem Chrome.
   Estas três frases são a primeira coisa que alguém lê sobre o projeto:
   na busca, no ícone instalado e no alto da página. */

test('a descrição da página não reduz tudo a transmitir uma aba', async ({ request }) => {
  const html = await (await request.get('/index.html')).text();
  const descricao = html.match(/<meta name="description" content="([^"]+)"/)[1];

  expect(descricao).toContain('TV');
  expect(descricao, 'a aba é um caminho entre três').not.toContain('aba');
  // "Chromecast" é o nome do aparelho e pode aparecer; o que não pode é
  // exigir o navegador Chrome, que só cobre um dos três caminhos.
  expect(descricao, 'não depende de um navegador específico').not.toMatch(/\bChrome\b/);
});

test('a descrição do aplicativo instalado diz a mesma coisa', async ({ request }) => {
  const manifesto = await (await request.get('/manifest.webmanifest')).json();

  expect(manifesto.description).toContain('TV');
  expect(manifesto.description, 'a aba é um caminho entre três').not.toContain('aba');
  expect(manifesto.description, 'não depende de um navegador específico').not.toMatch(/\bChrome\b/);
});

test('a linha do cabeçalho também', async ({ page }) => {
  await abrir(page);

  const linha = page.locator('.linha-fina');
  await expect(linha).toBeVisible();
  await expect(linha).toContainText('TV');
  await expect(linha, 'não depende de um navegador específico').not.toContainText(/\bChrome\b/);
});
