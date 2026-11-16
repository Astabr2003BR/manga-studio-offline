# Manga Studio Offline — CHECKPOINT OFICIAL

Atualizado em 2026-11-16. Este documento é a fonte de continuidade técnica do projeto, junto com o GitHub e os resultados reais de CI. Não é uma declaração de conclusão artística.

## 1. Identidade e escopo

- Repositório: https://github.com/Astabr2003BR/manga-studio-offline
- Branch principal: main.
- Objetivo: editor de mangá para uso local, prioritariamente Android, gratuito e offline, sem IA generativa incorporada, sem créditos, mensalidades ou serviços pagos.
- O usuário utiliza Android; não pressupor disponibilidade de PC.
- Projeto independente de LocalCut, Controle de Gastos, IA Creator, Nexus AI e Mangaverse.
- O nome Manga Studio Offline não identifica uma obra de mangá específica. O personagem e o quarto atuais são uma demonstração do editor; não importar cânones de outras obras.

## 2. Estado estável confirmado

- Versão estável técnica: **V0.31**.
- Commit de código validado: `c91a1fe7f97daccd9d23fdc92d518a76c447f4e9` (o commit deste documento pode ser posterior, sem mudança no código).
- Editor HTML portátil: `Manga-Studio-Offline-v0.31.html` (26.265.706 bytes no build validado).
- Editor real: 58/58 verificações aprovadas no GitHub Actions, incluindo compilação, renderização VRM, independência de quadros, exportação PNG, JSON, importação, reabertura, regressão e ausência de erros não tratados e rede externa no teste.
- Motor artístico isolado: execução aprovada.
- Editor: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43891841925
- Motor: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43891841807
- Artefato editor: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43891841925/artifacts/14237915728
- Artefato motor: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43891841807/artifacts/14236113944
- Artefatos Actions têm retenção limitada (os acima expiram em 2026-11-19); regenerar a partir do commit e dos workflows caso indisponíveis. Não presumir que os links de artefatos são permanentes.
- Testes executados em Chromium/Playwright no CI. **Ainda não há validação real no Android do usuário.** Não confundir sucesso de CI com aprovação artística ou mobile.

## 3. Arquitetura e preservação

- `vrm-lab/studio.js`: Three.js + VRM, pose, câmera, materiais, iluminação, cenário, celular, acabamento e composição.
- `vrm-lab/build-studio.mjs`, `vrm-lab/test-studio.mjs`, `vrm-lab/package.json`: build e testes do motor.
- `editor-v21/index.html`, `editor-v21/panel-vrm.js`: editor, interface, quadros independentes, renderização, controle de operações assíncronas, exportação e salvamento.
- `editor-v21/build.mjs`, `editor-v21/test.mjs`: HTML autossuficiente e regressão real.
- `.github/workflows/editor-v21.yml`: CI do editor completo, incluindo alterações no motor.
- Modelo VRM de demonstração CC0 incorporado; validação do arquivo de 18.481.892 bytes no editor. Verificar licenças antes de incorporar quaisquer novos recursos.
- Acabamentos existentes: Original, Anime Cinematográfico, Anime Ilustrado, Retrato Anime, Anime Cinematográfico Suave.
- Direção de cena: Original (classic), Narrativa Cinematográfica (story), Narrativa Refinada (story2).
- Lettering opcional: fala, pensamento, sussurro, quatro posições, narração, ajuste de texto.
- Projetos antigos: schema 18, storage `manga-web-v21`, snapshots VRM vinculados à configuração de cada quadro. Não alterar chaves/schemas sem migração testada. Campos opcionais devem manter serialização anterior quando ausentes.
- Renderizações alteradas ficam desatualizadas até nova renderização; exportação deve bloquear snapshots desatualizados. Preservar proteções de ownership do projeto/quadro, tickets, epoch, troca de quadro e cancelamento.
- Render local: sem dependências de rede durante execução testada. Não afirmar funcionamento Android até teste físico.

## 4. Referência visual e QA artístico

