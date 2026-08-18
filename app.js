/* ============================================================
   Ciranda — fotos e música na TV
   Versão web. Servida de um endereço https, o player do YouTube
   funciona: a origem tem referência válida, coisa que uma página
   de extensão não tem.
   Uma página só, dois modos: configurar e exibir.
   Sair do modo exibir não recarrega nada, então o navegador
   continua entendendo que houve um clique e libera o som.
   ============================================================ */

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------
   Banco: metadados separados dos arquivos.
   A grade e a exibição leem só os metadados, que são leves;
   o arquivo cheio só é lido quando a foto entra na tela.
   É o que permite uma ciranda de centenas de fotos.
   ------------------------------------------------------------ */

const BANCO = 'ciranda';
const VERSAO = 1;
let bancoAberto = null;

function abrirBanco() {
  if (bancoAberto) return bancoAberto;
  bancoAberto = new Promise((ok, erro) => {
    const pedido = indexedDB.open(BANCO, VERSAO);

    pedido.onupgradeneeded = () => {
      const banco = pedido.result;
      if (!banco.objectStoreNames.contains('paginas')) {
        banco.createObjectStore('paginas', { keyPath: 'id', autoIncrement: true })
             .createIndex('ordem', 'ordem');
      }
      if (!banco.objectStoreNames.contains('arquivos')) {
        banco.createObjectStore('arquivos', { keyPath: 'id' });
      }
      // Logotipo e imagem de abertura: guardados como vieram, sem
      // reprocessar, senão um PNG transparente ganharia fundo branco.
      if (!banco.objectStoreNames.contains('imagens')) {
        banco.createObjectStore('imagens', { keyPath: 'chave' });
      }
      if (!banco.objectStoreNames.contains('musicas')) {
        banco.createObjectStore('musicas', { keyPath: 'id', autoIncrement: true })
             .createIndex('ordem', 'ordem');
      }
      if (!banco.objectStoreNames.contains('ajustes')) {
        banco.createObjectStore('ajustes', { keyPath: 'chave' });
      }
    };

    pedido.onsuccess = () => ok(pedido.result);
    pedido.onerror = () => erro(pedido.error);
  });
  return bancoAberto;
}

function tx(nomes, modo, tarefa) {
  return abrirBanco().then((banco) => new Promise((ok, erro) => {
    const t = banco.transaction(nomes, modo);
    const lojas = {};
    nomes.forEach((n) => { lojas[n] = t.objectStore(n); });
    let saida;
    tarefa(lojas, (valor) => { saida = valor; });
    t.oncomplete = () => ok(saida);
    t.onerror = () => erro(t.error);
    t.onabort = () => erro(t.error);
  }));
}

const lerPaginas = () => tx(['paginas'], 'readonly', (lojas, devolver) => {
  const p = lojas.paginas.getAll();
  p.onsuccess = () => devolver((p.result || []).sort((a, b) => a.ordem - b.ordem));
});

const lerIdsEmOrdem = () => tx(['paginas'], 'readonly', (lojas, devolver) => {
  const p = lojas.paginas.index('ordem').getAllKeys();
  p.onsuccess = () => devolver(p.result || []);
});

const lerArquivo = (id) => tx(['arquivos'], 'readonly', (lojas, devolver) => {
  const p = lojas.arquivos.get(id);
  p.onsuccess = () => devolver(p.result ? p.result.blob : null);
});

const gravarPagina = (pagina) => tx(['paginas'], 'readwrite', (lojas) => lojas.paginas.put(pagina));

const apagarPagina = (id) => tx(['paginas', 'arquivos'], 'readwrite', (lojas) => {
  lojas.paginas.delete(id);
  lojas.arquivos.delete(id);
});

const apagarTudo = () => tx(['paginas', 'arquivos'], 'readwrite', (lojas) => {
  lojas.paginas.clear();
  lojas.arquivos.clear();
});

const lerMusicas = () => tx(['musicas'], 'readonly', (lojas, devolver) => {
  const p = lojas.musicas.getAll();
  p.onsuccess = () => devolver((p.result || []).sort((a, b) => a.ordem - b.ordem));
});

const guardarMusica = (registro) =>
  tx(['musicas'], 'readwrite', (lojas) => lojas.musicas.add(registro));

const gravarMusica = (registro) =>
  tx(['musicas'], 'readwrite', (lojas) => lojas.musicas.put(registro));

const apagarMusica = (id) =>
  tx(['musicas'], 'readwrite', (lojas) => lojas.musicas.delete(id));

const guardarImagem = (chave, blob) =>
  tx(['imagens'], 'readwrite', (lojas) => lojas.imagens.put({ chave, blob }));

const lerImagem = (chave) => tx(['imagens'], 'readonly', (lojas, devolver) => {
  const p = lojas.imagens.get(chave);
  p.onsuccess = () => devolver(p.result ? p.result.blob : null);
});

const apagarImagem = (chave) =>
  tx(['imagens'], 'readwrite', (lojas) => lojas.imagens.delete(chave));

function guardarNova(registro, blob) {
  return tx(['paginas', 'arquivos'], 'readwrite', (lojas) => {
    const add = lojas.paginas.add(registro);
    add.onsuccess = () => lojas.arquivos.put({ id: add.result, blob });
  });
}

/* ------------------------------------------------------------
   Preparar a imagem: uma cópia grande para a TV e uma
   miniatura para a grade não pesar com muitas fotos.
   ------------------------------------------------------------ */

function redimensionar(img, limite, qualidade) {
  const escala = Math.min(1, limite / Math.max(img.width, img.height));
  const tela = document.createElement('canvas');
  tela.width = Math.max(1, Math.round(img.width * escala));
  tela.height = Math.max(1, Math.round(img.height * escala));
  const pincel = tela.getContext('2d');
  pincel.fillStyle = '#ffffff';
  pincel.fillRect(0, 0, tela.width, tela.height);
  pincel.drawImage(img, 0, 0, tela.width, tela.height);
  return new Promise((ok) => tela.toBlob(ok, 'image/jpeg', qualidade));
}

