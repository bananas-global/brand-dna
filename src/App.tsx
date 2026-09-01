import { Fragment, useCallback, useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { ArrowRight, CircleCheck, Eye, Plus, Save, Share2, type LucideIcon } from "lucide-react";
import {
  buildChangeRequest,
  buildUpdatePrompt,
  diffBrandDna,
  getDraftStorageKey,
  rebaseDraft,
  reconcileColorBases,
  setAtPath,
  type JsonValue,
} from "./editor";
import { generateColorScale, getColorAtStop, getContrastColor, getScaleTones, resolveBaseColorValue } from "./color-scale";
import { buildGoogleFontStylesheet, detectGoogleFontWeights, parseGoogleFontLink } from "./google-fonts";

const publicAssetUrl = (asset: string) => `${__BRAND_DNA_BASE_PATH__}${asset.replace(/^\//, "")}`;
const brandDnaDownloadUrl = publicAssetUrl("brand-dna.json");
const brandDnaManifestUrl = publicAssetUrl("manifest.json");
const brandSourcePath = __BRAND_DNA_SOURCE_DIR__.replace(/\/$/, "");
type ColorMode = "source" | "complementary" | "derived" | "custom";
type BrandColor = { name: string; value: string; mode: ColorMode; role: string };
type AdditionalBrandColor = { name: string; value: string; role: string };
type AdditionalBrandFont = { name: string; family: string; source: string; weight: number; role: string };
type EmbeddedBrandDna = typeof __BRAND_DNA__;
type ColorScaleSettings = EmbeddedBrandDna["visual"]["colorScale"];
type ColorScaleLink = { mode: "linked" | "custom"; settings?: ColorScaleSettings };
type BrandDna = Omit<EmbeddedBrandDna, "visual"> & {
  visual: Omit<EmbeddedBrandDna["visual"], "colors" | "additionalColors" | "colorScales" | "typography"> & {
    colors: BrandColor[];
    additionalColors: AdditionalBrandColor[];
    colorScales: Record<string, ColorScaleLink>;
    typography: Omit<EmbeddedBrandDna["visual"]["typography"], "additional"> & {
      additional: AdditionalBrandFont[];
    };
  };
};
const linkedColorScales = Object.fromEntries(
  ["Accent", "Success", "Warning", "Error"].map((name) => [name, { mode: "linked" }]),
) as Record<string, ColorScaleLink>;
const embeddedBrandDna = __BRAND_DNA__ as BrandDna;
const fallbackAgentGuidance: BrandDna["agentGuidance"] = {
  priorities: ["Preserve supplied facts and constraints.", "Make the reader's job clear before styling."],
  compositionRules: ["Give each artifact one dominant idea and an obvious reading path."],
  avoidPatterns: ["Generic dashboard reflex — do not turn every artifact into interchangeable cards."],
};
const initialBrandDna: BrandDna = {
  ...embeddedBrandDna,
  agentGuidance: embeddedBrandDna.agentGuidance ?? fallbackAgentGuidance,
  visual: {
    ...embeddedBrandDna.visual,
    additionalColors: embeddedBrandDna.visual.additionalColors ?? [],
    colorScales: embeddedBrandDna.visual.colorScales ?? linkedColorScales,
    typography: {
      ...embeddedBrandDna.visual.typography,
      additional: embeddedBrandDna.visual.typography.additional ?? [],
    },
  },
};
const brandDraftStorageKey = getDraftStorageKey(initialBrandDna.meta.brandName, initialBrandDna.meta.schemaVersion);

const sections = [
  ["about", "About"],
  ["logo", "Logo"],
  ["typography", "Typography"],
  ["color", "Color"],
  ["borders", "Borders"],
  ["shadows", "Shadows"],
  ["imagery", "Imagery"],
  ["iconography", "Iconography"],
  ["voice", "Voice & Tone"],
  ["use-cases", "Use cases"],
] as const;

type SectionId = (typeof sections)[number][0];

const borderThicknessValues = { thin: 1, medium: 2, bold: 4 } as const;
type BorderThickness = keyof typeof borderThicknessValues;

const iconLibraries = [
  { name: "Lucide", url: "https://lucide.dev/icons/", variants: ["Outline"] },
  { name: "Phosphor", url: "https://phosphoricons.com/", variants: ["Thin", "Light", "Regular", "Bold", "Fill", "Duotone"] },
  { name: "Material Symbols", url: "https://fonts.google.com/icons", variants: ["Outlined", "Rounded", "Sharp"] },
  { name: "Heroicons", url: "https://heroicons.com/", variants: ["Outline", "Solid", "Mini", "Micro"] },
  { name: "Font Awesome Free", url: "https://fontawesome.com/search?o=r&m=free", variants: ["Solid", "Regular", "Brands"] },
] as const;

const getEffectiveColorScale = (brandDna: BrandDna, colorName: string): ColorScaleSettings => {
  const linkedScale = brandDna.visual.colorScales?.[colorName];
  return linkedScale?.mode === "custom" && linkedScale.settings
    ? { ...brandDna.visual.colorScale, ...linkedScale.settings }
    : brandDna.visual.colorScale;
};

const SpecimenCard = ({ name, value, description, className = "", children }: {
  name: string;
  value: string;
  description: string;
  className?: string;
  children: ReactNode;
}) => (
  <article className={`specimen-card ${className}`.trim()}>
    <div className="specimen-card-visual">{children}</div>
    <div className="specimen-card-caption">
      <div className="specimen-card-meta"><b>{name}</b><code>{value}</code></div>
      <p>{description}</p>
    </div>
  </article>
);

const Swatch = ({ name, hex, role, displayValue = hex }: { name: string; hex: string; role: string; displayValue?: string }) => (
  <SpecimenCard className="swatch" name={name} value={displayValue} description={role}>
    <span className="swatch-color" style={{ backgroundColor: hex }} aria-hidden="true" />
  </SpecimenCard>
);

const ExtendedSwatch = ({ name, value, role }: AdditionalBrandColor) => (
  <article className="extended-swatch">
    <i style={{ backgroundColor: value }} aria-hidden="true" />
    <div><span><b>{name}</b><code>{value}</code></span><p>{role}</p></div>
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

type UseCaseVariant = "web" | "presentation" | "social" | "generic";
type BrandUseCase = BrandDna["useCases"][number];

const MiniBrandMark = ({ inverse = false }: { inverse?: boolean }) => (
  <span className={`mini-brand-mark${inverse ? " is-inverse" : ""}`}>
    <b>DNA</b><i />
  </span>
);

const UseCasePreview = ({ variant, channel, brandDna }: {
  variant: UseCaseVariant;
  channel: BrandUseCase;
  brandDna: BrandDna;
}) => {
  if (variant === "web") return <div className="use-case-preview mini-web" aria-hidden="true">
    <div className="mini-web-nav"><MiniBrandMark /><span>Work&nbsp;&nbsp; About&nbsp;&nbsp; Contact</span></div>
    <div className="mini-web-hero">
      <div><small>Built with one clear system</small><strong>{brandDna.essence.purpose}</strong><p>{channel.job}</p><b>Explore the work →</b></div>
      <div className="mini-web-visual"><i /><span>{brandDna.meta.brandName}</span></div>
    </div>
  </div>;

  if (variant === "presentation") return <div className="use-case-preview mini-presentation" aria-hidden="true">
    <header><MiniBrandMark inverse /><span>Brand story / 01</span></header>
    <div className="mini-slide-main"><small>One clear idea</small><strong>{brandDna.visual.signatureRule}</strong><p>{channel.job}</p></div>
    <div className="mini-slide-meta"><i /><span>01 / 12</span></div>
  </div>;

  if (variant === "social") {
    const direction = brandDna.imagery.directions[0];
    return <div className="use-case-preview mini-social" aria-hidden="true">
      <div className="mini-social-post">
        <img src={publicAssetUrl(`imagery/${direction.asset}`)} alt="" />
        <div className="mini-social-brand"><MiniBrandMark inverse /><span>@{brandDna.meta.brandName}</span></div>
        <div className="mini-social-copy"><small>Make it unmistakable</small><strong>{brandDna.essence.purpose}</strong><p>Save · Share · Make</p></div>
      </div>
      <span className="mini-social-size">1080 × 1080</span>
    </div>;
  }

  return <div className="use-case-preview mini-generic" aria-hidden="true">
    <MiniBrandMark />
    <strong>{brandDna.essence.purpose}</strong>
    <p>{channel.job}</p>
  </div>;
};

const LibraryIcon = ({ name, icon: Icon }: { name: string; icon: LucideIcon }) => (
  <figure className="icon-card">
    <Icon aria-hidden="true" />
    <figcaption>{name}</figcaption>
  </figure>
);

const LogoVariant = ({ name, file, usage, tone = "light", compact = false }: {
  name: string;
  file: string;
  usage: string;
  tone?: "light" | "dark";
  compact?: boolean;
}) => (
  <SpecimenCard
    className={`logo-variant logo-variant-${tone}${compact ? " is-compact" : ""}`}
    name={name}
    value={file}
    description={usage}
  >
    <img src={publicAssetUrl(`logo/${file}`)} alt={`${name} logo example`} />
  </SpecimenCard>
);

type EditorPanelProps = {
  section: SectionId;
  draft: BrandDna;
  changeCount: number;
  comparing: boolean;
  status: string;
  onChange: (path: string, value: JsonValue) => void;
  onCompare: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onDownloadJson: () => void;
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

const OptionField = ({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) => (
  <fieldset className="editor-option-field">
    <legend>{label}</legend>
    <div className="editor-mode-toggle">
      {options.map((option) => <button
        type="button"
        key={option}
        aria-pressed={value === option}
        onClick={() => onChange(option)}
      >{option}</button>)}
    </div>
  </fieldset>
);

type TypographyRole = "headings" | "body" | "utility";

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

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

type ShadowSize = "sm" | "md" | "lg";
type ShadowToken = BrandDna["visual"]["shadows"]["base"];

const getDerivedShadow = (base: ShadowToken, multiplier: number, size: ShadowSize): ShadowToken => {
  const factor = size === "sm" ? 1 / multiplier : size === "lg" ? multiplier : 1;
  const scale = (value: number) => Math.round(value * factor * 10) / 10;
  return {
    ...base,
    distance: scale(base.distance),
    blur: scale(base.blur),
    spread: scale(base.spread),
  };
};

const getShadowCss = (
  token: ShadowToken,
  baseHex: string,
  settings: ColorScaleSettings,
) => {
  const radians = token.angle * Math.PI / 180;
  const x = Math.round(Math.cos(radians) * token.distance * 100) / 100;
  const y = Math.round(Math.sin(radians) * token.distance * 100) / 100;
  const color = withOpacity(getColorAtStop(baseHex, settings, token.colorStop), token.opacity);
  return `${x}px ${y}px ${token.blur}px ${token.spread}px ${color}`;
};

function EditorPanel({ section, draft, changeCount, comparing, status, onChange, onCompare, onCopy, onDownload, onDownloadJson, onReset, onClose }: EditorPanelProps) {
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
    about: <>
      <Field label="Brand name" value={draft.meta.brandName} onChange={(value) => onChange("meta.brandName", value)} />
      <Field label="Purpose" value={draft.essence.purpose} onChange={(value) => onChange("essence.purpose", value)} multiline />
    </>,
    logo: null,
    typography: <>
      <div className="editor-font-source">
        <p>Choose each typeface in Google Fonts, copy its link, and paste it into the matching field below.</p>
        <a href="https://fonts.google.com/" target="_blank" rel="noreferrer">Open Google Fonts ↗</a>
      </div>
      <FontRoleEditor fontRole="headings" font={draft.visual.typography.headings} onChange={onChange} />
      <FontRoleEditor fontRole="body" font={draft.visual.typography.body} onChange={onChange} />
      <FontRoleEditor fontRole="utility" font={draft.visual.typography.utility} onChange={onChange} />
      <details className="editor-additional-colors editor-additional-fonts">
        <summary><span>Additional typefaces</span><output>{draft.visual.typography.additional.length}</output></summary>
        <div className="editor-additional-body">
          <p>Optional typefaces extend the system without replacing the three core roles.</p>
          {draft.visual.typography.additional.map((font, index) => <section className="editor-additional-color" aria-label={`Additional typeface ${index + 1}`} key={index}>
            <div className="editor-additional-heading"><b>Typeface {String(index + 1).padStart(2, "0")}</b><button type="button" onClick={() => onChange(
              "visual.typography.additional",
              draft.visual.typography.additional.filter((_, fontIndex) => fontIndex !== index) as unknown as JsonValue,
            )}>Remove</button></div>
            <Field label="Name" value={font.name} onChange={(value) => onChange(`visual.typography.additional[${index}].name`, value)} />
            <Field label="Family" value={font.family} onChange={(value) => onChange(`visual.typography.additional[${index}].family`, value)} />
            <Field label="Google Fonts link" value={font.source} onChange={(value) => onChange(`visual.typography.additional[${index}].source`, value)} />
            <label className="editor-field"><span>Preferred weight</span><input type="number" min="100" max="900" step="100" value={font.weight} onChange={(event) => onChange(`visual.typography.additional[${index}].weight`, Number(event.target.value))} /></label>
            <Field label="Role" value={font.role} onChange={(value) => onChange(`visual.typography.additional[${index}].role`, value)} />
          </section>)}
          <button className="editor-add-color" type="button" disabled={draft.visual.typography.additional.length >= 12} onClick={() => onChange(
            "visual.typography.additional",
            [...draft.visual.typography.additional, { name: `Typeface ${draft.visual.typography.additional.length + 1}`, family: "Inter", source: "https://fonts.google.com/specimen/Inter", weight: 400, role: "Supporting expression" }] as unknown as JsonValue,
          )}><Plus aria-hidden="true" size={14} />Add typeface</button>
        </div>
      </details>
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
      <details className="editor-additional-colors">
        <summary><span>Additional brand colors</span><output>{draft.visual.additionalColors.length}</output></summary>
        <div className="editor-additional-body">
          <p>Optional colors extend the brand palette without changing utility colors, semantic colors, or generated scales.</p>
          {draft.visual.additionalColors.map((color, index) => <section className="editor-additional-color" aria-label={`Additional color ${index + 1}`} key={index}>
            <div className="editor-additional-heading"><b>Color {String(index + 1).padStart(2, "0")}</b><button type="button" onClick={() => onChange(
              "visual.additionalColors",
              draft.visual.additionalColors.filter((_, colorIndex) => colorIndex !== index) as unknown as JsonValue,
            )}>Remove</button></div>
            <label className="editor-field">
              <span>Name</span>
              <input aria-label={`Additional color ${index + 1} name`} value={color.name} onChange={(event) => onChange(`visual.additionalColors[${index}].name`, event.target.value)} />
            </label>
            <label className="editor-custom-color">
              <input aria-label={`Choose additional color ${index + 1}`} type="color" value={color.value} onChange={(event) => onChange(`visual.additionalColors[${index}].value`, event.target.value.toUpperCase())} />
              <input aria-label={`Additional color ${index + 1} hex`} value={color.value} onChange={(event) => onChange(`visual.additionalColors[${index}].value`, event.target.value)} />
            </label>
            <label className="editor-field">
              <span>Role</span>
              <input aria-label={`Additional color ${index + 1} role`} value={color.role} onChange={(event) => onChange(`visual.additionalColors[${index}].role`, event.target.value)} />
            </label>
          </section>)}
          <button
            className="editor-add-color"
            type="button"
            disabled={draft.visual.additionalColors.length >= 12}
            onClick={() => {
              const index = draft.visual.additionalColors.length;
              const seedColors = ["#A98BFF", "#FF7A59", "#2EC4B6", "#F06C9B"];
              onChange("visual.additionalColors", [
                ...draft.visual.additionalColors,
                { name: `Color ${index + 1}`, value: seedColors[index % seedColors.length], role: "Supporting brand expression" },
              ] as unknown as JsonValue);
            }}
          ><Plus aria-hidden="true" size={14} />Add color</button>
        </div>
      </details>
    </>,
    borders: <>
      <OptionField label="Border thickness" value={draft.visual.borders.thickness} options={["thin", "medium", "bold"]} onChange={(value) => onChange("visual.borders.thickness", value)} />
      <RangeField label="Corner radius" value={draft.visual.borders.radius} min={0} max={3} step={0.1} unit="rem" onChange={(value) => onChange("visual.borders.radius", value)} />
      <OptionField label="Button pill" value={draft.visual.borders.buttonPill ? "on" : "off"} options={["off", "on"]} onChange={(value) => onChange("visual.borders.buttonPill", value === "on")} />
    </>,
    shadows: <>
      <p className="editor-shadow-note">MD is the base shadow. SM divides its geometry by the multiplier; LG multiplies it. Angle and color stay consistent.</p>
      <section className="editor-shadow-entry" aria-label="Shadow scale controls">
        <p className="editor-palette-label">Base shadow <span>MD</span></p>
        <RangeField label="Distance" value={draft.visual.shadows.base.distance} min={0} max={48} unit="px" onChange={(value) => onChange("visual.shadows.base.distance", value)} />
        <RangeField label="Angle" value={draft.visual.shadows.base.angle} min={0} max={360} unit="°" onChange={(value) => onChange("visual.shadows.base.angle", value)} />
        <RangeField label="Blur" value={draft.visual.shadows.base.blur} min={0} max={96} unit="px" onChange={(value) => onChange("visual.shadows.base.blur", value)} />
        <RangeField label="Spread" value={draft.visual.shadows.base.spread} min={-16} max={32} unit="px" onChange={(value) => onChange("visual.shadows.base.spread", value)} />
        <SemanticStopSelect label="Color" sourceName="Signal" value={draft.visual.shadows.base.colorStop} min={0} max={1000} baseHex={signal.value} settings={draft.visual.colorScale} onChange={(value) => onChange("visual.shadows.base.colorStop", value)} />
        <RangeField label="Opacity" value={Math.round(draft.visual.shadows.base.opacity * 100)} min={0} max={100} unit="%" onChange={(value) => onChange("visual.shadows.base.opacity", value / 100)} />
        <RangeField label="Scale multiplier" value={draft.visual.shadows.multiplier} min={1} max={3} step={0.1} unit="×" onChange={(value) => onChange("visual.shadows.multiplier", value)} />
      </section>
    </>,
    imagery: <>
      <div className="editor-asset-note">
        <p>Drop your image files into:</p>
        <code>{brandSourcePath}/imagery/</code>
      </div>
      {draft.imagery.directions.map((direction, index) => <section className="editor-imagery-entry" key={`${direction.asset}-${index}`}>
        <p className="editor-palette-label">Image {String(index + 1).padStart(2, "0")}</p>
        <Field label="Title" value={direction.name} onChange={(value) => onChange(`imagery.directions[${index}].name`, value)} />
        <Field label="Description" value={direction.description} onChange={(value) => onChange(`imagery.directions[${index}].description`, value)} multiline />
        <Field label="Prompt" value={direction.prompt} onChange={(value) => onChange(`imagery.directions[${index}].prompt`, value)} multiline />
      </section>)}
    </>,
    iconography: <>
      <div className="editor-icon-source">
        <p>Bring your own icons. Choose one open-source library, then keep its visual language consistent across applications.</p>
        <div className="editor-icon-libraries" role="radiogroup" aria-label="Icon library">
          {iconLibraries.map((library) => <div className="editor-icon-library" key={library.name}>
            <button
              type="button"
              role="radio"
              aria-checked={draft.iconography.library === library.name}
              onClick={() => {
                onChange("iconography.library", library.name);
                onChange("iconography.variant", library.variants[0]);
                onChange("iconography.source", library.url);
              }}
            >{library.name}</button>
            <a href={library.url} target="_blank" rel="noreferrer" aria-label={`Visit ${library.name}`}>Visit ↗</a>
          </div>)}
        </div>
      </div>
      <label className="editor-field editor-icon-variant">
        <span>Variant</span>
        <select
          aria-label="Icon library variant"
          value={draft.iconography.variant}
          onChange={(event) => onChange("iconography.variant", event.target.value)}
        >
          {(iconLibraries.find(({ name }) => name === draft.iconography.library)?.variants ?? [draft.iconography.variant]).map((variant) => <option key={variant} value={variant}>{variant}</option>)}
        </select>
      </label>
      <p className="editor-icon-note">The published examples update after the selected library is installed in the project.</p>
    </>,
    voice: <>
      <div className="editor-voice-dimensions">
        {draft.voice.dimensions.map((dimension, index) => <label className="editor-voice-dimension" key={dimension.name}>
          <span><b>{dimension.left}</b><em>{dimension.name}</em><b>{dimension.right}</b></span>
          <input
            aria-label={`${dimension.left} to ${dimension.right}`}
            type="range"
            min="0"
            max="100"
            step="1"
            value={dimension.value}
            onInput={(event) => onChange(`voice.dimensions[${index}].value`, Number(event.currentTarget.value))}
          />
          <p>{dimension.description}</p>
        </label>)}
      </div>
      <Field label="Say" value={draft.voice.say} onChange={(value) => onChange("voice.say", value)} multiline />
      <Field label="Don’t say" value={draft.voice.dontSay} onChange={(value) => onChange("voice.dontSay", value)} multiline />
    </>,
    "use-cases": <>
      {draft.useCases.map((channel, index) => <div className="editor-group" key={channel.name}>
        <p className="editor-locked">{channel.name}<span>Fixed format</span></p>
        <Field label="Usage rule" value={channel.rule} onChange={(value) => onChange(`useCases[${index}].rule`, value)} multiline />
      </div>)}
      <div className="editor-group">
        <p className="editor-locked">Agent guidance<span>One rule per line</span></p>
        <Field label="Priority order" value={draft.agentGuidance.priorities.join("\n")} onChange={(value) => onChange("agentGuidance.priorities", value.split("\n").map((item) => item.trim()).filter(Boolean))} multiline />
        <Field label="Composition rules" value={draft.agentGuidance.compositionRules.join("\n")} onChange={(value) => onChange("agentGuidance.compositionRules", value.split("\n").map((item) => item.trim()).filter(Boolean))} multiline />
        <Field label="Patterns to reject" value={draft.agentGuidance.avoidPatterns.join("\n")} onChange={(value) => onChange("agentGuidance.avoidPatterns", value.split("\n").map((item) => item.trim()).filter(Boolean))} multiline />
      </div>
    </>,
  };

  return <aside className="editor-panel" aria-label="Brand editor">
    <header className="editor-head">
      <div><span>Edit / {sectionLabel}</span><b>{changeCount} {changeCount === 1 ? "change" : "changes"}</b></div>
      <button type="button" aria-label="Close editor" onClick={onClose}>×</button>
    </header>
    <div className="editor-scroll">
      {section !== "logo" && <section className="editor-controls" aria-labelledby="controls-heading">
        <h2 id="controls-heading">{sectionLabel}</h2>
        {controls[section]}
      </section>}
    </div>
    <div className="editor-actions">
      <button type="button" aria-label={comparing ? "Show draft" : "Compare original"} onClick={onCompare}>{comparing ? "Draft" : "Compare"}</button>
      <button type="button" aria-label="Copy update prompt" onClick={onCopy} disabled={changeCount === 0}>Copy</button>
      <button type="button" aria-label="Download changes" onClick={onDownload} disabled={changeCount === 0}>Changes</button>
      <button type="button" aria-label="Download updated JSON" onClick={onDownloadJson} disabled={changeCount === 0}>JSON</button>
      <button className="editor-reset" type="button" aria-label="Reset draft" onClick={onReset} disabled={changeCount === 0}>Reset</button>
      <p role="status" aria-live="polite">{status || "Local preview only. Changes stay in this browser and never modify the published Brand DNA."}</p>
    </div>
  </aside>;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<SectionId>("about");
  const [isEditing, setIsEditing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState<BrandDna>(() => {
    try {
      const saved = localStorage.getItem(brandDraftStorageKey);
      if (!saved) return structuredClone(initialBrandDna);
      const { draft: savedDraft, source: savedSource } = JSON.parse(saved) as {
        draft: BrandDna;
        source?: BrandDna;
      };
      const reconciled = reconcileColorBases(savedDraft, initialBrandDna);
      return savedSource ? rebaseDraft(reconciled, savedSource, initialBrandDna) : reconciled;
    } catch {
      return structuredClone(initialBrandDna);
    }
  });
  const changes = useMemo(() => diffBrandDna(initialBrandDna, draft), [draft]);
  const brandDna = isEditing && !comparing ? draft : initialBrandDna;
  const typography = brandDna.visual.typography;
  const borderDemoPadding = 16;
  const borderThicknessName = brandDna.visual.borders.thickness as BorderThickness;
  const borderThickness = borderThicknessValues[borderThicknessName] ?? borderThicknessValues.thin;
  const borderRadius = Math.min(3, Math.max(0, brandDna.visual.borders.radius));
  const borderRadiusCss = `${borderRadius}rem`;
  const signal = brandDna.visual.colors.find((item) => item.name === "Signal") ?? brandDna.visual.colors[0];
  const resolvedBaseColors = brandDna.visual.colors.map((base) => ({
    ...base,
    value: resolveBaseColorValue(base, signal.value),
  }));
  const additionalColors = brandDna.visual.additionalColors ?? [];
  const ink = getColorAtStop(signal.value, brandDna.visual.colorScale, brandDna.visual.semanticColors.ink.stop);
  const borderToken = brandDna.visual.semanticColors.border;
  const border = withOpacity(ink, borderToken.opacity);
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
    "--brand-headings": `"${typography.headings.family}", Georgia, serif`,
    "--brand-sans": `"${typography.body.family}", Arial, sans-serif`,
    "--brand-mono": `"${typography.utility.family}", monospace`,
    "--brand-headings-weight": typography.headings.weight,
    "--brand-body-weight": typography.body.weight,
    "--brand-utility-weight": typography.utility.weight,
    "--content-border-width": `${borderThickness}px`,
    "--content-radius": borderRadiusCss,
    "--content-button-radius": brandDna.visual.borders.buttonPill ? "999px" : `${Math.min(borderRadius, 1)}rem`,
  } as CSSProperties;

  useEffect(() => {
    const fonts = [
      ...(["headings", "body", "utility"] as const).map((role) => ({ key: role, font: typography[role] })),
      ...typography.additional.map((font, index) => ({ key: `additional-${index}`, font })),
    ];
    const links = fonts.flatMap(({ key, font }) => {
      const stylesheet = buildGoogleFontStylesheet(font.source, font.weight);
      if (!stylesheet) return [];
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = stylesheet;
      link.dataset.brandFont = key;
      document.head.append(link);
      return [link];
    });
    return () => links.forEach((link) => link.remove());
  }, [typography]);

  useEffect(() => {
    localStorage.setItem(brandDraftStorageKey, JSON.stringify({ draft, source: initialBrandDna }));
  }, [draft]);

  useEffect(() => {
    const syncWithHash = () => {
      const rawHash = window.location.hash.slice(1);
      const hash = (rawHash === "principles" ? "about" : rawHash === "layout" ? "borders" : rawHash === "motion" ? "voice" : rawHash === "applications" ? "use-cases" : rawHash) as SectionId;
      if (sections.some(([id]) => id === hash)) {
        setActiveTab(hash);
        if (["principles", "layout", "motion", "applications"].includes(rawHash)) window.history.replaceState(null, "", `#${hash}`);
      }
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
    const prompt = buildUpdatePrompt(initialBrandDna, draft, __BRAND_DNA_TARGET__);
    await navigator.clipboard.writeText(prompt);
    setStatus("Update prompt copied.");
  };

  const downloadChanges = () => {
    const request = buildChangeRequest(initialBrandDna, draft, __BRAND_DNA_TARGET__);
    const url = URL.createObjectURL(new Blob([JSON.stringify(request, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "brand-dna-change-request.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Change request downloaded.");
  };

  const downloadUpdatedJson = () => {
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(draft, null, 2)}\n`], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "brand-dna.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Updated Brand DNA JSON downloaded.");
  };

  const resetDraft = () => {
    setDraft(structuredClone(initialBrandDna));
    setComparing(false);
    setStatus("Draft reset to the source JSON.");
  };

  return (
    <main className={isEditing ? "is-editing" : ""} style={previewStyle}>
      <a className="skip-link" href="#content">Skip to content</a>

      <header className="topbar" aria-label="Document header">
        <button className="wordmark" type="button" onClick={() => selectTab("about")} aria-label="Open About">
          <span>DNA</span><i aria-hidden="true" />
        </button>
        <p>{comparing ? "Original source" : `${brandDna.meta.brandName} brand guidelines`}</p>
        <div className="document-meta">
          <div className="mode-switch" aria-label="Preview mode">
            <button type="button" aria-pressed={!isEditing} onClick={() => { setIsEditing(false); setComparing(false); }}>View</button>
            <button type="button" aria-pressed={isEditing} onClick={() => setIsEditing(true)}>Edit</button>
          </div>
          <span>v{brandDna.meta.version}</span>
          <a href={brandDnaDownloadUrl} download>Download JSON ↓</a>
          <a className="machine-link" href={brandDnaManifestUrl}>For AI ↗</a>
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
        <div hidden={activeTab !== "about"}>
          <Chapter id="about" eyebrow="01 / Introduction" title="About" note="The shortest useful introduction to the brand." className="about-page">
            <div className="about-statement">
              <p className="field-label">Brand name</p>
              <h2>{brandDna.meta.brandName}</h2>
              <p className="field-label">Purpose</p>
              <p>{brandDna.essence.purpose}</p>
            </div>
          </Chapter>
        </div>

        <div hidden={activeTab !== "logo"}>
          <Chapter id="logo" eyebrow="02 / Signature" title="Logo" note="Use the right asset for the available space and background." className="logo-page">
            <div className="logo-source-note">
              <p className="field-label">Asset folder</p>
              <code>{brandSourcePath}/logo/</code>
              <p>Replace the SVG files in this folder while keeping their filenames. The examples below update automatically.</p>
            </div>
            <div className="logo-variants" role="region" aria-label="Minimum logo asset set">
              <LogoVariant name="Primary logo" file="default.svg" usage="Default choice for most brand applications." />
              <LogoVariant name="Icon" file="icon.svg" usage="Square spaces, avatars, favicons, and app icons." compact />
              <LogoVariant name="Wordmark" file="wordmark.svg" usage="Wide, shallow spaces where the symbol is unnecessary." />
              <LogoVariant name="Black" file="black.svg" usage="Single-color reproduction on light backgrounds." />
              <LogoVariant name="White" file="white.svg" usage="Reversed reproduction on dark backgrounds." tone="dark" />
            </div>
            <div className="logo-usage-rules">
              <div><b>Clear space</b><p>Keep at least one icon width clear around the logo.</p></div>
              <div><b>Minimum size</b><p>Do not reproduce the logo below the point where its forms remain clear.</p></div>
              <div><b>Never modify</b><p>Do not stretch, recolor, outline, rotate, or add effects.</p></div>
            </div>
          </Chapter>
        </div>

        <div hidden={activeTab !== "typography"}>
          <Chapter id="typography" eyebrow="03 / Type system" title="Typography" note="Hierarchy first. Personality follows." className="type-page">
            <div className="type-marquee"><span>Aa</span><p>One system.<br />Three voices.</p></div>
            <div className="type-specimens">
              <article className="type-headings"><span>Headings</span><p>Make the point visible.</p><code>{brandDna.visual.typography.headings.family} · {brandDna.visual.typography.headings.weight}</code></article>
              <article className="type-body"><span>Body</span><p>Use body type for sustained reading, instructions, and supporting detail.</p><code>{brandDna.visual.typography.body.family} · {brandDna.visual.typography.body.weight}</code></article>
              <article className="type-utility"><span>Utility</span><p>0123456789<br />ABCDEFGHIJKLMNOPQRSTUVWXYZ</p><code>{brandDna.visual.typography.utility.family} · {brandDna.visual.typography.utility.weight}</code></article>
            </div>
            {brandDna.visual.typography.additional.length > 0 && <div className="type-additional" role="region" aria-label="Additional typefaces">
              <p className="field-label">Extended type system</p>
              {brandDna.visual.typography.additional.map((font, index) => <article key={`${font.name}-${index}`} style={{ fontFamily: `"${font.family}", sans-serif`, fontWeight: font.weight }}>
                <span>{font.name}</span><p>{font.role}</p><code>{font.family} · {font.weight}</code>
              </article>)}
            </div>}
          </Chapter>
        </div>

        <div hidden={activeTab !== "color"}>
          <Chapter id="color" eyebrow="04 / Palette" title="Color" note="Use color to organize, signal, and create recognition." className="color-page">
            <div className="palette-groups">
              {paletteGroups.map((group) => <Fragment key={group.id}>
                <section className="palette-group" aria-labelledby={`palette-${group.id}`}>
                  <h2 id={`palette-${group.id}`}>{group.label}</h2>
                  <div className={`swatches swatches-${group.id}`}>
                    {group.colors.map((color) => <Swatch key={color.name} name={color.name} hex={color.value} role={color.role} displayValue={"displayValue" in color ? color.displayValue : undefined} />)}
                  </div>
                </section>
                {group.id === "brand" && additionalColors.length > 0 && <section className="palette-group palette-group-extended" aria-labelledby="palette-extended">
                  <h2 id="palette-extended">Extended palette</h2>
                  <div className="extended-swatches">
                    {additionalColors.map((color, index) => <ExtendedSwatch key={`${index}-${color.name}`} {...color} />)}
                  </div>
                </section>}
              </Fragment>)}
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
            </section>
            <p className="inline-rule"><b>Rule:</b> Never use color as the only carrier of meaning.</p>
          </Chapter>
        </div>

        <div hidden={activeTab !== "borders"}>
          <Chapter id="borders" eyebrow="05 / Edge system" title="Borders" note="Define edge thickness and corner behavior." className="borders-page">
            <div
              className="border-system"
              style={{
                "--border-thickness": "var(--content-border-width)",
                "--outer-radius": "var(--content-radius)",
                "--inner-radius": `max(0px, calc(var(--content-radius) - ${borderDemoPadding}px))`,
                "--border-padding": `${borderDemoPadding}px`,
                "--button-radius": "var(--content-button-radius)",
              } as CSSProperties}
            >
              <article className="border-card">
                <div className="border-card-visual"><span>Inner radius</span><strong>R−P</strong></div>
                <div className="border-card-copy"><p className="field-label">Concentric by default</p><h2>One edge logic.</h2><p>Inner radius equals outer radius minus the space between both edges.</p><span className="border-demo-button">Button</span></div>
              </article>
              <dl className="border-values">
                <div><dt>Border thickness</dt><dd>{borderThicknessName}</dd><p>Sets the visual weight of lines and dividers.</p></div>
                <div><dt>Corner radius</dt><dd>{borderRadius}rem</dd><p>Dial the corner character continuously from sharp to soft.</p></div>
                <div><dt>Button pill</dt><dd>{brandDna.visual.borders.buttonPill ? "On" : "Off"}</dd><p>Buttons are {brandDna.visual.borders.buttonPill ? "fully rounded" : "shaped by the selected corner radius"}.</p></div>
              </dl>
            </div>
          </Chapter>
        </div>

        <div hidden={activeTab !== "shadows"}>
          <Chapter id="shadows" eyebrow="06 / Depth system" title="Shadows" note="Use depth deliberately, from a quiet lift to strong separation." className="shadows-page">
            <div className="shadow-cards" role="region" aria-label="Shadow scale">
              {(["sm", "md", "lg"] as const).map((size) => {
                const token = getDerivedShadow(brandDna.visual.shadows.base, brandDna.visual.shadows.multiplier, size);
                const label = size.toUpperCase();
                return <SpecimenCard
                  className="shadow-card"
                  key={size}
                  name={`Shadow ${label}`}
                  value={`Signal ${token.colorStop}`}
                  description={`${token.distance}px distance · ${token.angle}° angle · ${token.blur}px blur · ${token.spread}px spread · ${Math.round(token.opacity * 100)}% opacity`}
                >
                  <div className="shadow-sample" style={{ boxShadow: getShadowCss(token, signal.value, brandDna.visual.colorScale) }}>
                    <span>{label}</span><strong>Aa</strong>
                  </div>
                </SpecimenCard>;
              })}
            </div>
          </Chapter>
        </div>

        <div hidden={activeTab !== "imagery"}>
          <Chapter id="imagery" eyebrow="07 / Art direction" title="Imagery" note={brandDna.imagery.principle} className="imagery-page">
            <div className="imagery-references">
              {brandDna.imagery.directions.map((direction) => <section className="imagery-reference" key={direction.asset}>
                <SpecimenCard className="imagery-card" name={direction.name} value={direction.asset} description={direction.description}>
                  <img src={publicAssetUrl(`imagery/${direction.asset}`)} alt={`${direction.name} visual reference`} />
                </SpecimenCard>
                <div className="imagery-prompt">
                  <p className="field-label">Generation prompt</p>
                  <p>{direction.prompt}</p>
                </div>
              </section>)}
            </div>
          </Chapter>
        </div>

        <div hidden={activeTab !== "iconography"}>
          <Chapter id="iconography" eyebrow="08 / Icon source" title="Iconography" note={initialBrandDna.iconography.principle} className="icon-page">
            <div className="icon-source-summary">
              <p className="field-label">Current source</p>
              <b>{initialBrandDna.iconography.library}</b>
              <span>{initialBrandDna.iconography.variant}</span>
              <a href={initialBrandDna.iconography.source} target="_blank" rel="noreferrer">Browse library ↗</a>
            </div>
            <div className="icon-grid">
              <LibraryIcon name="Create" icon={Plus} />
              <LibraryIcon name="Move" icon={ArrowRight} />
              <LibraryIcon name="Save" icon={Save} />
              <LibraryIcon name="View" icon={Eye} />
              <LibraryIcon name="Connect" icon={Share2} />
              <LibraryIcon name="Confirm" icon={CircleCheck} />
            </div>
          </Chapter>
        </div>

        <div hidden={activeTab !== "voice"}>
          <Chapter id="voice" eyebrow="09 / Language" title="Voice & Tone" note="Five dimensions define how the brand sounds." className="voice-page">
            <div className="voice-spectrum" aria-label="Voice dimensions">
              {brandDna.voice.dimensions.map((dimension) => <div className="voice-spectrum-row" key={dimension.name}>
                <span>{dimension.left}</span>
                <div className="voice-spectrum-track" aria-hidden="true"><i style={{ left: `${dimension.value}%` }} /></div>
                <span>{dimension.right}</span>
                <small>{dimension.name}</small>
              </div>)}
            </div>
            <div className="voice-language">
              <article><span>Say</span><p>{brandDna.voice.say}</p></article>
              <article><span>Don’t say</span><p>{brandDna.voice.dontSay}</p></article>
            </div>
          </Chapter>
        </div>

        <div hidden={activeTab !== "use-cases"}>
          <Chapter id="use-cases" eyebrow="10 / In use" title="Use cases" note="The same identity, demonstrated in real formats with different levels of density and intensity." className="use-cases-page">
            <div className="use-case-list">
              {brandDna.useCases.map((channel, index) => (
                <article className="use-case-showcase" key={channel.name}>
                  <div className="use-case-intro">
                    <p><span>{String(index + 1).padStart(2, "0")}</span>{channel.name}</p>
                    <h2>{channel.rule}</h2>
                    <p>{channel.job}</p>
                  </div>
                  <UseCasePreview variant={( ["web", "presentation", "social"][index] ?? "generic") as UseCaseVariant} channel={channel} brandDna={brandDna} />
                </article>
              ))}
            </div>
            <div className="use-case-rule"><p className="field-label">Across every format</p><p>Preserve the logo, type hierarchy, palette logic, image direction, and voice. Adapt scale, density, and rhythm.</p></div>
          </Chapter>
        </div>

        <footer>
          <div className="footer-mark"><span>DNA</span><i /></div>
          <p>Practical brand guidelines for people and agents.</p>
          <button type="button" onClick={() => selectTab("about")}>About <span aria-hidden="true">↑</span></button>
        </footer>
      </div>
      {isEditing && <EditorPanel
        section={activeTab}
        draft={draft}
        changeCount={changes.length}
        comparing={comparing}
        status={status}
        onChange={updateDraft}
        onCompare={() => setComparing((current) => !current)}
        onCopy={copyPrompt}
        onDownload={downloadChanges}
        onDownloadJson={downloadUpdatedJson}
        onReset={resetDraft}
        onClose={() => { setIsEditing(false); setComparing(false); }}
      />}
    </main>
  );
}
