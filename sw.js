/* Trabalhador de serviço da Ciranda.

   Guarda só a casca do aplicativo — página, estilo, script, ícones — para
   ela abrir sem internet e poder ser instalada. As fotos e as músicas não
   passam por aqui: elas moram no IndexedDB, que já é local.

   O player do YouTube nunca é guardado, porque depende da rede de qualquer
   jeito. Sem internet, a trilha por arquivos continua tocando. */

const CASCA = 'ciranda-casca-v1';
const ITENS = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './manifest.webmanifest',
  './icones/icone128.png',
  './icones/icone512.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CASCA).then((c) => c.addAll(ITENS)));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CASCA).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  if (new URL(pedido.url).origin !== location.origin) return;

  // Rede primeiro, cache como rede de segurança: assim uma atualização
  // publicada no GitHub aparece sem a pessoa precisar limpar nada.
  evento.respondWith(
    fetch(pedido)
      .then((resposta) => {
        // Só entra no cache o que voltou inteiro. Guardar um 404 ou um
        // 502 de um deploy pela metade deixaria a Ciranda presa no erro
        // mesmo depois de a publicação ficar boa.
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(CASCA).then((c) => c.put(pedido, copia));
        }
        return resposta;
      })
      .catch(() => caches.match(pedido))
  );
});
