# Torre Espacial --- Documento de Design Industrial

## Árvore de materiais, receitas, máquinas, progressão e expedições

**Versão:** 1.0 --- proposta jogável para protótipo\
**Escopo:** do início absoluto até a indústria dimensional de endgame

> **Status dos números:** quantidades, tempos, energia e custos deste
> documento são valores iniciais de balanceamento para prototipagem, não
> valores finais. O objetivo é fornecer uma árvore fechada, sem
> dependências impossíveis, para testes de ritmo e gargalos.

------------------------------------------------------------------------

# 1. Princípios de design

1.  **Recuperar não é fabricar.** Uma expedição pode fornecer um motor
    pronto, mas a fabricação repetível exige matérias-primas, máquinas,
    receitas e componentes.
2.  **Componentes intermediários são obrigatórios.** Módulos não são
    construídos diretamente de minério; usam estruturas, mecanismos,
    controles, energia e subsistemas.
3.  **Itens essenciais têm caminho fabricável.** A aleatoriedade pode
    acelerar ou atrasar o progresso, mas nunca deve bloquear
    permanentemente o jogador.
4.  **A indústria se retroalimenta.** Máquinas fabricam peças para
    melhorar e construir máquinas novas.
5.  **O estoque desbloqueia expedições.** Antes do primeiro estoque, o
    jogador só coleta sucata e separa materiais. Depois de instalar o
    estoque, expedições tornam-se disponíveis.
6.  **A energia operacional é diferente da energia dimensional.**
    Energia operacional alimenta máquinas e módulos. Energia específica
    de portal é acumulada no modo idle e usada para acessar/estabilizar
    portais.
7.  **A derrota atrasa, não apaga a campanha.** Expedições podem perder
    recursos não protegidos, gastar energia, danificar módulos e exigir
    reparos; tecnologias permanentes e receitas já pesquisadas
    permanecem.
8.  **Universos antigos continuam relevantes.** Recursos básicos seguem
    necessários para componentes avançados, enquanto portais mais altos
    introduzem recursos especializados.
9.  **Evitar multiplicadores infinitos.** Progressão deve desbloquear
    novas opções, eficiências e capacidades, não depender apenas de
    números cada vez maiores.
10. **Os tempos são segundos de produção-base.** Máquinas podem ter
    velocidade, eficiência, qualidade, capacidade, automação e
    confiabilidade como atributos separados.

## 1.1 Convenções de unidades

-   Quantidades de itens são unidades discretas, salvo quando indicadas
    como `L`, `kg` ou `m³`.
-   `Energia` é uma unidade abstrata de consumo operacional por ciclo.
-   O tempo é tempo-base real de produção, antes de melhorias.
-   Uma receita consome seus ingredientes quando o ciclo começa. Se a
    máquina ficar sem energia, o ciclo pausa; não consome ingredientes
    adicionais.
-   Máquinas trabalham continuamente enquanto têm ingredientes, energia
    e espaço de saída.
-   O armazenamento compartilhado é o inventário principal. Máquinas
    também possuem buffers internos.
-   Receitas de construção são instantâneas após a conclusão da fila,
    salvo se a receita indicar tempo de montagem.
-   `Projeto` significa desbloqueio tecnológico permanente;
    `componente recuperado` não concede automaticamente o projeto.

------------------------------------------------------------------------

# 2. Loop geral de jogo

1.  Coletar sucata passivamente.
2.  Separar sucata em materiais, peças recuperáveis e resíduos.
3.  Fabricar os componentes intermediários iniciais.
4.  Construir coletor de minério, construtor e primeiro estoque.
5.  Instalar o estoque para desbloquear expedições.
6.  Fazer expedições para recuperar máquinas, peças, projetos e recursos
    que ainda não são fabricáveis.
7.  Construir forno e outras máquinas básicas.
8.  Produzir materiais refinados, peças mecânicas, eletrônicas e
    hidráulicas.
9.  Automatizar coleta, processamento, energia, reparo e construção.
10. Melhorar a torre, enfrentar ondas e explorar portais mais difíceis.
11. Usar materiais raros e projetos para desenvolver tecnologia
    avançada.
12. Preservar a indústria básica como fundação da produção de endgame.

## 2.1 Modos de jogo integrados

### Modo baixo --- idle e infraestrutura

-   Produz recursos, energia operacional e energia específica de portais
    conforme os módulos instalados.
-   Mantém as linhas industriais funcionando enquanto houver insumos,
    energia e espaço.
-   Sustenta árvores permanentes de Eficiência, Infraestrutura,
    Estabilidade e Pesquisa.
-   Portais antigos continuam produzindo recursos básicos necessários ao
    craft avançado.

### Modo alto --- expedições e combate roguelike

-   O jogador entra em expedições/portais, enfrenta ondas e escolhe
    quando extrair em marcos permitidos.
-   Recompensas incluem materiais raros, peças recuperadas, projetos,
    relíquias e dados tecnológicos.
-   A carga pode ser classificada como protegida ou não protegida.
-   Derrota pode causar perda de carga não protegida, gasto de energia
    dimensional, danos e custos de manutenção.
-   A progressão permanente não é apagada por uma expedição fracassada.

------------------------------------------------------------------------

# 3. Recursos brutos e famílias

## 3.1 Minerais e metais

  -------------------------------------------------------------------------------------
  ID                         Nome              Origem principal       Primeiros usos
  -------------------------- ----------------- ---------------------- -----------------
  `raw.ferrous_regolith`     Regolito          Coletor de minério     Ferro, estrutura
                             ferrífero                                

  `raw.copper_ore`           Minério de cobre  Asteroides condutores  Fios e bobinas

  `raw.aluminum_ore`         Minério de        Asteroides leves       Estruturas leves
                             alumínio                                 

  `raw.titanium_ore`         Minério de        Depósitos raros        Blindagem e peças
                             titânio                                  resistentes

  `raw.nickel_ore`           Minério de níquel Asteroides metálicos   Ligas e baterias

  `raw.cobalt_ore`           Minério de        Depósitos especiais    Baterias e
                             cobalto                                  superligas

  `raw.tungsten_ore`         Minério de        Asteroides densos      Ferramentas e
                             tungstênio                               armas

  `raw.rare_earth_ore`       Minério de terras Portais/depósitos      Ímãs e sensores
                             raras             raros                  

  `raw.platinum_group_ore`   Minério de metais Expedições/depósitos   Contatos e
                             nobres            raros                  catalisadores

  `raw.silica_sand`          Areia silicatada  Coletor de minério     Vidro e silício

  `raw.quartz`               Quartzo bruto     Depósitos minerais     Óptica e
                                                                      cristalização

  `raw.graphite`             Grafita espacial  Depósitos carbonosos   Lubrificantes e
                                                                      eletrodos

  `raw.basalt`               Basalto espacial  Regolito vulcânico     Cerâmica e fibras

  `raw.borate`               Mineral boratado  Depósitos químicos     Vidros especiais

  `raw.phosphate`            Fosfato mineral   Depósitos químicos     Reagentes

  `raw.sulfur`               Enxofre mineral   Depósitos vulcânicos   Química
                                                                      industrial
  -------------------------------------------------------------------------------------

