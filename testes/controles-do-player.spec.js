import { test, expect } from '@playwright/test';
import { abrir, foto, importarFotos } from './ajuda.js';

/* Duas dimensões independentes: quem ocupa a tela (fotos ou vídeo) e se
   o outro aparece num canto. T troca o principal, V mostra e esconde o
   secundário. A disposição dos ajustes é o estado inicial; a alternância
   durante a exibição não é salva. */

const VIDEO = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

async function montar(page, { comTrilha = true, principal = 'fotos', secundario = false } = {}) {
  // O player não precisa carregar: o que se testa é como a Ciranda o
  // monta e o revela. Sem rede, o teste é rápido e não depende do
  // YouTube estar de pé.
  await page.route('**://*.youtube.com/**', (rota) => rota.abort());

  await abrir(page);
  await importarFotos(page, [foto(60, 40), foto(80, 50)]);

  if (comTrilha) {
    await page.fill('#campo-link', VIDEO);
    await page.click('#btn-add-link');
    await expect(page.locator('#lista-trilha li')).toHaveCount(1);
  }
  await page.check(`input[name="principal"][value="${principal}"]`);
  await page.setChecked('#campo-secundario', secundario);
}

async function exibir(page) {
  await page.click('#btn-exibir');
  await expect(page.locator('#exibicao')).toBeVisible();
}

const quemOcupa = (page) => page.getAttribute('#palco', 'data-principal');
const temCanto = (page) => page.getAttribute('#palco', 'data-secundario');

// Uma caixa é "do canto" quando ocupa uma fração da largura do palco.
async function ehCaixaDoCanto(page, seletor) {
  const palco = await page.locator('#palco').boundingBox();
  const alvo = await page.locator(seletor).boundingBox();
  if (!alvo) return false;
  return alvo.width < palco.width * 0.5;
}

test.describe('o vídeo ocupando a tela', () => {

  test('o player cobre o palco e recebe clique', async ({ page }) => {
    await montar(page, { principal: 'video' });
    await exibir(page);

    expect(await quemOcupa(page)).toBe('video');
    expect(await ehCaixaDoCanto(page, '#som'), 'o player ficou pequeno').toBe(false);
    await expect.poll(() => page.evaluate(() =>
      getComputedStyle(document.getElementById('som')).pointerEvents)).toBe('auto');
  });

  test('sem o canto ligado, as fotos somem da tela', async ({ page }) => {
    await montar(page, { principal: 'video', secundario: false });
    await exibir(page);

    await expect(page.locator('.fotos')).toBeHidden();
  });

  test('com o canto ligado, as fotos viram a caixinha', async ({ page }) => {
    await montar(page, { principal: 'video', secundario: true });
    await exibir(page);

    await expect(page.locator('.fotos')).toBeVisible();
    expect(await ehCaixaDoCanto(page, '.fotos'), 'as fotos não encolheram').toBe(true);
  });

});

test.describe('as fotos ocupando a tela', () => {

  test('sem o canto, o player fica atrás e não intercepta clique', async ({ page }) => {
    await montar(page, { principal: 'fotos', secundario: false });
    await exibir(page);

    const ponteiro = await page.evaluate(() =>
      getComputedStyle(document.getElementById('som')).pointerEvents);
    expect(ponteiro, 'o player cobre a tela toda por trás das fotos').toBe('none');
  });

  test('com o canto, o player vira a telinha clicável', async ({ page }) => {
    await montar(page, { principal: 'fotos', secundario: true });
    await exibir(page);

    expect(await ehCaixaDoCanto(page, '#som'), 'a telinha não encolheu').toBe(true);
    await expect.poll(() => page.evaluate(() =>
      getComputedStyle(document.getElementById('som')).pointerEvents)).toBe('auto');
  });

  test('o player nasce com os próprios controles e sem o teclado do YouTube', async ({ page }) => {
    await montar(page, { principal: 'fotos', secundario: true });
    await exibir(page);

    const src = await page.getAttribute('#som iframe', 'src');
    expect(src, 'sem controles não há como clicar em pular anúncio').toContain('controls=1');
    expect(src, 'espaço e setas são da Ciranda, não do player').toContain('disablekb=1');
  });

});

