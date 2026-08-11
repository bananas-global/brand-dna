"use client";

import { useEffect, useState, type KeyboardEvent } from "react";

const sections = [
  ["overview", "Overview"],
  ["strategy", "Strategy"],
  ["expression", "Expression"],
  ["voice", "Voice & tone"],
  ["visual", "Visual identity"],
  ["imagery", "Imagery system"],
  ["motion", "Motion & sound"],
  ["data", "Information & data"],
  ["accessibility", "Accessibility"],
  ["channels", "Channel profiles"],
  ["ai-contract", "AI contract"],
  ["governance", "Governance"],
] as const;

type SectionId = (typeof sections)[number][0];

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
  const [activeTab, setActiveTab] = useState<SectionId>("overview");

  useEffect(() => {
    const syncWithHash = () => {
      const hash = window.location.hash.slice(1) as SectionId;
      if (sections.some(([id]) => id === hash)) setActiveTab(hash);
    };
    const frame = window.requestAnimationFrame(syncWithHash);
    window.addEventListener("hashchange", syncWithHash);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", syncWithHash);
    };
  }, []);

  const selectTab = (id: SectionId, updateUrl = true) => {
    setActiveTab(id);
    if (updateUrl) window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = sections.length - 1;
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    const [id] = sections[next];
    selectTab(id);
    document.getElementById(`tab-${id}`)?.focus();
  };

  return (
    <main>
      <a className="skip-link" href="#content">Skip to content</a>

      <header className="topbar" aria-label="Document header">
        <button className="wordmark" type="button" onClick={() => selectTab("overview")} aria-label="Open overview">
          <span>DNA</span><i aria-hidden="true" />
        </button>
        <p>Brand system template</p>
        <div className="document-meta">
          <span>Base 00</span>
          <span>v1.2</span>
        </div>
      </header>

      <aside className="rail" aria-label="Page navigation">
        <p className="rail-label">Chapters</p>
        <nav aria-label="Brand DNA chapters">
          <ol role="tablist" aria-orientation="vertical">
            {sections.map(([id, label], index) => (
              <li key={id}>
                <button
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  aria-controls={`panel-${id}`}
                  tabIndex={activeTab === id ? 0 : -1}
                  onClick={() => selectTab(id)}
                  onKeyDown={(event) => handleTabKey(event, index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <p className="rail-note">A source of truth before interfaces.</p>
      </aside>

      <div className="page" id="content">
        <section className="hero tab-panel" id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" hidden={activeTab !== "overview"}>
          <div className="hero-kicker reveal r1">
            <span>Living document</span>
            <span>Fictional use / open template</span>
          </div>
          <div className="hero-copy reveal r2">
            <p className="hero-pretitle">Brand DNA / Brand System</p>
            <h1 id="hero-title">
              What makes a brand
              <em>itself.</em>
            </h1>
          </div>
          <div className="hero-bottom reveal r3">
            <p className="hero-intro">
              A template for documenting the decisions that keep a brand coherent—from its central idea
              to its behavior in every channel.
            </p>
            <div className="spectrum" aria-label="Espectro visual demonstrativo">
              <span /><span /><span /><span /><span />
            </div>
            <p className="hero-caption">Neutral placeholder. Replace the content; preserve the logic.</p>
          </div>
        </section>

        <section className="chapter essence tab-panel" id="panel-strategy" role="tabpanel" aria-labelledby="tab-strategy" hidden={activeTab !== "strategy"}>
          <div className="section-head">
            <div>
              <p className="eyebrow">Foundation</p>
              <h2 id="strategy-title">Brand essence</h2>
            </div>
            <p>The part that does not change when the format does.</p>
          </div>
          <div className="essence-grid">
            <div className="essence-statement">
              <span className="field-label">Central idea</span>
              <blockquote>“[A short truth that guides every choice.]”</blockquote>
              <p>This is not a tagline. It is the internal criterion for saying “yes,” “no,” and “not yet.”</p>
            </div>
            <dl className="definition-list">
              <div>
                <dt>Purpose</dt>
                <dd>[The concrete change the brand wants to enable.]</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>[How it participates in people’s lives.]</dd>
              </div>
              <div>
                <dt>Tension</dt>
                <dd>[The cultural or human conflict it helps resolve.]</dd>
              </div>
              <div>
                <dt>Promise</dt>
                <dd>[The experience that should repeat at every touchpoint.]</dd>
              </div>
            </dl>
          </div>
          <div className="strategy-grid">
            <article className="strategy-card strategy-position">
              <p className="field-label">Positioning</p>
              <h3>For [priority audience], we are the [category] that [distinct benefit], because [proof].</h3>
              <p>A comparable, verifiable statement. It is not a slogan or advertising copy.</p>
            </article>
            <article className="strategy-card">
              <p className="field-label">Primary audience</p>
              <h3>[Who experiences the problem and chooses the solution.]</h3>
              <ul><li>Context and needs</li><li>Barriers and objections</li><li>Decision criteria</li></ul>
            </article>
            <article className="strategy-card">
              <p className="field-label">Influencing audience</p>
              <h3>[Who recommends, approves, or enables the decision.]</h3>
              <ul><li>What they need to prove</li><li>Risks they need to reduce</li><li>Language they recognize</li></ul>
            </article>
          </div>
          <div className="decision-order">
            <p className="field-label">Decision order for agents</p>
            <ol>
              <li><span>01</span><b>Truth</b><p>Never sacrifice accuracy for impact.</p></li>
              <li><span>02</span><b>Clarity</b><p>Reduce effort before adding expression.</p></li>
              <li><span>03</span><b>Distinction</b><p>Apply personality without reducing comprehension.</p></li>
              <li><span>04</span><b>Channel</b><p>Adapt the format while preserving invariants.</p></li>
            </ol>
          </div>
          <div className="brand-compass" aria-label="Fictional positioning compass">
            <div className="axis axis-x"><span>Approachable</span><span>Authoritative</span></div>
            <div className="axis axis-y"><span>Calm</span><span>Expressive</span></div>
            <div className="compass-field"><span className="compass-point">Intent point</span></div>
          </div>
        </section>

        <section className="chapter tab-panel" id="panel-expression" role="tabpanel" aria-labelledby="tab-expression" hidden={activeTab !== "expression"}>
          <div className="section-head">
            <div>
              <p className="eyebrow">Behavior</p>
              <h2 id="expression-title">Expression principles</h2>
            </div>
            <p>Three productive tensions help the brand sound like itself without repeating formulas.</p>
          </div>
          <div className="principles-grid">
            <article>
              <span className="principle-index">P—A</span>
              <h3>Clear,<br />not simplistic.</h3>
              <p>We reduce effort without erasing nuance. We orient first, then go deeper.</p>
              <div className="range"><i style={{ left: "76%" }} /><span>Direct</span><span>Dense</span></div>
            </article>
            <article>
              <span className="principle-index">P—B</span>
              <h3>Human,<br />not casual.</h3>
              <p>We speak to people, not segments. Warmth comes from attention, not forced intimacy.</p>
              <div className="range"><i style={{ left: "42%" }} /><span>Close</span><span>Distant</span></div>
            </article>
            <article>
              <span className="principle-index">P—C</span>
              <h3>Vivid,<br />not noisy.</h3>
              <p>We use contrast to create energy. One idea at a time, with room to breathe.</p>
              <div className="range"><i style={{ left: "61%" }} /><span>Restrained</span><span>Intense</span></div>
            </article>
          </div>
          <div className="example-pair">
            <article className="example-approved"><span>WORKS</span><h3>“See what changes your decision first.”</h3><p>Direct, human, and clearly prioritized.</p></article>
            <article className="example-avoid"><span>AVOID</span><h3>“Discover a revolutionary universe of possibilities.”</h3><p>Grandiose without evidence, generic, and noisy.</p></article>
          </div>
        </section>

        <section className="chapter verbal tab-panel" id="panel-voice" role="tabpanel" aria-labelledby="tab-voice" hidden={activeTab !== "voice"}>
          <div className="section-head light">
            <div>
              <p className="eyebrow">Language</p>
              <h2 id="voice-title">Voice & tone</h2>
            </div>
            <p>Voice is stable. Tone adapts to context without losing intent.</p>
          </div>
          <div className="voice-grid">
            <div className="voice-hero">
              <p className="field-label">Voice in one sentence</p>
              <blockquote>“[We say what matters with precision and leave a door open.]”</blockquote>
            </div>
            <div className="voice-rules">
              <div><span>01</span><h3>Start with the person</h3><p>“See where you are” before “Check the dashboard.”</p></div>
              <div><span>02</span><h3>Prefer concrete verbs</h3><p>“Compare, choose, move forward” instead of abstract concepts.</p></div>
              <div><span>03</span><h3>End with direction</h3><p>Every message should make the next possible step clear.</p></div>
            </div>
          </div>
          <div className="tone-table" role="table" aria-label="Tone scale by context">
            <div className="tone-row tone-header" role="row">
              <span role="columnheader">Context</span><span role="columnheader">Priority</span><span role="columnheader">Fictional example</span>
            </div>
            <div className="tone-row" role="row"><b role="cell">Guide</b><span role="cell">Clarity + calm</span><p role="cell">“Start here. You can review it later.”</p></div>
            <div className="tone-row" role="row"><b role="cell">Celebrate</b><span role="cell">Energy + restraint</span><p role="cell">“All set. Your next step is ready.”</p></div>
            <div className="tone-row" role="row"><b role="cell">Correct</b><span role="cell">Precision + care</span><p role="cell">“This field needs a future date.”</p></div>
          </div>
          <div className="word-bank">
            <div><p className="field-label">Preferred vocabulary</p><p>start · compare · understand · choose · move forward · review</p></div>
            <div><p className="field-label">Avoid by default</p><p>disruptive · revolutionary · leading · unmissable · 360° solution</p></div>
          </div>
        </section>

        <section className="chapter tab-panel" id="panel-visual" role="tabpanel" aria-labelledby="tab-visual" hidden={activeTab !== "visual"}>
          <div className="section-head">
            <div>
              <p className="eyebrow">Form</p>
              <h2 id="visual-title">Visual identity</h2>
            </div>
            <p>A minimal grammar: color that guides, typography that prioritizes, and space that creates rhythm.</p>
          </div>

          <div className="visual-rule">
            <div className="mark-demo"><span>[BRAND]</span><i /></div>
            <div>
              <p className="field-label">Placeholder signature</p>
              <h3>The name is variable.<br />Proportion is the rule.</h3>
              <p>Clear space around the signature equals the height of the circular signal. Never compress, skew, or fill it with effects.</p>
            </div>
          </div>

          <div className="token-group">
            <div className="token-title"><p className="eyebrow">Tokens / Color</p><p>Function before preference.</p></div>
            <div className="swatches">
              <Swatch name="Ink" hex="#182126" className="ink" />
              <Swatch name="Paper" hex="#F3F4EF" className="paper" />
              <Swatch name="Signal" hex="#FF5C35" className="signal" />
              <Swatch name="Field" hex="#A7E3D5" className="field" />
              <Swatch name="Pulse" hex="#6657FF" className="pulse" />
            </div>
          </div>

          <div className="type-specimen">
            <div className="token-title"><p className="eyebrow">Tokens / Typography</p><p>From argument to evidence.</p></div>
            <div className="type-grid">
              <div className="type-display"><span>Display / Editorial</span><p>Aa</p><code>Georgia · 400 · −0.04em</code></div>
              <div className="type-body"><span>Body / Reading</span><p>Clarity begins with the right distance between ideas.</p><code>Geist Sans · 400 · 1.55</code></div>
              <div className="type-utility"><span>UTILITY / DATA</span><p>0123456789<br />ABCDEFGHIJKLMNOPQRSTUVWXYZ</p><code>Geist Mono · 500</code></div>
            </div>
          </div>

          <div className="token-matrix">
            <div className="matrix-block spacing-block">
              <p className="eyebrow">Spacing</p>
              <div><i style={{ width: 4 }} /><code>space-1 · 4px</code></div>
              <div><i style={{ width: 8 }} /><code>space-2 · 8px</code></div>
              <div><i style={{ width: 16 }} /><code>space-4 · 16px</code></div>
              <div><i style={{ width: 32 }} /><code>space-8 · 32px</code></div>
              <div><i style={{ width: 64 }} /><code>space-16 · 64px</code></div>
            </div>
            <div className="matrix-block radius-block">
              <p className="eyebrow">Radii</p>
              <div><i className="radius-sm" /><code>radius-sm · 4px</code></div>
              <div><i className="radius-md" /><code>radius-md · 12px</code></div>
              <div><i className="radius-full" /><code>radius-full</code></div>
            </div>
            <div className="matrix-block shadow-block">
              <p className="eyebrow">Shadows</p>
              <div><i className="shadow-soft" /><code>shadow-soft</code></div>
              <div><i className="shadow-lift" /><code>shadow-lift</code></div>
            </div>
          </div>
        </section>

        <section className="chapter image-system tab-panel" id="panel-imagery" role="tabpanel" aria-labelledby="tab-imagery" hidden={activeTab !== "imagery"}>
          <div className="section-head">
            <div>
              <p className="eyebrow">Direction</p>
              <h2 id="imagery-title">Imagery system</h2>
            </div>
            <p>Images should reveal relationships—never act as generic decoration.</p>
          </div>
          <div className="image-gallery">
            <figure className="image-placeholder image-a">
              <div className="crop-marks"><span /><span /><span /><span /></div>
              <div className="orb orb-a" /><div className="orb orb-b" />
              <figcaption><b>01 / Presence</b><span>A clear relationship between subject and space.</span></figcaption>
            </figure>
            <figure className="image-placeholder image-b">
              <div className="crop-marks"><span /><span /><span /><span /></div>
              <div className="light-shape" />
              <figcaption><b>02 / Material</b><span>Real texture, directional light, close detail.</span></figcaption>
            </figure>
            <figure className="image-placeholder image-c">
              <div className="crop-marks"><span /><span /><span /><span /></div>
              <div className="image-type">Aa</div>
              <figcaption><b>03 / Intervention</b><span>Color as commentary, not as a filter.</span></figcaption>
            </figure>
          </div>
          <div className="image-rules">
            <div><span className="do">DO</span><p>Show action, imperfection, and enough context to understand the scene.</p></div>
            <div><span className="dont">AVOID</span><p>Obvious stock imagery, staged gestures, and filters that flatten skin tones.</p></div>
          </div>
        </section>

        <section className="chapter motion tab-panel" id="panel-motion" role="tabpanel" aria-labelledby="tab-motion" hidden={activeTab !== "motion"}>
          <div className="section-head light">
            <div>
              <p className="eyebrow">Time & atmosphere</p>
              <h2 id="motion-title">Motion & sound</h2>
            </div>
            <p>Motion explains change. Sound confirms action—always optional, never intrusive.</p>
          </div>
          <div className="motion-stage" aria-label="Intentional, reduced-motion demonstration">
            <div className="motion-orbit"><i /><span>Continuous transformation</span></div>
            <div className="motion-copy">
              <p className="field-label">Motion principle</p>
              <h3>Enter with direction.<br />Remain at rest.</h3>
              <p>Short transitions clarify cause and effect. Ambient motion is rare and respects reduced-motion preferences.</p>
            </div>
          </div>
          <div className="motion-tokens">
            <div><span>Fast</span><b>160 ms</b><i className="m-fast" /></div>
            <div><span>Standard</span><b>280 ms</b><i className="m-base" /></div>
            <div><span>Expressive</span><b>520 ms</b><i className="m-slow" /></div>
            <div><span>Easing</span><b>0.2, 0, 0, 1</b><i className="m-curve" /></div>
          </div>
          <div className="sound-note">
            <div className="sound-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
            <div><p className="field-label">Sonic signature / placeholder</p><p>Three notes, soft attack, under one second. Use only as a user-enabled confirmation.</p></div>
          </div>
        </section>

        <section className="chapter tab-panel" id="panel-data" role="tabpanel" aria-labelledby="tab-data" hidden={activeTab !== "data"}>
          <div className="section-head">
            <div>
              <p className="eyebrow">Evidence</p>
              <h2 id="data-title">Information & data language</h2>
            </div>
            <p>Data does not decorate arguments. It makes differences legible and decisions verifiable.</p>
          </div>
          <div className="data-grid">
            <div className="data-story">
              <p className="field-label">Fictional example / Relative index</p>
              <div className="big-data"><strong>72</strong><span>/100</span></div>
              <p>Name the metric, state the period, and explain what changes for the reader.</p>
            </div>
            <div className="bar-chart" aria-label="Illustrative chart with fictional values: clarity 72, trust 58, distinction 86">
              <div><span>Clarity</span><i><b style={{ width: "72%" }} /></i><em>72</em></div>
              <div><span>Trust</span><i><b style={{ width: "58%" }} /></i><em>58</em></div>
              <div><span>Distinction</span><i><b style={{ width: "86%" }} /></i><em>86</em></div>
              <p>Illustrative baseline · no real data</p>
            </div>
          </div>
          <ul className="data-rules">
            <li><b>Provide context.</b><span>Value, unit, period, and source appear together.</span></li>
            <li><b>Use redundant color cues.</b><span>Labels and patterns reinforce meaning.</span></li>
            <li><b>Do not dramatize.</b><span>Scales start at zero when the comparison requires it.</span></li>
          </ul>
        </section>

        <section className="chapter accessibility tab-panel" id="panel-accessibility" role="tabpanel" aria-labelledby="tab-accessibility" hidden={activeTab !== "accessibility"}>
          <div className="section-head light">
            <div>
              <p className="eyebrow">Responsibility</p>
              <h2 id="access-title">Accessibility & boundaries</h2>
            </div>
            <p>Brand recognition cannot depend on excluding people.</p>
          </div>
          <div className="access-grid">
            <div className="contrast-demo">
              <p className="field-label">Text contrast</p>
              <div className="contrast-pair"><span>Aa</span><div><b>Ink / Paper</b><p>15.1:1 · AAA</p></div></div>
              <div className="contrast-pair inverse"><span>Aa</span><div><b>Paper / Ink</b><p>15.1:1 · AAA</p></div></div>
            </div>
            <div className="access-list">
              <div><b>Reading</b><p>Minimum 16px body text; lines between 45 and 80 characters.</p></div>
              <div><b>Interaction</b><p>Visible focus, logical order, and touch targets of at least 40px.</p></div>
              <div><b>Motion</b><p>No information depends on animation or audio alone.</p></div>
              <div><b>Language</b><p>Direct sentences, text alternatives, and non-exclusionary terms.</p></div>
            </div>
          </div>
          <div className="limits">
            <p className="field-label">Usage boundaries</p>
            <div>
              <p><b>Never use the brand to:</b> create artificial urgency, hide conditions, imply certainty where risk exists, or decorate critical information.</p>
              <p><b>Escalate when:</b> an application involves vulnerable audiences, high impact, sensitive cultural context, or an exception not covered here.</p>
            </div>
          </div>
        </section>

        <section className="chapter channels tab-panel" id="panel-channels" role="tabpanel" aria-labelledby="tab-channels" hidden={activeTab !== "channels"}>
          <div className="section-head">
            <div>
              <p className="eyebrow">Adaptation</p>
              <h2 id="channels-title">Channel profiles</h2>
            </div>
            <p>The channel changes intensity and format. The central idea, voice, and boundaries remain.</p>
          </div>
          <div className="channel-constant">
            <p className="field-label">Adaptation rule</p>
            <p><b>Preserve:</b> promise, principles, essential vocabulary, contrast, and ethical criteria.</p>
            <p><b>Adapt:</b> density, rhythm, proportion, call to action, and degree of expressiveness.</p>
          </div>
          <div className="channel-grid">
            <article className="channel-card channel-deck">
              <span>PRESENTATIONS</span><h3>One idea per frame.</h3>
              <ul><li>Lead with the decision</li><li>30–60 words per slide</li><li>Data with an explicit conclusion</li><li>Imagery as evidence</li></ul>
            </article>
            <article className="channel-card channel-proposal">
              <span>PROPOSALS</span><h3>Clarity before persuasion.</h3>
              <ul><li>Context → approach → proof</li><li>Unambiguous scope</li><li>Confident, not grandiose</li><li>Unmistakable next step</li></ul>
            </article>
            <article className="channel-card channel-social">
              <span>SOCIAL</span><h3>One tension, one gesture.</h3>
              <ul><li>Specific hook</li><li>More expressive rhythm</li><li>Short on-image copy</li><li>Caption adds depth</li></ul>
            </article>
            <article className="channel-card channel-web">
              <span>WEB</span><h3>Guide, prove, invite.</h3>
              <ul><li>Responsive hierarchy</li><li>CTAs with concrete verbs</li><li>Motion explains change</li><li>Accessibility by default</li></ul>
            </article>
            <article className="channel-card channel-bi">
              <span>BI & DATA</span><h3>Reading ends in a decision.</h3>
              <ul><li>KPI with period and unit</li><li>Semantic, redundant color</li><li>Proportional precision</li><li>Annotate relevant deviations</li></ul>
            </article>
          </div>
          <div className="channel-prompt">
            <span>CHANNEL PROMPT</span>
            <p>“Apply the <b>[channel]</b> profile. Preserve brand invariants and adapt only the properties declared as flexible.”</p>
          </div>
        </section>

        <section className="chapter implementation tab-panel" id="panel-ai-contract" role="tabpanel" aria-labelledby="tab-ai-contract" hidden={activeTab !== "ai-contract"}>
          <div className="section-head">
            <div>
              <p className="eyebrow">Operational layer</p>
              <h2 id="implementation-title">AI contract</h2>
            </div>
            <p>The page explains the brand to people. Structured files deliver the same decisions to agents.</p>
          </div>
          <div className="system-flow" aria-label="Relationship between Brand DNA, design tokens, and channel implementation">
            <article className="flow-dna"><span>01 / Meaning</span><h3>Brand DNA</h3><p>Essence, principles, voice, imagery, and behavior.</p></article>
            <div className="flow-arrow" aria-hidden="true">→</div>
            <article className="flow-tokens"><span>02 / Contract</span><h3>Rules + tokens</h3><p>Invariants, preferences, boundaries, examples, and values.</p></article>
            <div className="flow-arrow" aria-hidden="true">→</div>
            <article className="flow-channels"><span>03 / Execution</span><h3>Agent + channel</h3><ul><li>Selects the profile</li><li>Produces the material</li><li>Validates the rules</li><li>Records exceptions</li></ul></article>
          </div>
          <div className="machine-grid">
            <div className="file-tree">
              <p className="field-label">Canonical package</p>
              <pre>{`brand/
├── brand-dna.yaml
├── tokens.json
├── channel-profiles.yaml
├── assets-manifest.json
└── validation-checklist.yaml`}</pre>
            </div>
            <div className="contract-anatomy">
              <p className="field-label">Anatomy of each rule</p>
              <dl>
                <div><dt>intent</dt><dd>Why the rule exists</dd></div>
                <div><dt>invariants</dt><dd>What never changes</dd></div>
                <div><dt>preferences</dt><dd>The recommended default</dd></div>
                <div><dt>avoid</dt><dd>What not to produce</dd></div>
                <div><dt>examples</dt><dd>Approved and negative pairs</dd></div>
                <div><dt>overrides</dt><dd>Channel-specific exceptions</dd></div>
              </dl>
            </div>
          </div>
          <div className="download-group">
            <div>
              <p className="field-label">Example files</p>
              <h3>Ready to connect to an agent.</h3>
            </div>
            <div className="download-list">
              <a href="/brand/brand-dna.yaml" download><span>Structured DNA</span><code>.yaml ↓</code></a>
              <a href="/brand/tokens.json" download><span>Design tokens</span><code>.json ↓</code></a>
              <a href="/brand/channel-profiles.yaml" download><span>Channel profiles</span><code>.yaml ↓</code></a>
              <a href="/brand/assets-manifest.json" download><span>Asset catalog</span><code>.json ↓</code></a>
              <a href="/brand/validation-checklist.yaml" download><span>Validation checklist</span><code>.yaml ↓</code></a>
            </div>
          </div>
          <div className="scope-note">
            <span>CONFLICT RULE</span>
            <p>Truth and accessibility outrank expression. Invariants outrank preferences. A channel profile may change only what is marked as flexible.</p>
          </div>
        </section>

        <section className="chapter governance tab-panel" id="panel-governance" role="tabpanel" aria-labelledby="tab-governance" hidden={activeTab !== "governance"}>
          <div className="section-head light">
            <div>
              <p className="eyebrow">Maintenance</p>
              <h2 id="governance-title">Governance</h2>
            </div>
            <p>A source of truth stays reliable only when decisions, owners, and changes remain visible.</p>
          </div>
          <div className="version-card">
            <div><span>CURRENT VERSION</span><strong>1.2</strong></div>
            <dl>
              <div><dt>Status</dt><dd>Approved for use</dd></div>
              <div><dt>Owner</dt><dd>[Owning team or person]</dd></div>
              <div><dt>Reviewed</dt><dd>[YYYY-MM-DD]</dd></div>
              <div><dt>Next review</dt><dd>[YYYY-MM-DD]</dd></div>
            </dl>
          </div>
          <div className="governance-grid">
            <article><span>APPROVED</span><h3>Canonical rule</h3><p>May guide people and agents in final materials.</p></article>
            <article><span>EXPERIMENTAL</span><h3>Hypothesis in testing</h3><p>Use within a controlled scope and record results.</p></article>
            <article><span>DEPRECATED</span><h3>Do not use</h3><p>Keep in history, never in the agent’s active context.</p></article>
          </div>
          <div className="approval-flow">
            <p className="field-label">Exception flow</p>
            <ol><li><b>01</b><span>Identify conflict</span></li><li><b>02</b><span>Record context</span></li><li><b>03</b><span>Obtain owner approval</span></li><li><b>04</b><span>Update the source</span></li></ol>
          </div>
          <div className="checklist-preview">
            <p className="field-label">Before publishing</p>
            <ul>
              <li><span>✓</span> Is the promise accurate and supportable?</li>
              <li><span>✓</span> Was the correct channel profile applied?</li>
              <li><span>✓</span> Do voice, imagery, and data respect the invariants?</li>
              <li><span>✓</span> Are contrast, reading, and motion accessible?</li>
              <li><span>✓</span> Are all assets marked as approved?</li>
              <li><span>✓</span> Were exceptions documented?</li>
            </ul>
          </div>
        </section>

        <footer>
          <div className="footer-mark"><span>DNA</span><i /></div>
          <p>Fictional template for future brand sources of truth.</p>
          <button type="button" onClick={() => selectTab("overview")}>Overview <span aria-hidden="true">→</span></button>
        </footer>
      </div>
    </main>
  );
}