## 3.2 Gelo, gases e fluidos

  ----------------------------------------------------------------------------------------
  ID                           Nome                 Origem               Usos
  ---------------------------- -------------------- -------------------- -----------------
  `raw.water_ice`              Gelo de água         Cometas/asteroides   Água e
                               cometária                                 refrigeração

  `raw.co2_ice`                Gelo de dióxido de   Cometas frios        Química e gases
                               carbono                                   

  `raw.ammonia_ice`            Gelo de amônia       Corpos gelados       Reagentes e
                                                                         refrigeração

  `raw.hydrocarbon_ice`        Gelo de              Corpos ricos em      Polímeros e
                               hidrocarbonetos      carbono              combustível

  `raw.hydrogen_gas`           Hidrogênio bruto     Coletor de gases     Energia e química

  `raw.helium_mix`             Mistura com hélio    Nebulosas            Separação gasosa

  `raw.nitrogen_gas`           Nitrogênio bruto     Atmosferas/nebula    Atmosfera
                                                                         industrial

  `raw.oxygen_mix`             Mistura oxigenada    Gelo/nebula          Química e suporte
                                                                         de vida

  `raw.nebula_gas`             Gás de nebulosa      Coletor de gases     Separação de
                                                                         gases

  `raw.used_hydraulic_fluid`   Fluido hidráulico    Sucata industrial    Recuperação de
                               usado                                     óleo

  `raw.organic_residue`        Resíduo              Sucata de naves      Polímeros e
                               orgânico/carbonoso                        carbono
  ----------------------------------------------------------------------------------------

## 3.3 Sucata recuperável

  -----------------------------------------------------------------------
  ID                      Nome                    Saída possível do
                                                  separador
  ----------------------- ----------------------- -----------------------
  `scrap.structural`      Sucata estrutural       Metal recuperado,
                                                  chapas, fixadores

  `scrap.electrical`      Sucata elétrica         Cobre, fios,
                                                  isolamento, conectores

  `scrap.mechanical`      Sucata mecânica         Engrenagens, eixos,
                                                  rolamentos, motores
                                                  danificados

  `scrap.electronic`      Sucata eletrônica       Placas, chips,
                                                  sensores, conectores

  `scrap.chemical`        Sucata química          Óleo, polímeros,
                                                  recipientes, resíduos

  `scrap.thermal`         Sucata térmica          Cerâmica, dissipadores,
                                                  isolamento

  `scrap.military`        Sucata militar          Blindagem, mecanismos
                                                  de arma, sensores de
                                                  mira

  `scrap.unknown`         Sucata desconhecida     Peças não
                                                  identificadas, dados e
                                                  materiais exóticos
                                                  raros
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 4. Separador: tabela inicial de recuperação

O separador processa uma unidade de sucata por ciclo. Valores abaixo são
saídas médias por unidade; os resultados podem variar. Para o protótipo,
use as saídas determinísticas para facilitar o teste e introduza
variação posteriormente.

  ------------------------------------------------------------------------------------
  Entrada                                      Tempo Saída determinística
  --------------------- ---------------------------- ---------------------------------
  1 `scrap.structural`                           8 s 2 `mat.recovered_iron`, 1
                                                     `part.fastener`, 20% chance de 1
                                                     `part.rough_plate`

  1 `scrap.electrical`                          10 s 1 `mat.recovered_copper`, 1
                                                     `part.short_wire`, 1
                                                     `part.connector`

  1 `scrap.mechanical`                          12 s 1 `part.gear_small`, 1
                                                     `part.short_shaft`, 25% chance de
                                                     `part.bearing`

  1 `scrap.electronic`                          15 s 1 `part.circuit_scrap`, 1
                                                     `part.connector`, 15% chance de
                                                     `part.sensor_basic_damaged`

  1 `scrap.chemical`                            10 s 1 `mat.recovered_polymer`, 1
                                                     `mat.used_oil`

  1 `scrap.thermal`                             12 s 1 `mat.recovered_ceramic`, 1
                                                     `part.heatsink_fragment`

  1 `scrap.military`                            18 s 2 `mat.recovered_iron`, 1
                                                     `part.armored_plate_fragment`,
                                                     10% chance de
                                                     `part.targeting_sensor_damaged`

  1 `scrap.unknown`                             20 s 1 material aleatório + chance
                                                     baixa de componente desconhecido
  ------------------------------------------------------------------------------------

**Regra de equilíbrio:** a sucata inicial deve produzir quantidade
suficiente de materiais para começar a fabricar, mas não tantos
componentes avançados que a fabricação industrial perca valor.

------------------------------------------------------------------------

# 5. Estágio 0 --- ferramentas e componentes manuais

O jogador começa com o coletor de sucata e o separador instalados. Não
possui forno, mineração automática, estoque industrial ou expedições.

## 5.1 Ferramentas iniciais

  -----------------------------------------------------------------------------------------------
  Item                         Receita                                     Tempo Desbloqueio
  ---------------------------- --------------------------- --------------------- ----------------
  `tool.grinding_stone` ---    2 `mat.recovered_iron` + 1                   10 s Inicial
  Pedra de moagem              `raw.basalt`                                      

  `tool.scrap_cutter` ---      2 `part.rough_plate`                         12 s Inicial
  Cortador de sucata                                                             

  `tool.fabric_filter` ---     1 `mat.recovered_polymer` +                   8 s Inicial
  Filtro de pano               1 `part.short_wire`                               

  `part.fastener` --- Fixador  1 `mat.recovered_iron`                        5 s Inicial

  `part.rough_plate` --- Placa 2 `mat.recovered_iron`                        8 s Inicial
  rudimentar                                                                     

  `part.short_wire` --- Fio    1 `mat.recovered_copper`                      6 s Inicial
  curto                                                                          

  `part.simple_bracket` ---    1 `part.rough_plate` + 1                      8 s Inicial
  Suporte simples              `part.fastener`                                   

  `part.mechanical_assembly`   2 `part.gear_small` + 1                      15 s Inicial
  --- Conjunto mecânico        `part.short_shaft` + 2                            
  rudimentar                   `part.fastener`                                   

  `part.simple_control` ---    1 `part.circuit_scrap` + 1                   15 s Reparação manual
  Controle simples recuperado  `part.connector`                                  

  `part.cable_bundle` ---      3 `part.short_wire` + 1                      12 s Inicial
  Feixe de cabos rudimentar    `mat.recovered_polymer`                           
  -----------------------------------------------------------------------------------------------

