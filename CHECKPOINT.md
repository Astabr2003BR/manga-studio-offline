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

**Próxima ação concreta:** continuar na branch candidata a partir de `6c0f993258c1be65efcfff33b743141ca6a7b91f` (CI verde), aprimorando a anatomia visual dos dedos, inclusive a aparência de alongamento na borda direita do celular, e registrando QA por ângulos. A métrica de contato melhorou, mas a revisão estética ainda não está aprovada; não promover V0.40 até corrigir esse ponto e concluir os demais blocos.


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

### Regressão da segunda candidata

- CI intermediário `43896956051` (commit `d998bb2`) falhou por rodar o teste antigo que esperava altura .70; valor obtido .60. Não é falha ignorada: a expectativa foi atualizada no commit `c293d9a` e inclui também a verificação de uma malha fechada e restauração de duas camadas em story.
- CI isolado por ref em `4282ecaa2b29ddcd72e650600f0902060c2baaca`, para que validações de main e PR não se cancelem entre si. PR #1 foi fechado/reaberto (mesmo PR, rascunho) exclusivamente para disparar o CI do HEAD correto; sem merge.
- Execução real da segunda candidata: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43897230516 (HEAD `4282ecaa2b29ddcd72e650600f0902060c2baaca`, em execução neste registro). Aguardam-se motor, editor e PNG desta execução antes de aprovação visual/técnica.

### Fechamento técnico do incremento 1 — revisão 2

- HEAD candidato `4282ecaa2b29ddcd72e650600f0902060c2baaca`. CI `43897230516` cancelado por execução duplicada do mesmo HEAD (motor aprovado; editor interrompido); execução definitiva https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43897420977 concluída com sucesso integral. Artefato https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43897420977/artifacts/14240156074.
- Relatório do editor: 58/58, errors=[], external=[]; motor real aprovado, relaxedHandJoints=8, pillowHeight=.60, quiltLayers=1, restauração legada e determinismo aprovados. Modelo original preservado (18145 vértices, 131 primitivas). Sem teste físico Android.
- QA visual real da página editorial de revisão 2: manchas pretas do cobertor desapareceram nesta cena; travesseiros mais baixos e mão livre suavizada. Correção localizada aprovada visualmente para continuidade, sem aprovação artística global: cobertor ainda rígido, rosto/roupa com aparência 3D, cabelo geométrico e mão do celular seguem pendentes. V0.30 permanece referência aprovada pelo usuário; V0.31 permanece versão estável em main. Não houve merge nem release.
- Auditoria do VRM CC0 para próxima etapa: cabelo `F00_000_Hair_00_HAIR` utiliza 114 primitivas, 7775 vértices, 9196 triângulos e uma textura de base. Face/pele utiliza geometria existente; preservar identidade, silhueta, UVs, animação e materiais do modelo importado. Não adicionar IA generativa, APIs ou assets sem licença.
- Próxima ação concreta: iniciar segundo incremento do bloco 1 no HEAD candidato, com melhoria de cabelo e mão que segura o celular, testes reais e comparação de PNGs. Manter malha única do cobertor e registrar melhorias têxteis no bloco gráfico. Manter o PR #1 em rascunho para consolidar a V0.40.

### Segundo incremento do bloco 1 — candidato (2026-11-16)

- HEAD anterior validado `4282ecaa2b29ddcd72e650600f0902060c2baaca`; novo HEAD candidato `5aab0f5963d0582f2fa8388f62a95fe70bd75e2e` no PR #1 em rascunho. Motor e testes alterados atomicamente; main mantém V0.31.
- Revisão da página real da revisão 2: cobertor sem manchas, cabelo com mechas geométricas, dedos do celular rígidos. Implementada textura local de cabelo refinada em film/story2, mantendo UVs, alpha, geometria e material legado. Rotação distal limitada a 0,30 rad e reversão se o contato estimado não melhorar; não é colisão física comprovada nem uma solução artística final.
- Novos testes: textura refinada, 1–4 articulações distais, distância estimada menor, limite angular, cache <=6, restauração de material/grip legado. Preserva testes anteriores e malha única do cobertor.
- CI real iniciado: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43901683048 (HEAD `5aab0f5963d0582f2fa8388f62a95fe70bd75e2e`). Pendente de resultado e revisão visual; não declarar aprovado antes de recuperar relatório e PNG.
- Próxima ação: concluir regressão e comparar página com revisão 2. Corrigir se necessário; manter aparência original, sem serviços externos, IA generativa, custos ou APK/AAB.

