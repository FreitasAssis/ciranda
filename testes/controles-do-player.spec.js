import { test, expect } from '@playwright/test';
import { abrir, foto, importarFotos } from './ajuda.js';

/* A disposição escolhida nos ajustes é só o estado inicial. Durante a
   exibição, V e o botão chamam e escondem a telinha — é o que permite
   fazer o player aparecer, clicar em "Pular anúncio" e sumir com ele de
   novo, sem entregar um canto da TV ao vídeo o evento inteiro. */

const VIDEO = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

async function montar(page, { comTrilha = true, layout = 'so-foto' } = {}) {
  // O player não precisa carregar de verdade: o que se testa é como a
  // Ciranda o monta e o revela. Sem rede, o teste fica rápido e não
  // depende do YouTube estar de pé.
  await page.route('**://*.youtube.com/**', (rota) => rota.abort());

  await abrir(page);
  await importarFotos(page, [foto(60, 40), foto(80, 50)]);

  if (comTrilha) {
    await page.fill('#campo-link', VIDEO);
    await page.click('#btn-add-link');
    await expect(page.locator('#lista-trilha li')).toHaveCount(1);
  }
  await page.check(`input[name="layout"][value="${layout}"]`);
}

async function exibir(page) {
  await page.click('#btn-exibir');
  await expect(page.locator('#exibicao')).toBeVisible();
}

const disposicao = (page) => page.getAttribute('#palco', 'data-layout');

test.describe('como o player é montado', () => {

  test('nasce com os próprios controles e sem o teclado do YouTube', async ({ page }) => {
    await montar(page, { layout: 'canto' });
    await exibir(page);

    const src = await page.getAttribute('#som iframe', 'src');
    expect(src, 'sem controles não há como clicar em pular anúncio').toContain('controls=1');
    expect(src, 'espaço e setas são da Ciranda, não do player').toContain('disablekb=1');
  });

  test('na telinha do canto dá para clicar no player', async ({ page }) => {
    await montar(page, { layout: 'canto' });
    await exibir(page);

    await expect.poll(() => page.evaluate(() =>
      getComputedStyle(document.getElementById('som')).pointerEvents)).toBe('auto');
  });

  test('com o vídeo escondido o player não intercepta clique nenhum', async ({ page }) => {
    await montar(page, { layout: 'so-foto' });
    await exibir(page);

    const ponteiro = await page.evaluate(() =>
      getComputedStyle(document.getElementById('som')).pointerEvents);
    expect(ponteiro, 'nesse layout o player cobre a tela toda').toBe('none');
  });

  test('o teclado volta para a Ciranda quando o mouse sai da telinha', async ({ page }) => {
    await montar(page, { layout: 'canto' });
    await exibir(page);

    await page.evaluate(() => document.querySelector('#som iframe').focus());
    expect(await page.evaluate(() => document.activeElement.tagName)).toBe('IFRAME');

    await page.locator('#som').dispatchEvent('mouseleave');

    await expect.poll(() => page.evaluate(() => document.activeElement.id), {
      message: 'o foco ficou preso no player e as teclas pararam de responder'
    }).toBe('palco');
  });

});