**Limitação deliberada:** os itens `part.gear_small`, `part.short_shaft`
e `part.circuit_scrap` só vêm da sucata até a instalação de máquinas
apropriadas. Se uma sequência de sucata não os fornecer, o jogo deve
oferecer uma pequena reserva inicial ou uma receita alternativa de
recuperação manual. A campanha não pode ficar presa por aleatoriedade.

## 5.2 Receita alternativa para evitar bloqueio

A cada nova campanha, o estoque inicial de sucata inclui garantia de: -
4 `scrap.structural` - 2 `scrap.electrical` - 2 `scrap.mechanical` - 1
`scrap.electronic`

Isso garante material para o primeiro construtor sem tornar o inventário
inicial abundante.

------------------------------------------------------------------------

# 6. Estágio 1 --- os três módulos que iniciam o jogo

## 6.1 Componentes exclusivos de montagem inicial

  ------------------------------------------------------------------------------------------------------
  Item                          Receita                                        Tempo Máquina
  ----------------------------- ------------------------------ --------------------- -------------------
  `part.basic_frame` ---        4 `part.rough_plate` + 6                        20 s Montagem
  Estrutura básica              `part.fastener`                                      manual/construtor
                                                                                     inicial

  `part.collection_head` ---    2 `part.rough_plate` + 1                        25 s Montagem
  Cabeça de coleta              `part.mechanical_assembly`                           manual/construtor
                                                                                     inicial

  `part.simple_drive` ---       1 `part.mechanical_assembly` +                  20 s Montagem
  Acionamento simples           2 `part.short_wire`                                  manual/construtor
                                                                                     inicial

  `part.storage_bay` ---        4 `part.rough_plate` + 4                        20 s Montagem
  Compartimento de estoque      `part.fastener`                                      manual/construtor
                                                                                     inicial

  `part.basic_conveyor` ---     2 `part.gear_small` + 1                         25 s Montagem
  Transporte simples            `part.short_shaft` + 2                               manual/construtor
                                `part.rough_plate`                                   inicial

  `part.recovered_controller`   1 `part.simple_control` + 1                     25 s Reparação manual
  --- Controlador recuperado    `part.short_wire`                                    
  reparado                                                                           
  ------------------------------------------------------------------------------------------------------

## 6.2 Módulo: Coletor de minério

**Receita:** - 1 `part.basic_frame` - 1 `part.collection_head` - 1
`part.simple_drive` - 1 `part.recovered_controller` - 2
`part.simple_bracket`

**Montagem:** 45 s.\
**Desbloqueia:** extração de minério.\
**Produção-base:** 1 unidade de minério bruto a cada 20 s, alternando
entre os depósitos disponíveis.\
**Energia:** 1 unidade por ciclo.\
**Buffer interno:** 10 unidades.\
**Melhorias iniciais:** velocidade, capacidade de buffer e seletor de
minério.

## 6.3 Módulo: Construtor inicial

**Receita:** - 1 `part.basic_frame` - 1 `part.mechanical_assembly` - 1
`part.recovered_controller` - 2 `part.basic_conveyor` - 2
`part.simple_bracket`

**Montagem:** 60 s.\
**Desbloqueia:** fabricação de componentes e módulos iniciais.\
**Capacidade:** 1 fila de produção; 1 receita por vez.\
**Energia:** 2 unidades por ciclo de construção.\
**Limite:** não fabrica componentes que exijam fundição, química ou
eletrônica industrial. Ele monta peças recuperadas e componentes
rudimentares.

## 6.4 Módulo: Estoque industrial

**Receita:** - 1 `part.basic_frame` - 2 `part.storage_bay` - 1
`part.basic_conveyor` - 1 `part.recovered_controller` - 4
`part.fastener`

**Montagem:** 45 s.\
**Capacidade inicial:** 100 espaços de inventário; cada pilha de um item
ocupa 1 espaço, independentemente da quantidade.\
**Energia:** 1 unidade por ciclo de movimentação, não por item
armazenado.\
**Efeito especial:** desbloqueia expedições e permite guardar
componentes recuperados.

## 6.5 Ordem de desbloqueio

1.  Coletor de sucata e separador já instalados.
2.  Fabricar peças rudimentares.
3.  Construir o construtor inicial.
4.  Fabricar o coletor de minério e o estoque.
5.  Instalar o estoque.
6.  **Desbloquear expedições.**
7.  Fazer a primeira expedição e recuperar componentes industriais.
8.  Construir o forno de recuperação.

O jogo pode permitir construir coletor de minério antes do construtor,
desde que os componentes básicos sejam montados manualmente. A ordem de
instalação não deve ser rígida; a dependência obrigatória é que o
estoque seja instalado antes das expedições.

------------------------------------------------------------------------

# 7. Estágio 2 --- primeira expedição e forno

## 7.1 Regras da primeira expedição

-   Duração-base: 90 s.
-   Uma escolha de rota.
-   Uma janela de extração no fim.
-   Espólio garantido: 3 `scrap.structural`, 2 `scrap.mechanical`, 1
    `scrap.electrical`.
-   Uma recompensa garantida entre `part.motor_damaged`,
    `part.pump_damaged` ou `part.power_cell_damaged`.
-   20% de chance de encontrar `project.basic_furnace`.
-   Se o projeto não cair, a próxima expedição inicial garante o
    projeto.
-   A expedição não exige combustível avançado; consome 5 unidades de
    energia de expedição.
-   A carga não protegida pode ser perdida em derrota; o projeto
    desbloqueado permanece.

## 7.2 Componentes para o forno

  ----------------------------------------------------------------------------------------------------
  Item                               Receita                                    Tempo Máquina
  ---------------------------------- -------------------------- --------------------- ----------------
  `mat.refractory_lining` ---        3 `raw.basalt` + 1                          30 s Construtor
  Revestimento refratário            `raw.borate`                                     inicial, receita
                                                                                      rudimentar

  `part.heating_coil` --- Bobina     3 `part.short_wire` + 1                     25 s Construtor
  térmica simples                    `part.heatsink_fragment`                         inicial

  `part.thermal_chamber` --- Câmara  4 `part.rough_plate` + 2                    35 s Construtor
  térmica                            `mat.refractory_lining`                          inicial

  `part.basic_temperature_control`   1 `part.simple_control` +                   25 s Construtor
  --- Controle térmico               2 `part.short_wire`                              inicial

  `part.ash_reservoir` --- Coletor   2 `part.rough_plate` + 2                    15 s Construtor
  de resíduos térmicos               `part.fastener`                                  inicial
  ----------------------------------------------------------------------------------------------------

