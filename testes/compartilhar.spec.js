import { test, expect } from '@playwright/test';

/* O que aparece quando alguém cola o link no WhatsApp, no LinkedIn ou no
   Slack. Os leitores desses aplicativos não executam JavaScript e não
   resolvem caminho relativo: as URLs têm que ser absolutas e o arquivo
   tem que estar publicado, senão o preview sai sem imagem. */

const SITE = 'https://freitasassis.github.io/ciranda/';
const CAPA = SITE + 'icones/capa.jpg';

async function tags(request) {
  const html = await (await request.get('/index.html')).text();
  const achadas = {};
  for (const [, prop, valor] of html.matchAll(
    /<meta (?:property|name)="((?:og|twitter):[^"]+)" content="([^"]+)"/g)) {
    achadas[prop] = valor;
  }
  return achadas;
}

test('a página se apresenta com título, descrição e endereço próprios', async ({ request }) => {
  const t = await tags(request);

  expect(t['og:title']).toBeTruthy();
  expect(t['og:description']).toBeTruthy();
  expect(t['og:url'], 'sem endereço absoluto o preview não sabe para onde aponta').toBe(SITE);
  expect(t['og:type']).toBe('website');
});

test('a imagem de capa é absoluta, senão o preview sai sem ela', async ({ request }) => {
  const t = await tags(request);

  expect(t['og:image']).toBe(CAPA);
  expect(t['og:image']).toMatch(/^https:\/\//);
  expect(t['twitter:image']).toBe(CAPA);
});

test('declara o tamanho da capa, que é o que evita o preview pequeno', async ({ request }) => {
  const t = await tags(request);

  expect(t['og:image:width']).toBe('1280');
  expect(t['og:image:height']).toBe('640');
  expect(t['twitter:card'], 'sem isto o Twitter mostra a miniatura quadrada')
    .toBe('summary_large_image');
});

test('o tamanho declarado é o do arquivo de verdade', async ({ request }) => {
  const t = await tags(request);
  const resposta = await request.get('/icones/capa.jpg');

  expect(resposta.status(), 'a capa não está onde as tags dizem que está').toBe(200);
  expect(resposta.headers()['content-type']).toContain('image/jpeg');

  // Lê a dimensão do próprio JPEG e compara com o que as tags prometem.
  const bytes = await resposta.body();
  let i = 2, largura = 0, altura = 0;
  while (i < bytes.length) {
    if (bytes[i] !== 0xFF) { i++; continue; }
    const marca = bytes[i + 1];
    if (marca >= 0xC0 && marca <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(marca)) {
      altura = bytes.readUInt16BE(i + 5);
      largura = bytes.readUInt16BE(i + 7);
      break;
    }
    i += 2 + bytes.readUInt16BE(i + 2);
  }

  expect(largura).toBe(Number(t['og:image:width']));
  expect(altura).toBe(Number(t['og:image:height']));
  expect(largura, 'abaixo de 1200 o preview vira miniatura').toBeGreaterThanOrEqual(1200);
});

test('a capa é leve o bastante para o WhatsApp buscar', async ({ request }) => {
  const bytes = await (await request.get('/icones/capa.jpg')).body();

  expect(bytes.length, 'imagem pesada demais faz o preview desistir')
    .toBeLessThan(300 * 1024);
});

test('a descrição do preview não volta a prometer só a aba do Chrome', async ({ request }) => {
  const t = await tags(request);

  expect(t['og:description']).toContain('TV');
  expect(t['og:description']).not.toContain('aba');
  expect(t['og:description']).not.toMatch(/\bChrome\b/);
});