test.describe('as duas teclas', () => {

  test('T troca quem ocupa a tela, nos dois sentidos', async ({ page }) => {
    await montar(page, { principal: 'fotos' });
    await exibir(page);
    expect(await quemOcupa(page)).toBe('fotos');

    await page.keyboard.press('t');
    await expect.poll(() => quemOcupa(page)).toBe('video');

    await page.keyboard.press('t');
    await expect.poll(() => quemOcupa(page)).toBe('fotos');
  });

  test('V mostra e esconde o canto, com as fotos ocupando a tela', async ({ page }) => {
    await montar(page, { principal: 'fotos', secundario: false });
    await exibir(page);

    await page.keyboard.press('v');
    await expect.poll(() => temCanto(page)).toBe('sim');

    await page.keyboard.press('v');
    await expect.poll(() => temCanto(page)).toBe('nao');
  });

  test('V mostra e esconde o canto também com o vídeo ocupando a tela', async ({ page }) => {
    await montar(page, { principal: 'video', secundario: false });
    await exibir(page);

    await page.keyboard.press('v');
    await expect.poll(() => temCanto(page)).toBe('sim');
    expect(await ehCaixaDoCanto(page, '.fotos')).toBe(true);
  });

  test('as duas teclas são independentes: T não mexe no canto', async ({ page }) => {
    await montar(page, { principal: 'fotos', secundario: true });
    await exibir(page);

    await page.keyboard.press('t');
    await expect.poll(() => quemOcupa(page)).toBe('video');
    expect(await temCanto(page), 'trocar o principal apagou o canto').toBe('sim');
  });

  test('nada disso é salvo: a exibição seguinte recomeça pelos ajustes', async ({ page }) => {
    await montar(page, { principal: 'fotos', secundario: false });
    await exibir(page);

    await page.keyboard.press('t');
    await page.keyboard.press('v');
    await expect.poll(() => quemOcupa(page)).toBe('video');

    await page.keyboard.press('Escape');
    await expect(page.locator('#config')).toBeVisible();
    await exibir(page);

    expect(await quemOcupa(page)).toBe('fotos');
    expect(await temCanto(page)).toBe('nao');
  });

});