function preparar(arquivo) {
  return new Promise((ok) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = async () => {
      const grande = await redimensionar(img, 2400, 0.88);
      const miniatura = await redimensionar(img, 400, 0.7);
      URL.revokeObjectURL(url);
      ok({ grande: grande || arquivo, miniatura });
    };
    img.onerror = () => { URL.revokeObjectURL(url); ok(null); };
    img.src = url;
  });
}

/* ------------------------------------------------------------
   Ajustes
   ------------------------------------------------------------ */

const PADRAO = {
  trilha: [],
  fonte: 'youtube',
  volume: 80,
  intervalo: 12,
  ordem: 'fixa',
  principal: 'fotos',
  secundario: false,
  nome: '',
  rodapeNome: true,
  logoFundo: false,
  rodapeHora: true,
  abertura: false,
  aberturaTitulo: '',
  aberturaSub: '',
  aberturaSegundos: 6
};

let ajustes = { ...PADRAO };

async function lerAjustes() {
  const guardado = await tx(['ajustes'], 'readonly', (lojas, devolver) => {
    const p = lojas.ajustes.get('ajustes');
    p.onsuccess = () => devolver(p.result ? p.result.valor : null);
  });
  ajustes = { ...PADRAO, ...(guardado || {}) };

  // A disposição já foi um valor só. Quem tem ciranda montada de antes
  // não perde o ajuste por causa da mudança de forma.
  if (guardado && guardado.layout && guardado.principal === undefined) {
    ajustes.principal = 'fotos';
    ajustes.secundario = guardado.layout === 'canto';
    delete ajustes.layout;
    await salvarAjustes();
  }
}

const salvarAjustes = () =>
  tx(['ajustes'], 'readwrite', (lojas) => lojas.ajustes.put({ chave: 'ajustes', valor: ajustes }));

/* ------------------------------------------------------------
   Links do YouTube
   ------------------------------------------------------------ */

function interpretarLink(texto) {
  const bruto = (texto || '').trim();
  if (!bruto) return null;

  if (/^[\w-]{11}$/.test(bruto)) return { tipo: 'video', ref: bruto };

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(bruto) ? bruto : 'https://' + bruto);
  } catch { return null; }

  const casa = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  const doYoutube = ['youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'youtu.be'];
  if (!doYoutube.includes(casa)) return null;

  // Mixes automáticos (começam com RD) não tocam no player incorporado,
  // então nesse caso caímos para o vídeo que veio junto no link.
  const lista = url.searchParams.get('list');
  if (lista && /^[\w-]{12,}$/.test(lista) && !/^RD/.test(lista)) {
    return { tipo: 'playlist', ref: lista };
  }

  const partes = url.pathname.split('/').filter(Boolean);
  let id = null;
  if (casa === 'youtu.be') id = partes[0];
  else if (url.pathname === '/watch') id = url.searchParams.get('v');
  else if (['shorts', 'embed', 'live', 'v'].includes(partes[0])) id = partes[1];

  return id && /^[\w-]{11}$/.test(id) ? { tipo: 'video', ref: id } : null;
}

function enderecoDoPlayer(trilha) {
  if (!trilha.length) return null;

  // Com controles, a telinha do canto serve para pausar e para clicar em
  // "Pular anúncio" — coisas que a Ciranda não alcança por fora, porque o
  // player é de outro domínio. O teclado do player fica desligado: espaço
  // e setas pertencem à ciranda de fotos, e dois donos para a mesma tecla
  // é confusão garantida.
  const p = new URLSearchParams({
    autoplay: '1', loop: '1', controls: '1', modestbranding: '1',
    rel: '0', iv_load_policy: '3', playsinline: '1', disablekb: '1', fs: '0'
  });

  const playlist = trilha.find((i) => i.tipo === 'playlist');
  if (playlist) {
    p.set('list', playlist.ref);
    return 'https://www.youtube.com/embed/videoseries?' + p.toString();
  }

  const ids = trilha.map((i) => i.ref);
  p.set('playlist', ids.length > 1 ? ids.slice(1).join(',') : ids[0]);
  return `https://www.youtube.com/embed/${ids[0]}?${p.toString().replace(/%2C/g, ',')}`;
}

/* ------------------------------------------------------------
   Tela de configuração — trilha
   ------------------------------------------------------------ */

function avisar(texto) {
  const recado = $('recado-link');
  recado.textContent = texto;
  recado.hidden = !texto;
}

function desenharTrilha() {
  const lista = $('lista-trilha');
  lista.textContent = '';

  const primeiraPlaylist = ajustes.trilha.findIndex((i) => i.tipo === 'playlist');

  ajustes.trilha.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'item';

    const ordem = document.createElement('span');
    ordem.className = 'item-ordem';
    ordem.textContent = String(i + 1).padStart(2, '0');

    const corpo = document.createElement('div');
    corpo.className = 'item-corpo';

    const nome = document.createElement('input');
    nome.className = 'item-nome';
    nome.value = item.nome || '';
    nome.placeholder = item.tipo === 'playlist' ? 'Playlist sem nome' : 'Vídeo sem nome';
    nome.setAttribute('aria-label', 'Nome da faixa ' + (i + 1));
    nome.addEventListener('change', () => {
      item.nome = nome.value.trim();
      salvarAjustes();
    });

    const ref = document.createElement('span');
    ref.className = 'item-ref';
    ref.textContent = item.ref;
    corpo.append(nome, ref);

    const selo = document.createElement('span');
    selo.className = 'selo-playlist';
    selo.textContent = item.tipo === 'playlist' ? 'playlist' : 'vídeo';

    const sobe = document.createElement('button');
    sobe.className = 'mini';
    sobe.textContent = '↑';
    sobe.title = 'Subir';
    sobe.disabled = i === 0;
    sobe.addEventListener('click', () => moverTrilha(i, -1));

    const desce = document.createElement('button');
    desce.className = 'mini';
    desce.textContent = '↓';
    desce.title = 'Descer';
    desce.disabled = i === ajustes.trilha.length - 1;
    desce.addEventListener('click', () => moverTrilha(i, 1));

    const tira = document.createElement('button');
    tira.className = 'mini perigo';
    tira.textContent = '✕';
    tira.title = 'Remover';
    tira.addEventListener('click', () => {
      ajustes.trilha.splice(i, 1);
      salvarAjustes();
      desenharTrilha();
    });

    if (primeiraPlaylist !== -1 && i !== primeiraPlaylist) li.style.opacity = '.45';

    li.append(ordem, corpo, selo, sobe, desce, tira);
    lista.append(li);
  });

  const total = ajustes.trilha.length;
  atualizarContaTrilha();
  $('vazio-trilha').hidden = total > 0;

  if (primeiraPlaylist !== -1 && total > 1) {
    avisar('Uma playlist do YouTube toca sozinha. As outras entradas ficam de fora enquanto ela estiver na lista.');
  }
}