### Fechamento do segundo incremento — CI e QA visual

- HEAD candidato `5aab0f5963d0582f2fa8388f62a95fe70bd75e2e`, PR #1 segue aberto em rascunho. CI https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43901683048 aprovado integralmente: motor e editor. Artefato https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43901683048/artifacts/14241179021.
- Editor 58/58, errors=[], external=[]; motor: 4 articulações distais, distância estimada 0.0205553527 m → 0.0164609764 m (19.9% de redução), ângulo máximo 0.30 rad, cache 6, hairRefined=true, restauração legada/determinismo aprovados. Distância é estimativa de ponta baseada em ossos, não colisão física.
- QA visual: PNG editorial 1080×1350 e comparação ampliada com revisão 2 inspecionados. Alteração em 2.19% dos pixels da página, região do cabelo 47.95% dos pixels (magnitude média RGB 0.45), região mão/celular 3.98% (magnitude média RGB 1.10), região do cobertor 0% (retângulo x=205..864, y=395..484). Ganho visual discreto; não declarar cabelo/mão finalizados. Textura original de cabelo 512×1024 preservada; nenhuma alteração geométrica neste incremento.
- Próximo incremento: examinar a geometria das mechas e a topologia/pose da mão, evitando outra camada de filtro como substituto de melhoria geométrica; preservar material, silhueta e os modos legados. A V0.31 segue estável em main. Sem merge, release, APK/AAB, serviço pago, IA generativa ou validação Android física.

### Terceiro incremento do bloco 1 — geometria capilar (2026-11-16)

- HEAD anterior `5aab0f5963d0582f2fa8388f62a95fe70bd75e2e`; candidato `95660425c56af31f06c94f80d85c488d07a27df3` no PR #1. Alterações atômicas no motor, helper `vrm-lab/hair-geometry.js` e testes.
- Auditoria do VRM original: 114 primitivas compartilham 7.775 posições/normais, 9.196 triângulos, 5.724 vértices de borda e 2.051 internos. Suavização Laplaciana determinística de uma passagem, deslocamento limitado a 0,003 m; bordas fixas, normais internas mescladas com as originais; UVs, índices, pesos, morfos e topologia intactos. Buffers originais restaurados nos modos legados, sem clonar 114 malhas. Aplicação apenas em film/story2, com assinatura estrutural conhecida e verificações de compartilhamento; importações não compatíveis ignoradas.
- Novos testes de geometria sintética, índice inválido, preservação de bordas, quantidade real de vértices, limite de deslocamento, normais, restauração e regressão. CI e QA visual da candidata ainda pendentes. Mão do celular permanece no estado técnico validado do incremento 2.
- Próxima ação: localizar CI do HEAD exato, recuperar relatório e PNG, comparar com incremento 2; corrigir se necessário. Não declarar V0.40 completa, não publicar e não modificar main fora do checkpoint.

### Retomada — validação do cabelo e candidato para mão/celular (2026-11-16)

- CI da geometria capilar `43910019595` concluído com sucesso; motor real e editor 58/58, errors=[], external=[]; artefato original https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43910019595/artifacts/14247451319. Página 1080x1350 inspecionada; diferença de 1,98% dos pixels em relação ao incremento 2, concentrada no cabelo (região do cobertor e mão inalteradas). Ganho visual discreto; integridade geométrica confirmada, cabelo não finalizado artisticamente.
- Próxima falha visual observada: mão do celular com polegar afastado e palma sobreposta ao aparelho. Novo candidato em branch `v040-artwork-block1`: `e47a268ecca81c4bd9f7bd24627ff4f421140e37` reposiciona o telefone em relação ao plano dos dedos somente em story2 e articula o polegar em dois segmentos; testes de profundidade, contato e isolamento legado.
- Correção preventiva no commit `2219d4861ef88d550e280e941c643b1c68e044db`: bone naming após normalização VRM 0.x → VRM 1.0 usa `rightThumbMetacarpal`, `rightThumbProximal`, `rightThumbDistal`, não `rightThumbIntermediate`. Verificado na especificação oficial VRM. Preservado fallback de pose clássica. Somente o commit corrigido pode receber aprovação.
- CI exato do candidato `2219d486`: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43938010068, em execução no registro; não alegar aprovação até resultados completos e PNG comparado. PR #1 permanece draft, main conserva V0.31, sem publicação, APK/AAB ou gastos.