test.describe('os botões', () => {

  const opacidade = (page) => page.evaluate(() =>
    getComputedStyle(document.getElementById('controles-tela')).opacity);

  /* A barra de atalhos é centralizada e os botões saem da esquerda. Se
     as duas coisas se cruzarem, a barra fica por cima e engole o clique
     — foi o que aconteceu quando o terceiro botão entrou na fileira. */
  test('não ficam debaixo da barra de atalhos', async ({ page }) => {
    await montar(page, { principal: 'fotos' });
    await exibir(page);

    const botoes = await page.locator('#controles-tela').boundingBox();
    const atalhos = await page.locator('#atalhos').boundingBox();

    const cruzam = botoes.x < atalhos.x + atalhos.width
      && atalhos.x < botoes.x + botoes.width
      && botoes.y < atalhos.y + atalhos.height
      && atalhos.y < botoes.y + botoes.height;

    expect(cruzam, 'a barra de atalhos cobre os botões e o clique não chega').toBe(false);
  });

  /* Com o vídeo ocupando a tela, o rodapé pertence ao player: barra de
     progresso, tempo e play ficam lá, e o topo tem o título à esquerda e
     volume, legendas e ajustes à direita. Os botões da Ciranda em cima
     disso disputam clique com os do YouTube. */
  test('saem de cima dos controles do player quando o vídeo ocupa a tela', async ({ page }) => {
    await montar(page, { principal: 'video' });
    await exibir(page);

    const palco = await page.locator('#palco').boundingBox();
    const botoes = await page.locator('#controles-tela').boundingBox();

    const rodapeDoPlayer = palco.y + palco.height * 0.85;
    const topoDoPlayer = palco.y + palco.height * 0.15;

    expect(botoes.y + botoes.height, 'os botões invadem a barra do player')
      .toBeLessThanOrEqual(rodapeDoPlayer);
    expect(botoes.y, 'os botões invadem o título e os ajustes do player')
      .toBeGreaterThanOrEqual(topoDoPlayer);
  });

  test('ficam acima da telinha, sem encostar nela', async ({ page }) => {
    await montar(page, { principal: 'video', secundario: true });
    await exibir(page);

    const botoes = await page.locator('#controles-tela').boundingBox();
    const telinha = await page.locator('.fotos').boundingBox();

    expect(botoes.y + botoes.height, 'os botões caem em cima da telinha')
      .toBeLessThanOrEqual(telinha.y);
    expect(botoes.x + botoes.width, 'não estão alinhados com a telinha')
      .toBeCloseTo(telinha.x + telinha.width, 0);
  });

  test('não pulam de lugar quando o principal troca', async ({ page }) => {
    await montar(page, { principal: 'fotos' });
    await exibir(page);
    const comFotos = await page.locator('#controles-tela').boundingBox();

    await page.keyboard.press('t');
    await expect.poll(() => quemOcupa(page)).toBe('video');
    const comVideo = await page.locator('#controles-tela').boundingBox();

    expect(comVideo.y, 'o botão fugiu de baixo do dedo de quem ia clicar de novo')
      .toBeCloseTo(comFotos.y, 0);
  });

  test('cada botão ensina a tecla que faz a mesma coisa', async ({ page }) => {
    await montar(page, { principal: 'fotos' });
    await exibir(page);

    for (const [botao, tecla] of [['#btn-tela', 'F'], ['#btn-trocar', 'T'], ['#btn-video', 'V']]) {
      await expect(page.locator(botao), `${botao} não diz a tecla`).toContainText(`(${tecla})`);
    }
  });

  test('cada tecla tem seu par na tela', async ({ page }) => {
    await montar(page, { principal: 'fotos' });
    await exibir(page);

    await expect(page.locator('#btn-trocar')).toBeVisible();
    await expect(page.locator('#btn-video')).toBeVisible();
  });

  test('o botão de trocar nomeia o destino, e troca de fato', async ({ page }) => {
    await montar(page, { principal: 'fotos' });
    await exibir(page);

    const trocar = page.locator('#btn-trocar');
    await expect(trocar).toHaveText('Vídeo na tela toda (T)');

    await trocar.click();
    await expect.poll(() => quemOcupa(page)).toBe('video');
    await expect(trocar).toHaveText('Fotos na tela toda (T)');

    await trocar.click();
    await expect.poll(() => quemOcupa(page)).toBe('fotos');
    await expect(trocar).toHaveText('Vídeo na tela toda (T)');
  });

  test('o botão da telinha nomeia o destino, e some com o conteúdo ao esconder', async ({ page }) => {
    await montar(page, { principal: 'fotos', secundario: false });
    await exibir(page);

    const botao = page.locator('#btn-video');
    await expect(botao).toHaveText('Vídeo na telinha (V)');

    // Escondido, não é preciso nomear o quê: só existe uma telinha.
    await botao.click();
    await expect(botao).toHaveText('Esconder a telinha (V)');

    // Com o vídeo ocupando a tela, quem vai para a telinha é a foto.
    await page.locator('#btn-trocar').click();
    await expect(botao).toHaveText('Esconder a telinha (V)');

    await botao.click();
    await expect(botao).toHaveText('Fotos na telinha (V)');
  });

  /* Era o defeito da primeira versão: com o vídeo sozinho na tela, os
     dois botões diziam "fotos" e nenhum dizia para onde elas iriam. */
  test('em nenhum estado os dois botões dizem a mesma coisa', async ({ page }) => {
    await montar(page, { principal: 'fotos', secundario: false });
    await exibir(page);

    const textos = () => page.evaluate(() => ({
      trocar: document.getElementById('btn-trocar').textContent,
      canto: document.getElementById('btn-video').textContent
    }));

    for (const passos of [[], ['v'], ['t'], ['v']]) {
      for (const tecla of passos) await page.keyboard.press(tecla);
      await page.waitForTimeout(120);

      const { trocar, canto } = await textos();
      const estado = `${await quemOcupa(page)}/${await temCanto(page)}`;

      expect(trocar, `rótulos iguais em ${estado}`).not.toBe(canto);
      expect(trocar, `o botão de trocar não diz o destino em ${estado}`).toContain('tela toda');
      expect(canto, `o botão da telinha não diz o destino em ${estado}`).toContain('telinha');
    }
  });

  /* Já foram fixos com o vídeo ocupando a tela, porque eram a única saída
     se um clique no player prendesse o foco do teclado no iframe. Hoje
     há duas outras saídas — sair da tela cheia e tirar o mouse do player
     devolvem o foco —, então eles podem sair da frente como em qualquer
     outro modo. As duas saídas estão testadas logo abaixo. */
  test('somem sozinhos também com o vídeo ocupando a tela', async ({ page }) => {
    await montar(page, { principal: 'video' });
    await exibir(page);

    await expect.poll(() => opacidade(page), { timeout: 12000 })
      .toBe('0');
  });

  test('tirar o mouse do player devolve o teclado, mesmo com ele ocupando tudo', async ({ page }) => {
    await montar(page, { principal: 'video' });
    await exibir(page);

    // Sincroniza em vez de correr: insiste até o foco pousar no iframe,
    // e falha alto se ele nunca pousar — o teste não pode passar por não
    // ter conseguido prender o foco.
    await expect(page.locator('#som iframe')).toBeAttached();
    await expect.poll(() => page.evaluate(() => {
      const quadro = document.querySelector('#som iframe');
      if (document.activeElement !== quadro) quadro.focus();
      return document.activeElement.tagName;
    }), { message: 'não deu para prender o foco no player' }).toBe('IFRAME');

    await page.locator('#som').dispatchEvent('mouseleave');

    await expect.poll(() => page.evaluate(() => document.activeElement.id),
      { message: 'sem esta saída, o teclado fica preso no player' }).toBe('palco');
  });

  test('e com o teclado de volta, as teclas ainda arranjam a tela', async ({ page }) => {
    await montar(page, { principal: 'video' });
    await exibir(page);

    // Espera os botões sumirem: daí em diante só o teclado responde.
    await expect.poll(() => opacidade(page), { timeout: 12000 }).toBe('0');

    await page.keyboard.press('t');
    await expect.poll(() => quemOcupa(page),
      'sem botão e sem tecla não haveria como sair do modo vídeo').toBe('fotos');
  });

  test('com as fotos ocupando a tela, os botões somem e voltam com o mouse', async ({ page }) => {
    await montar(page, { principal: 'fotos' });
    await exibir(page);

    await expect.poll(() => opacidade(page), { timeout: 12000 }).toBe('0');
    await page.mouse.move(400, 300);
    await expect.poll(() => opacidade(page)).toBe('1');
  });

});

