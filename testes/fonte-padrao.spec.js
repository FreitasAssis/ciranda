import { test, expect } from '@playwright/test';
import { esperarPronta } from './ajuda.js';

test.describe('fonte padrão da trilha', () => {

  test('o markup já vem com o YouTube marcado, sem piscar o painel errado', async ({ request }) => {
    const html = await (await request.get('/index.html')).text();

    const youtube = html.match(/<input[^>]*name="fonte"[^>]*value="youtube"[^>]*>/);
    const arquivos = html.match(/<input[^>]*name="fonte"[^>]*value="arquivos"[^>]*>/);

    expect(youtube, 'a opção YouTube deve existir').not.toBeNull();
    expect(arquivos, 'a opção Arquivos deve existir').not.toBeNull();

    expect(youtube[0], 'o YouTube é a fonte padrão, então nasce marcado').toContain('checked');
    expect(arquivos[0], 'Arquivos não é o padrão, então não nasce marcado').not.toContain('checked');

    const blocoMusicas = html.match(/<div id="bloco-musicas"[^>]*>/)[0];
    const blocoYoutube = html.match(/<div id="bloco-youtube"[^>]*>/)[0];
    expect(blocoMusicas, 'o painel de arquivos começa escondido').toContain('hidden');
    expect(blocoYoutube, 'o painel do YouTube começa à mostra').not.toContain('hidden');
  });

  test('a página avisa quando terminou de montar', async ({ page }) => {
    await page.goto('/index.html');
    await esperarPronta(page);

    await expect(page.locator('#bloco-youtube')).toBeVisible();
    await expect(page.locator('#bloco-musicas')).toBeHidden();
    await expect(page.locator('input[name="fonte"][value="youtube"]')).toBeChecked();
  });

});