function moverTrilha(i, passo) {
  const destino = i + passo;
  if (destino < 0 || destino >= ajustes.trilha.length) return;
  const [item] = ajustes.trilha.splice(i, 1);
  ajustes.trilha.splice(destino, 0, item);
  salvarAjustes();
  desenharTrilha();
}

function adicionarLink() {
  const campo = $('campo-link');
  const achado = interpretarLink(campo.value);

  if (!achado) {
    avisar('Não reconheci esse link. Cole o endereço de um vídeo ou de uma playlist do YouTube.');
    return;
  }
  if (ajustes.trilha.some((i) => i.ref === achado.ref)) {
    avisar('Essa entrada já está na trilha.');
    return;
  }

  avisar('');
  ajustes.trilha.push({ ...achado, nome: '' });
  campo.value = '';
  salvarAjustes();
  desenharTrilha();
}

/* ------------------------------------------------------------
   Tela de configuração — músicas
   ------------------------------------------------------------ */

let musicas = [];

function nomeLimpo(arquivo) {
  return arquivo.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
}

async function desenharMusicas() {
  musicas = await lerMusicas();
  const lista = $('lista-musicas');
  lista.textContent = '';

  musicas.forEach((musica, i) => {
    const li = document.createElement('li');
    li.className = 'item';

    const ordem = document.createElement('span');
    ordem.className = 'item-ordem';
    ordem.textContent = String(i + 1).padStart(2, '0');

    const corpo = document.createElement('div');
    corpo.className = 'item-corpo';
    const nome = document.createElement('span');
    nome.className = 'item-titulo';
    nome.textContent = nomeLimpo(musica.nome || 'sem nome');
    const tam = document.createElement('span');
    tam.className = 'item-ref';
    tam.textContent = Math.round(musica.blob.size / 1024 / 1024 * 10) / 10 + ' MB';
    corpo.append(nome, tam);

    const sobe = document.createElement('button');
    sobe.className = 'mini';
    sobe.textContent = '↑';
    sobe.title = 'Subir';
    sobe.disabled = i === 0;
    sobe.addEventListener('click', () => moverMusica(i, -1));

    const desce = document.createElement('button');
    desce.className = 'mini';
    desce.textContent = '↓';
    desce.title = 'Descer';
    desce.disabled = i === musicas.length - 1;
    desce.addEventListener('click', () => moverMusica(i, 1));

    const tira = document.createElement('button');
    tira.className = 'mini perigo';
    tira.textContent = '✕';
    tira.title = 'Remover';
    tira.addEventListener('click', async () => {
      await apagarMusica(musica.id);
      await desenharMusicas();
    });

    li.append(ordem, corpo, sobe, desce, tira);
    lista.append(li);
  });

  $('vazio-musicas').hidden = musicas.length > 0;
  atualizarContaTrilha();
}

async function moverMusica(i, passo) {
  const destino = i + passo;
  if (destino < 0 || destino >= musicas.length) return;
  const a = musicas[i], b = musicas[destino];
  const guardada = a.ordem;
  a.ordem = b.ordem;
  b.ordem = guardada;
  await gravarMusica(a);
  await gravarMusica(b);
  await desenharMusicas();
}

async function receberMusicas(arquivos) {
  const sons = [...arquivos].filter((a) => a.type.startsWith('audio/'));
  if (!sons.length) return;

  const progresso = $('progresso-musica');
  progresso.hidden = false;

  let ordem = musicas.length ? Math.max(...musicas.map((m) => m.ordem)) + 1 : 0;
  for (let i = 0; i < sons.length; i++) {
    progresso.textContent = `Guardando ${i + 1} de ${sons.length}…`;
    await guardarMusica({ ordem: ordem++, nome: sons[i].name, blob: sons[i] });
  }

  progresso.hidden = true;
  await desenharMusicas();
}

function atualizarContaTrilha() {
  const conta = $('conta-trilha');
  if (ajustes.fonte === 'arquivos') {
    conta.textContent = musicas.length === 0 ? 'sem música'
      : musicas.length === 1 ? '1 música' : musicas.length + ' músicas';
  } else {
    const total = ajustes.trilha.length;
    conta.textContent = total === 0 ? 'vazia' : total === 1 ? '1 entrada' : total + ' entradas';
  }
}

function atualizarFonte() {
  $('bloco-musicas').hidden = ajustes.fonte !== 'arquivos';
  $('bloco-youtube').hidden = ajustes.fonte !== 'youtube';
  atualizarContaTrilha();
}

/* ------------------------------------------------------------
   Tela de configuração — fotos
   ------------------------------------------------------------ */

let paginas = [];
let urlsDaGrade = [];

