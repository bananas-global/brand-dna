import { Fragment, useCallback, useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import {
  buildChangeRequest,
  buildUpdatePrompt,
  diffBrandDna,
  draftStorageKey,
  reconcileColorBases,
  setAtPath,
  type EditorDirections,
  type JsonValue,
} from "./editor";
import { generateColorScale, getColorAtStop, getContrastColor, getScaleTones, resolveBaseColorValue } from "./color-scale";
import { buildGoogleFontStylesheet, detectGoogleFontWeights, parseGoogleFontLink } from "./google-fonts";

const brandDnaDownloadUrl = "/brand-dna/brand/brand-dna.json";
type ColorMode = "source" | "complementary" | "derived" | "custom";
type BrandColor = { name: string; value: string; mode: ColorMode; role: string };
type EmbeddedBrandDna = typeof __BRAND_DNA__;
type ColorScaleSettings = EmbeddedBrandDna["visual"]["colorScale"];
type ColorScaleLink = { mode: "linked" | "custom"; settings?: ColorScaleSettings };
type BrandDna = Omit<EmbeddedBrandDna, "visual"> & {
  visual: Omit<EmbeddedBrandDna["visual"], "colors" | "colorScales"> & {
    colors: BrandColor[];
    colorScales: Record<string, ColorScaleLink>;
  };
};
const linkedColorScales = Object.fromEntries(
  ["Accent", "Success", "Warning", "Error"].map((name) => [name, { mode: "linked" }]),
) as Record<string, ColorScaleLink>;
const embeddedBrandDna = __BRAND_DNA__ as BrandDna;
const initialBrandDna: BrandDna = {
  ...embeddedBrandDna,
  visual: {
    ...embeddedBrandDna.visual,
    colorScales: embeddedBrandDna.visual.colorScales ?? linkedColorScales,
  },
};

const sections = [
  ["principles", "Principles"],
  ["logo", "Logo"],
  ["typography", "Typography"],
  ["color", "Color"],
  ["layout", "Layout"],
  ["imagery", "Imagery"],
  ["iconography", "Iconography"],
  ["motion", "Motion"],
  ["voice", "Voice & Tone"],
  ["applications", "Applications"],
] as const;

type SectionId = (typeof sections)[number][0];

const getEffectiveColorScale = (brandDna: BrandDna, colorName: string): ColorScaleSettings => {
  const linkedScale = brandDna.visual.colorScales?.[colorName];
  return linkedScale?.mode === "custom" && linkedScale.settings
    ? { ...brandDna.visual.colorScale, ...linkedScale.settings }
    : brandDna.visual.colorScale;
};

const Swatch = ({ name, hex, role, displayValue = hex }: { name: string; hex: string; role: string; displayValue?: string }) => (
  <article className="swatch">
    <div className="swatch-color" style={{ backgroundColor: hex }} aria-hidden="true" />
    <div className="swatch-meta"><b>{name}</b><code>{displayValue}</code></div>
    <p>{role}</p>
  </article>
);

const ColorScale = ({ name, hex, settings, markers }: {
  name: string;
  hex: string;
  settings: BrandDna["visual"]["colorScale"];
  markers?: Array<{ stop: number; label: string }>;
}) => {
  const scale = generateColorScale(hex, settings);
  const tones = getScaleTones(hex, settings);
  const contrast = getContrastColor(hex, settings);
  const oppositeStop = contrast.stop === 0 ? 1000 : 0;
  const oppositeColor = getColorAtStop(hex, settings, oppositeStop);
  return <article className="color-scale-row">
    <header><b>{name}</b><code>{scale.base}</code></header>
    <div className="color-scale-tones" aria-label={`${name}: 10 light tones, base color at 500, and 10 dark tones`}>
      {tones.map((tone, index) => {
        const stop = index * 50;
        const marker = markers?.find((item) => item.stop === stop);
        const isContrast = stop === contrast.stop;
        const isBase = stop === 500;
        return <i className={`${marker ? "is-semantic" : ""} ${isContrast ? `is-contrast contrast-${stop}` : ""} ${isBase ? "is-base" : ""}`.trim()} key={`${tone}-${index}`} style={{ backgroundColor: tone }} title={`${stop} · ${tone}`}>
          {marker && <span>{marker.label}</span>}
          {isContrast && <button
            className="contrast-marker"
            type="button"
            aria-label={`Automatic contrast for ${name}. Stop ${contrast.stop} provides ${contrast.ratio.toFixed(2)} to 1 contrast against the base color. The dot uses stop ${oppositeStop}, the opposite end of the scale.`}
            data-tooltip={`Calculated automatically · ${contrast.ratio.toFixed(2)}:1 against the base · Dot: ${oppositeStop}`}
            style={{ "--opposite-color": oppositeColor } as CSSProperties}
          />}
        </i>;
      })}
    </div>
    <div className="color-scale-axis" aria-hidden="true"><span>0 / Light</span><span>500 / Base</span><span>1000 / Dark</span></div>
  </article>;
};

const Chapter = ({ id, eyebrow, title, note, className = "", children }: {
  id: SectionId;
  eyebrow: string;
  title: string;
  note: string;
  className?: string;
  children: ReactNode;
}) => (
  <section
    className={`chapter tab-panel ${className}`}
    id={`panel-${id}`}
    role="tabpanel"
    aria-labelledby={`tab-${id}`}
  >
    <div className="section-head">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>
      <p>{note}</p>
    </div>
    {children}
  </section>
);

const LineIcon = ({ name, children }: { name: string; children: ReactNode }) => (
  <figure className="icon-card">
    <svg viewBox="0 0 48 48" role="img" aria-label={name}>{children}</svg>
    <figcaption>{name}</figcaption>
  </figure>
);

type EditorPanelProps = {
  section: SectionId;
  draft: BrandDna;
  directions: EditorDirections;
  changeCount: number;
  comparing: boolean;
  status: string;
  onChange: (path: string, value: JsonValue) => void;
  onDirections: (directions: EditorDirections) => void;
  onCompare: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onReset: () => void;
  onClose: () => void;
};

const Field = ({ label, value, onChange, multiline = false, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) => (
  <label className="editor-field">
    <span>{label}</span>
    {multiline
      ? <textarea value={value} rows={3} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      : <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}
  </label>
);

const RangeField = ({ label, ariaLabel = label, value, min, max, step = 1, unit, onChange }: {
  label: string;
  ariaLabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}) => (
  <label className="editor-field editor-range">
    <span>{label}<output>{value}{unit}</output></span>
    <input aria-label={ariaLabel} type="range" min={min} max={max} step={step} value={value} onInput={(event) => onChange(Number(event.currentTarget.value))} />
  </label>
);

type TypographyRole = "display" | "body" | "utility";

const FontRoleEditor = ({ fontRole, font, onChange }: {
  fontRole: TypographyRole;
  font: BrandDna["visual"]["typography"][TypographyRole];
  onChange: (path: string, value: JsonValue) => void;
}) => {
  const [weightResult, setWeightResult] = useState({ source: font.source ?? "", weights: [font.weight] });
  const label = fontRole[0].toUpperCase() + fontRole.slice(1);
  const parsedFont = parseGoogleFontLink(font.source);
  const weights = weightResult.source === font.source ? weightResult.weights : [font.weight];
  const checking = Boolean(parsedFont.family) && weightResult.source !== font.source;

  useEffect(() => {
    if (!parsedFont.family) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void detectGoogleFontWeights(font.source, { signal: controller.signal }).then((available) => {
        if (controller.signal.aborted) return;
        const nextWeights = available.length ? available : [font.weight];
        setWeightResult({ source: font.source ?? "", weights: nextWeights });
        if (!nextWeights.includes(font.weight)) {
          const nearest = nextWeights.reduce((best, candidate) =>
            Math.abs(candidate - font.weight) < Math.abs(best - font.weight) ? candidate : best,
          );
          onChange(`visual.typography.${fontRole}.weight`, nearest);
        }
      });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [font.source, font.weight, fontRole, onChange, parsedFont.family]);

  return <div className="editor-font-role">
    <Field
      label={`${label} font link`}
      value={font.source ?? ""}
      placeholder="Paste a Google Fonts link"
      onChange={(value) => {
        const parsed = parseGoogleFontLink(value);
        onChange(`visual.typography.${fontRole}.source`, value);
        if (parsed.family) onChange(`visual.typography.${fontRole}.family`, parsed.family);
      }}
    />
    {parsedFont.family && <label className="editor-field editor-font-weight">
      <span>Preferred weight<output>{checking ? "Checking…" : `${weights.length} available`}</output></span>
      <select
        aria-label={`${label} preferred weight`}
        disabled={checking}
        value={font.weight}
        onChange={(event) => onChange(`visual.typography.${fontRole}.weight`, Number(event.target.value))}
      >
        {weights.map((weight) => <option value={weight} key={weight}>{weight}</option>)}
      </select>
    </label>}
  </div>;
};

const SemanticStopSelect = ({ label, sourceName, value, min, max, baseHex, settings, onChange }: {
  label: string;
  sourceName: string;
  value: number;
  min: number;
  max: number;
  baseHex: string;
  settings: BrandDna["visual"]["colorScale"];
  onChange: (value: number) => void;
}) => {
  const stops = Array.from({ length: (max - min) / 50 + 1 }, (_, index) => min + index * 50);
  const selectedHex = getColorAtStop(baseHex, settings, value);
  return <label className="editor-field semantic-select">
    <span>{label}<output>{selectedHex}</output></span>
    <select aria-label={`${label} stop`} value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {stops.map((stop) => <option key={stop} value={stop}>{sourceName} {stop} · {getColorAtStop(baseHex, settings, stop)}</option>)}
    </select>
  </label>;
};

const ScaleControls = ({ name, settings, onChange }: {
  name: string;
  settings: ColorScaleSettings;
  onChange: (setting: keyof ColorScaleSettings, value: JsonValue) => void;
}) => {
  const ariaLabel = (label: string) => name === "Signal" ? label : `${name} ${label.toLowerCase()}`;
  return <div className={`editor-scale-controls ${name === "Signal" ? "is-signal" : "is-custom"}`}>
    <p>{name} / Scale behavior<span>10 light / 10 dark</span></p>
    <div className="editor-drift-control">
      <RangeField label="Hue drift" ariaLabel={ariaLabel("Hue drift")} value={settings.hueMultiplier} min={1} max={2} step={0.01} unit="×" onChange={(value) => onChange("hueMultiplier", value)} />
      <button type="button" aria-label={ariaLabel("Flip hue drift")} aria-pressed={Boolean(settings.hueFlip)} onClick={() => onChange("hueFlip", !settings.hueFlip)}>Flip</button>
    </div>
    <div className="editor-drift-control">
      <RangeField label="Saturation drift" ariaLabel={ariaLabel("Saturation drift")} value={settings.saturationMultiplier} min={1} max={2} step={0.05} unit="×" onChange={(value) => onChange("saturationMultiplier", value)} />
      <button type="button" aria-label={ariaLabel("Flip saturation drift")} aria-pressed={Boolean(settings.saturationFlip)} onClick={() => onChange("saturationFlip", !settings.saturationFlip)}>Flip</button>
    </div>
    <RangeField label="Scale contrast" ariaLabel={ariaLabel("Scale contrast")} value={settings.contrast} min={0.5} max={1.25} step={0.05} unit="×" onChange={(value) => onChange("contrast", value)} />
  </div>;
};

const numberFromToken = (value: string) => Number.parseFloat(value) || 0;

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

function EditorPanel({ section, draft, directions, changeCount, comparing, status, onChange, onDirections, onCompare, onCopy, onDownload, onReset, onClose }: EditorPanelProps) {
  const sectionLabel = sections.find(([id]) => id === section)?.[1];
  const signal = draft.visual.colors.find((color) => color.name === "Signal") ?? draft.visual.colors[0];
  const border = draft.visual.semanticColors.border;
  const utilityControls = <div className="editor-semantic-colors">
    <p>Utility colors<span>Derived tokens</span></p>
    <SemanticStopSelect label="Paper / Background" sourceName="Signal" value={draft.visual.semanticColors.paper.stop} min={0} max={450} baseHex={signal.value} settings={draft.visual.colorScale} onChange={(value) => onChange("visual.semanticColors.paper.stop", value)} />
    <SemanticStopSelect label="Ink / Foreground" sourceName="Signal" value={draft.visual.semanticColors.ink.stop} min={550} max={1000} baseHex={signal.value} settings={draft.visual.colorScale} onChange={(value) => onChange("visual.semanticColors.ink.stop", value)} />
    <RangeField label="Border opacity" value={Math.round(border.opacity * 100)} min={0} max={100} step={1} unit="%" onChange={(value) => onChange("visual.semanticColors.border.opacity", value / 100)} />
  </div>;

  const controls: Record<SectionId, ReactNode> = {
    principles: <>
      <Field label="Central idea" value={draft.essence.centralIdea} onChange={(value) => onChange("essence.centralIdea", value)} multiline />
      {draft.expressionPrinciples.map((principle, index) => <div className="editor-group" key={index}>
        <Field label={`Principle ${index + 1}`} value={principle.name} onChange={(value) => onChange(`expressionPrinciples[${index}].name`, value)} />
        <Field label="Intent" value={principle.intent} onChange={(value) => onChange(`expressionPrinciples[${index}].intent`, value)} multiline />
      </div>)}
    </>,
    logo: <Field label="Signature rule" value={draft.visual.signatureRule} onChange={(value) => onChange("visual.signatureRule", value)} multiline />,
    typography: <>
      <div className="editor-font-source">
        <p>Choose each typeface in Google Fonts, copy its link, and paste it into the matching field below.</p>
        <a href="https://fonts.google.com/" target="_blank" rel="noreferrer">Open Google Fonts ↗</a>
      </div>
      <FontRoleEditor fontRole="display" font={draft.visual.typography.display} onChange={onChange} />
      <FontRoleEditor fontRole="body" font={draft.visual.typography.body} onChange={onChange} />
      <FontRoleEditor fontRole="utility" font={draft.visual.typography.utility} onChange={onChange} />
    </>,
    color: <>
      <div className="editor-palette-label">Base colors</div>
      {draft.visual.colors.map((color, index) => {
        const mode = "mode" in color ? color.mode : undefined;
        const effectiveScale = getEffectiveColorScale(draft, color.name);
        const resolvedValue = resolveBaseColorValue(color, signal.value);
        if (color.name === "Signal") return <Fragment key={color.name}>
          <div className="editor-base-color">
            <label className="editor-color">
              <input aria-label="Choose Signal color" type="color" value={color.value} onChange={(event) => onChange(`visual.colors[${index}].value`, event.target.value.toUpperCase())} />
              <span>Signal</span>
              <input aria-label="Signal hex" value={color.value} onChange={(event) => onChange(`visual.colors[${index}].value`, event.target.value)} />
            </label>
          </div>
          <ScaleControls
            name="Signal"
            settings={draft.visual.colorScale}
            onChange={(setting, value) => onChange(`visual.colorScale.${setting}`, value)}
          />
          {utilityControls}
        </Fragment>;

        const derivedMode = color.name === "Accent" ? "complementary" : "derived";
        const scaleLink = draft.visual.colorScales?.[color.name] ?? { mode: "linked" };
        const scalePath = `visual.colorScales.${color.name}`;
        const editorMode = mode === "custom" ? "custom" : scaleLink.mode === "custom" ? "adjusted" : "default";
        return <Fragment key={color.name}>
          {color.name === "Success" && <div className="editor-semantic-harmony">
            <p>Semantic group<span>Success · Warning · Error</span></p>
          </div>}
          <section className="editor-derived-color" aria-label={`${color.name} color`}>
          <div className="editor-derived-summary">
            <i style={{ backgroundColor: resolvedValue }} aria-hidden="true" />
            <span><b>{color.name}</b><output>{resolvedValue}</output></span>
          </div>
          <div className="editor-mode-toggle editor-derived-tabs" role="group" aria-label={`${color.name} mode`}>
            <button type="button" aria-pressed={editorMode === "default"} onClick={() => {
              onChange(`visual.colors[${index}].mode`, derivedMode);
              onChange(scalePath, { mode: "linked" });
            }}>Default</button>
            <button type="button" aria-pressed={editorMode === "adjusted"} onClick={() => {
              onChange(`visual.colors[${index}].mode`, derivedMode);
              onChange(scalePath, {
                mode: "custom",
                settings: scaleLink.settings ?? structuredClone(draft.visual.colorScale),
              } as unknown as JsonValue);
            }}>Adjusted</button>
            <button type="button" aria-pressed={editorMode === "custom"} onClick={() => {
              onChange(`visual.colors[${index}].mode`, "custom");
              onChange(scalePath, {
                mode: "custom",
                settings: scaleLink.settings ?? structuredClone(draft.visual.colorScale),
              } as unknown as JsonValue);
            }}>Custom</button>
          </div>
          {editorMode === "custom" && <label className="editor-custom-color">
              <input aria-label={`Choose ${color.name} color`} type="color" value={color.value} onChange={(event) => onChange(`visual.colors[${index}].value`, event.target.value.toUpperCase())} />
              <input aria-label={`${color.name} hex`} value={color.value} onChange={(event) => onChange(`visual.colors[${index}].value`, event.target.value)} />
            </label>}
          {(editorMode === "adjusted" || editorMode === "custom") && <ScaleControls
            name={color.name}
            settings={effectiveScale}
            onChange={(setting, value) => onChange(scalePath, {
              mode: "custom",
              settings: { ...effectiveScale, [setting]: value },
            } as unknown as JsonValue)}
          />}
          </section>
        </Fragment>;
      })}
    </>,
    layout: <>
      {Object.entries(draft.visual.spacing).map(([name, value]) => <RangeField key={name} label={`Space ${name}`} value={numberFromToken(value)} min={0} max={96} step={2} unit="px" onChange={(next) => onChange(`visual.spacing.${name}`, `${next}px`)} />)}
      {Object.entries(draft.visual.radii).map(([name, value]) => <RangeField key={name} label={`${name} radius`} value={numberFromToken(value)} min={0} max={name === "full" ? 999 : 48} unit="px" onChange={(next) => onChange(`visual.radii.${name}`, `${next}px`)} />)}
    </>,
    imagery: <>
      <Field label="Image principle" value={draft.imagery.principle} onChange={(value) => onChange("imagery.principle", value)} multiline />
      <Field label="Do" value={draft.imagery.do} onChange={(value) => onChange("imagery.do", value)} multiline />
      <Field label="Avoid" value={draft.imagery.avoid} onChange={(value) => onChange("imagery.avoid", value)} multiline />
    </>,
    iconography: <>
      <Field label="Grid" value={draft.iconography.grid} onChange={(value) => onChange("iconography.grid", value)} />
      <Field label="Stroke" value={draft.iconography.stroke} onChange={(value) => onChange("iconography.stroke", value)} />
      <Field label="Corners" value={draft.iconography.corners} onChange={(value) => onChange("iconography.corners", value)} />
      <Field label="Style" value={draft.iconography.style} onChange={(value) => onChange("iconography.style", value)} />
    </>,
    motion: <>
      <Field label="Motion principle" value={draft.motionAndSound.principle} onChange={(value) => onChange("motionAndSound.principle", value)} multiline />
      {Object.entries(draft.motionAndSound.motion).filter(([name]) => name !== "easing").map(([name, value]) => <RangeField key={name} label={name} value={numberFromToken(value)} min={80} max={1200} step={20} unit="ms" onChange={(next) => onChange(`motionAndSound.motion.${name}`, `${next}ms`)} />)}
      <Field label="Easing" value={draft.motionAndSound.motion.easing} onChange={(value) => onChange("motionAndSound.motion.easing", value)} />
    </>,
    voice: <>
      <Field label="Voice intent" value={draft.voice.intent} onChange={(value) => onChange("voice.intent", value)} multiline />
      <Field label="Preferred words" value={draft.voice.preferredVocabulary.join(", ")} onChange={(value) => onChange("voice.preferredVocabulary", value.split(",").map((word) => word.trim()).filter(Boolean))} multiline />
      <Field label="Words to avoid" value={draft.voice.avoidVocabulary.join(", ")} onChange={(value) => onChange("voice.avoidVocabulary", value.split(",").map((word) => word.trim()).filter(Boolean))} multiline />
    </>,
    applications: <>{draft.channels.map((channel, index) => <div className="editor-group" key={channel.name}>
      <p className="editor-locked">{channel.name}<span>Fixed format</span></p>
      <Field label="Usage rule" value={channel.rule} onChange={(value) => onChange(`channels[${index}].rule`, value)} multiline />
    </div>)}</>,
  };

  return <aside className="editor-panel" aria-label="Brand editor">
    <header className="editor-head">
      <div><span>Edit / {sectionLabel}</span><b>{changeCount} {changeCount === 1 ? "change" : "changes"}</b></div>
      <button type="button" aria-label="Close editor" onClick={onClose}>×</button>
    </header>
    <div className="editor-scroll">
      {section === "principles" && <section className="editor-direction" aria-labelledby="direction-heading">
          <h2 id="direction-heading">Direction</h2>
          <Field label="Should feel like" value={directions.desired} onChange={(desired) => onDirections({ ...directions, desired })} multiline />
          <Field label="Should not feel like" value={directions.avoided} onChange={(avoided) => onDirections({ ...directions, avoided })} multiline />
        </section>}
      <section className="editor-controls" aria-labelledby="controls-heading">
        <h2 id="controls-heading">{sectionLabel}</h2>
        {controls[section]}
      </section>
    </div>
    <div className="editor-actions">
      <button type="button" aria-label={comparing ? "Show draft" : "Compare original"} onClick={onCompare}>{comparing ? "Draft" : "Compare"}</button>
      <button type="button" aria-label="Copy update prompt" onClick={onCopy} disabled={changeCount === 0 && !directions.desired && !directions.avoided}>Copy</button>
      <button type="button" aria-label="Download changes" onClick={onDownload} disabled={changeCount === 0}>Download</button>
      <button className="editor-reset" type="button" aria-label="Reset draft" onClick={onReset} disabled={changeCount === 0}>Reset</button>
      <p role="status" aria-live="polite">{status || "Changes stay in this browser until you copy them."}</p>
    </div>
  </aside>;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<SectionId>("principles");
  const [isEditing, setIsEditing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState<BrandDna>(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      return saved
        ? reconcileColorBases(JSON.parse(saved).draft as BrandDna, initialBrandDna)
        : structuredClone(initialBrandDna);
    } catch {
      return structuredClone(initialBrandDna);
    }
  });
  const [directions, setDirections] = useState<EditorDirections>(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      return saved ? JSON.parse(saved).directions as EditorDirections : { desired: "", avoided: "" };
    } catch {
      return { desired: "", avoided: "" };
    }
  });
  const changes = useMemo(() => diffBrandDna(initialBrandDna, draft), [draft]);
  const brandDna = isEditing && !comparing ? draft : initialBrandDna;
  const typography = brandDna.visual.typography;
  const signal = brandDna.visual.colors.find((item) => item.name === "Signal") ?? brandDna.visual.colors[0];
  const resolvedBaseColors = brandDna.visual.colors.map((base) => ({
    ...base,
    value: resolveBaseColorValue(base, signal.value),
  }));
  const ink = getColorAtStop(signal.value, brandDna.visual.colorScale, brandDna.visual.semanticColors.ink.stop);
  const borderToken = brandDna.visual.semanticColors.border;
  const border = withOpacity(ink, borderToken.opacity);
  const contrastColors = resolvedBaseColors.map((base) => ({
    base,
    contrast: getContrastColor(base.value, getEffectiveColorScale(brandDna, base.name)),
  }));
  const resolvedColors = [
    {
      name: "Ink",
      value: ink,
      role: `${brandDna.visual.semanticColors.ink.role} · Signal ${brandDna.visual.semanticColors.ink.stop}`,
    },
    {
      name: "Paper",
      value: getColorAtStop(signal.value, brandDna.visual.colorScale, brandDna.visual.semanticColors.paper.stop),
      role: `${brandDna.visual.semanticColors.paper.role} · Signal ${brandDna.visual.semanticColors.paper.stop}`,
    },
    {
      name: "Border",
      value: border,
      displayValue: `${Math.round(borderToken.opacity * 100)}% Ink`,
      role: `${borderToken.role} · ${Math.round(borderToken.opacity * 100)}% Ink`,
    },
    ...resolvedBaseColors,
  ];
  const paletteGroups = [
    { id: "brand", label: "Brand", names: ["Signal", "Accent"] },
    { id: "utility", label: "Utility", names: ["Ink", "Paper", "Border"] },
    { id: "semantic", label: "Semantic", names: ["Success", "Warning", "Error"] },
  ].map((group) => ({
    ...group,
    colors: group.names.map((name) => resolvedColors.find((item) => item.name === name)).filter((item) => item !== undefined),
  }));
  const color = (name: string, fallback: string) => resolvedColors.find((item) => item.name.toLowerCase() === name)?.value || fallback;
  const previewStyle = {
    "--ink": color("ink", "#182126"),
    "--paper": color("paper", "#F3F4EF"),
    "--signal": color("signal", "#FF5C35"),
    "--accent": color("accent", "#6657FF"),
    "--success": color("success", "#2E9B58"),
    "--warning": color("warning", "#D99A16"),
    "--error": color("error", "#D94332"),
    "--line": border,
    "--brand-display": `"${typography.display.family}", Georgia, serif`,
    "--brand-sans": `"${typography.body.family}", Arial, sans-serif`,
    "--brand-mono": `"${typography.utility.family}", monospace`,
    "--brand-display-weight": typography.display.weight,
    "--brand-body-weight": typography.body.weight,
    "--brand-utility-weight": typography.utility.weight,
  } as CSSProperties;

  useEffect(() => {
    const roles = ["display", "body", "utility"] as const;
    const links = roles.flatMap((role) => {
      const stylesheet = buildGoogleFontStylesheet(typography[role].source, typography[role].weight);
      if (!stylesheet) return [];
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = stylesheet;
      link.dataset.brandFont = role;
      document.head.append(link);
      return [link];
    });
    return () => links.forEach((link) => link.remove());
  }, [typography]);

  useEffect(() => {
    localStorage.setItem(draftStorageKey, JSON.stringify({ draft, directions }));
  }, [draft, directions]);

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

  const selectTab = (id: SectionId) => {
    setActiveTab(id);
    window.history.replaceState(null, "", `#${id}`);
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

  const updateDraft = useCallback((path: string, value: JsonValue) => {
    setDraft((current) => setAtPath(current, path, value));
    setComparing(false);
    setStatus("");
  }, []);

  const copyPrompt = async () => {
    const prompt = buildUpdatePrompt(initialBrandDna, draft, directions);
    await navigator.clipboard.writeText(prompt);
    setStatus("Update prompt copied.");
  };

  const downloadChanges = () => {
    const request = buildChangeRequest(initialBrandDna, draft, directions);
    const url = URL.createObjectURL(new Blob([JSON.stringify(request, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "brand-dna-change-request.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Change request downloaded.");
  };

  const resetDraft = () => {
    setDraft(structuredClone(initialBrandDna));
    setDirections({ desired: "", avoided: "" });
    setComparing(false);
    setStatus("Draft and directions reset to the source JSON.");
  };

  return (
    <main className={isEditing ? "is-editing" : ""} style={previewStyle}>
      <a className="skip-link" href="#content">Skip to content</a>

      <header className="topbar" aria-label="Document header">
        <button className="wordmark" type="button" onClick={() => selectTab("principles")} aria-label="Open principles">
          <span>DNA</span><i aria-hidden="true" />
        </button>
        <p>{comparing ? "Original source" : "Brand guidelines"}</p>
        <div className="document-meta">
          <div className="mode-switch" aria-label="Preview mode">
            <button type="button" aria-pressed={!isEditing} onClick={() => { setIsEditing(false); setComparing(false); }}>View</button>
            <button type="button" aria-pressed={isEditing} onClick={() => setIsEditing(true)}>Edit</button>
          </div>
          <span>v{brandDna.meta.version}</span>
          <a href={brandDnaDownloadUrl} download>Download JSON ↓</a>
        </div>
      </header>

      <aside className="rail" aria-label="Page navigation">
        <p className="rail-label">Guidelines</p>
        <nav aria-label="Brand guideline sections">
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
                  <span>{String(index + 1).padStart(2, "0")}</span>{label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <p className="rail-note">Use the rule.<br />Make the work.</p>
      </aside>

      <div className="page" id="content">
        <div hidden={activeTab !== "principles"}>
          <Chapter id="principles" eyebrow="01 / Foundation" title="Principles" note="The few decisions that guide every expression.">
            <div className="principle-lead">
              <p className="field-label">Central idea</p>
              <blockquote>“{brandDna.essence.centralIdea}”</blockquote>
            </div>
            <div className="principles-grid">
              {brandDna.expressionPrinciples.map((principle, index) => (
                <article key={principle.name}>
                  <span>P{index + 1}</span><h2>{principle.name}</h2><p>{principle.intent}</p>
                </article>
              ))}
            </div>
            <dl className="foundation-strip">
              <div><dt>Purpose</dt><dd>{brandDna.essence.purpose}</dd></div>
              <div><dt>Promise</dt><dd>{brandDna.essence.promise}</dd></div>
            </dl>
          </Chapter>
        </div>

        <div hidden={activeTab !== "logo"}>
          <Chapter id="logo" eyebrow="02 / Signature" title="Logo" note="Protect the mark. Keep every application recognizable." className="logo-page">
            <div className="logo-hero">
              <div className="mark-demo"><span>[BRAND]</span><i /></div>
              <div><p className="field-label">Primary signature</p><h2>{brandDna.visual.signatureRule}</h2></div>
            </div>
            <div className="logo-system">
              <article className="clearspace-demo">
                <p className="field-label">Clear space</p>
                <div className="clearspace-box"><i /><b>[BRAND]</b><i /></div>
                <p>Keep one signal width clear on every side.</p>
              </article>
              <article className="logo-pair logo-light"><span>[BRAND]</span><p>Light background</p></article>
              <article className="logo-pair logo-dark"><span>[BRAND]</span><p>Dark background</p></article>
            </div>
            <ul className="compact-rules"><li>Do not stretch.</li><li>Do not add effects.</li><li>Do not alter proportions.</li></ul>
          </Chapter>
        </div>

        <div hidden={activeTab !== "typography"}>
          <Chapter id="typography" eyebrow="03 / Type system" title="Typography" note="Hierarchy first. Personality follows." className="type-page">
            <div className="type-marquee"><span>Aa</span><p>One system.<br />Three voices.</p></div>
            <div className="type-specimens">
              <article className="type-display"><span>Display</span><p>Make the point visible.</p><code>{brandDna.visual.typography.display.family} · {brandDna.visual.typography.display.weight}</code></article>
              <article className="type-body"><span>Body</span><p>Use body type for sustained reading, instructions, and supporting detail.</p><code>{brandDna.visual.typography.body.family} · {brandDna.visual.typography.body.weight}</code></article>
              <article className="type-utility"><span>Utility</span><p>0123456789<br />ABCDEFGHIJKLMNOPQRSTUVWXYZ</p><code>{brandDna.visual.typography.utility.family} · {brandDna.visual.typography.utility.weight}</code></article>
            </div>
            <div className="type-scale" aria-label="Type scale">
              <div><code>Display / 76</code><b>Brand systems</b></div>
              <div><code>Heading / 32</code><b>Built to be used</b></div>
              <div><code>Body / 16</code><span>Clear information at a comfortable reading size.</span></div>
              <div><code>Label / 10</code><span>SECTION LABEL</span></div>
            </div>
          </Chapter>
        </div>

        <div hidden={activeTab !== "color"}>
          <Chapter id="color" eyebrow="04 / Palette" title="Color" note="Use color to organize, signal, and create recognition." className="color-page">
            <div className="palette-groups">
              {paletteGroups.map((group) => <section className="palette-group" aria-labelledby={`palette-${group.id}`} key={group.id}>
                <h2 id={`palette-${group.id}`}>{group.label}</h2>
                <div className={`swatches swatches-${group.id}`}>
                  {group.colors.map((color) => <Swatch key={color.name} name={color.name} hex={color.value} role={color.role} displayValue={"displayValue" in color ? color.displayValue : undefined} />)}
                </div>
              </section>)}
            </div>
            <section className="color-scale-system" aria-labelledby="color-scale-heading">
              <div className="color-scale-head"><div><p className="field-label">Generated system</p><h2 id="color-scale-heading">Light to dark</h2></div><p>Signal anchors Paper and Ink. Border uses Ink at an editable 20% opacity by default.</p></div>
              {resolvedBaseColors.map((color) => <ColorScale
                key={color.name}
                name={color.name}
                hex={color.value}
                settings={getEffectiveColorScale(brandDna, color.name)}
                markers={color.name === "Signal" ? [
                  { stop: brandDna.visual.semanticColors.paper.stop, label: "Paper" },
                  { stop: brandDna.visual.semanticColors.ink.stop, label: "Ink" },
                ] : undefined}
              />)}
              <dl className="color-scale-formula">
                <div><dt>Hue drift</dt><dd>{brandDna.visual.colorScale.hueMultiplier.toFixed(2)}×{brandDna.visual.colorScale.hueFlip ? " · Flipped" : ""}</dd></div>
                <div><dt>Saturation drift</dt><dd>{brandDna.visual.colorScale.saturationMultiplier.toFixed(2)}×{brandDna.visual.colorScale.saturationFlip ? " · Flipped" : ""}</dd></div>
                <div><dt>Scale contrast</dt><dd>{brandDna.visual.colorScale.contrast.toFixed(2)}×</dd></div>
              </dl>
            </section>
            <div className="color-pairs">
              {contrastColors.map(({ base, contrast }) => <article
                className="pair-auto"
                key={base.name}
                style={{ backgroundColor: base.value, color: contrast.value }}
              >
                <span>Aa</span>
                <div><b>{base.name} / Contrast</b><p>{contrast.value} · Stop {contrast.stop} · {contrast.ratio.toFixed(2)}:1</p></div>
              </article>)}
            </div>
            <p className="inline-rule"><b>Rule:</b> Never use color as the only carrier of meaning.</p>
          </Chapter>
        </div>

        <div hidden={activeTab !== "layout"}>
          <Chapter id="layout" eyebrow="05 / Structure" title="Layout" note="Build rhythm with columns, space, and alignment." className="layout-page">
            <div className="grid-specimen" aria-label="Twelve-column grid demonstration">
              {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
              <strong>12</strong><span>columns</span>
            </div>
            <div className="layout-details">
              <article className="spacing-block"><p className="field-label">Spacing scale</p>{Object.entries(brandDna.visual.spacing).map(([name, value]) => <div key={name}><i style={{ width: value }} /><code>{name} / {value}</code></div>)}</article>
              <article className="composition-demo"><p className="field-label">Composition</p><div><span /><span /><span /></div><p>Align to the grid. Change scale before adding decoration.</p></article>
              <article className="shape-block"><p className="field-label">Shape</p><div><i style={{ borderRadius: brandDna.visual.radii.small }} /><i style={{ borderRadius: brandDna.visual.radii.medium }} /><i style={{ borderRadius: brandDna.visual.radii.full }} /></div><p>Use radius only when it clarifies grouping or interaction.</p></article>
            </div>
          </Chapter>
        </div>

        <div hidden={activeTab !== "imagery"}>
          <Chapter id="imagery" eyebrow="06 / Art direction" title="Imagery" note={brandDna.imagery.principle} className="imagery-page">
            <div className="image-gallery">
              {brandDna.imagery.directions.map((direction, index) => (
                <figure className={`image-placeholder image-${index + 1}`} key={direction.name}>
                  <div className="crop-marks"><span /><span /><span /><span /></div>
                  <div className="image-art" aria-hidden="true"><i /><i /><i /></div>
                  <figcaption><b>{direction.name}</b><span>{direction.description}</span></figcaption>
                </figure>
              ))}
            </div>
            <div className="do-dont"><div><b>DO</b><p>{brandDna.imagery.do}</p></div><div><b>AVOID</b><p>{brandDna.imagery.avoid}</p></div></div>
          </Chapter>
        </div>

        <div hidden={activeTab !== "iconography"}>
          <Chapter id="iconography" eyebrow="07 / Symbol system" title="Iconography" note={brandDna.iconography.principle} className="icon-page">
            <div className="icon-grid">
              <LineIcon name="Create"><path d="M24 8v32M8 24h32" /></LineIcon>
              <LineIcon name="Move"><path d="M8 24h30M28 14l10 10-10 10" /></LineIcon>
              <LineIcon name="Save"><path d="M12 8h20l4 4v28H12zM18 8v12h12V8M18 32h12" /></LineIcon>
              <LineIcon name="View"><path d="M5 24s7-11 19-11 19 11 19 11-7 11-19 11S5 24 5 24z" /><circle cx="24" cy="24" r="5" /></LineIcon>
              <LineIcon name="Connect"><circle cx="12" cy="24" r="5" /><circle cx="36" cy="12" r="5" /><circle cx="36" cy="36" r="5" /><path d="m17 22 14-8M17 26l14 8" /></LineIcon>
              <LineIcon name="Confirm"><circle cx="24" cy="24" r="18" /><path d="m15 24 6 6 13-14" /></LineIcon>
            </div>
            <div className="icon-rules">
              <div><p className="field-label">Grid</p><b>{brandDna.iconography.grid}</b><span>Design on a consistent optical field.</span></div>
              <div><p className="field-label">Stroke</p><b>{brandDna.iconography.stroke}</b><span>Keep weight consistent at the base size.</span></div>
              <div><p className="field-label">Corners</p><b>{brandDna.iconography.corners}</b><span>Use one corner logic across the set.</span></div>
              <div><p className="field-label">Style</p><b>{brandDna.iconography.style}</b><span>Use fill only for selected states.</span></div>
            </div>
          </Chapter>
        </div>

        <div hidden={activeTab !== "motion"}>
          <Chapter id="motion" eyebrow="08 / Behavior" title="Motion" note="Explain change. Show cause and effect." className="motion-page">
            <div className="motion-stage">
              <div className="motion-orbit"><i /><span>Enter with direction.<br />Remain at rest.</span></div>
              <div><p className="field-label">Core principle</p><h2>{brandDna.motionAndSound.principle}</h2></div>
            </div>
            <div className="motion-tokens">
              <article><span>Fast</span><b>{brandDna.motionAndSound.motion.fast}</b><i className="m-fast" /></article>
              <article><span>Standard</span><b>{brandDna.motionAndSound.motion.standard}</b><i className="m-base" /></article>
              <article><span>Expressive</span><b>{brandDna.motionAndSound.motion.expressive}</b><i className="m-slow" /></article>
              <article><span>Easing</span><b>{brandDna.motionAndSound.motion.easing}</b><i className="m-curve" /></article>
            </div>
            <p className="inline-rule"><b>Rule:</b> Respect reduced-motion preferences. Ambient motion is optional.</p>
          </Chapter>
        </div>

        <div hidden={activeTab !== "voice"}>
          <Chapter id="voice" eyebrow="09 / Language" title="Voice & Tone" note="Say what matters. Adapt the energy, not the point of view." className="voice-page">
            <div className="voice-lead"><p className="field-label">Voice in one sentence</p><blockquote>“{brandDna.voice.intent}”</blockquote></div>
            <div className="voice-rules">{brandDna.voice.rules.map((rule, index) => <article key={rule}><span>0{index + 1}</span><h2>{rule}</h2></article>)}</div>
            <div className="tone-table" role="table" aria-label="Tone by context">
              <div role="row"><b role="cell">Guide</b><span role="cell">Clear + calm</span><p role="cell">“Start here. You can review it later.”</p></div>
              <div role="row"><b role="cell">Celebrate</b><span role="cell">Warm + brief</span><p role="cell">“All set. Your next step is ready.”</p></div>
              <div role="row"><b role="cell">Correct</b><span role="cell">Direct + useful</span><p role="cell">“This field needs a future date.”</p></div>
            </div>
            <div className="word-bank"><div><b>USE</b><p>{brandDna.voice.preferredVocabulary.join(" · ")}</p></div><div><b>AVOID</b><p>{brandDna.voice.avoidVocabulary.join(" · ")}</p></div></div>
          </Chapter>
        </div>

        <div hidden={activeTab !== "applications"}>
          <Chapter id="applications" eyebrow="10 / In use" title="Applications" note="One identity. Different formats and levels of intensity." className="applications-page">
            <div className="application-grid">
              {brandDna.channels.map((channel, index) => (
                <article className={`application-card ${["app-web", "app-presentation", "app-bi", "app-social"][index]}`} key={channel.name}>
                  <span>{channel.name}</span>
                  <div className="application-art" aria-hidden="true"><i /><i /><i /></div>
                  <p>{channel.rule}</p>
                </article>
              ))}
            </div>
            <div className="application-rule"><p className="field-label">Across every format</p><p>Preserve the logo, type hierarchy, palette logic, image direction, and voice. Adapt scale, density, and rhythm.</p></div>
          </Chapter>
        </div>

        <footer>
          <div className="footer-mark"><span>DNA</span><i /></div>
          <p>Practical brand guidelines for people and agents.</p>
          <button type="button" onClick={() => selectTab("principles")}>Principles <span aria-hidden="true">↑</span></button>
        </footer>
      </div>
      {isEditing && <EditorPanel
        section={activeTab}
        draft={draft}
        directions={directions}
        changeCount={changes.length}
        comparing={comparing}
        status={status}
        onChange={updateDraft}
        onDirections={(next) => { setDirections(next); setStatus(""); }}
        onCompare={() => setComparing((current) => !current)}
        onCopy={copyPrompt}
        onDownload={downloadChanges}
        onReset={resetDraft}
        onClose={() => { setIsEditing(false); setComparing(false); }}
      />}
    </main>
  );
}