- **V0.30 é a referência visual aprovada pelo usuário**, que enviou uma imagem da página e disse que estava melhorando e no caminho certo. A aprovação é da direção visual, não de toda a qualidade final.
- Commit reproduzível V0.30: `368d7f9c576f64d3dad95e100bf31476016882bd`.
- CI V0.30: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43890142556 (54/54).
- Motor V0.30: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43890142787
- Referência em texto: página colorida vertical 1080x1350 (4:5), dois quadros, primeiro plano aberto de jovem com cabelo preto/franja, moletom azul-marinho, calça escura e sapatos, sentado na cama azul; celular na mão direita; quarto noturno, janela ampla com prédios e chuva, luminária quente e relógio 03:00. Segundo quadro close do mesmo personagem com celular. Paleta azul noturna e luz quente lateral. Textos de demonstração: 03:00 e Quem está aí?
- V0.31 preserva identidade e aprimora pegada, câmeras do celular, malha do cobertor e continuidade da pose sentada. Usuário enviou a página V0.31 e perguntou como desenvolver mais rápido e melhor.
- Arquivos de referência das conversas não são presumidos acessíveis em outra conversa. Recuperar as imagens do CI ou regenerar o exemplo nos commits acima. Não confundir screenshots da demonstração com imagens de uma obra externa.
- Defeitos visuais pendentes: dedos artificiais/contato com celular; manchas escuras e interseções no cobertor; cabelo ainda geométrico; rosto e roupa com aparência de avatar 3D; cenário repetitivo; balões de demonstração simples. Meta: semi-realismo anime profissional, sem alegar resultado humano nem prometer equivalência antes de comparação visual.

## 5. Próxima atualização consolidada: V0.40

**Status: em desenvolvimento; primeiro incremento em branch de revisão, ainda não promovido para main.** Basear o trabalho na V0.31, mantendo V0.30 reproduzível. A próxima conversa deve conferir o HEAD e qualquer trabalho posterior antes de agir.

Ordem proposta de blocos (não criar cinco modos novos apenas para mascarar problemas; priorizar ganho visual e controles úteis):

1. Biblioteca artística local e personagem: avaliar recursos existentes/licenças, melhorar geometria/cabelo, mãos, anatomia/expressão e materiais. Separar identidade, pose e acabamento. Evitar filtros sucessivos sem ganho real.
2. Motor gráfico: sombras em camadas, contornos seletivos, textura pictórica, iluminação motivada, oclusão e correções de interseções; manter continuidade de cenário e objetos.
3. Composição e editor: quadros variados, lettering legível, pensamentos, SFX, narração, posições personalizáveis, consistência entre páginas e edição não destrutiva.
4. QA e mobile: renderizar várias cenas, comparar lado a lado com V0.30 e V0.31, testar pose/close/roupa/cenário, limites de tamanho, memória, cancelamentos, rede indisponível, projetos antigos, exportações e usabilidade Android. Validar no dispositivo quando possível.

Critérios de aceitação: melhorias visuais perceptíveis e documentadas; nenhuma regressão nos 58 testes existentes; novos testes para cada incremento; preservação de projetos e snapshots; zero chamadas externas no fluxo local; sem custos recorrentes. Só declarar aprovado tecnicamente com CI real; aprovação artística depende de inspeção de imagens e preferência do usuário.

## 6. Procedimento de retomada

1. Ler este documento e README, conferir HEAD/branch atual e alterações desde o commit estável. Não reiniciar ou duplicar projeto.
2. Ler os módulos e workflows pertinentes. Recuperar resultados CI e artefatos; conferir imagens reais (não apenas logs).
3. Se houver CI pendente, identificar commit/run e concluir revisão antes de promover uma versão. Se falhar, investigar logs, corrigir causa raiz, repetir regressão.
4. Desenvolver em blocos pequenos internamente, com commits reversíveis e testes, mas consolidar entrega maior V0.40. Não publicar APK/AAB nem contratar recursos sem autorização explícita.
5. Antes de modificar main, confirmar HEAD e usar atualização não forçada com proteção contra concorrência; não reescrever histórico. Não expor tokens, chaves ou credenciais.
6. Atualizar este CHECKPOINT.md a cada bloco relevante: commit de código, estado, resultados, links CI, evidências, pendências e próxima ação. O documento deve distinguir o que foi implementado, testado e aprovado visualmente.
7. Em outra conversa, abrir o mesmo Projeto ChatGPT se disponível, conectar GitHub quando necessário e pedir: “Continue o Manga Studio Offline lendo primeiro o CHECKPOINT.md no GitHub. Confirme o HEAD e retome exatamente o próximo bloco da V0.40.”
8. Não prometer trabalho contínuo em segundo plano sem automação realmente configurada. GitHub Actions pode executar CI disparado por commits; isso não significa que um agente continue desenvolvendo autonomamente.