Se `raw.basalt` ou `raw.borate` ainda não puderem ser minerados, devem
existir como materiais comuns na sucata térmica/química e como espólio
garantido da primeira expedição. Isso evita que o forno dependa de uma
cadeia que ele próprio precisa desbloquear.

## 7.3 Forno de recuperação

**Receita:** - 1 `part.basic_frame` - 1 `part.thermal_chamber` - 1
`part.heating_coil` - 1 `part.basic_temperature_control` - 1
`part.ash_reservoir` - 2 `mat.refractory_lining`

**Montagem:** 90 s.\
**Energia operacional:** 4 por ciclo.\
**Consumível térmico:** 1 `mat.thermal_residue` por 3 ciclos; pode ser
substituído por energia elétrica após instalar um gerador adequado.\
**Desbloqueia:** lingotes de ferro e cobre recuperados, cerâmica técnica
rudimentar e metal refinado de sucata.

## 7.4 Receitas do forno

  -------------------------------------------------------------------------------------------
  Receita          Ingredientes               Saída                                     Tempo
  ---------------- -------------------------- ------------------------- ---------------------
  Refino de ferro  3 `raw.ferrous_regolith` + 2 `mat.iron_ingot` + 1                     30 s
                   1 `mat.thermal_residue`    `mat.slag`                

  Refino de cobre  3 `raw.copper_ore` + 1     2 `mat.copper_ingot` + 1                   35 s
                   `mat.thermal_residue`      `mat.slag`                

  Recuperação de   3 `mat.recovered_iron` + 1 2 `mat.iron_ingot`                         25 s
  ferro            `mat.thermal_residue`                                

  Recuperação de   3 `mat.recovered_copper` + 2 `mat.copper_ingot`                       25 s
  cobre            1 `mat.thermal_residue`                              

  Cerâmica técnica 3 `raw.basalt` + 1         2 `mat.technical_ceramic`                  40 s
                   `raw.borate`                                         

  Vidro rudimentar 3 `raw.silica_sand` + 1    2 `mat.rough_glass`                        35 s
                   `mat.thermal_residue`                                
  -------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 8. Estágio 3 --- peças mecânicas e estrutura industrial

## 8.1 Materiais processados

  --------------------------------------------------------------------------------------
  Item                      Receita                          Tempo Máquina
  ------------------------- ---------------- --------------------- ---------------------
  `mat.iron_ingot` ---      3 minério +                       30 s Forno
  Lingote de ferro          resíduo térmico                        

  `mat.copper_ingot` ---    3 minério +                       35 s Forno
  Lingote de cobre          resíduo térmico                        

  `mat.iron_bar` --- Barra  1 lingote de                      15 s Laminador/extrusora
  de ferro                  ferro                                  

  `mat.copper_wire` --- Fio 1 lingote de                      20 s Trefiladora
  de cobre                  cobre                                  

  `mat.iron_sheet` ---      1 lingote de                      20 s Laminador
  Chapa de ferro            ferro                                  

  `mat.rough_glass` ---     3 areia                           35 s Forno
  Vidro rudimentar          silicatada +                           
                            resíduo térmico                        

  `mat.technical_ceramic`   Basalto + borato                  40 s Forno cerâmico
  --- Cerâmica técnica                                             

  `mat.recovered_polymer`   Sucata química                    10 s Separador
  --- Polímero recuperado                                          
  --------------------------------------------------------------------------------------

## 8.2 Máquinas mecânicas

### Trefiladora

-   Receita: 6 `mat.iron_ingot`, 2 `part.gear_small`, 1
    `part.mechanical_assembly`, 1 `part.simple_control`.
-   Montagem: 75 s.
-   Energia: 3/ciclo.
-   Desbloqueia: fio de cobre e cabos de seção maior.

### Laminador

-   Receita: 8 `mat.iron_ingot`, 4 `part.gear_small`, 2
    `part.short_shaft`, 1 `part.motor_damaged` reparado ou motor
    fabricado, 1 `part.simple_control`.
-   Montagem: 100 s.
-   Energia: 5/ciclo.
-   Desbloqueia: chapas, fitas e perfis metálicos.

### Prensa hidráulica

-   Receita: 8 `mat.iron_ingot`, 2 `part.hydraulic_cylinder`, 1
    `part.hydraulic_pump`, 1 `part.motor_basic`, 1
    `part.recovered_controller`.
-   Montagem: 120 s.
-   Energia: 6/ciclo.
-   Desbloqueia: suportes reforçados, perfis e peças conformadas.

### Torno/fresadora

-   Receita: 6 `mat.iron_ingot`, 1 `part.motor_basic`, 2
    `part.short_shaft`, 1 `part.precision_toolhead`, 1
    `part.recovered_controller`.
-   Montagem: 110 s.
-   Energia: 5/ciclo.
-   Desbloqueia: eixos, engrenagens e peças de precisão.

## 8.3 Componentes mecânicos fabricáveis

  ------------------------------------------------------------------------
  Item             Ingredientes     Máquina                          Tempo
  ---------------- ---------------- ---------------- ---------------------
  Barra metálica   1 lingote        Laminador                         15 s

  Chapa metálica   1 lingote        Laminador                         20 s

  Perfil           1 lingote + 1    Laminador                         25 s
  estrutural       fixador                           

  Viga reforçada   2 perfis + 4     Prensa                            30 s
                   fixadores                         

  Eixo curto       1 barra          Torno                             20 s

  Engrenagem       1 barra +        Fresadora                         25 s
                   ferramenta de                     
                   corte                             

  Rolamento        1 barra + 2      Fresadora                         35 s
                   componentes de                    
                   precisão                          

  Suporte          1 chapa + 2      Prensa                            20 s
  reforçado        fixadores                         

  Cilindro         2 barras + 1     Oficina mecânica                  40 s
  hidráulico       vedação + 1                       
                   pistão                            

  Pistão           1 barra + 1      Torno                             25 s
                   junta                             

  Ferramenta de    1 barra de aço + Fresadora                         35 s
  precisão         1 abrasivo                        
  ------------------------------------------------------------------------

------------------------------------------------------------------------

# 9. Estágio 4 --- linha elétrica e geração de energia