test.describe('quando não há player', () => {

  test('o botão nem aparece e a barra não promete tecla nenhuma', async ({ page }) => {
    await montar(page, { comTrilha: false });
    await exibir(page);

    await expect(page.locator('#btn-video')).toBeHidden();
    await expect(page.locator('#btn-trocar')).toBeHidden();
    await expect(page.locator('#atalho-video')).toBeHidden();
    await expect(page.locator('#atalho-trocar')).toBeHidden();
  });

  test('V e T não fazem nada', async ({ page }) => {
    await montar(page, { comTrilha: false });
    await exibir(page);

    await page.keyboard.press('v');
    await page.keyboard.press('t');
    await page.waitForTimeout(300);

    expect(await quemOcupa(page)).toBe('fotos');
    expect(await temCanto(page)).toBe('nao');
  });

  test('escolher "o vídeo ocupa a tela" não deixa a TV preta', async ({ page }) => {
    await montar(page, { comTrilha: false, principal: 'video', secundario: false });
    await exibir(page);

    expect(await quemOcupa(page), 'sem vídeo nenhum, as fotos têm que assumir').toBe('fotos');
    await expect(page.locator('.fotos')).toBeVisible();
  });

});

test.describe('durante a abertura', () => {

  test('V e T são ignorados e não vazam para depois', async ({ page }) => {
    await montar(page, { principal: 'fotos' });
    await page.check('#campo-abertura');
    await page.fill('#campo-abertura-titulo', 'Ana e Rui');
    await page.locator('#campo-abertura-tempo').fill('2');
    await page.locator('#campo-abertura-tempo').dispatchEvent('input');

    await exibir(page);
    await expect(page.locator('#abertura')).toBeVisible();

    await page.keyboard.press('v');
    await page.keyboard.press('t');
    await page.waitForTimeout(200);
    expect(await quemOcupa(page)).toBe('fotos');

    await expect(page.locator('#abertura')).toBeHidden({ timeout: 8000 });
    expect(await quemOcupa(page)).toBe('fotos');
    expect(await temCanto(page)).toBe('nao');
  });

});

