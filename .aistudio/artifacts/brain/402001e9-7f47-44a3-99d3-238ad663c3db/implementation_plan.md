# Padrão Industrial Torre Espacial & Sistema de Combate Tático (v2.0)

A infraestrutura industrial e o sistema de combate orbital do **Modo Alto** foram completamente reformulados com base no padrão industrial oficial (`[PD-xxxx]`) e na nova mecânica de durabilidade tática, área de efeito hexagonal (AoE) e progressão roguelike ritmada.

---

## 1. Durabilidade e Dano em Módulos de Ataque / Frotas
- **Vulnerabilidade Total**: Todas as embarcações e módulos posicionados na malha espacial possuem `currentHp` e `maxHp`.
- **Combate e Colisão**: Invasores atacam e colidem com as embarcações em sua trajetória antes de alcançarem a Cidadela Central. Cada impacto reduz o HP do módulo, gerando faíscas, números flutuantes de dano e feedback tátil de tela (`screenShake`).
- **Destruição em Combate**: Ao ter seu casco reduzido a 0 HP, o módulo é completamente destruído e removido da órbita (`sound.playExplosion`).
- **Gestão Tática em Tempo Real**:
  - No painel lateral **Hangar Tático**, o jogador monitora a barra de HP de cada setor ocupado.
  - Ação **Reparar Casco**: Permite gastar créditos de combate para consertar módulos danificados antes que explodam.
  - Ao evoluir de nível, o módulo ganha `+35% HP Máximo` e recebe cura emergencial.

---

## 2. Arquétipos Táticos Diferenciados & Especialidades
1. **Canhão de Pulso `[MK-3001]`** (150 HP · AoE 1h): Interceptador veloz balanceado com cadência rápida anti-enxame.
2. **Cruzeiro de Feixe `[MK-3002]`** (160 HP · AoE 1h): Laser térmico contínuo sem tempo de viagem, fundindo armaduras.
3. **Bateria de Plasma `[MK-3003]`** (180 HP · AoE 2h): **Sobrecarga de Reator ao Morrer!** Ao ser destruída por invasores, detona em explosão radial massiva causando **240 de Dano de Plasma em área de 2 hexágonos** (ou **480 de Dano em 3 hexágonos** com aprimoramento).
4. **Vórtice Sifão `[MK-3004]`** (140 HP · AoE 2h): Desacelera invasores num raio de 2 hexágonos e extrai espólios do vácuo.
5. **Bateria de Micro-Mísseis `[MK-3005]`** (110 HP · AoE 1h): Fuselagem leve de longo alcance disparando salvas teleguiadas com 100% de acerto.
6. **Torre Tesla `[MK-3006]`** (210 HP · AoE 2h): Arcos criogênicos em cadeia que congelam e desaceleram alvos por 2 segundos.
7. **Bastião Blindado Railgun `[MK-3007]`** (480 HP · AoE 1h): **Super Tanque Blindado!** Funciona como muralha avançada absorvendo o fogo de invasores enquanto seu canhão sniper perfura colunas inteiras de inimigos.
8. **Hangar de Drones Nanobots `[MK-3008]`** (220 HP · AoE 2h): **Suporte e Regenerador Aliado!** A cada 2.5s pulsa uma onda nanítica que **cura +25 HP em todas as embarcações aliadas vizinhas** na área de efeito e restaura a Cidadela Central.

---

## 3. Malha de Hexágonos Ampliada (50% do Tamanho)
- **Densidade Tática Duplicada**: `PIXEL_HEX_RADIUS` reduzido de 28 para 14 (e `HEX_RADIUS` no Three.js de 1.35 para 0.68).
- **Alcance Preservado**: A malha agora se estende dos anéis 3 a 11, oferecendo **378 células hexagonais jogáveis** sem ultrapassar as bordas do viewport.
- **Visualização de Área de Efeito (AoE)**:
  - Ao selecionar ou passar o cursor sobre qualquer módulo com efeito radial (`nanobot_drone`, `plasma_battery`, `flux_harvester`), o grid projeta um brilho translúcido destacando exatamente todos os hexágonos afetados.

---

## 4. Reformulação Severa do Modo Alto
- **Ritmo Roguelike Orgânico**:
  - Eliminada a interrupção prematura no meio da batalha (onde o modal de cartas aparecia a cada 3 abates).
  - A horda de cada onda combate até o fim: a barra superior exibe o progresso de invasores abatidos (`X / Total da Horda`).
  - O **Salto Quântico (Escolha de 3 Cartas Roguelike)** é concedido no momento exato em que a horda é 100% superada.
- **Catálogo de Espólios Sincronizado**:
  - Inimigos derrotados derrubam materiais autênticos da árvore física: `[PD-1201]` a `[PD-1208]` (sucatas), `[PD-1001]` a `[PD-1004]` (minérios e titânio), `[PD-3101]` (lingote de ferro) e `[PD-3012]` (conectores elétricos).
- **Pool de Upgrades Estratégicos**:
  - Cartas reformuladas para sinergizar diretamente com HP de blindagem, cura em rede nanítica, sobrecargas de reator, defesas globais e condutores superaquecidos.