## 9.1 Componentes elétricos

  -----------------------------------------------------------------------------
  Item             Receita          Máquina                               Tempo
  ---------------- ---------------- --------------------- ---------------------
  Fio de cobre     1 lingote de     Trefiladora                            20 s
                   cobre                                  

  Cabo isolado     2 fios + 1       Extrusora de cabos                     25 s
                   polímero                               

  Bobina           3 cabos + 1      Bobinadora                             30 s
                   núcleo magnético                       

  Núcleo magnético 2 lingotes de    Prensa/sinterizador                    25 s
                   ferro                                  

  Ímã básico       2 materiais      Prensa magnética                       35 s
                   magnéticos + 1                         
                   núcleo                                 

  Placa de         1 substrato + 2  Bancada elétrica                       30 s
  circuito         fios + 2                               
                   conectores                             

  Controlador      1 placa + 2      Bancada elétrica                       40 s
  básico           componentes                            
                   eletrônicos + 1                        
                   conector                               

  Motor básico     1 rotor + 1      Montador                               50 s
                   estator + 2                            
                   bobinas + 1                            
                   controlador                            

  Gerador básico   1 rotor + 1      Montador                               60 s
                   estator + 3                            
                   bobinas + 1                            
                   controlador                            

  Transformador    1 núcleo + 2     Bancada elétrica                       45 s
                   bobinas +                              
                   isolamento                             

  Banco de         4 capacitores +  Montador elétrico                      60 s
  capacitores      1 barramento + 1                       
                   proteção                               
  -----------------------------------------------------------------------------

## 9.2 Máquinas da linha elétrica

### Bancada elétrica

-   Receita: 4 chapas de ferro, 3 cabos isolados, 1 controlador
    recuperado, 1 fonte de energia.
-   Montagem: 75 s.
-   Energia: 2/ciclo.
-   Desbloqueia: cabos, placas e controladores básicos.

### Bobinadora

-   Receita: 4 chapas, 2 eixos, 1 motor básico, 1 controlador.
-   Montagem: 90 s.
-   Energia: 3/ciclo.
-   Desbloqueia: bobinas, enrolamentos e núcleos.

### Gerador básico

-   Receita: 1 rotor, 1 estator, 3 bobinas, 1 controlador, 1 estrutura
    reforçada.
-   Montagem: 100 s.
-   Saída: 10 unidades de energia por segundo-base em operação.
-   Energia de partida: 20 unidades.
-   Consumível: não consome combustível enquanto operar com rotação
    fornecida por um sistema mecânico; em outra variante, usa
    combustível.
-   **Nota:** o gerador não deve produzir energia líquida negativa. A
    produção líquida deve descontar o consumo dos módulos auxiliares.

### Banco de baterias

-   Receita: 6 células de energia, 2 barramentos, 1 controlador de
    carga, 1 carcaça.
-   Montagem: 75 s.
-   Capacidade: 100 unidades de energia armazenada.
-   Desbloqueia: buffer de energia e suporte a picos de consumo.

------------------------------------------------------------------------

# 10. Estágio 5 --- fluidos, gases e química

## 10.1 Máquinas

### Destilador térmico

-   Receita: 4 chapas, 2 tubos, 1 aquecedor, 1 condensador, 1
    controlador.
-   Montagem: 90 s.
-   Energia: 4/ciclo.
-   Desbloqueia: água purificada e recuperação de fluidos.

### Coletor de gases

-   Receita: 4 chapas, 2 tubos pressurizados, 2 válvulas, 1 compressor,
    1 controlador.
-   Montagem: 100 s.
-   Energia: 4/ciclo.
-   Desbloqueia: coleta de `raw.nebula_gas` e gases locais.

### Refinaria química

-   Receita: 8 chapas resistentes, 2 bombas, 2 válvulas, 1 reator
    químico, 1 controlador avançado.
-   Montagem: 150 s.
-   Energia: 8/ciclo.
-   Desbloqueia: polímeros, lubrificantes, reagentes e aditivos.

## 10.2 Receitas químicas

  ---------------------------------------------------------------------------
  Produto          Ingredientes        Máquina                          Tempo
  ---------------- ------------------- ---------------- ---------------------
  Água suja        1 gelo de água      Destilador, modo                  10 s
                                       derretimento     

  Água purificada  2 água suja + 1     Destilador                        25 s
                   filtro                               

  Óleo recuperado  2 fluido hidráulico Destilador                        20 s
                   usado                                

  Lubrificante     2 óleo recuperado + Refinaria                         35 s
  industrial       1 aditivo           química          

  Fluido           2 base              Refinaria                         40 s
  hidráulico       lubrificante + 1    química          
                   aditivo + 1 água                     
                   purificada                           

  Polímero técnico 2 hidrocarbonetos + Refinaria                         45 s
                   1 reagente          química          

  Resina           2 polímeros + 1     Refinaria                         40 s
  estrutural       catalisador         química          

  Membrana         2 polímeros + 1     Montador químico                  35 s
  filtrante        suporte fino                         

  Gás separado     3 mistura gasosa +  Refinaria de                      45 s
                   1 cartucho          gases            
                   filtrante                            

  Refrigerante     2 água purificada + Refinaria                         30 s
  industrial       1 gás apropriado    química          
  ---------------------------------------------------------------------------

------------------------------------------------------------------------

# 11. Estágio 6 --- eletrônica e computação

A fabricação de semicondutores deve ter várias etapas e consumíveis. A
receita não pode ser apenas "areia + forno".

## 11.1. Cadeia de silício

  --------------------------------------------------------------------------------
  Etapa            Receita            Máquina                                Tempo
  ---------------- ------------------ ---------------------- ---------------------
  Sílica           3 areia silicatada Moedor/classificador                    20 s
  concentrada                                                

  Silício          3 sílica           Forno especializado                     60 s
  metalúrgico      concentrada +                             
                   carbono processado                        

  Silício de alta  2 silício          Refinaria química                       90 s
  pureza           metalúrgico +                             
                   reagentes                                 

  Cristal          3 silício de alta  Cristalizador                          120 s
  monocristalino   pureza + cadinho                          

  Wafer polido     1 cristal          Cortadora de precisão                   60 s
                   monocristalino +                          
                   abrasivo                                  

  Wafer processado 1 wafer +          Litografia                             120 s
                   fotorresiste +                            
                   gases de processo                         

  Chip básico      1 wafer            Montador eletrônico                     45 s
                   processado +                              
                   encapsulamento                            

  Processador      2 wafers           Fábrica de                             180 s
  avançado         processados +      semicondutores         
                   materiais                                 
                   especiais +                               
                   encapsulamento                            
  --------------------------------------------------------------------------------

## 11.2. Máquinas eletrônicas

### Sala limpa

-   Receita: 8 painéis vedados, 4 filtros, 2 unidades de refrigeração, 1
    controle ambiental.
-   Montagem: 180 s.
-   Energia: 8/ciclo.
-   Desbloqueia fabricação confiável de semicondutores.

### Cristalizador

