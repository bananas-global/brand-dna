import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand DNA — Template mestre",
  description:
    "Um template editorial para documentar a essência, a expressão e os fundamentos de implementação de uma marca.",
};

const sections = [
  ["essencia", "Essência"],
  ["expressao", "Expressão"],
  ["verbal", "Identidade verbal"],
  ["visual", "Identidade visual"],
  ["imagem", "Sistema de imagem"],
  ["motion", "Motion & som"],
  ["dados", "Informação & dados"],
  ["acessibilidade", "Acessibilidade"],
  ["implementacao", "DNA → canais"],
] as const;

const Swatch = ({ name, hex, className }: { name: string; hex: string; className: string }) => (
  <div className="swatch">
    <div className={`swatch-color ${className}`} aria-hidden="true" />
    <div className="swatch-meta">
      <span>{name}</span>
      <code>{hex}</code>
    </div>
  </div>
);

export default function Home() {
  return (
    <main>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>

      <header className="topbar" aria-label="Cabeçalho do documento">
        <a className="wordmark" href="#inicio" aria-label="Voltar ao início">
          <span>DNA</span><i aria-hidden="true" />
        </a>
        <p>Template de sistema de marca</p>
        <div className="document-meta">
          <span>Base 00</span>
          <span>v1.0</span>
        </div>
      </header>

      <aside className="rail" aria-label="Navegação da página">
        <p className="rail-label">Índice</p>
        <nav>
          <ol>
            {sections.map(([id, label], index) => (
              <li key={id}>
                <a href={`#${id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <p className="rail-note">Uma fonte de verdade, antes das interfaces.</p>
      </aside>

      <div className="page" id="conteudo">
        <section className="hero" id="inicio" aria-labelledby="hero-title">
          <div className="hero-kicker reveal r1">
            <span>Documento vivo</span>
            <span>Uso fictício / modelo aberto</span>
          </div>
          <div className="hero-copy reveal r2">
            <p className="hero-pretitle">Brand DNA / Brand System</p>
            <h1 id="hero-title">
              O que torna uma marca
              <em>ela mesma.</em>
            </h1>
          </div>
          <div className="hero-bottom reveal r3">
            <p className="hero-intro">
              Um template para registrar as decisões que mantêm uma marca coerente — da ideia central
              ao comportamento em cada canal.
            </p>
            <div className="spectrum" aria-label="Espectro visual demonstrativo">
              <span /><span /><span /><span /><span />
            </div>
            <p className="hero-caption">Placeholder neutro. Substitua o conteúdo; preserve a lógica.</p>
          </div>
        </section>

        <section className="chapter essence" id="essencia" aria-labelledby="essencia-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Fundamento</p>
              <h2 id="essencia-title">Essência da marca</h2>
            </div>
            <p>A parte que não muda quando o formato muda.</p>
          </div>
          <div className="essence-grid">
            <div className="essence-statement">
              <span className="field-label">Ideia central</span>
              <blockquote>“[Uma verdade curta que orienta todas as escolhas.]”</blockquote>
              <p>Não é uma tagline. É o critério interno para dizer “sim”, “não” e “ainda não”.</p>
            </div>
            <dl className="definition-list">
              <div>
                <dt>Propósito</dt>
                <dd>[A mudança concreta que a marca quer habilitar.]</dd>
              </div>
              <div>
                <dt>Papel</dt>
                <dd>[Como ela participa da vida das pessoas.]</dd>
              </div>
              <div>
                <dt>Tensão</dt>
                <dd>[O conflito cultural ou humano que ela ajuda a resolver.]</dd>
              </div>
              <div>
                <dt>Promessa</dt>
                <dd>[A experiência que deve se repetir em cada contato.]</dd>
              </div>
            </dl>
          </div>
          <div className="brand-compass" aria-label="Bússola de posicionamento fictícia">
            <div className="axis axis-x"><span>Próxima</span><span>Referencial</span></div>
            <div className="axis axis-y"><span>Calma</span><span>Expressiva</span></div>
            <div className="compass-field"><span className="compass-point">Ponto de intenção</span></div>
          </div>
        </section>

        <section className="chapter" id="expressao" aria-labelledby="expressao-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Comportamento</p>
              <h2 id="expressao-title">Princípios de expressão</h2>
            </div>
            <p>Três tensões produtivas ajudam a marca a soar como ela mesma sem repetir fórmulas.</p>
          </div>
          <div className="principles-grid">
            <article>
              <span className="principle-index">P—A</span>
              <h3>Clara,<br />não simplista.</h3>
              <p>Reduzimos esforço sem apagar nuance. Primeiro orientamos; depois aprofundamos.</p>
              <div className="range"><i style={{ left: "76%" }} /><span>Direta</span><span>Densa</span></div>
            </article>
            <article>
              <span className="principle-index">P—B</span>
              <h3>Humana,<br />não informal.</h3>
              <p>Falamos com pessoas, não com segmentos. Calor vem da atenção, não de intimidade forçada.</p>
              <div className="range"><i style={{ left: "42%" }} /><span>Próxima</span><span>Distante</span></div>
            </article>
            <article>
              <span className="principle-index">P—C</span>
              <h3>Viva,<br />não ruidosa.</h3>
              <p>Usamos contraste para criar energia. Uma ideia por vez, com espaço para respirar.</p>
              <div className="range"><i style={{ left: "61%" }} /><span>Contida</span><span>Intensa</span></div>
            </article>
          </div>
        </section>

        <section className="chapter verbal" id="verbal" aria-labelledby="verbal-title">
          <div className="section-head light">
            <div>
              <p className="eyebrow">Linguagem</p>
              <h2 id="verbal-title">Identidade verbal</h2>
            </div>
            <p>A voz é estável. O tom se adapta ao contexto, sem perder a intenção.</p>
          </div>
          <div className="voice-grid">
            <div className="voice-hero">
              <p className="field-label">Voz em uma frase</p>
              <blockquote>“[Dizemos o essencial com precisão e deixamos uma porta aberta.]”</blockquote>
            </div>
            <div className="voice-rules">
              <div><span>01</span><h3>Comece pela pessoa</h3><p>“Veja onde você está” antes de “Confira o painel”.</p></div>
              <div><span>02</span><h3>Prefira verbos concretos</h3><p>“Compare, escolha, avance” em vez de conceitos abstratos.</p></div>
              <div><span>03</span><h3>Termine com direção</h3><p>Toda mensagem deve deixar claro o próximo passo possível.</p></div>
            </div>
          </div>
          <div className="tone-table" role="table" aria-label="Escala de tom por contexto">
            <div className="tone-row tone-header" role="row">
              <span role="columnheader">Contexto</span><span role="columnheader">Prioridade</span><span role="columnheader">Exemplo fictício</span>
            </div>
            <div className="tone-row" role="row"><b role="cell">Orientar</b><span role="cell">Clareza + calma</span><p role="cell">“Comece por aqui. Você pode revisar depois.”</p></div>
            <div className="tone-row" role="row"><b role="cell">Celebrar</b><span role="cell">Energia + medida</span><p role="cell">“Tudo pronto. Seu próximo passo já está aberto.”</p></div>
            <div className="tone-row" role="row"><b role="cell">Corrigir</b><span role="cell">Precisão + cuidado</span><p role="cell">“Este campo precisa de uma data futura.”</p></div>
          </div>
        </section>

        <section className="chapter" id="visual" aria-labelledby="visual-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Forma</p>
              <h2 id="visual-title">Identidade visual</h2>
            </div>
            <p>Uma gramática mínima: cor que orienta, tipografia que hierarquiza e espaço que cria ritmo.</p>
          </div>

          <div className="visual-rule">
            <div className="mark-demo"><span>[MARCA]</span><i /></div>
            <div>
              <p className="field-label">Assinatura placeholder</p>
              <h3>O nome é variável.<br />A proporção é a regra.</h3>
              <p>A área livre ao redor da assinatura equivale à altura do sinal circular. Nunca comprimir, inclinar ou preencher com efeitos.</p>
            </div>
          </div>

          <div className="token-group">
            <div className="token-title"><p className="eyebrow">Tokens / Cor</p><p>Função antes de preferência.</p></div>
            <div className="swatches">
              <Swatch name="Ink" hex="#182126" className="ink" />
              <Swatch name="Paper" hex="#F3F4EF" className="paper" />
              <Swatch name="Signal" hex="#FF5C35" className="signal" />
              <Swatch name="Field" hex="#A7E3D5" className="field" />
              <Swatch name="Pulse" hex="#6657FF" className="pulse" />
            </div>
          </div>

          <div className="type-specimen">
            <div className="token-title"><p className="eyebrow">Tokens / Tipografia</p><p>Do argumento à evidência.</p></div>
            <div className="type-grid">
              <div className="type-display"><span>Display / Editorial</span><p>Aa</p><code>Georgia · 400 · −0.04em</code></div>
              <div className="type-body"><span>Texto / Leitura</span><p>A clareza começa na distância certa entre as ideias.</p><code>Geist Sans · 400 · 1.55</code></div>
              <div className="type-utility"><span>UTILITÁRIO / DADOS</span><p>0123456789<br />ABCDEFGHIJKLMNOPQRSTUVWXYZ</p><code>Geist Mono · 500</code></div>
            </div>
          </div>

          <div className="token-matrix">
            <div className="matrix-block spacing-block">
              <p className="eyebrow">Espaçamento</p>
              <div><i style={{ width: 4 }} /><code>space-1 · 4px</code></div>
              <div><i style={{ width: 8 }} /><code>space-2 · 8px</code></div>
              <div><i style={{ width: 16 }} /><code>space-4 · 16px</code></div>
              <div><i style={{ width: 32 }} /><code>space-8 · 32px</code></div>
              <div><i style={{ width: 64 }} /><code>space-16 · 64px</code></div>
            </div>
            <div className="matrix-block radius-block">
              <p className="eyebrow">Raios</p>
              <div><i className="radius-sm" /><code>radius-sm · 4px</code></div>
              <div><i className="radius-md" /><code>radius-md · 12px</code></div>
              <div><i className="radius-full" /><code>radius-full</code></div>
            </div>
            <div className="matrix-block shadow-block">
              <p className="eyebrow">Sombras</p>
              <div><i className="shadow-soft" /><code>shadow-soft</code></div>
              <div><i className="shadow-lift" /><code>shadow-lift</code></div>
            </div>
          </div>
        </section>

        <section className="chapter image-system" id="imagem" aria-labelledby="imagem-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Direção</p>
              <h2 id="imagem-title">Sistema de imagem</h2>
            </div>
            <p>Imagens devem revelar relações — nunca funcionar como decoração genérica.</p>
          </div>
          <div className="image-gallery">
            <figure className="image-placeholder image-a">
              <div className="crop-marks"><span /><span /><span /><span /></div>
              <div className="orb orb-a" /><div className="orb orb-b" />
              <figcaption><b>01 / Presença</b><span>Uma relação clara entre sujeito e espaço.</span></figcaption>
            </figure>
            <figure className="image-placeholder image-b">
              <div className="crop-marks"><span /><span /><span /><span /></div>
              <div className="light-shape" />
              <figcaption><b>02 / Material</b><span>Textura real, luz direcional, detalhe próximo.</span></figcaption>
            </figure>
            <figure className="image-placeholder image-c">
              <div className="crop-marks"><span /><span /><span /><span /></div>
              <div className="image-type">Aa</div>
              <figcaption><b>03 / Intervenção</b><span>Cor como comentário, não como filtro.</span></figcaption>
            </figure>
          </div>
          <div className="image-rules">
            <div><span className="do">FAZER</span><p>Mostrar ação, imperfeição e contexto suficiente para entender a cena.</p></div>
            <div><span className="dont">EVITAR</span><p>Banco de imagem óbvio, gestos encenados e filtros que anulam tons de pele.</p></div>
          </div>
        </section>

        <section className="chapter motion" id="motion" aria-labelledby="motion-title">
          <div className="section-head light">
            <div>
              <p className="eyebrow">Tempo & atmosfera</p>
              <h2 id="motion-title">Motion e som</h2>
            </div>
            <p>Movimento explica mudança. Som confirma ação — sempre opcional, nunca intrusivo.</p>
          </div>
          <div className="motion-stage" aria-label="Demonstração de movimento reduzido e intencional">
            <div className="motion-orbit"><i /><span>Transformação contínua</span></div>
            <div className="motion-copy">
              <p className="field-label">Princípio de movimento</p>
              <h3>Entrar com direção.<br />Permanecer em repouso.</h3>
              <p>Transições curtas esclarecem causa e efeito. Movimentos ambientes são raros e respeitam a preferência de reduzir animações.</p>
            </div>
          </div>
          <div className="motion-tokens">
            <div><span>Rápido</span><b>160 ms</b><i className="m-fast" /></div>
            <div><span>Padrão</span><b>280 ms</b><i className="m-base" /></div>
            <div><span>Expressivo</span><b>520 ms</b><i className="m-slow" /></div>
            <div><span>Curva</span><b>0.2, 0, 0, 1</b><i className="m-curve" /></div>
          </div>
          <div className="sound-note">
            <div className="sound-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
            <div><p className="field-label">Assinatura sonora / placeholder</p><p>Três notas, ataque suave, menos de 1 segundo. Usar somente como confirmação escolhida pela pessoa.</p></div>
          </div>
        </section>

        <section className="chapter" id="dados" aria-labelledby="dados-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Evidência</p>
              <h2 id="dados-title">Linguagem de informação e dados</h2>
            </div>
            <p>Dados não decoram argumentos. Eles tornam diferenças legíveis e decisões verificáveis.</p>
          </div>
          <div className="data-grid">
            <div className="data-story">
              <p className="field-label">Exemplo fictício / Índice relativo</p>
              <div className="big-data"><strong>72</strong><span>/100</span></div>
              <p>Nomeie a métrica, declare o período e explique o que muda para quem lê.</p>
            </div>
            <div className="bar-chart" aria-label="Gráfico ilustrativo com valores fictícios: clareza 72, confiança 58, distinção 86">
              <div><span>Clareza</span><i><b style={{ width: "72%" }} /></i><em>72</em></div>
              <div><span>Confiança</span><i><b style={{ width: "58%" }} /></i><em>58</em></div>
              <div><span>Distinção</span><i><b style={{ width: "86%" }} /></i><em>86</em></div>
              <p>Base ilustrativa · sem dados reais</p>
            </div>
          </div>
          <ul className="data-rules">
            <li><b>Dê contexto.</b><span>Valor, unidade, período e fonte aparecem juntos.</span></li>
            <li><b>Use cor com redundância.</b><span>Rótulos e padrões sustentam o significado.</span></li>
            <li><b>Não dramatize.</b><span>Escalas começam no zero quando a comparação exige.</span></li>
          </ul>
        </section>

        <section className="chapter accessibility" id="acessibilidade" aria-labelledby="access-title">
          <div className="section-head light">
            <div>
              <p className="eyebrow">Responsabilidade</p>
              <h2 id="access-title">Acessibilidade e limites</h2>
            </div>
            <p>Reconhecimento de marca não pode depender de excluir pessoas.</p>
          </div>
          <div className="access-grid">
            <div className="contrast-demo">
              <p className="field-label">Contraste de texto</p>
              <div className="contrast-pair"><span>Aa</span><div><b>Ink / Paper</b><p>15.1:1 · AAA</p></div></div>
              <div className="contrast-pair inverse"><span>Aa</span><div><b>Paper / Ink</b><p>15.1:1 · AAA</p></div></div>
            </div>
            <div className="access-list">
              <div><b>Leitura</b><p>Corpo mínimo de 16px; linhas entre 45 e 80 caracteres.</p></div>
              <div><b>Interação</b><p>Foco visível, ordem lógica e alvos de toque de pelo menos 40px.</p></div>
              <div><b>Movimento</b><p>Nenhuma informação depende apenas de animação ou áudio.</p></div>
              <div><b>Linguagem</b><p>Frases diretas, alternativas textuais e termos não excludentes.</p></div>
            </div>
          </div>
          <div className="limits">
            <p className="field-label">Limites de uso</p>
            <div>
              <p><b>Não usar a marca para:</b> criar urgência artificial, ocultar condições, sugerir certeza onde existe risco ou ornamentar informação crítica.</p>
              <p><b>Escalar quando:</b> uma aplicação envolve públicos vulneráveis, alto impacto, contexto cultural sensível ou uma exceção não prevista aqui.</p>
            </div>
          </div>
        </section>

        <section className="chapter implementation" id="implementacao" aria-labelledby="implementation-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Arquitetura</p>
              <h2 id="implementation-title">Do DNA aos canais</h2>
            </div>
            <p>O DNA orienta. Tokens traduzem. Cada canal implementa sem copiar cegamente.</p>
          </div>
          <div className="system-flow" aria-label="Relação entre Brand DNA, design tokens e implementação por canal">
            <article className="flow-dna"><span>01 / Significado</span><h3>Brand DNA</h3><p>Essência, princípios, voz, imagem e comportamento.</p></article>
            <div className="flow-arrow" aria-hidden="true">→</div>
            <article className="flow-tokens"><span>02 / Tradução</span><h3>Design tokens</h3><p>Cor, tipo, espaço, raio, sombra, tempo e curvas.</p></article>
            <div className="flow-arrow" aria-hidden="true">→</div>
            <article className="flow-channels"><span>03 / Expressão</span><h3>Canais</h3><ul><li>Produto digital</li><li>Conteúdo & social</li><li>Ambientes</li><li>Movimento & áudio</li></ul></article>
          </div>
          <div className="scope-note">
            <span>FORA DESTE DOCUMENTO</span>
            <p>Componentes de interface, padrões de produto e regras específicas de plataforma vivem nos sistemas de implementação de cada canal.</p>
          </div>
        </section>

        <footer>
          <div className="footer-mark"><span>DNA</span><i /></div>
          <p>Template fictício para futuras fontes de verdade de marca.</p>
          <a href="#inicio">Voltar ao topo <span aria-hidden="true">↑</span></a>
        </footer>
      </div>
    </main>
  );
}
