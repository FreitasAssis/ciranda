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
    await expect(trocar).toHaveText('Vídeo na tela toda');

    await trocar.click();
    await expect.poll(() => quemOcupa(page)).toBe('video');
    await expect(trocar).toHaveText('Fotos na tela toda');

    await trocar.click();
    await expect.poll(() => quemOcupa(page)).toBe('fotos');
    await expect(trocar).toHaveText('Vídeo na tela toda');
  });

  test('o botão da telinha nomeia o destino, e some com o conteúdo ao esconder', async ({ page }) => {
    await montar(page, { principal: 'fotos', secundario: false });
    await exibir(page);

    const botao = page.locator('#btn-video');
    await expect(botao).toHaveText('Vídeo na telinha');

    // Escondido, não é preciso nomear o quê: só existe uma telinha.
    await botao.click();
    await expect(botao).toHaveText('Esconder a telinha');

    // Com o vídeo ocupando a tela, quem vai para a telinha é a foto.
    await page.locator('#btn-trocar').click();
    await expect(botao).toHaveText('Esconder a telinha');

    await botao.click();
    await expect(botao).toHaveText('Fotos na telinha');
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

  test('com o vídeo ocupando a tela, os botões não somem sozinhos', async ({ page }) => {
    await montar(page, { principal: 'video' });
    await exibir(page);

    await page.waitForTimeout(5000);
    expect(await opacidade(page),
      'sumiu a única superfície clicável fora do player: o teclado fica preso lá').toBe('1');
  });

  test('e o de trocar continua clicável, que é como se sai desse modo sem teclado', async ({ page }) => {
    await montar(page, { principal: 'video' });
    await exibir(page);

    await page.waitForTimeout(5000);
    await page.locator('#btn-trocar').click();

    await expect.poll(() => quemOcupa(page)).toBe('fotos');
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

test.describe('sair da tela cheia', () => {

  test('encerra a exibição, porque com o foco preso no player o Esc não chega', async ({ page }) => {
    await montar(page, { principal: 'video' });
    await exibir(page);

    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement),
      { message: 'a exibição nem entrou em tela cheia' }).toBe(true);

    // É o que o navegador faz quando o Esc é apertado com o foco dentro
    // do player: sai da tela cheia sem avisar a Ciranda por tecla.
    await page.evaluate(() => document.exitFullscreen());

    await expect(page.locator('#config')).toBeVisible();
    await expect(page.locator('#exibicao')).toBeHidden();
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