async function desenharFotos() {
  paginas = await lerPaginas();

  urlsDaGrade.forEach(URL.revokeObjectURL);
  urlsDaGrade = [];

  const grade = $('grade-fotos');
  grade.textContent = '';

  for (let i = 0; i < paginas.length; i++) {
    const pagina = paginas[i];

    const cartao = document.createElement('div');
    cartao.className = 'cartao';

    const img = document.createElement('img');
    img.className = 'cartao-imagem';
    img.loading = 'lazy';
    img.alt = pagina.nome || 'Foto ' + (i + 1);
    const fonte = pagina.miniatura || await lerArquivo(pagina.id);
    if (fonte) {
      const url = URL.createObjectURL(fonte);
      urlsDaGrade.push(url);
      img.src = url;
    }

    const pe = document.createElement('div');
    pe.className = 'cartao-pe';

    const ordem = document.createElement('span');
    ordem.className = 'cartao-ordem';
    ordem.textContent = String(i + 1).padStart(2, '0');

    const antes = document.createElement('button');
    antes.className = 'mini';
    antes.textContent = '←';
    antes.title = 'Antes';
    antes.disabled = i === 0;
    antes.addEventListener('click', () => moverFoto(i, -1));

    const depois = document.createElement('button');
    depois.className = 'mini';
    depois.textContent = '→';
    depois.title = 'Depois';
    depois.disabled = i === paginas.length - 1;
    depois.addEventListener('click', () => moverFoto(i, 1));

    const tira = document.createElement('button');
    tira.className = 'mini perigo';
    tira.textContent = '✕';
    tira.title = 'Remover';
    tira.addEventListener('click', async () => {
      await apagarPagina(pagina.id);
      await desenharFotos();
    });

    pe.append(ordem, antes, depois, tira);
    cartao.append(img, pe);
    grade.append(cartao);
  }

  $('conta-fotos').textContent = paginas.length === 1 ? '1 foto' : paginas.length + ' fotos';
  $('ferramentas').hidden = paginas.length === 0;
}

async function moverFoto(i, passo) {
  const destino = i + passo;
  if (destino < 0 || destino >= paginas.length) return;
  const a = paginas[i], b = paginas[destino];
  const guardada = a.ordem;
  a.ordem = b.ordem;
  b.ordem = guardada;
  await gravarPagina(a);
  await gravarPagina(b);
  await desenharFotos();
}

async function ordenarPeloNome() {
  const ordenadas = [...paginas].sort((a, b) =>
    (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { numeric: true }));
  for (let i = 0; i < ordenadas.length; i++) {
    ordenadas[i].ordem = i;
    await gravarPagina(ordenadas[i]);
  }
  await desenharFotos();
}

async function receberArquivos(arquivos) {
  const imagens = [...arquivos].filter((a) => a.type.startsWith('image/'));
  if (!imagens.length) return;

  const progresso = $('progresso');
  progresso.classList.remove('atencao');
  progresso.hidden = false;

  let ordem = paginas.length ? Math.max(...paginas.map((p) => p.ordem)) + 1 : 0;
  let recusadas = 0;

  for (let i = 0; i < imagens.length; i++) {
    progresso.textContent = `Preparando ${i + 1} de ${imagens.length}…`;
    const pronta = await preparar(imagens[i]);
    if (!pronta) { recusadas++; continue; }
    await guardarNova(
      { ordem: ordem++, nome: imagens[i].name, miniatura: pronta.miniatura },
      pronta.grande
    );
  }

  // Formato que o navegador não decodifica passa pelo filtro de tipo e
  // some na hora de preparar. Quem arrastou trinta fotos e viu vinte e
  // sete precisa saber o que aconteceu com as outras três.
  if (recusadas) {
    const quantas = recusadas === 1 ? '1 foto ficou' : `${recusadas} fotos ficaram`;
    progresso.classList.add('atencao');
    progresso.textContent = `${quantas} de fora: o navegador não abriu o arquivo. ` +
      'Formatos como HEIC, o padrão do iPhone, precisam virar JPEG antes.';
  } else {
    progresso.hidden = true;
    progresso.textContent = '';
  }

  await desenharFotos();
}

/* ------------------------------------------------------------
   Imagens avulsas: logotipo e abertura
   ------------------------------------------------------------ */

const urlsAvulsas = {};

async function desenharAvulsa(chave, idMostra, idTirar) {
  const mostra = $(idMostra);
  const blob = await lerImagem(chave);

  if (urlsAvulsas[chave]) {
    URL.revokeObjectURL(urlsAvulsas[chave]);
    delete urlsAvulsas[chave];
  }

  mostra.textContent = '';
  if (chave === 'logo') mostra.classList.toggle('com-fundo', ajustes.logoFundo);
  if (blob) {
    const url = URL.createObjectURL(blob);
    urlsAvulsas[chave] = url;
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    mostra.append(img);
    $(idTirar).hidden = false;
  } else {
    const vazio = document.createElement('span');
    vazio.className = 'imagem-vazia';
    vazio.textContent = chave === 'logo' ? 'Sem logotipo' : 'Sem imagem';
    mostra.append(vazio);
    $(idTirar).hidden = true;
  }
}

async function receberAvulsa(chave, arquivo, idMostra, idTirar) {
  if (!arquivo || !arquivo.type.startsWith('image/')) return;
  await guardarImagem(chave, arquivo);
  await desenharAvulsa(chave, idMostra, idTirar);
}

function atualizarPainelAbertura() {
  $('bloco-abertura').hidden = !ajustes.abertura;
  $('conta-abertura').textContent = ajustes.abertura
    ? ajustes.aberturaSegundos + 's antes de começar'
    : 'desligada';
}

/* ------------------------------------------------------------
   Tela de exibição
   ------------------------------------------------------------ */

let exibindo = false;
let sequencia = [];
let posicao = 0;
let camadaA = true;
let trocando = false;
let pausado = false;
let relogioSlide = null;
let relogioHora = null;
let relogioAtalhos = null;
let travaDeTela = null;

const cacheDeUrls = new Map();
const TETO_DO_CACHE = 4;

let filaDeSom = [];
let urlDaMusica = null;
let indiceDaMusica = 0;

let urlDoLogo = null;
let urlDaAbertura = null;
let relogioAbertura = null;
let naAbertura = false;