## 7. Restrições permanentes

Gratuito/offline, sem IA generativa no aplicativo, sem créditos, mensalidades ou serviços pagos. Android-first. Preservar o visual aprovado, código estável, funcionalidades e dados. Não misturar projetos, não apagar dados, não publicar APK/AAB sem autorização. Priorizar soluções testáveis, reversíveis, seguras e manutenção simples.

**Próxima ação concreta:** concluir CI e comparar os PNGs da segunda candidata do primeiro incremento com as referências V0.30/V0.31; corrigir qualquer regressão antes de promover. Continuar bloco 1 com cabelo, mão do celular e materiais após essa revisão. Não tratar V0.40 como pronta.


## 8. Retomada V0.40 — incremento 1 (2026-11-16)

- HEAD main de partida: `8968cdde462bac8ece323c383b85d575559fd105`; código estável permanece V0.31.
- Branch candidata: `v040-artwork-block1`; PR em rascunho: https://github.com/Astabr2003BR/manga-studio-offline/pull/1.
- Código candidato: `cb4f7464d54f83b6e211f2ca1b19b88400c45d46`; testes: `8cfb733aa9d98b927582cb7b43148e985e9d5404`; CI: `22e04ff71cde6ceb508f2a8bde8dc9c71e92db1b`.
- Recuperadas e inspecionadas páginas editoriais V0.30 e V0.31 dos artefatos originais; persistem rigidez da mão livre e manchas/interseções junto ao cobertor. Mantida a identidade visual do personagem e o modo story (V0.30).
- Alteração candidata: articulação suave da mão livre sentada somente em story2, reposicionamento dos travesseiros e separação da superfície detalhada do cobertor; preserva configurações clássicas e dados. Testes adicionais verificam oito articulações, restauração de pose/posição de travesseiros e determinismo de renderização.
- CI real da candidata: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43896292213. Builds do motor e editor concluídos com sucesso; testes gráficos ainda em execução neste registro. Não declarar aprovação de renderização antes dos resultados.
- Ambiente local desta conversa não disponibilizou WebGL 2 no Chromium; nenhuma renderização local aprovada. A validação gráfica depende do CI real e dos PNGs produzidos. Android físico permanece pendente.
- Sem merge, APK/AAB, custos, serviços externos ou alteração de schema. Próximo passo: recuperar resultados e artefatos da candidata; comparar página editorial com V0.30 e V0.31; se necessário corrigir e repetir, antes de promover.

### Revisão 1 e autocorreção

- CI inicial `43896292213` concluído com sucesso: motor (inclusive novos testes) e editor 58/58, sem erros não tratados ou rede externa no fluxo testado. Artefato: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43896292213/artifacts/14238753191.
- PNG real comparado com V0.30/V0.31: mão livre ligeiramente mais relaxada; travesseiros elevados demais e manchas escuras do cobertor persistem. Candidata 1 reprovada parcialmente no QA visual, apesar do CI verde. Não promover.
- Candidata 2: `d998bb2287469fb4e9f270b55ca68011bc9adc65` substitui a dupla superfície do cobertor detalhado por malha fechada única com bordas deformadas, mantém story clássico e reduz altura dos travesseiros para .60; conserva a mão relaxada. Testes atualizados em `c293d9aa83445e8688fcd47c9e21b8c9c239a971` para camada única, altura e restauração legada. Regressão desta candidata ainda não confirmada neste registro.
- Próxima ação: consultar CI do HEAD `c293d9aa83445e8688fcd47c9e21b8c9c239a971` no PR #1, baixar novo PNG, inspecionar cobertor, travesseiros e mão. Não confundir CI anterior com o HEAD atualizado. V0.31 continua estável; não renomear a entrega V0.40 até consolidar os demais blocos.