### Fechamento do incremento mão/celular — CI e QA (2026-11-16)

- HEAD da branch de revisão: `2219d4861ef88d550e280e941c643b1c68e044db`. PR #1 em rascunho, sem merge. Commit precedente `e47a268ecca81c4bd9f7bd24627ff4f421140e37` corrigido antes da aprovação pelo mapeamento correto de ossos VRM.
- CI real https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43938010068: SUCESSO, motor e editor (58/58), `errors=[]` e `external=[]`. Artefato https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43938010068/artifacts/14260454753, 3 dias de retenção. Página 1080×1350 exportada e inspecionada.
- Mudanças isoladas em story2: telefone deslocado para frente do plano da base dos dedos, polegar mapeado aos ossos normalizados metacarpal/proximal/distal, com duas articulações. A pose clássica e modelos com ossos opcionais usam fallback anterior; sem alteração de schema ou recursos externos.
- Medições do CI: 10 articulações de pegada, 2 do polegar, ponta do polegar a 0,00890 m do alvo estimado; `phonePalmOffset=-0.007` (contra +0.016 no incremento anterior); quatro articulações distais adicionais. Contato médio dos demais dedos piorou de 0,00502 m para 0,01235 m, embora permaneça dentro do limite existente <0,06; `gripError` passou de 0,02303 m a 0,03042 m. **Não ocultar esta regressão métrica**: otimizar contato em incremento posterior, sem regredir a visibilidade do telefone. Métricas são estimativas geométricas, não simulação de colisão.
- Revisão visual da página e recorte mão/celular (antes/depois): telefone passa a aparecer à frente da palma e o polegar acompanha melhor a borda, ganho perceptível; anatomia de mão, contato de dedos e acabamento 3D ainda insuficientes para aprovação artística final. Diferença da página contra incremento anterior: 5,46% dos pixels; região da pegada 40,44%; região do cobertor 0% (retângulo x=180..890,y=350..510). Não confundir diferença de pixels com qualidade artística.
- Próxima ação: aprimorar contato de dedos e criar QA por cenas/ângulos (pose sentada/em pé/close), depois continuar motor gráfico e composição. Preservar versões V0.30/V0.31 e os últimos checkpoints. Teste Android físico continua pendente. Sem APK/AAB, publicação, custos, créditos ou IA generativa.

### Continuação: contato dos quatro dedos — candidato CI aprovado, QA visual com ressalva (2026-11-16)

- Base anterior do PR #1: `2219d4861ef88d550e280e941c643b1c68e044db`; candidato novo: `6c0f993258c1be65efcfff33b743141ca6a7b91f`, branch `v040-artwork-block1` em rascunho. `main` permanece com o código estável V0.31; nenhuma migração de schema ou mudança de dados.
- Mudança localizada no `vrm-lab/studio.js`: no modo `story2`, o alvo da articulação intermediária dos quatro dedos mudou em 10 mm sobre a normal relativa ao aparelho (de +0,007 para -0,003), para reduzir separação após deslocamento do celular. Mantida a pegada clássica, o polegar, a geometria de cabelo, a cena e o cobertor.
- Testes adicionais exigem `contactMean < 0.010 m` e `gripError < 0.035 m`; evidência real: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43939332387 — sucesso no motor e editor 58/58, `errors=[]`, `external=[]`. Artefato https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43939332387/artifacts/14261138006. Página editorial PNG 1080×1350 recuperada e inspecionada.
- Medição CI anterior → nova: `contactMean` 0,0123552172 m → 0,0099667926 m (redução de ~2,39 mm, 19,3%); `gripError` 0,0304171389 → 0,0301929792 m; `thumbTipGap` inalterado em 0,0089045156 m; `phonePalmOffset` preservado em -0,007 m. O limite de 10 mm foi superado por apenas ~0,033 mm, portanto margem numérica pequena. São métricas estimadas de ossos/pontos, não prova de contato físico natural.
- Comparação de PNGs antes/depois: apenas 0,175% dos pixels da página mudou; recorte do celular/dedos ~6,85% mudou; cabelo, rosto e cobertor nas regiões medidas permaneceram idênticos. O recorte revela alguns dedos alongados/pendentes na lateral do celular. **QA artístico não aprovado**, apesar da melhoria quantitativa e do CI verde.
- Próximos passos: refinar a curvatura/anatomia das falanges com checagem visual em diferentes ângulos e poses; evitar otimizar exclusivamente a distância à caixa geométrica do celular, porque isso pode induzir postura artificial; só depois prosseguir com luz, sombras e materiais do Bloco 2.
- Sem merge, release, APK/AAB, custos, IA generativa, mensalidades, créditos ou serviços externos. Teste físico Android continua pendente.