-   Receita: 6 chapas de precisão, 1 câmara térmica, 1 controle de
    temperatura, 1 unidade de refrigeração.
-   Montagem: 150 s.
-   Energia: 8/ciclo.
-   Desbloqueia cristal monocristalino.

### Litografia

-   Receita: 8 painéis de sala limpa, 2 lentes ópticas, 1 emissor
    óptico, 1 controlador avançado, 1 sistema de alinhamento.
-   Montagem: 210 s.
-   Energia: 12/ciclo.
-   Desbloqueia wafers processados e circuitos integrados.

### Computador industrial

-   Receita: 1 processador básico, 2 memórias, 2 placas de circuito, 1
    módulo de comunicação, 1 carcaça.
-   Montagem: 75 s.
-   Desbloqueia controle industrial, logística e automação avançada.

### Núcleo de IA

-   Receita: 4 processadores avançados, 8 módulos de memória, 2
    interconexões avançadas, 1 sistema de refrigeração, 1 projeto de IA.
-   Montagem: 300 s.
-   Desbloqueia otimização autônoma, manutenção preditiva e sistemas de
    combate avançados.

------------------------------------------------------------------------

# 12. Estágio 7 --- robótica, logística e automação

  --------------------------------------------------------------------------
  Item               Receita          Máquina                          Tempo
  ------------------ ---------------- ---------------- ---------------------
  Servoacionamento   1 motor + 1      Montador                          50 s
                     encoder + 1                       
                     controlador                       

  Atuador linear     1 servo + 1      Montador                          60 s
                     eixo + 1                          
                     conjunto                          
                     mecânico                          

  Garra robótica     2 atuadores + 1  Montador                          75 s
                     estrutura + 1                     
                     sensor de força                   

  Braço robótico     3 atuadores + 1  Montador                         120 s
                     garra + 1        automático       
                     controlador +                     
                     estrutura                         

  Drone de mineração 1 chassi + 2     Montador                         150 s
                     motores + 1                       
                     bateria + 1                       
                     sensor + 1                        
                     controlador                       

  Unidade logística  2 esteiras + 2   Montador                         180 s
                     braços + 1       automático       
                     computador                        
                     industrial                        

  Robô de reparo     1 braço + 1      Montador                         180 s
                     computador       automático       
                     industrial +                      
                     ferramentas +                     
                     inventário de                     
                     peças                             

  Montador           2 braços + 2     Montador                         210 s
  automático         esteiras + 1     automático       
                     computador                        
                     industrial + 1                    
                     sistema de visão                  

  Centro de controle 2 computadores   Montador                         180 s
                     industriais +                     
                     sensores + rede                   
                     de dados                          
  --------------------------------------------------------------------------

A automação não deve eliminar a necessidade de planejar recursos. Ela
reduz intervenção e aumenta consistência, mas ainda consome energia,
espaço e peças de reposição.

------------------------------------------------------------------------

# 13. Estágio 8 --- defesa e combate

## 13.1. Componentes de defesa

  -------------------------------------------------------------------------
  Item              Receita          Máquina                          Tempo
  ----------------- ---------------- ---------------- ---------------------
  Placa balística   2 chapas de      Prensa                            45 s
                    aço + 1 cerâmica                  
                    técnica                           

  Blindagem         2 placas         Prensa de                         75 s
  composta          balísticas + 1   compósitos       
                    compósito + 2                     
                    fixadores                         

  Mecanismo de      2 engrenagens +  Oficina                           60 s
  alimentação       1 motor + 1                       
                    conjunto                          
                    mecânico                          

  Unidade de mira   1 sensor + 1     Montador                          90 s
                    computador                        
                    industrial + 1                    
                    módulo óptico                     

  Torre cinética    Estrutura +      Montador                         150 s
                    mecanismo de                      
                    alimentação +                     
                    atuador +                         
                    unidade de mira                   

  Emissor laser     Diodos ópticos + Montador óptico                  180 s
                    lentes +                          
                    dissipador +                      
                    controlador de                    
                    potência                          

  Canhão            Trilhos          Montador                         240 s
  eletromagnético   condutores +     avançado         
                    bobinas +                         
                    capacitores +                     
                    refrigeração                      

  Radar espacial    Antena +         Montador                         180 s
                    transmissor +    eletrônico       
                    receptor +                        
                    computador de                     
                    processamento                     

  Escudo energético Gerador + banco  Montador                         240 s
                    de capacitores + avançado         
                    emissores +                       
                    controlador                       
  -------------------------------------------------------------------------

## 13.2. Consumo operacional

-   Torre cinética: consome munição e energia de acionamento.
-   Torre laser: consome energia e capacidade de refrigeração.
-   Canhão eletromagnético: consome energia em picos, capacitores e
    manutenção de trilhos.
-   Radar: consome energia continuamente.
-   Escudo: consome energia conforme o dano absorvido e pode exigir
    tempo de recarga.
-   Blindagem: não consome energia, mas exige reparo após danos.

Os módulos de combate podem ser danificados durante ondas. O estado
operacional, danificado e desativado altera a produção e a capacidade
defensiva até o reparo.

------------------------------------------------------------------------

# 14. Estágio 9 --- materiais avançados e tecnologia dimensional

Estes itens devem depender de recursos exclusivos de portais, projetos e
infraestrutura de alto nível. Não devem ser fabricáveis com a tecnologia
inicial.

  -----------------------------------------------------------------------
  Material/componente     Receita conceitual      Origem ou requisito
  ----------------------- ----------------------- -----------------------
  Liga de titânio         Titânio refinado +      Forno avançado
  avançada                níquel + processo       
                          térmico                 

  Superliga térmica       Níquel + cobalto +      Refinaria metalúrgica
                          cromo + tratamento      

  Supercondutor           Material especial +     Laboratório avançado
                          refrigeração + processo 
                          de deposição            

  Matriz fotônica         Cristal óptico +        Sala limpa
                          circuito avançado +     
                          alinhamento             

  Nanocompósito           Polímero técnico +      Nanofábrica
                          fibra de carbono +      
                          nanomaterial            

  Material                Matriz polimérica +     Laboratório de
  autorregenerativo       microcápsulas +         materiais
                          catalisador raro        

  Cristal de ressonância  Fragmento exótico +     Portal de alta
                          estabilizador + energia instabilidade
                          dimensional             

  Liga alienígena         Sucata alienígena +     Projeto alienígena
                          reagente específico +   
                          forja exótica           

  Núcleo de contenção     Supercondutor +         Laboratório dimensional
                          cerâmica avançada +     
                          cristal de ressonância  

  Núcleo de portal        Núcleo de contenção +   Pesquisa dimensional
                          matriz fotônica +       
                          energia dimensional     
                          concentrada             

  Estabilizador           Núcleo de portal +      Projeto de portal
  dimensional             computador avançado +   
                          supercondutores         

  Fábrica autorreplicante Nanofábrica + núcleo de Endgame
  limitada                IA + material           
                          autorregenerativo +     
                          projeto exclusivo       
  -----------------------------------------------------------------------