let temPlayer = false;
let relogioBotaoVideo = null;

/* A disposição escolhida nos ajustes é o estado inicial, não uma
   sentença. Durante a exibição são duas decisões independentes: T troca
   quem ocupa a tela, V mostra e esconde quem fica no canto. É o que
   permite chamar o player, clicar em "Pular anúncio" e sumir com ele, ou
   pôr o jogo em tela cheia no meio da festa. Nada disso é salvo — a
   exibição seguinte recomeça pelos ajustes. */
function aplicarDisposicao() {
  const palco = $('palco');
  palco.dataset.principal = ajustes.principal;
  palco.dataset.secundario = ajustes.secundario ? 'sim' : 'nao';
}

function trocarPrincipal() {
  if (!podeMexerNaTela()) return;

  const palco = $('palco');
  palco.dataset.principal = palco.dataset.principal === 'video' ? 'fotos' : 'video';
  atualizarControles();
  despertarControles();
}

function alternarVideo() {
  if (!podeMexerNaTela()) return;

  const palco = $('palco');
  palco.dataset.secundario = palco.dataset.secundario === 'sim' ? 'nao' : 'sim';
  atualizarControles();
  despertarControles();
}

// Sem player não há duas coisas para arranjar na tela, e mexer nisso só
// levaria a uma tela preta ou a uma caixa vazia na TV.
const podeMexerNaTela = () => exibindo && temPlayer && !naAbertura;

/* Cada botão nomeia o destino, não só o conteúdo. Dizer "mostrar fotos"
   nos dois seria ambíguo com o vídeo sozinho na tela: as duas ações
   fazem a foto aparecer, e o que muda é onde ela vai parar.
   Para esconder não é preciso nomear o quê — só existe uma telinha. */
function atualizarControles() {
  const palco = $('palco');
  const outro = palco.dataset.principal === 'video' ? 'Fotos' : 'Vídeo';

  $('btn-trocar').textContent = `${outro} na tela toda`;
  $('btn-video').textContent = palco.dataset.secundario === 'sim'
    ? 'Esconder a telinha'
    : `${outro} na telinha`;
}

function despertarControles() {
  const controles = $('controles-tela');
  controles.classList.remove('some');
  clearTimeout(relogioBotaoVideo);

  // Com o vídeo ocupando a tela, estes botões são a única superfície
  // clicável fora do player. Se sumissem, um clique no vídeo prenderia o
  // foco do teclado no iframe sem deixar por onde recuperá-lo — e é o
  // botão de trocar que tira você desse modo sem o teclado.
  if ($('palco').dataset.principal === 'video') return;

  relogioBotaoVideo = setTimeout(() => controles.classList.add('some'), 3000);
}

