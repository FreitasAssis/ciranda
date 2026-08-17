# Ciranda

Página web que passa suas fotos em tela cheia com música tocando por trás. A
tela vai para a TV como uma aba só — som e imagem juntos, sem precisar de
aparelho nenhum além do Chromecast que você já tem.

Serve para o cardápio de um restaurante, para as fotos de um aniversário, para
o portfólio na parede do estúdio, para os imóveis na vitrine. É a mesma
ciranda: fotos girando, música tocando.

Site estático, sem servidor e sem conta. As fotos, as músicas e os ajustes
ficam no navegador de quem usa e não saem dali.

**No ar em [freitasassis.github.io/ciranda](https://freitasassis.github.io/ciranda/).**

Feito por [Luiz Freitas](https://luizfreitas.com.br/). Licença MIT.

---

## Abrir e instalar

Abra o endereço da Ciranda no Chrome. Não precisa de conta nem de instalação
para usar.

Para ter um ícone e não depender de favorito, clique no botão de instalar que
aparece na barra de endereço, ou vá em **⋮ → Transmitir, salvar e compartilhar
→ Instalar página como app**. Instalada, ela abre em janela própria e o
navegador passa a proteger as fotos guardadas de serem descartadas quando o
disco apertar.

## Montar a ciranda

**Trilha.** A música pode vir de duas fontes.

*YouTube* é a opção que já vem escolhida, e é o caminho mais rápido: cole o
link de um vídeo ou de uma playlist e pronto. Vários vídeos tocam em sequência
e recomeçam do primeiro. Uma playlist inteira toca sozinha — se houver uma
playlist na lista, as outras entradas ficam de fora.

*Arquivos de música* é a opção para quando não se pode depender da internet,
ou quando a trilha precisa ser exatamente aquela. Arraste os arquivos como faz
com as fotos. Eles tocam na ordem da lista, recomeçam do primeiro ao terminar,
e há um controle de volume.

**Fotos.** Arraste quantas quiser, inclusive centenas de uma vez. Cada foto é
reduzida na importação, então o banco fica leve e a TV continua com imagem
boa. Durante a exibição só a foto que está na tela fica carregada, mais a
seguinte, já pronta para a troca não piscar.

Se as fotos vieram da câmera com nomes como `IMG_0001`, o botão **Ordenar
pelo nome do arquivo** coloca tudo em ordem cronológica de uma vez.

**Ajustes.** Tempo de cada foto, ordem, disposição na tela e o rodapé.

Sobre a ordem: **na ordem** segue a lista de cima para baixo, que é o que
cardápio, catálogo e portfólio querem. **Sorteada** embaralha e sorteia de
novo a cada volta completa, que é o que festa e retrospectiva querem.

**Rodapé.** Aceita um logotipo, um nome, e a hora — cada um pode ser ligado
ou desligado por conta própria. O relógio faz sentido num restaurante e é
estranho num casamento, então fica a seu critério. Sem nada ligado, a faixa
some e as fotos ficam com a tela inteira.

O logotipo é guardado exatamente como veio: sem redimensionar e sem
converter. É por isso que um PNG com fundo transparente continua transparente
sobre o rodapé, em vez de ganhar um retângulo branco em volta.

Logotipo escuro some no rodapé grafite. Para esse caso existe a **plaquinha
clara**, que põe um retângulo de fundo atrás dele. A prévia ao lado do botão
mostra o resultado exato antes de você transmitir.

**Abertura.** Uma tela de apresentação que aparece por alguns segundos antes
da ciranda começar, com uma imagem ocupando tudo e um título por cima. A
música já entra junto com ela. Serve para o nome dos noivos, para o nome da
festa, para a capa do catálogo. Qualquer seta ou a barra de espaço pula
direto para as fotos.

Tudo fica salvo no próprio computador. Não sai dali e não vai para servidor
nenhum.

## Transmitir para a TV

1. Clique em **Iniciar exibição**. A tela entra em tela cheia e a música começa.
2. No Chrome: menu **⋮ → Transmitir**.
3. Em **Origens**, escolha **Transmitir aba**.
4. Escolha o Chromecast.

O áudio da aba vai junto automaticamente. Se aparecer uma opção de enviar o
som, deixe marcada.

Enquanto estiver transmitindo, deixe a janela do Chrome visível na tela do
computador. Minimizada, o Chrome economiza recursos e a troca de fotos pode
ficar irregular.

Transmitir aba é recurso de desktop. No celular a Ciranda serve para montar,
não para exibir na TV.

### Teclas durante a exibição

| Tecla | O que faz |
|---|---|
| `Esc` | Sai da exibição e volta para os ajustes |
| `→` ou `Espaço` | Durante a abertura, pula direto para as fotos |
| `←` `→` | Foto anterior / próxima |
| `Espaço` | Pausa e retoma a troca automática |
| `R` | Religa a trilha do começo |

## Se algo não funcionar

**A música não começa sozinha.**
Precisa haver um clique na página antes do som. Se o navegador segurar,
aperte `Esc` e clique em Iniciar exibição de novo, ou aperte `R` durante a
exibição.

**O arquivo de música não aparece na lista.**
A Ciranda só aceita o que o navegador sabe tocar. MP3, M4A, OGG e WAV
funcionam. Formatos como FLAC e WMA podem ser recusados.

**Algumas fotos ficaram de fora, e apareceu um recado embaixo do campo.**
O navegador não abriu aquelas. O caso mais comum é HEIC, que é o formato
padrão da câmera do iPhone. No próprio iPhone, em **Ajustes → Câmera →
Formatos**, a opção **Mais compatível** passa a gerar JPEG. Para as fotos
que já existem, vale exportar como JPEG antes de arrastar.

**As fotos aparecem, mas sem som na TV.**
A transmissão foi feita como "Transmitir arquivo" ou "Transmitir site" em vez
de **Transmitir aba**. Pare e refaça pela opção de aba.

**O player do YouTube aparece preto ou diz que o vídeo não está disponível.**
Alguns vídeos são bloqueados pelo dono para tocar fora do YouTube. Troque por
outro vídeo ou playlist — as playlists oficiais de música quase sempre
funcionam.

**O computador dorme no meio do evento.**
A Ciranda pede para o sistema manter a tela acesa, mas alguns computadores
ignoram. Vale desligar a suspensão automática nas configurações de energia.

**A trilha parou depois de horas tocando.**
Aperte `R` na tela de exibição, ou saia e entre de novo.

## Música em ambiente comercial

Som ambiente em estabelecimento comercial no Brasil passa pelo ECAD, e os
termos do YouTube são de uso pessoal. Para um restaurante ficar em dia,
serviços como Spotify, Deezer ou Superplayer têm planos comerciais que já
incluem a parte de direitos. Nesse caso a ideia continua valendo: abra o
serviço em outra aba, deixe tocando, e transmita a aba da Ciranda com as
fotos. Para uso doméstico — festa, casamento, aniversário — isso não se
aplica.

## Guardado onde

Tudo fica no navegador deste computador: fotos, músicas, logotipo e ajustes.
Nada vai para servidor nenhum, e por isso mesmo nada sincroniza entre
aparelhos — uma ciranda montada no celular não aparece no computador.

Limpar os dados de navegação do site apaga a ciranda. Mantenha as fotos
originais em outra pasta.

---

# Para quem mexe no código

## Publicar no GitHub Pages

1. Crie um repositório e suba o conteúdo desta pasta na raiz.
2. Em **Settings → Pages**, escolha a branch (`main`) e a pasta `/ (root)`.
3. Aguarde alguns minutos. O endereço será `https://SEU-USUARIO.github.io/ciranda/`.

Precisa ser `https://`. Aberta direto do disco, com `file://`, a página avisa e
o player do YouTube não funciona — ele exige uma origem de verdade.

## Estrutura

```
index.html            a página inteira: configuração e exibição
app.css               estilos
app.js                toda a lógica
manifest.webmanifest  nome e ícones para instalar como aplicativo
sw.js                 guarda a casca para abrir offline e permitir instalar
icones/               16, 48, 128 e 512
testes/               testes de navegador, não vão para o ar
```

O que é publicado não tem build, dependência nem etapa de compilação: editar e
publicar. O `package.json` existe só para os testes.

## Testes

[![testes](https://github.com/FreitasAssis/ciranda/actions/workflows/testes.yml/badge.svg)](https://github.com/FreitasAssis/ciranda/actions/workflows/testes.yml)

Rodam num Chromium de verdade, porque tudo que importa aqui é comportamento de
navegador: tela cheia, IndexedDB, decodificação de imagem e o trabalhador de
serviço. Nada disso um teste de mentirinha pega.

```
npm install
npx playwright install chromium
npm run teste
```

`npm run teste:ver` abre o navegador para acompanhar. A cada push em `main` e
em cada pull request a suíte roda sozinha pelo GitHub Actions; quando falha,
o rastro das falhas fica anexado à execução.

## Decisões que valem saber

**Por que não é extensão do Chrome.** Era, até descobrir que o Chrome não
envia cabeçalho de referência para iframes dentro de páginas de extensão. Sem
esse cabeçalho o YouTube recusa o player com o erro 153, e não há atributo que
resolva. Servida de `https://`, a mesma página funciona.

**Por que as fotos são reduzidas na importação e o logotipo não.** Foto vira
JPEG de no máximo 2400px, o que sobra para uma TV e mantém o banco leve. O
logotipo é guardado exatamente como veio, senão um PNG transparente ganharia
fundo branco.

**Por que só uma foto fica carregada por vez.** Um álbum de festa passa de
centenas de imagens. A exibição lê apenas a lista de identificadores e mantém
no máximo quatro imagens em memória, sempre com a próxima já decodificada para
a transição não piscar. Criar o endereço da imagem não basta: a decodificação
do JPEG só acontece quando alguém pede a imagem, e é ela que atrasa a troca.

**Por que a tela cheia é pedida antes de tudo.** O Chrome só concede enquanto o
clique do usuário ainda vale, cerca de cinco segundos. Ler o banco de uma
ciranda grande e ligar a trilha pode passar disso, e aí a exibição abriria
dentro da aba — justamente na hora de transmitir. O pedido vem antes de
qualquer espera, e não deve voltar para o fim da função.

**Por que a moldura é cinza neutro.** É moldura de galeria: quando a foto não
preenche a tela, o que sobra não deve competir com a cor da foto.