## 14.1. Regras de endgame

-   Materiais exóticos podem ser exclusivos de determinados universos.
-   A indústria comum continua necessária para produzir suportes,
    estruturas, eletrônica e manutenção.
-   A tecnologia dimensional não deve tornar os materiais básicos
    obsoletos.
-   Fábricas autorreplicantes precisam de limites de energia, capacidade
    e matéria-prima.
-   Projetos raros desbloqueiam novas possibilidades, não apenas bônus
    de dano.
-   Algumas peças únicas podem ser impossíveis de fabricar em massa;
    isso cria objetivos de expedição permanentes.

------------------------------------------------------------------------

# 15. Estoque, buffers e logística

## 15.1. Capacidade de estoque por etapa

  Estrutura                         Capacidade inicial sugerida
  ------------------------------- -----------------------------
  Inventário temporário inicial                       20 pilhas
  Primeiro estoque industrial                        100 pilhas
  Estoque expandido I                                250 pilhas
  Estoque expandido II                               600 pilhas
  Armazém automatizado                             1.500 pilhas
  Rede logística avançada                          4.000 pilhas

Uma pilha pode conter uma quantidade variável conforme o tipo: -
Materiais comuns: 100 unidades por pilha. - Componentes: 25 unidades por
pilha. - Módulos: 5 unidades por pilha. - Itens únicos/exóticos: 1
unidade por pilha.

## 15.2. Buffers das máquinas

Cada máquina possui: - Buffer de entrada. - Buffer de saída. - Limite de
ciclos em fila. - Consumo operacional. - Estado de bloqueio por falta de
entrada, energia ou espaço.

Uma máquina cheia na saída para de produzir, mas não perde os itens. O
sistema deve informar claramente o motivo da parada.

## 15.3. Prioridade de logística

Ordem recomendada: 1. Componentes para reparos críticos. 2. Insumos de
geração e distribuição de energia. 3. Ingredientes das linhas
industriais ativas. 4. Insumos de defesa. 5. Construções e melhorias
opcionais.

O jogador deve poder sobrescrever essa prioridade quando desejar.

------------------------------------------------------------------------

# 16. Energia operacional e energia dimensional

São recursos diferentes e não devem ser confundidos.

## 16.1. Energia operacional

-   Alimenta máquinas, sensores, armas, refrigeração e logística.
-   Pode ser produzida por geradores e outras fontes.
-   Pode ser armazenada em baterias.
-   Uma queda de energia pausa as máquinas e pode desativar módulos de
    combate.
-   O sistema de distribuição pode ter capacidade máxima.

## 16.2. Energia dimensional

-   Acumulada no modo idle em relação aos portais disponíveis.
-   Necessária para acessar ou estabilizar portais.
-   Cada portal tem custo próprio e pode limitar acessos.
-   Portais mais avançados não substituem os antigos: recursos de
    portais antigos continuam necessários.
-   A energia dimensional não deve ser consumida como se fosse energia
    elétrica comum.

## 16.3. Regra para o protótipo

Começar com uma fonte operacional básica suficiente para o coletor,
separador e construtor inicial. O jogador precisa construir geração
própria antes de sustentar várias máquinas. Isso evita o bloqueio
inicial e mantém energia como um gargalo de progressão.

------------------------------------------------------------------------

# 17. Expedições, risco e recuperação

## 17.1. Categorias de carga

-   **Carga protegida:** exige espaço ou investimento específico; não se
    perde na derrota, ou tem perda fortemente reduzida.
-   **Carga não protegida:** pode ser perdida ao fracassar.
-   **Projeto desbloqueado:** permanece após a expedição.
-   **Relíquia única:** pode ter regra própria; se for requisito
    permanente, não deve desaparecer sem aviso.
-   **Material consumível de expedição:** usado para entrar, avançar ou
    extrair.

## 17.2. Regras de derrota

-   Perda parcial da carga não protegida.
-   Consumo de energia dimensional investida.
-   Dano em módulos usados na expedição.
-   Custos de reparo em materiais e componentes.
-   Nenhuma perda de receitas já pesquisadas.
-   Nenhum bloqueio permanente da cadeia básica.
-   O jogador pode recuperar-se através do modo idle e de expedições
    mais fáceis.

## 17.3. Marcos de extração

-   A extração só fica disponível em marcos definidos.
-   Quanto mais o jogador avança, maior pode ser a recompensa e o risco.
-   A escolha de continuar ou extrair é uma decisão central do modo
    alto.
-   Recursos de expedições avançadas devem desbloquear tecnologias, não
    simplesmente substituir toda a economia básica.

------------------------------------------------------------------------

# 18. Manutenção, danos e reparo

Cada módulo operacional pode ter três estados: - **Operacional:**
funciona normalmente. - **Danificado:** eficiência reduzida, consumo
maior ou risco de falha. - **Desativado:** não produz nem oferece sua
função principal.

## 18.1. Receita de reparo básico

-   2 `mat.recovered_iron`
-   1 `part.fastener`
-   1 `part.mechanical_assembly`
-   20 s de oficina

## 18.2. Reparos especializados

-   Módulo elétrico: cabo, controlador ou componente elétrico.
-   Módulo térmico: revestimento refratário e componente de
    refrigeração.
-   Módulo eletrônico: placa ou sensor equivalente.
-   Módulo de combate: peça mecânica, componente de mira e material
    estrutural.
-   Módulo avançado: componentes de nível equivalente ou superior.

A manutenção deve ser previsível e legível. O jogador precisa saber
quais materiais serão necessários antes de iniciar uma expedição de
risco.

------------------------------------------------------------------------

# 19. Melhorias permanentes da torre

A progressão permanente deve complementar a indústria, não substituí-la.

## 19.1. Eficiência

-   Menor desperdício em processos.
-   Melhor rendimento de refino.
-   Menor consumo de energia.
-   Redução de resíduos.

## 19.2. Infraestrutura

-   Mais capacidade de armazenamento.
-   Mais slots de módulos.
-   Buffers maiores.
-   Maior capacidade de distribuição elétrica.
-   Mais filas de produção.

## 19.3. Estabilidade

-   Menor custo de acesso a portais já dominados.
-   Menor chance de dano em expedições.
-   Melhor proteção de carga.
-   Menor custo de reparo.
-   Maior tolerância a falhas operacionais.

## 19.4. Pesquisa