### Bloco 1 — QA multângulo e curvatura da pegada (2026-11-16)

- Código candidato `d3d0c38637f91970837c100a4362ab1350796a5a`, após HEAD `6c0f993258c1be65efcfff33b743141ca6a7b91f`, no PR #1 draft. Branch `v040-artwork-block1`, main mantém código V0.31.
- Em `story2`, os quatro dedos agora possuem alvos diferenciados para contato com lateral do telefone e altura restrita ao aparelho. Novo diagnóstico de ângulos entre falanges, alturas e espaçamentos laterais. Nenhuma troca de modelo, geometria do cabelo, posição do celular, polegar, cobertor, schema ou dependência externa.
- Testes adicionais para curvatura finita e limitada, 4 alvos dentro da altura do telefone, contato e regressões existentes. Geração de três PNGs específicos de QA da pegada (`studio-evidence/grip-left.png`, `grip-front.png`, `grip-right.png`), com ângulos -25°, 0° e +25°, pose sentada em close. QA separado dos dados reais do editor.
- CI do HEAD exato https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43944546280 em execução neste registro; os builds foram concluídos com sucesso, teste do motor/ editor e QA visual ainda não validados. Não aprovar o incremento nem promover merge sem examinar a saída real.
- Próxima ação: consultar resultado final do CI; se falhar, localizar a causa, corrigir e repetir; se passar, baixar artefatos, inspecionar os três PNGs e comparar com o candidato anterior. Registrar métricas e QA artístico honesto. Android físico ainda pendente; sem release ou APK.

### Continuação — anatomia dos dedos e QA multângulo corrigido (2026-11-16)

- Revisão iniciada a partir da base aprovada `6c0f993258c1be65efcfff33b743141ca6a7b91f`. Candidatas `d3d0c38637f91970837c100a4362ab1350796a5a` (alvos individuais) e `a6f69eb267f70aef1c02b3eddf1ad542c64bbf5e` (limite 2,20 rad) foram reprovadas no CI, respectivamente por curvatura excessiva e por contato médio >10mm. Registro de falhas preservado, sem relaxar as asserções.
- Diagnóstico real `098a4843c8fc2311c41b840411b6d66e2f7f151a`: contato médio 0,013396 m e os 4 dedos saturados em 2,20 rad. Causa identificada: direção inicial da falange incompatível com a nova posição do aparelho. Correção `dbd5067fdc79bc0b366f7d2d5b987e00e95e962a`: vetor de direção proximal corrigido; CI https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43945880257 integralmente aprovado (motor + editor 58/58, errors=[], external=[]). Artefato https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43945880257/artifacts/14265287647.
- Métricas do último CI: `contactMean=0.00418878m`, `gripError=0.0230223m`, `thumbTipGap=0.00890452m`; ângulos dos quatro dedos ainda saturados em 2,20 rad. QA visual NÃO aprovado até inspeção real multângulo e análise de proporções: proximidade ao aparelho é apenas estimativa geométrica.
- Auditoria dos três PNGs exportados: `grip-left.png`, `grip-front.png`, `grip-right.png` eram pixel-a-pixel idênticos, pois `vrm-lab/studio-test.html` sobrescreve `yaw` com valor fixo dentro de `renderPanel`. Isso invalidou exclusivamente o teste de três ângulos, não o CI do motor/editor. Corrigido em `9eedd56fbb052cd978ff8b1b4199c8639aaa9c03`: o teste chama `studio.draw()` diretamente com yaw -25°, 0°, +25°, e agora exige PNGs distintos; dados do editor e interface não são alterados.
- CI do HEAD corrigido: https://github.com/Astabr2003BR/manga-studio-offline/actions/runs/43946639280. **Pendente neste registro**. Após execução, baixar PNGs, avaliar anatomia e riscos; se necessário repetir correções. PR #1 segue rascunho, main continua no código estável V0.31; nenhuma publicação ou APK/AAB.
