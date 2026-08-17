/* Servidor estático mínimo para os testes.

   A Ciranda precisa de http para o service worker registrar e para o
   player do YouTube aceitar a origem. Sem dependência: node e mais nada. */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PORTA = Number(process.env.PORTA || 4173);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json'
};

const servidor = createServer(async (pedido, resposta) => {
  const caminho = new URL(pedido.url, 'http://localhost').pathname;
  const relativo = normalize(caminho === '/' ? '/index.html' : caminho);

  // Não deixa subir para fora da pasta do projeto.
  if (relativo.includes('..')) {
    resposta.writeHead(403).end('fora do escopo');
    return;
  }

  try {
    const conteudo = await readFile(join(RAIZ, relativo));
    resposta.writeHead(200, {
      'content-type': TIPOS[extname(relativo)] || 'application/octet-stream',
      'cache-control': 'no-store',
      'service-worker-allowed': '/'
    });
    resposta.end(conteudo);
  } catch {
    resposta.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    resposta.end('não encontrado');
  }
});

servidor.listen(PORTA, () => {
  console.log(`Ciranda em http://localhost:${PORTA}/`);
});
