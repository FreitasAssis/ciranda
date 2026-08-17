import { test, expect } from '@playwright/test';

/* O trabalhador de serviço grava tudo que passa. Se gravar também o que
   deu errado, um deploy pela metade no GitHub Pages fica preso: a pessoa
   volta depois, a rede está boa, e o cache continua servindo o 404. */

async function esperarTrabalhador(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((ok) =>
        navigator.serviceWorker.addEventListener('controllerchange', ok, { once: true }));
    }
  });
}

test('guarda a resposta boa e descarta a que deu errado', async ({ page }) => {
  await page.goto('/index.html');
  await esperarTrabalhador(page);

  const resultado = await page.evaluate(async () => {
    const ruim = await fetch('/nao-existe-mesmo.txt');
    await fetch('/icones/icone16.png');

    // O trabalhador grava fora do respondWith. Espera assentar usando a
    // resposta boa como referência: ela foi pedida depois da ruim.
    for (let i = 0; i < 60; i++) {
      if (await caches.match('/icones/icone16.png')) break;
      await new Promise((ok) => setTimeout(ok, 50));
    }

    return {
      status: ruim.status,
      guardouBoa: !!(await caches.match('/icones/icone16.png')),
      guardouRuim: !!(await caches.match('/nao-existe-mesmo.txt'))
    };
  });

  expect(resultado.status).toBe(404);
  expect(resultado.guardouBoa, 'a resposta boa tem que continuar sendo guardada').toBe(true);
  expect(resultado.guardouRuim, 'um 404 no cache deixa a Ciranda presa no erro').toBe(false);
});

test('offline, a casca continua abrindo pelo cache', async ({ page, context }) => {
  await page.goto('/index.html');
  await esperarTrabalhador(page);
  await page.waitForFunction(() => document.documentElement.dataset.pronta === '1');

  await context.setOffline(true);
  await page.reload();

  await expect(page.locator('#config')).toBeVisible();
  await expect(page.locator('.titulo')).toHaveText('Ciranda');
});
