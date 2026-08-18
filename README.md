# Ciranda

Página web que passa suas fotos em tela cheia com música tocando por trás. A
tela vai para a TV com som e imagem juntos — por Chromecast, pelo espelhamento
do próprio sistema, ou por um cabo HDMI.

Serve para o cardápio de um restaurante, para as fotos de um aniversário, para
o portfólio na parede do estúdio, para os imóveis na vitrine. É a mesma
ciranda: fotos girando, música tocando.

Site estático, sem servidor e sem conta. As fotos, as músicas e os ajustes
ficam no navegador de quem usa e não saem dali.

**No ar em [freitasassis.github.io/ciranda](https://freitasassis.github.io/ciranda/).**

Feito por [Luiz Freitas](https://luizfreitas.com.br/). Licença MIT.

---

## Abrir e instalar

Abra o endereço da Ciranda no navegador. Não precisa de conta nem de
instalação para usar. O Chrome é o mais completo, por ser o que transmite
direto para Chromecast; nos outros caminhos qualquer navegador serve.

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

Há três caminhos, e qual serve depende da TV, não da Ciranda. A mesma
explicação fica na tela de ajustes, no painel **Transmitir para a TV**, que
começa recolhido. Em todos: se aparecer uma opção de enviar o áudio junto,
deixe marcada — é ela que leva a música.

A transmissão pode ser ligada antes de iniciar a exibição ou já com ela
rodando. A exibição não entra em tela cheia sozinha, então a barra do navegador
continua à vista.

### 1. Pelo navegador, para Chromecast

Serve para o Chromecast de pendurar na TV e para as TVs com **Chromecast
integrado**: Sony, Philips, TCL, Hisense, e as LG de 2024 em diante. Vai só o
conteúdo da aba — a barra do navegador e o resto da área de trabalho não
aparecem na TV.

| Navegador | Caminho |
|---|---|
| Chrome | **⋮ → Transmitir, salvar e compartilhar → Transmitir**, e em **Origens** escolha **Transmitir aba** |
| Edge | **⋯ → Mais ferramentas → Transmitir mídia no dispositivo** (varia com a versão) |
| Brave, Opera, Vivaldi | Parentes do Chrome, mesmo caminho com outro nome de menu |
| Firefox | Não fala Google Cast — use outro navegador, ou os caminhos 2 e 3 |

### 2. Pelo sistema, para as outras TVs

Samsung, LG mais antigas, Roku, Fire TV e Apple TV **não respondem** ao menu do
navegador. Nesses casos quem espelha é o sistema — o que funciona com qualquer
navegador, inclusive o Firefox.

| Sistema | Caminho |
|---|---|
| Windows | **Win + K** e escolha a TV. É o Miracast, que Samsung, LG e Sony aceitam há bastante tempo |
| Mac | Central de Controle → **Espelhamento de Tela**. É o AirPlay, da Apple TV e das Samsung, LG, Sony e Vizio de 2019 em diante |

Aqui vai a **tela inteira**, não só a aba: uma notificação que chegue aparece
na TV no meio da festa. Vale ligar o "não perturbe" antes.

### 3. Cabo HDMI

Qualquer TV, qualquer navegador, sem rede e sem atraso. É o caminho mais seguro
quando o evento não pode falhar, e o único que não depende de Wi-Fi bom.

Nos caminhos sem fio, mantenha a janela do navegador visível: minimizada, ele
economiza recursos e a troca de fotos fica irregular.

Transmitir aba é recurso de desktop. No celular a Ciranda serve para montar,
não para exibir na TV.

### Teclas durante a exibição

| Tecla | O que faz |
|---|---|
| `Esc` | Sai da exibição e volta para os ajustes |
| `→` ou `Espaço` | Durante a abertura, pula direto para as fotos |
| `←` `→` | Foto anterior / próxima |
| `Espaço` | Pausa e retoma a troca automática |
| `F` | Entra e sai da tela cheia |
| `T` | Troca quem ocupa a tela toda: as fotos ou o vídeo |
| `V` | Mostra e esconde a telinha do canto |
| `R` | Religa a trilha do começo |

A mesma lista fica na tela de ajustes, no painel **Durante a exibição**.

**Arranjar a tela.** São duas decisões independentes: quem ocupa a tela e se o
outro aparece num canto. Daí saem as quatro combinações — só as fotos, fotos
com a telinha do vídeo, vídeo com a fotinha, só o vídeo.

O escolhido nos ajustes é o ponto de partida. Durante a exibição, `T` e `V`
mudam isso na hora, e a mudança não fica salva. Cada tecla tem seu par na tela
— botões empilhados logo acima da telinha, à direita, que aparecem quando o
mouse mexe e somem sozinhos. Cada um traz no rótulo a tecla que faz a mesma
coisa, então uma olhada basta para nunca mais precisar do botão.

Ficam ali, e não no rodapé, porque com o vídeo ocupando a tela o rodapé inteiro
pertence ao player: barra de progresso, tempo e play. O topo também é dele, com
o título de um lado e volume, legendas e ajustes do outro.

Serve para pôr o jogo em tela cheia no meio da festa e devolver as fotos
depois, ou para chamar o player só o tempo de clicar em **Pular anúncio**, que
é um botão do YouTube e só o mouse alcança.

Uma limitação a conhecer: com o vídeo ocupando a tela e a telinha escondida, os
botões não voltam pelo mouse depois de sumirem. O player cobre tudo e engole o
movimento antes que a Ciranda o veja. As teclas continuam funcionando, e com a
telinha à mostra o mouse por cima dela traz os botões de volta.

Se um clique no player prender o foco do teclado, duas coisas o devolvem: sair
da tela cheia e afastar o mouse do player.

Com a trilha vindo de arquivos de música não há o que trocar: `T` e `V` não
fazem nada e o botão não aparece.

**Tela cheia é sob demanda**, pela tecla `F` ou pelo botão. Ela serve ao
computador de quem opera, não à TV: transmitir aba manda o conteúdo da aba, e a
barra do navegador não vai junto de um jeito nem de outro. Sair da tela cheia
não encerra a exibição — sair costuma ser justamente para mexer no navegador.

**Depois de mexer no player, afaste o mouse dele.** Enquanto o cursor está em
cima, o teclado pertence ao YouTube, e é ao sair que `Esc` e as setas voltam a
ser da Ciranda. Sair da tela cheia também devolve o teclado. Para voltar aos
ajustes, `Esc`.

## Se algo não funcionar

**A música não começa sozinha.**
Precisa haver um clique na página antes do som, e o player leva alguns
segundos para engatar — vale esperar até uns cinco antes de concluir que
travou. Se o navegador tiver mesmo segurado, aperte `V` para chamar a telinha
e dê play nela. `R` também religa, mas volta a trilha para o começo.

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

## Estrutura

```
index.html            a página inteira: configuração e exibição
app.css               estilos
app.js                toda a lógica
manifest.webmanifest  nome e ícones para instalar como aplicativo
sw.js                 guarda a casca para abrir offline e permitir instalar
icones/               ícones 16, 48, 128 e 512, e a capa do compartilhamento
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

**Por que as metatags de compartilhamento usam URL absoluta.** Quem lê `og:` e
`twitter:` são os robôs do WhatsApp, do LinkedIn e do Slack, que não executam
JavaScript nem resolvem caminho relativo. Se o endereço publicado mudar, essas
URLs mudam junto — erradas, o preview sai sem imagem e ninguém percebe, porque
a página continua funcionando normalmente.


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

**Por que a tela cheia não é automática.** Ela parece um ganho e não é: quem
transmite uma aba manda o conteúdo da aba, e a barra do navegador nunca vai
para a TV de qualquer forma. Automática, ela só escondia o menu de transmitir
do próprio operador e obrigava a ligar a transmissão antes de começar. Sob
demanda, pela tecla `F`, dá para transmitir de dentro da exibição.

**Por que o player devolve o foco ao palco quando o mouse sai dele.** Clicar
dentro de um iframe de outro domínio entrega o foco do teclado a ele, e a
partir daí `Esc` e as setas vão para o YouTube — a Ciranda para de responder e
parece travada. O ouvinte de `mouseleave` que devolve o foco não é enfeite:
sem ele, usar o botão de pular anúncio custa o controle do teclado.

**Por que o teclado do player fica desligado (`disablekb=1`).** Espaço e setas
já pertencem à ciranda de fotos. Com o teclado do YouTube ligado, clicar no
player faria a mesma tecla pausar o vídeo em vez de pausar a troca de fotos.

**Por que a moldura é cinza neutro.** É moldura de galeria: quando a foto não
preenche a tela, o que sobra não deve competir com a cor da foto.
