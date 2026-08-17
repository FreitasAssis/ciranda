/* Apoio dos testes: gera imagens de verdade e leva a Ciranda até um
   estado conhecido pela própria interface, sem atalho por dentro. */

import { deflateSync } from 'node:zlib';
import { expect } from '@playwright/test';

/* ---- PNG de verdade, montado à mão para não precisar de biblioteca ---- */

const TABELA = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) c = TABELA[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pedaco(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length, 0);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo), 0);
  return Buffer.concat([tamanho, corpo, crc]);
}

/** PNG opaco de cor sólida, no tamanho pedido. */
export function png(largura, altura, cor = [190, 70, 40]) {
  const linhas = Buffer.alloc((largura * 3 + 1) * altura);
  let p = 0;
  for (let y = 0; y < altura; y++) {
    linhas[p++] = 0; // filtro "nenhum"
    for (let x = 0; x < largura; x++) {
      linhas[p++] = cor[0];
      linhas[p++] = cor[1];
      linhas[p++] = cor[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 2; // cor verdadeira, sem alfa

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', deflateSync(linhas)),
    pedaco('IEND', Buffer.alloc(0))
  ]);
}

/** Arquivo pronto para o setInputFiles, com o tamanho embutido no nome. */
export function foto(largura, altura, nome) {
  return {
    name: nome || `foto-${largura}x${altura}.png`,
    mimeType: 'image/png',
    buffer: png(largura, altura)
  };
}

/** WAV silencioso e válido, suficiente para virar uma faixa da trilha. */
export function musica(nome = 'trilha.wav') {
  const amostras = 8000;
  const dados = Buffer.alloc(amostras * 2);
  const cabeca = Buffer.alloc(44);
  cabeca.write('RIFF', 0);
  cabeca.writeUInt32LE(36 + dados.length, 4);
  cabeca.write('WAVE', 8);
  cabeca.write('fmt ', 12);
  cabeca.writeUInt32LE(16, 16);
  cabeca.writeUInt16LE(1, 20);  // PCM
  cabeca.writeUInt16LE(1, 22);  // mono
  cabeca.writeUInt32LE(8000, 24);
  cabeca.writeUInt32LE(16000, 28);
  cabeca.writeUInt16LE(2, 32);
  cabeca.writeUInt16LE(16, 34);
  cabeca.write('data', 36);
  cabeca.writeUInt32LE(dados.length, 40);
  return { name: nome, mimeType: 'audio/wav', buffer: Buffer.concat([cabeca, dados]) };
}

/* ---- estados da interface ---- */

/** Abre a Ciranda com banco limpo e espera a montagem terminar. */
export async function abrir(page) {
  await page.goto('/index.html');
  await page.evaluate(() => new Promise((ok) => {
    const pedido = indexedDB.deleteDatabase('ciranda');
    pedido.onsuccess = pedido.onerror = pedido.onblocked = () => ok();
  }));
  await page.reload();
  await esperarPronta(page);
}

export function esperarPronta(page) {
  return page.waitForFunction(() => document.documentElement.dataset.pronta === '1');
}

/** Importa fotos pelo campo de arquivos e espera a contagem bater. */
export async function importarFotos(page, arquivos) {
  await page.setInputFiles('#campo-fotos', arquivos);
  await esperarContagem(page, arquivos.length);
}

export function esperarContagem(page, quantas) {
  return expect(page.locator('#conta-fotos'))
    .toHaveText(quantas === 1 ? '1 foto' : `${quantas} fotos`);
}

/** Larguras das fotos visíveis no palco, para saber qual está na tela. */
export function larguraNoPalco(page) {
  return page.evaluate(() => {
    const visivel = [...document.querySelectorAll('.foto')].find((i) => i.classList.contains('visivel'));
    return visivel ? visivel.naturalWidth : 0;
  });
}