-   Mais opções de projetos.
-   Análise de sucata desconhecida.
-   Desbloqueio de receitas alternativas.
-   Melhor aproveitamento de componentes recuperados.
-   Pesquisa de materiais exóticos.

Evitar melhorias ilimitadas de multiplicadores. A cada faixa de
pesquisa, priorizar novas escolhas, capacidades ou processos.

------------------------------------------------------------------------

# 20. Balanceamento inicial sugerido

Estes são alvos para um primeiro teste de ritmo, não compromissos
definitivos.

  ------------------------------------------------------------------------
  Marco                  Tempo esperado para jogador Objetivo
                                               ativo 
  --------------------- ---------------------------- ---------------------
  Primeiros componentes                     1--3 min Ensinar separação e
                                                     fabricação

  Primeiro construtor                       3--6 min Habilitar montagem de
                                                     módulos

  Coletor de minério                        5--8 min Abrir a economia
                                                     mineral

  Primeiro estoque                         7--12 min Habilitar inventário
                                                     e expedições

  Primeira expedição                      10--15 min Recuperar peças e
                                                     projeto do forno

  Primeiro forno                          15--25 min Iniciar metalurgia

  Primeiras chapas                        20--30 min Substituir sucata por
  fabricadas                                         peças produzidas

  Primeira geração                        30--45 min Reduzir dependência
  própria                                            energética inicial

  Primeira automação                      45--75 min Manter linhas sem
  estável                                            intervenção constante

  Primeira cadeia                             1--2 h Desbloquear controle
  eletrônica básica                                  industrial
  ------------------------------------------------------------------------

O ritmo depende da velocidade de coleta, do número de slots e do quanto
o jogo permanece ativo em segundo plano. Os marcos devem ser testados
com simulação e telemetria.

------------------------------------------------------------------------

# 21. Regras de validação da árvore

Antes de lançar novas receitas, validar automaticamente:

1.  Todo ingrediente utilizado existe no catálogo.
2.  Toda receita tem uma máquina que pode ser construída em algum ponto
    da progressão.
3.  Todo item necessário para uma máquina essencial tem pelo menos uma
    fonte confiável.
4.  Não existem dependências circulares sem um recurso de entrada
    externo.
5.  Projetos não podem exigir itens produzidos exclusivamente pela
    própria tecnologia bloqueada.
6.  Nenhum item essencial depende exclusivamente de sorte em expedições.
7.  Componentes raros têm uma fonte identificável e uma alternativa de
    recuperação, quando forem essenciais.
8.  Todas as máquinas têm custos de energia e tempos de produção
    definidos.
9.  Todo módulo danificável possui uma receita de reparo acessível.
10. O jogador consegue continuar após uma derrota, mesmo que perca toda
    a carga não protegida.
11. Materiais de universos antigos continuam sendo utilizados em cadeias
    avançadas.
12. O estoque e os buffers impedem que o sistema produza itens
    infinitamente sem espaço.
13. O construtor inicial não exige forno, energia avançada ou
    componentes fabricáveis apenas em eras futuras.
14. O primeiro estoque sempre desbloqueia expedições.
15. A energia operacional e a dimensional nunca são tratadas como o
    mesmo recurso.

------------------------------------------------------------------------

# 22. Checklist de implementação

## Protótipo 1 --- início jogável

-   [ ] Coletor de sucata
-   [ ] Separador
-   [ ] Materiais e peças iniciais
-   [ ] Construtor inicial
-   [ ] Coletor de minério
-   [ ] Primeiro estoque
-   [ ] Desbloqueio de expedições
-   [ ] Primeira expedição garantida
-   [ ] Forno de recuperação

## Protótipo 2 --- indústria básica

-   [ ] Lingotes e chapas
-   [ ] Trefiladora
-   [ ] Laminador
-   [ ] Prensa hidráulica
-   [ ] Oficina mecânica
-   [ ] Destilador
-   [ ] Coletor de gases
-   [ ] Gerador e bateria

## Protótipo 3 --- automação

-   [ ] Motores e controladores fabricáveis
-   [ ] Montador automático
-   [ ] Buffers e logística
-   [ ] Centro de controle
-   [ ] Reparo automatizado
-   [ ] Prioridades de produção

## Protótipo 4 --- combate e progressão avançada

-   [ ] Módulos de defesa
-   [ ] Danos e reparos
-   [ ] Expedições com marcos de extração
-   [ ] Projetos tecnológicos
-   [ ] Semicondutores
-   [ ] Robótica
-   [ ] Materiais exóticos
-   [ ] Tecnologia dimensional

------------------------------------------------------------------------

# 23. Decisões de design que ainda precisam de teste

Esta versão fecha uma primeira cadeia de dependências, mas alguns
parâmetros devem ser ajustados durante o protótipo:

-   **Taxa de sucata:** determina a velocidade da primeira fase.
-   **Chance de recuperação de peças:** deve gerar variedade sem
    bloquear o construtor.
-   **Capacidade de armazenamento:** precisa criar decisões sem se
    tornar microgerenciamento excessivo.
-   **Energia por ciclo:** define quando a geração própria vira
    prioridade.
-   **Tempo de expedição:** precisa compensar o risco e a atenção
    exigida.
-   **Frequência de dano:** deve tornar reparos relevantes, sem
    transformar o jogo em manutenção constante.
-   **Quantidade de slots de módulos:** determina o valor de expansão e
    especialização.
-   **Custo de energia dimensional:** define o ritmo de acesso aos
    portais.
-   **Proteção de carga:** deve permitir escolhas estratégicas sem punir
    excessivamente jogadores casuais.
-   **Duração do modo offline:** precisa limitar ou resolver
    corretamente a simulação acumulada.

------------------------------------------------------------------------

# 24. Resumo executivo

A árvore começa com sucata e separação manual, avança para montagem
rudimentar e estoque, e só então abre as expedições. As expedições
fornecem componentes prontos, máquinas danificadas e projetos que
aceleram a progressão. O forno inaugura a metalurgia; depois vêm peças
mecânicas, energia, fluidos, química, eletrônica, robótica, defesa e
tecnologia dimensional.

O princípio que une tudo é simples:

**A expedição permite obter algo antes de saber produzi-lo; a indústria
permite deixar de depender da sorte para obtê-lo novamente.**

A torre cresce porque o jogador transforma recursos em capacidade de
produção, capacidade de produção em automação, automação em poder de
combate e poder de combate em acesso a universos com recursos que abrem
novas tecnologias. Mesmo no endgame, materiais básicos, reparos,
energia, armazenamento e logística continuam necessários.

Este documento serve como base de design para o protótipo. As receitas,
tempos e quantidades são propostas iniciais e devem ser validadas por
testes de fluxo, gargalos e duração de sessão.
