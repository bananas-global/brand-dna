"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import brandDna from "../public/brand/brand-dna.json";

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
  ["build-yours", "Build yours"],
] as const;

type SectionId = (typeof sections)[number][0];

const Swatch = ({ name, hex, role }: { name: string; hex: string; role: string }) => (
  <div className="swatch">
    <div className="swatch-color" style={{ backgroundColor: hex }} aria-hidden="true" />
    <div className="swatch-meta">
      <span>{name}</span>
      <code>{hex}</code>
    </div>
    <p className="swatch-role">{role}</p>
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
          <span>v{brandDna.meta.version}</span>
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
            <span>Minimum viable Brand DNA</span>
            <span>Open-source starter</span>
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
              Add what you have, answer eight questions, and turn one structured file into a brand source
              of truth for people and AI agents.
            </p>
            <div className="spectrum" aria-label="Espectro visual demonstrativo">
              <span /><span /><span /><span /><span />
            </div>
            <button className="hero-start" type="button" onClick={() => selectTab("build-yours")}>Build yours <span aria-hidden="true">→</span></button>
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
              <blockquote>“{brandDna.essence.centralIdea}”</blockquote>
              <p>This is not a tagline. It is the internal criterion for saying “yes,” “no,” and “not yet.”</p>
            </div>
            <dl className="definition-list">
              <div>
                <dt>Purpose</dt>
                <dd>{brandDna.essence.purpose}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{brandDna.essence.role}</dd>
              </div>
              <div>
                <dt>Tension</dt>
                <dd>{brandDna.essence.tension}</dd>
              </div>
              <div>
                <dt>Promise</dt>
                <dd>{brandDna.essence.promise}</dd>
              </div>
            </dl>
          </div>
          <div className="strategy-grid">
            <article className="strategy-card strategy-position">
              <p className="field-label">Positioning</p>
              <h3>{brandDna.positioning.statement}</h3>
              <p>A comparable, verifiable statement. It is not a slogan or advertising copy.</p>
            </article>
            <article className="strategy-card">
              <p className="field-label">Primary audience</p>
              <h3>{brandDna.positioning.primaryAudience}</h3>
              <ul><li>Context and needs</li><li>Barriers and objections</li><li>Decision criteria</li></ul>
            </article>
            <article className="strategy-card">
              <p className="field-label">Influencing audience</p>
              <h3>{brandDna.positioning.influencingAudience}</h3>
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
            {brandDna.expressionPrinciples.map((principle, index) => (
              <article key={principle.name}>
                <span className="principle-index">P—{String.fromCharCode(65 + index)}</span>
                <h3>{principle.name}</h3>
                <p>{principle.intent}</p>
                <div className="range"><i style={{ left: `${[76, 42, 61][index]}%` }} /><span>Restrained</span><span>Expressive</span></div>
              </article>
            ))}
          </div>
          <div className="example-pair">
            <article className="example-approved"><span>WORKS</span><h3>“{brandDna.expressionPrinciples[0].approvedExample}”</h3><p>Direct, human, and clearly prioritized.</p></article>
            <article className="example-avoid"><span>AVOID</span><h3>“{brandDna.expressionPrinciples[0].avoidExample}”</h3><p>Grandiose without evidence, generic, and noisy.</p></article>
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
              <blockquote>“{brandDna.voice.intent}”</blockquote>
            </div>
            <div className="voice-rules">
              {brandDna.voice.rules.map((rule, index) => (
                <div key={rule}><span>{String(index + 1).padStart(2, "0")}</span><h3>{rule}</h3><p>Apply this rule before adding personality or flourish.</p></div>
              ))}
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
            <div><p className="field-label">Preferred vocabulary</p><p>{brandDna.voice.preferredVocabulary.join(" · ")}</p></div>
            <div><p className="field-label">Avoid by default</p><p>{brandDna.voice.avoidVocabulary.join(" · ")}</p></div>
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
              <h3>{brandDna.visual.signatureRule}</h3>
              <p>Clear space around the signature equals the height of the circular signal. Never compress, skew, or fill it with effects.</p>
            </div>
          </div>

          <div className="token-group">
            <div className="token-title"><p className="eyebrow">Tokens / Color</p><p>Function before preference.</p></div>
            <div className="swatches">
              {brandDna.visual.colors.map((color) => <Swatch key={color.name} name={color.name} hex={color.value} role={color.role} />)}
            </div>
          </div>

          <div className="type-specimen">
            <div className="token-title"><p className="eyebrow">Tokens / Typography</p><p>From argument to evidence.</p></div>
            <div className="type-grid">
              <div className="type-display"><span>Display / Editorial</span><p>Aa</p><code>{brandDna.visual.typography.display.family} · {brandDna.visual.typography.display.weight} · {brandDna.visual.typography.display.letterSpacing}</code></div>
              <div className="type-body"><span>Body / Reading</span><p>Clarity begins with the right distance between ideas.</p><code>{brandDna.visual.typography.body.family} · {brandDna.visual.typography.body.weight} · {brandDna.visual.typography.body.lineHeight}</code></div>
              <div className="type-utility"><span>UTILITY / DATA</span><p>0123456789<br />ABCDEFGHIJKLMNOPQRSTUVWXYZ</p><code>{brandDna.visual.typography.utility.family} · {brandDna.visual.typography.utility.weight}</code></div>
            </div>
          </div>

          <div className="token-matrix">
            <div className="matrix-block spacing-block">
              <p className="eyebrow">Spacing</p>
              {Object.entries(brandDna.visual.spacing).map(([name, value]) => (
                <div key={name}><i style={{ width: Number.parseInt(value, 10) }} /><code>space-{name} · {value}</code></div>
              ))}
            </div>
            <div className="matrix-block radius-block">
              <p className="eyebrow">Radii</p>
              <div><i className="radius-sm" /><code>radius-small · {brandDna.visual.radii.small}</code></div>
              <div><i className="radius-md" /><code>radius-medium · {brandDna.visual.radii.medium}</code></div>
              <div><i className="radius-full" /><code>radius-full · {brandDna.visual.radii.full}</code></div>
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
            <p>{brandDna.imagery.principle}</p>
          </div>
          <div className="image-gallery">
            <figure className="image-placeholder image-a">
              <div className="crop-marks"><span /><span /><span /><span /></div>
              <div className="orb orb-a" /><div className="orb orb-b" />
              <figcaption><b>01 / {brandDna.imagery.directions[0].name}</b><span>{brandDna.imagery.directions[0].description}</span></figcaption>
            </figure>
            <figure className="image-placeholder image-b">
              <div className="crop-marks"><span /><span /><span /><span /></div>
              <div className="light-shape" />
              <figcaption><b>02 / {brandDna.imagery.directions[1].name}</b><span>{brandDna.imagery.directions[1].description}</span></figcaption>
            </figure>
            <figure className="image-placeholder image-c">
              <div className="crop-marks"><span /><span /><span /><span /></div>
              <div className="image-type">Aa</div>
              <figcaption><b>03 / {brandDna.imagery.directions[2].name}</b><span>{brandDna.imagery.directions[2].description}</span></figcaption>
            </figure>
          </div>
          <div className="image-rules">
            <div><span className="do">DO</span><p>{brandDna.imagery.do}</p></div>
            <div><span className="dont">AVOID</span><p>{brandDna.imagery.avoid}</p></div>
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
              <h3>{brandDna.motionAndSound.principle}</h3>
              <p>Short transitions clarify cause and effect. Ambient motion is rare and respects reduced-motion preferences.</p>
            </div>
          </div>
          <div className="motion-tokens">
            <div><span>Fast</span><b>{brandDna.motionAndSound.motion.fast}</b><i className="m-fast" /></div>
            <div><span>Standard</span><b>{brandDna.motionAndSound.motion.standard}</b><i className="m-base" /></div>
            <div><span>Expressive</span><b>{brandDna.motionAndSound.motion.expressive}</b><i className="m-slow" /></div>
            <div><span>Easing</span><b>{brandDna.motionAndSound.motion.easing}</b><i className="m-curve" /></div>
          </div>
          <div className="sound-note">
            <div className="sound-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
            <div><p className="field-label">Sonic signature / placeholder</p><p>{brandDna.motionAndSound.sound}</p></div>
          </div>
        </section>

        <section className="chapter tab-panel" id="panel-data" role="tabpanel" aria-labelledby="tab-data" hidden={activeTab !== "data"}>
          <div className="section-head">
            <div>
              <p className="eyebrow">Evidence</p>
              <h2 id="data-title">Information & data language</h2>
            </div>
            <p>{brandDna.informationAndData.principle}</p>
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
            {brandDna.informationAndData.rules.map((rule, index) => <li key={rule}><b>{String(index + 1).padStart(2, "0")}</b><span>{rule}</span></li>)}
          </ul>
        </section>

        <section className="chapter accessibility tab-panel" id="panel-accessibility" role="tabpanel" aria-labelledby="tab-accessibility" hidden={activeTab !== "accessibility"}>
          <div className="section-head light">
            <div>
              <p className="eyebrow">Responsibility</p>
              <h2 id="access-title">Accessibility & boundaries</h2>
            </div>
            <p>{brandDna.accessibility.principle}</p>
          </div>
          <div className="access-grid">
            <div className="contrast-demo">
              <p className="field-label">Text contrast</p>
              <div className="contrast-pair"><span>Aa</span><div><b>Ink / Paper</b><p>15.1:1 · AAA</p></div></div>
              <div className="contrast-pair inverse"><span>Aa</span><div><b>Paper / Ink</b><p>15.1:1 · AAA</p></div></div>
            </div>
            <div className="access-list">
              {brandDna.accessibility.rules.map((rule, index) => <div key={rule}><b>{["Reading", "Interaction", "Motion", "Language"][index]}</b><p>{rule}</p></div>)}
            </div>
          </div>
          <div className="limits">
            <p className="field-label">Usage boundaries</p>
            <div>
              <p><b>Never use the brand to:</b> {brandDna.accessibility.boundaries.join(" ")}</p>
              <p><b>Keep it simple:</b> if expression makes critical information harder to understand, remove the expression.</p>
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
            {brandDna.channels.map((channel, index) => (
              <article className={`channel-card ${["channel-deck", "channel-proposal", "channel-social", "channel-web", "channel-bi"][index]}`} key={channel.name}>
                <span>{channel.name.toUpperCase()}</span><h3>{channel.rule}</h3>
                <ul><li>{channel.job}</li><li>Preserve the central idea</li><li>Adapt density and rhythm</li></ul>
              </article>
            ))}
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
            <p>The page and every agent read the same source. There is nothing to synchronize.</p>
          </div>
          <div className="system-flow" aria-label="Relationship between Brand DNA, design tokens, and channel implementation">
            <article className="flow-dna"><span>01 / Meaning</span><h3>Brand DNA</h3><p>Essence, principles, voice, imagery, and behavior.</p></article>
            <div className="flow-arrow" aria-hidden="true">→</div>
            <article className="flow-tokens"><span>02 / Contract</span><h3>One JSON file</h3><p>Meaning, rules, tokens, channels, and provenance in one portable source.</p></article>
            <div className="flow-arrow" aria-hidden="true">→</div>
            <article className="flow-channels"><span>03 / Execution</span><h3>Agent + channel</h3><ul><li>Reads the same truth</li><li>Adapts the format</li><li>Produces the material</li><li>Keeps the brand coherent</li></ul></article>
          </div>
          <div className="machine-grid">
            <div className="file-tree">
              <p className="field-label">Canonical package</p>
              <pre>{`brand/
└── brand-dna.json`}</pre>
            </div>
            <div className="contract-anatomy">
              <p className="field-label">Provenance of every decision</p>
              <dl>
                <div><dt>evidence</dt><dd>Found directly in source material</dd></div>
                <div><dt>decision</dt><dd>Explicitly chosen by the designer</dd></div>
                <div><dt>proposal</dt><dd>Recommended by the builder for review</dd></div>
                <div><dt>missing</dt><dd>Still needs an answer or an asset</dd></div>
              </dl>
            </div>
          </div>
          <div className="download-group">
            <div>
              <p className="field-label">Single source of truth</p>
              <h3>Ready for people and agents.</h3>
            </div>
            <div className="download-list">
              <a href="/brand/brand-dna.json" download><span>Download the complete Brand DNA</span><code>.json ↓</code></a>
            </div>
          </div>
          <div className="scope-note">
            <span>WHY ONE FILE</span>
            <p>Strategy, expression, tokens, and channel rules evolve together. The website imports this file directly, eliminating duplicated truth.</p>
          </div>
        </section>

        <section className="chapter builder tab-panel" id="panel-build-yours" role="tabpanel" aria-labelledby="tab-build-yours" hidden={activeTab !== "build-yours"}>
          <div className="section-head light">
            <div>
              <p className="eyebrow">Minimum viable Brand DNA</p>
              <h2 id="builder-title">Build yours</h2>
            </div>
            <p>One folder, eight questions, one source of truth. The builder handles the rest.</p>
          </div>
          <ol className="builder-flow">
            <li><span>01</span><b>Add what you have</b><p>Drop existing material into <code>references/</code>, or leave it empty.</p></li>
            <li><span>02</span><b>Answer eight questions</b><p>The builder skips anything already supported by reliable evidence.</p></li>
            <li><span>03</span><b>Review the direction</b><p>Evidence, decisions, proposals, and gaps remain visibly different.</p></li>
            <li><span>04</span><b>Use your Brand DNA</b><p>The site and other agents read the same structured file.</p></li>
          </ol>
          <div className="question-block">
            <p className="field-label">The complete brief</p>
            <ol className="question-grid">
              {[
                "What does the brand offer?",
                "Who is it for?",
                "What perception should it build?",
                "Which three characteristics should define it?",
                "What must it never feel like?",
                "How should it speak?",
                "Which visual references feel relevant?",
                "Where will the identity be used most?",
              ].map((question, index) => <li key={question}><span>{String(index + 1).padStart(2, "0")}</span>{question}</li>)}
            </ol>
          </div>
          <div className="provenance-grid">
            <article><span>EVIDENCE</span><h3>Found</h3><p>Directly supported by a reference.</p></article>
            <article><span>DECISION</span><h3>Chosen</h3><p>Explicitly supplied by the designer.</p></article>
            <article><span>PROPOSAL</span><h3>Suggested</h3><p>A creative recommendation from the builder.</p></article>
            <article><span>MISSING</span><h3>Open</h3><p>The shortest list of what still needs to exist.</p></article>
          </div>
          <div className="starter-prompt">
            <span>START IN CODEX</span>
            <p>Use <b>$brand-dna-builder</b> to build my Brand DNA.</p>
          </div>
        </section>

        <footer>
          <div className="footer-mark"><span>DNA</span><i /></div>
          <p>Open-source starter for a minimum viable Brand DNA.</p>
          <button type="button" onClick={() => selectTab("overview")}>Overview <span aria-hidden="true">→</span></button>
        </footer>
      </div>
    </main>
  );
}