test.describe('ajustes de antes da mudança', () => {

  test('quem tinha "fotos e vídeo" salvo continua com a telinha', async ({ page }) => {
    await abrir(page);

    // Grava a forma antiga de guardar a disposição e recarrega.
    await page.evaluate(() => new Promise((ok, erro) => {
      const p = indexedDB.open('ciranda');
      p.onsuccess = () => {
        const t = p.result.transaction(['ajustes'], 'readwrite');
        t.objectStore('ajustes').put({ chave: 'ajustes', valor: { layout: 'canto', fonte: 'youtube' } });
        t.oncomplete = () => ok();
        t.onerror = () => erro(t.error);
      };
      p.onerror = () => erro(p.error);
    }));
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.pronta === '1');

    await expect(page.locator('input[name="principal"][value="fotos"]')).toBeChecked();
    await expect(page.locator('#campo-secundario')).toBeChecked();
  });

  test('quem tinha "só as fotos" salvo continua sem a telinha', async ({ page }) => {
    await abrir(page);

    await page.evaluate(() => new Promise((ok, erro) => {
      const p = indexedDB.open('ciranda');
      p.onsuccess = () => {
        const t = p.result.transaction(['ajustes'], 'readwrite');
        t.objectStore('ajustes').put({ chave: 'ajustes', valor: { layout: 'so-foto', fonte: 'youtube' } });
        t.oncomplete = () => ok();
        t.onerror = () => erro(t.error);
      };
      p.onerror = () => erro(p.error);
    }));
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.pronta === '1');

    await expect(page.locator('input[name="principal"][value="fotos"]')).toBeChecked();
    await expect(page.locator('#campo-secundario')).not.toBeChecked();
  });

});

test.describe('a tela de ajustes explica as teclas', () => {

  test('lista as teclas da exibição, inclusive as duas novas', async ({ page }) => {
    await abrir(page);

    const painel = page.locator('#instrucoes');
    await expect(painel).toBeVisible();
    for (const tecla of ['Esc', 'Espaço', 'V', 'T', 'R']) {
      await expect(painel.getByText(tecla, { exact: true })).toBeVisible();
    }
  });

});