async function urlDe(id) {
  if (cacheDeUrls.has(id)) {
    const url = cacheDeUrls.get(id);
    cacheDeUrls.delete(id);
    cacheDeUrls.set(id, url);
    return url;
  }
  const blob = await lerArquivo(id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  cacheDeUrls.set(id, url);
  while (cacheDeUrls.size > TETO_DO_CACHE) {
    const maisAntiga = cacheDeUrls.keys().next().value;
    URL.revokeObjectURL(cacheDeUrls.get(maisAntiga));
    cacheDeUrls.delete(maisAntiga);
  }
  return url;
}

function limparCache() {
  cacheDeUrls.forEach(URL.revokeObjectURL);
  cacheDeUrls.clear();
}

/* Deixa a próxima foto pronta de verdade. Só criar o endereço não basta:
   a decodificação do JPEG só acontece quando alguém pede a imagem, e é
   ela que atrasa a troca. Decodificada aqui, entra na hora lá. */
async function aquecer(id) {
  try {
    const url = await urlDe(id);
    if (!url) return;
    const img = new Image();
    img.src = url;
    await img.decode();
  } catch { /* foto ruim: a vez dela chega e a ciranda segue */ }
}

/* Põe a foto na camada e só a revela depois de decodificada, senão o
   crossfade mostra uma camada vazia por um instante. */
async function revelar(camada, url) {
  camada.src = url;
  try { await camada.decode(); } catch { /* foto ruim: mostra assim mesmo */ }
  camada.classList.add('visivel');
}

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

async function montarSequencia() {
  const ids = await lerIdsEmOrdem();
  sequencia = ajustes.ordem === 'sorteada' ? embaralhar(ids) : ids;
}

async function iniciarExibicao() {
  // A tela cheia é pedida antes de qualquer espera. O Chrome só concede
  // enquanto o clique ainda vale, e ler o banco de uma ciranda grande e
  // ligar a trilha pode passar desse prazo.
  const telaCheia = document.documentElement.requestFullscreen?.();
  if (telaCheia) telaCheia.catch(() => { /* segue sem */ });

  await montarSequencia();

  $('config').hidden = true;
  $('exibicao').hidden = false;
  exibindo = true;
  aplicarDisposicao();

  await ligarTrilha();

  // Sem player não há o que arranjar na tela: o botão não aparece, a
  // barra não promete teclas que não fazem nada, e as fotos assumem —
  // senão escolher "o vídeo ocupa a tela" numa ciranda com trilha por
  // arquivos daria uma TV preta.
  temPlayer = !!$('som').querySelector('iframe');
  if (!temPlayer) {
    $('palco').dataset.principal = 'fotos';
    $('palco').dataset.secundario = 'nao';
  }
  $('controles-tela').hidden = !temPlayer;
  $('atalho-video').hidden = !temPlayer;
  $('atalho-trocar').hidden = !temPlayer;
  if (temPlayer) {
    atualizarControles();
    despertarControles();
  }

  limparCache();
  posicao = 0;
  camadaA = true;
  pausado = false;
  $('foto-a').classList.remove('visivel');
  $('foto-b').classList.remove('visivel');
  $('sem-foto').hidden = sequencia.length > 0;

  if (sequencia.length) {
    const url = await urlDe(sequencia[0]);
    if (url) await revelar($('foto-a'), url);
    if (sequencia.length > 1) aquecer(sequencia[1]);
  }

  await montarRodape();

  if (ajustes.rodapeHora) {
    atualizarHora();
    relogioHora = setInterval(atualizarHora, 15000);
  }

  await montarAbertura();

  const atalhos = $('atalhos');
  atalhos.classList.remove('some');
  clearTimeout(relogioAtalhos);
  relogioAtalhos = setTimeout(() => atalhos.classList.add('some'), 7000);

  if (!naAbertura) agendarProxima();

  try {
    if ('wakeLock' in navigator) travaDeTela = await navigator.wakeLock.request('screen');
  } catch { /* segue sem */ }
}

async function ligarTrilha() {
  const som = $('som');
  som.textContent = '';

  if (ajustes.fonte === 'youtube') {
    const endereco = enderecoDoPlayer(ajustes.trilha);
    if (!endereco) return;
    const quadro = document.createElement('iframe');
    quadro.src = endereco;
    quadro.allow = 'autoplay; encrypted-media';
    quadro.referrerPolicy = 'strict-origin-when-cross-origin';
    quadro.setAttribute('title', 'Trilha sonora');
    som.append(quadro);
    return;
  }

  filaDeSom = (await lerMusicas()).map((m) => m.blob);
  if (!filaDeSom.length) return;

  indiceDaMusica = 0;
  const tocador = $('tocador');
  tocador.volume = ajustes.volume / 100;
  tocador.onended = proximaMusica;
  await tocarMusica(0);
}

async function tocarMusica(i) {
  if (!filaDeSom.length) return;
  indiceDaMusica = (i + filaDeSom.length) % filaDeSom.length;

  if (urlDaMusica) URL.revokeObjectURL(urlDaMusica);
  urlDaMusica = URL.createObjectURL(filaDeSom[indiceDaMusica]);

  const tocador = $('tocador');
  tocador.src = urlDaMusica;
  try { await tocador.play(); } catch { /* o navegador segurou; o R religa */ }
}

const proximaMusica = () => tocarMusica(indiceDaMusica + 1);

function desligarTrilha() {
  const tocador = $('tocador');
  tocador.onended = null;
  tocador.pause();
  tocador.removeAttribute('src');
  tocador.load();
  if (urlDaMusica) { URL.revokeObjectURL(urlDaMusica); urlDaMusica = null; }
  filaDeSom = [];
  $('som').textContent = '';
}

async function montarRodape() {
  const logo = $('rodape-logo');
  if (urlDoLogo) { URL.revokeObjectURL(urlDoLogo); urlDoLogo = null; }

  const blob = await lerImagem('logo');
  if (blob) {
    urlDoLogo = URL.createObjectURL(blob);
    logo.src = urlDoLogo;
    logo.classList.toggle('com-fundo', ajustes.logoFundo);
    logo.hidden = false;
  } else {
    logo.removeAttribute('src');
    logo.hidden = true;
  }

  const nome = ajustes.rodapeNome ? (ajustes.nome || '') : '';
  $('rodape-nome').textContent = nome;
  $('rodape-hora').hidden = !ajustes.rodapeHora;
  if (!ajustes.rodapeHora) $('rodape-hora').textContent = '';

  // Rodapé vazio não precisa roubar altura da tela.
  $('rodape-tv').hidden = !blob && !nome && !ajustes.rodapeHora;
}

async function montarAbertura() {
  const painel = $('abertura');
  if (urlDaAbertura) { URL.revokeObjectURL(urlDaAbertura); urlDaAbertura = null; }

  const titulo = ajustes.aberturaTitulo || ajustes.nome || '';
  const sub = ajustes.aberturaSub || '';
  const blob = ajustes.abertura ? await lerImagem('abertura') : null;

  if (!ajustes.abertura || (!blob && !titulo && !sub)) {
    painel.hidden = true;
    naAbertura = false;
    return;
  }

  const foto = $('abertura-foto');
  if (blob) {
    urlDaAbertura = URL.createObjectURL(blob);
    foto.src = urlDaAbertura;
    foto.hidden = false;
  } else {
    foto.removeAttribute('src');
    foto.hidden = true;
  }

  $('abertura-titulo').textContent = titulo;
  $('abertura-sub').textContent = sub;
  painel.classList.remove('saindo');
  painel.hidden = false;
  naAbertura = true;

  relogioAbertura = setTimeout(encerrarAbertura, ajustes.aberturaSegundos * 1000);
}

function encerrarAbertura() {
  if (!naAbertura) return;
  naAbertura = false;
  clearTimeout(relogioAbertura);

  const painel = $('abertura');
  painel.classList.add('saindo');
  setTimeout(() => { painel.hidden = true; }, 900);

  agendarProxima();
}

function encerrarExibicao() {
  exibindo = false;
  clearTimeout(relogioSlide);
  clearInterval(relogioHora);
  clearTimeout(relogioAtalhos);
  clearTimeout(relogioAbertura);
  clearTimeout(relogioBotaoVideo);
  naAbertura = false;
  $('abertura').hidden = true;

  temPlayer = false;
  $('controles-tela').hidden = true;
  $('controles-tela').classList.remove('some');
  $('atalho-video').hidden = true;
  $('atalho-trocar').hidden = true;
  aplicarDisposicao();

  if (urlDoLogo) { URL.revokeObjectURL(urlDoLogo); urlDoLogo = null; }
  if (urlDaAbertura) { URL.revokeObjectURL(urlDaAbertura); urlDaAbertura = null; }

  desligarTrilha();
  $('foto-a').removeAttribute('src');
  $('foto-b').removeAttribute('src');
  limparCache();

  if (travaDeTela) { travaDeTela.release().catch(() => {}); travaDeTela = null; }
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

  $('exibicao').hidden = true;
  $('config').hidden = false;
  desenharFotos();
}

function agendarProxima() {
  clearTimeout(relogioSlide);
  if (pausado || naAbertura || sequencia.length < 2) return;
  relogioSlide = setTimeout(() => avancar(1), ajustes.intervalo * 1000);
}

async function avancar(passo) {
  if (!sequencia.length || trocando) return;
  trocando = true;

  try {
    const anterior = posicao;
    posicao = (posicao + passo + sequencia.length) % sequencia.length;

    // Uma volta completa numa ciranda sorteada pede um novo sorteio.
    if (ajustes.ordem === 'sorteada' && passo > 0 && posicao === 0 && anterior !== 0) {
      sequencia = embaralhar(sequencia);
    }

    const url = await urlDe(sequencia[posicao]);
    if (url) {
      const entra = camadaA ? $('foto-b') : $('foto-a');
      const sai = camadaA ? $('foto-a') : $('foto-b');
      await revelar(entra, url);
      sai.classList.remove('visivel');
      camadaA = !camadaA;
    }

    if (sequencia.length > 1) aquecer(sequencia[(posicao + 1) % sequencia.length]);
  } catch {
    // Uma foto que não abre não pode parar a ciranda: fica a anterior na
    // tela e a próxima volta tenta a seguinte.
  } finally {
    trocando = false;
    agendarProxima();
  }
}

function atualizarHora() {
  $('rodape-hora').textContent = new Date()
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

document.addEventListener('keydown', (evento) => {
  if (!exibindo) return;
  const tecla = evento.key;

  if (tecla === 'Escape') { encerrarExibicao(); return; }

  if (naAbertura && ['ArrowRight', 'ArrowLeft', ' ', 'Enter'].includes(tecla)) {
    evento.preventDefault();
    encerrarAbertura();
    return;
  }

  if (tecla === 'ArrowRight') { avancar(1); return; }
  if (tecla === 'ArrowLeft') { avancar(-1); return; }

  if (tecla === ' ') {
    evento.preventDefault();
    pausado = !pausado;
    agendarProxima();
    return;
  }

  if (tecla === 't' || tecla === 'T') { trocarPrincipal(); return; }

  if (tecla === 'v' || tecla === 'V') { alternarVideo(); return; }

  if (tecla === 'r' || tecla === 'R') {
    if (ajustes.fonte === 'youtube') {
      const quadro = $('som').querySelector('iframe');
      if (quadro) quadro.src = quadro.src;
    } else {
      tocarMusica(0);
    }
  }
});

/* ------------------------------------------------------------
   Ligações da interface
   ------------------------------------------------------------ */

function ligarInterface() {
  document.querySelectorAll('input[name="fonte"]').forEach((opcao) => {
    opcao.addEventListener('change', () => {
      if (!opcao.checked) return;
      ajustes.fonte = opcao.value;
      salvarAjustes();
      atualizarFonte();
    });
  });

  const soltaMusica = $('solta-musica');
  const campoMusicas = $('campo-musicas');
  soltaMusica.addEventListener('click', () => campoMusicas.click());
  soltaMusica.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); campoMusicas.click(); }
  });
  campoMusicas.addEventListener('change', async () => {
    await receberMusicas(campoMusicas.files);
    campoMusicas.value = '';
  });
  ['dragenter', 'dragover'].forEach((evt) =>
    soltaMusica.addEventListener(evt, (e) => { e.preventDefault(); soltaMusica.classList.add('ativa'); }));
  ['dragleave', 'drop'].forEach((evt) =>
    soltaMusica.addEventListener(evt, () => soltaMusica.classList.remove('ativa')));
  soltaMusica.addEventListener('drop', async (e) => {
    e.preventDefault();
    await receberMusicas(e.dataTransfer.files);
  });

  const volume = $('campo-volume');
  volume.addEventListener('input', () => {
    ajustes.volume = Number(volume.value);
    $('saida-volume').textContent = ajustes.volume + '%';
    $('tocador').volume = ajustes.volume / 100;
    salvarAjustes();
  });

  $('btn-add-link').addEventListener('click', adicionarLink);
  $('campo-link').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') adicionarLink();
  });

  const solta = $('solta');
  const campoFotos = $('campo-fotos');
  solta.addEventListener('click', () => campoFotos.click());
  solta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); campoFotos.click(); }
  });
  campoFotos.addEventListener('change', async () => {
    await receberArquivos(campoFotos.files);
    campoFotos.value = '';
  });

  ['dragenter', 'dragover'].forEach((evt) =>
    solta.addEventListener(evt, (e) => { e.preventDefault(); solta.classList.add('ativa'); }));
  ['dragleave', 'drop'].forEach((evt) =>
    solta.addEventListener(evt, () => solta.classList.remove('ativa')));
  solta.addEventListener('drop', async (e) => {
    e.preventDefault();
    await receberArquivos(e.dataTransfer.files);
  });

  $('btn-ordenar').addEventListener('click', ordenarPeloNome);
  $('btn-limpar').addEventListener('click', async () => {
    if (!confirm('Remover todas as fotos? Não dá para desfazer.')) return;
    await apagarTudo();
    await desenharFotos();
  });

  const intervalo = $('campo-intervalo');
  intervalo.addEventListener('input', () => {
    ajustes.intervalo = Number(intervalo.value);
    $('saida-intervalo').textContent = ajustes.intervalo + 's';
    salvarAjustes();
  });

  document.querySelectorAll('input[name="ordem"]').forEach((opcao) => {
    opcao.addEventListener('change', () => {
      if (!opcao.checked) return;
      ajustes.ordem = opcao.value;
      salvarAjustes();
    });
  });

  document.querySelectorAll('input[name="principal"]').forEach((opcao) => {
    opcao.addEventListener('change', () => {
      if (!opcao.checked) return;
      ajustes.principal = opcao.value;
      salvarAjustes();
    });
  });

  $('campo-secundario').addEventListener('change', () => {
    ajustes.secundario = $('campo-secundario').checked;
    salvarAjustes();
  });

  $('campo-nome').addEventListener('input', () => {
    ajustes.nome = $('campo-nome').value;
    salvarAjustes();
  });

  $('campo-rodape-nome').addEventListener('change', () => {
    ajustes.rodapeNome = $('campo-rodape-nome').checked;
    salvarAjustes();
  });

  $('campo-rodape-hora').addEventListener('change', () => {
    ajustes.rodapeHora = $('campo-rodape-hora').checked;
    salvarAjustes();
  });

  $('btn-logo').addEventListener('click', () => $('campo-logo').click());
  $('campo-logo').addEventListener('change', async () => {
    await receberAvulsa('logo', $('campo-logo').files[0], 'mostra-logo', 'btn-logo-tirar');
    $('campo-logo').value = '';
  });
  $('campo-logo-fundo').addEventListener('change', async () => {
    ajustes.logoFundo = $('campo-logo-fundo').checked;
    salvarAjustes();
    await desenharAvulsa('logo', 'mostra-logo', 'btn-logo-tirar');
  });

  $('btn-logo-tirar').addEventListener('click', async () => {
    await apagarImagem('logo');
    await desenharAvulsa('logo', 'mostra-logo', 'btn-logo-tirar');
  });

  $('campo-abertura').addEventListener('change', () => {
    ajustes.abertura = $('campo-abertura').checked;
    salvarAjustes();
    atualizarPainelAbertura();
  });

  $('btn-abertura').addEventListener('click', () => $('campo-abertura-imagem').click());
  $('campo-abertura-imagem').addEventListener('change', async () => {
    await receberAvulsa('abertura', $('campo-abertura-imagem').files[0], 'mostra-abertura', 'btn-abertura-tirar');
    $('campo-abertura-imagem').value = '';
  });
  $('btn-abertura-tirar').addEventListener('click', async () => {
    await apagarImagem('abertura');
    await desenharAvulsa('abertura', 'mostra-abertura', 'btn-abertura-tirar');
  });

  $('campo-abertura-titulo').addEventListener('input', () => {
    ajustes.aberturaTitulo = $('campo-abertura-titulo').value;
    salvarAjustes();
  });

  $('campo-abertura-sub').addEventListener('input', () => {
    ajustes.aberturaSub = $('campo-abertura-sub').value;
    salvarAjustes();
  });

  const tempoAbertura = $('campo-abertura-tempo');
  tempoAbertura.addEventListener('input', () => {
    ajustes.aberturaSegundos = Number(tempoAbertura.value);
    $('saida-abertura-tempo').textContent = ajustes.aberturaSegundos + 's';
    salvarAjustes();
    atualizarPainelAbertura();
  });

  $('btn-exibir').addEventListener('click', iniciarExibicao);

  $('btn-trocar').addEventListener('click', trocarPrincipal);
  $('btn-video').addEventListener('click', alternarVideo);

  // Com o vídeo ocupando a tela, um clique no player prende o foco do
  // teclado no iframe e o Esc da Ciranda não chega mais. O Esc do
  // navegador ainda sai da tela cheia, e é por aqui que isso vira o
  // encerramento de verdade em vez de uma exibição pela metade.
  document.addEventListener('fullscreenchange', () => {
    if (exibindo && !document.fullscreenElement) encerrarExibicao();
  });

  $('exibicao').addEventListener('mousemove', () => {
    if (exibindo && temPlayer) despertarControles();
  });

  // Clicar dentro do player entrega o foco ao iframe, e a partir daí o
  // navegador manda as teclas para o YouTube: Esc e as setas param de
  // responder. Quando o mouse sai da telinha, o teclado volta a ser da
  // Ciranda.
  $('som').addEventListener('mouseleave', () => {
    if (exibindo) $('palco').focus();
  });
}