test.describe('chamar e esconder a telinha', () => {

  test('V mostra o vídeo que começou escondido, e esconde de novo', async ({ page }) => {
    await montar(page, { layout: 'so-foto' });
    await exibir(page);
    expect(await disposicao(page)).toBe('so-foto');

    await page.keyboard.press('v');
    await expect.poll(() => disposicao(page)).toBe('canto');

    await page.keyboard.press('v');
    await expect.poll(() => disposicao(page)).toBe('so-foto');
  });

  test('V também esconde o vídeo que começou à mostra', async ({ page }) => {
    await montar(page, { layout: 'canto' });
    await exibir(page);
    expect(await disposicao(page)).toBe('canto');

    await page.keyboard.press('v');
    await expect.poll(() => disposicao(page)).toBe('so-foto');
  });

  test('o botão faz o mesmo e diz o que faz, não o estado em que está', async ({ page }) => {
    await montar(page, { layout: 'so-foto' });
    await exibir(page);

    const botao = page.locator('#btn-video');
    await expect(botao).toBeVisible();
    await expect(botao).toHaveText('Mostrar vídeo');

    await botao.click();
    await expect.poll(() => disposicao(page)).toBe('canto');
    await expect(botao).toHaveText('Esconder vídeo');

    await botao.click();
    await expect.poll(() => disposicao(page)).toBe('so-foto');
    await expect(botao).toHaveText('Mostrar vídeo');
  });

  test('a alternância não é salva: sair e voltar recomeça pelos ajustes', async ({ page }) => {
    await montar(page, { layout: 'so-foto' });
    await exibir(page);

    await page.keyboard.press('v');
    await expect.poll(() => disposicao(page)).toBe('canto');

    await page.keyboard.press('Escape');
    await expect(page.locator('#config')).toBeVisible();
    await exibir(page);

    expect(await disposicao(page), 'a telinha voltou sozinha na exibição seguinte').toBe('so-foto');
  });

});

test.describe('quando não há player', () => {

  test('sem trilha do YouTube o botão nem aparece', async ({ page }) => {
    await montar(page, { comTrilha: false, layout: 'so-foto' });
    await exibir(page);

    await expect(page.locator('#btn-video')).toBeHidden();
  });

  test('sem trilha do YouTube o V não faz um retângulo vazio surgir na TV', async ({ page }) => {
    await montar(page, { comTrilha: false, layout: 'so-foto' });
    await exibir(page);

    await page.keyboard.press('v');
    await page.waitForTimeout(300);

    expect(await disposicao(page), 'apareceu uma telinha vazia com contorno âmbar').toBe('so-foto');
  });

  test('sem trilha do YouTube a barra de atalhos não promete a tecla V', async ({ page }) => {
    await montar(page, { comTrilha: false, layout: 'so-foto' });
    await exibir(page);

    await expect(page.locator('#atalho-video')).toBeHidden();
  });

  test('com trilha do YouTube a barra de atalhos anuncia a tecla V', async ({ page }) => {
    await montar(page, { layout: 'so-foto' });
    await exibir(page);

    await expect(page.locator('#atalho-video')).toBeVisible();
  });

});

test.describe('durante a abertura', () => {

  test('V é ignorado, e o vídeo não aparece sozinho quando ela termina', async ({ page }) => {
    await montar(page, { layout: 'so-foto' });
    await page.check('#campo-abertura');
    await page.fill('#campo-abertura-titulo', 'Ana e Rui');
    await page.locator('#campo-abertura-tempo').fill('2');
    await page.locator('#campo-abertura-tempo').dispatchEvent('input');

    await exibir(page);
    await expect(page.locator('#abertura')).toBeVisible();

    await page.keyboard.press('v');
    await page.waitForTimeout(200);
    expect(await disposicao(page)).toBe('so-foto');

    // Passada a abertura, o vídeo continua escondido.
    await expect(page.locator('#abertura')).toBeHidden({ timeout: 8000 });
    expect(await disposicao(page), 'o V da abertura vazou para depois').toBe('so-foto');
  });

});

test.describe('o botão sai da frente sozinho', () => {

  test('some depois de parado e volta quando o mouse mexe', async ({ page }) => {
    await montar(page, { layout: 'so-foto' });
    await exibir(page);

    const opacidade = () => page.evaluate(() =>
      getComputedStyle(document.getElementById('btn-video')).opacity);

    await expect.poll(opacidade, { timeout: 12000, message: 'o botão ficou para sempre na tela da TV' })
      .toBe('0');

    await page.mouse.move(400, 300);
    await expect.poll(opacidade, { message: 'o botão não voltou quando o mouse mexeu' }).toBe('1');
  });

});