async function comecar() {
  $('alerta-arquivo').hidden = location.protocol !== 'file:';

  // Sem isto, o navegador pode descartar as fotos quando o disco apertar.
  // Instalada como aplicativo, a Ciranda quase sempre recebe a permissão.
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted()
      .then((jaTem) => jaTem || navigator.storage.persist())
      .catch(() => {});
  }

  await lerAjustes();

  $('campo-intervalo').value = ajustes.intervalo;
  $('saida-intervalo').textContent = ajustes.intervalo + 's';
  $('campo-nome').value = ajustes.nome;
  $('campo-rodape-nome').checked = ajustes.rodapeNome;
  $('campo-logo-fundo').checked = ajustes.logoFundo;
  $('campo-rodape-hora').checked = ajustes.rodapeHora;
  $('campo-abertura').checked = ajustes.abertura;
  $('campo-abertura-titulo').value = ajustes.aberturaTitulo;
  $('campo-abertura-sub').value = ajustes.aberturaSub;
  $('campo-abertura-tempo').value = ajustes.aberturaSegundos;
  $('saida-abertura-tempo').textContent = ajustes.aberturaSegundos + 's';
  atualizarPainelAbertura();

  $('campo-volume').value = ajustes.volume;
  $('saida-volume').textContent = ajustes.volume + '%';
  const fonteEscolhida = document.querySelector(`input[name="fonte"][value="${ajustes.fonte}"]`);
  if (fonteEscolhida) fonteEscolhida.checked = true;

  const ordemEscolhida = document.querySelector(`input[name="ordem"][value="${ajustes.ordem}"]`);
  if (ordemEscolhida) ordemEscolhida.checked = true;
  const principalEscolhido = document.querySelector(`input[name="principal"][value="${ajustes.principal}"]`);
  if (principalEscolhido) principalEscolhido.checked = true;
  $('campo-secundario').checked = ajustes.secundario;
  aplicarDisposicao();

  desenharTrilha();
  await desenharMusicas();
  atualizarFonte();
  await desenharFotos();
  await desenharAvulsa('logo', 'mostra-logo', 'btn-logo-tirar');
  await desenharAvulsa('abertura', 'mostra-abertura', 'btn-abertura-tirar');
  ligarInterface();

  // Marca que a montagem terminou: daqui em diante os botões respondem.
  document.documentElement.dataset.pronta = '1';
}

comecar();
