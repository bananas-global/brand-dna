import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { getDraftStorageKey } from "./editor";

const draftStorageKey = getDraftStorageKey(__BRAND_DNA__.meta.brandName, __BRAND_DNA__.meta.schemaVersion);

const chapterNames = [
  "About",
  "Logo",
  "Typography",
  "Color",
  "Borders",
  "Shadows",
  "Imagery",
  "Iconography",
  "Voice & Tone",
  "Use cases",
];

describe("Brand DNA site", () => {
  beforeEach(() => {
    localStorage.clear();
    document.querySelectorAll("link[data-brand-font]").forEach((link) => link.remove());
    window.history.replaceState(null, "", "/brand-dna/");
  });

  it("renders the complete design-first navigation", () => {
    render(<App />);

    expect(screen.getAllByRole("tab")).toHaveLength(10);
    for (const chapter of chapterNames) {
      expect(screen.getByRole("tab", { name: new RegExp(chapter, "i") })).toBeInTheDocument();
    }

    expect(screen.queryByRole("tab", { name: /AI contract/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Build yours/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Motion/i })).not.toBeInTheDocument();
  });

  it("groups the palette into Brand, Utility, and Semantic rows", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /Color/ }));
    const brandCards = within(screen.getByRole("region", { name: "Brand" })).getAllByRole("article");
    expect(brandCards.map((item) => item.querySelector("b")?.textContent)).toEqual(["Signal", "Accent"]);
    expect(brandCards.every((item) => item.classList.contains("specimen-card") && item.querySelector(".specimen-card-caption"))).toBe(true);
    expect(within(screen.getByRole("region", { name: "Utility" })).getAllByRole("article").map((item) => item.querySelector("b")?.textContent)).toEqual(["Ink", "Paper", "Border"]);
    expect(within(screen.getByRole("region", { name: "Semantic" })).getAllByRole("article").map((item) => item.querySelector("b")?.textContent)).toEqual(["Success", "Warning", "Error"]);
    expect(document.querySelector(".color-scale-formula")).not.toBeInTheDocument();
    expect(document.querySelector(".color-pairs")).not.toBeInTheDocument();
  });

  it("keeps additional brand colors optional, compact, and outside generated scales", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /Color/ }));
    expect(screen.queryByRole("region", { name: "Extended palette" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByText("Additional brand colors", { selector: "summary span" }));
    await user.click(screen.getByRole("button", { name: "Add color" }));

    expect(screen.getByRole("region", { name: "Extended palette" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Extended palette" }).querySelectorAll(".extended-swatch")).toHaveLength(1);
    expect(screen.queryByLabelText("Color 1: 10 light tones, base color at 500, and 10 dark tones")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Additional color 1 name"));
    await user.type(screen.getByLabelText("Additional color 1 name"), "Campaign blue");
    fireEvent.change(screen.getByLabelText("Choose additional color 1"), { target: { value: "#1473e6" } });
    await user.clear(screen.getByLabelText("Additional color 1 role"));
    await user.type(screen.getByLabelText("Additional color 1 role"), "Seasonal campaigns");

    const extendedPalette = screen.getByRole("region", { name: "Extended palette" });
    expect(within(extendedPalette).getByText("Campaign blue")).toBeInTheDocument();
    expect(within(extendedPalette).getByText("#1473E6")).toBeInTheDocument();
    expect(within(extendedPalette).getByText("Seasonal campaigns")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.queryByRole("region", { name: "Extended palette" })).not.toBeInTheDocument();
  });

  it("documents the minimum logo asset set without Logo editor controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /Logo/ }));
    expect(screen.getByText("public/brand/logo/")).toBeInTheDocument();
    const assetSet = screen.getByRole("region", { name: "Minimum logo asset set" });
    const variants = within(assetSet).getAllByRole("article");
    expect(variants).toHaveLength(5);
    expect(variants.every((item) => item.classList.contains("specimen-card") && item.querySelector(".specimen-card-caption"))).toBe(true);
    for (const variant of ["Primary logo", "Icon", "Wordmark", "Black", "White"]) {
      expect(within(assetSet).getByText(variant)).toBeInTheDocument();
    }
    expect(within(assetSet).queryByText(/Small-use/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const editor = screen.getByRole("complementary", { name: "Brand editor" });
    expect(editor.querySelector(".editor-controls")).not.toBeInTheDocument();
    expect(within(editor).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("presents imagery as reusable reference cards with editable text prompts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /Imagery/ }));
    const references = document.querySelectorAll(".imagery-reference");
    expect(references).toHaveLength(2);
    expect(document.querySelectorAll(".imagery-card.specimen-card")).toHaveLength(2);
    expect(screen.getAllByText("Generation prompt")).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Focused Work visual reference" })).toHaveAttribute("src", "/brand-dna/imagery/21eb2840e0203c85520b0f9b5c7ee10090e56b9410e61918b7ace9886f9c6ca3.png");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("public/brand/imagery/")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Title")).toHaveLength(2);
    expect(screen.getAllByLabelText("Description")).toHaveLength(2);
    expect(screen.getAllByLabelText("Prompt")).toHaveLength(2);
    await user.clear(screen.getAllByLabelText("Title")[0]);
    await user.type(screen.getAllByLabelText("Title")[0], "People in motion");
    expect(screen.getByText("People in motion", { selector: ".specimen-card-meta b" })).toBeInTheDocument();
  });

  it("uses a real icon library and keeps iconography editing source-based", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /Iconography/ }));
    expect(screen.getByText("Lucide", { selector: ".icon-source-summary b" })).toBeInTheDocument();
    expect(document.querySelectorAll(".icon-card svg")).toHaveLength(6);
    for (const label of ["Create", "Move", "Save", "View", "Connect", "Confirm"]) {
      expect(screen.getByText(label, { selector: "figcaption" })).toBeInTheDocument();
    }
    expect(screen.queryByText("24 × 24")).not.toBeInTheDocument();
    expect(screen.queryByText("1.5 px")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const libraries = within(screen.getByRole("radiogroup", { name: "Icon library" }));
    expect(libraries.getAllByRole("radio")).toHaveLength(5);
    expect(libraries.getByRole("radio", { name: "Lucide" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("link", { name: "Visit Phosphor" })).toHaveAttribute("href", "https://phosphoricons.com/");

    await user.click(libraries.getByRole("radio", { name: "Phosphor" }));
    expect(screen.getByRole("combobox", { name: "Icon library variant" })).toHaveValue("Thin");
    expect(screen.getByRole("option", { name: "Duotone" })).toBeInTheDocument();
    expect(screen.getByText("Lucide", { selector: ".icon-source-summary b" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Grid")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Stroke")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Corners")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Style")).not.toBeInTheDocument();
  });

  it("keeps Borders to semantic thickness, a rem radius dial, and button-pill decisions", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /Borders/ }));
    expect(screen.getByRole("heading", { name: "Borders" })).toBeInTheDocument();
    expect(screen.getByText("Concentric by default")).toBeInTheDocument();
    expect(screen.getByText("Dial the corner character continuously from sharp to soft.")).toBeInTheDocument();
    expect(document.querySelector(".border-values")?.textContent).not.toContain("px");
    expect(screen.queryByText("Spacing scale")).not.toBeInTheDocument();
    expect(screen.queryByText("Composition")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Twelve-column grid demonstration")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const thickness = within(screen.getByRole("group", { name: "Border thickness" }));
    const radius = screen.getByRole("slider", { name: "Corner radius" });
    const pill = within(screen.getByRole("group", { name: "Button pill" }));
    expect(thickness.getByRole("button", { name: "thin" })).toHaveAttribute("aria-pressed", "true");
    expect(radius).toHaveValue("0");
    expect(radius).toHaveAttribute("min", "0");
    expect(radius).toHaveAttribute("max", "3");
    expect(radius).toHaveAttribute("step", "0.1");
    expect(pill.getByRole("button", { name: "off" })).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector("main")).toHaveStyle({
      "--content-radius": "0rem",
      "--content-button-radius": "0rem",
    });

    fireEvent.input(radius, { target: { value: "2.2" } });
    expect(radius).toHaveValue("2.2");
    expect(screen.getByText("2.2rem", { selector: ".border-values dd" })).toBeInTheDocument();
    await user.click(pill.getByRole("button", { name: "on" }));
    expect(screen.getByText("Buttons are fully rounded.")).toBeInTheDocument();
    expect(document.querySelector("main")).toHaveStyle({
      "--content-border-width": "1px",
      "--content-radius": "2.2rem",
      "--content-button-radius": "999px",
    });
  });

  it("defines three editable shadow tokens using Signal palette stops", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /Shadows/ }));
    const scale = screen.getByRole("region", { name: "Shadow scale" });
    expect(within(scale).getAllByRole("article")).toHaveLength(3);
    for (const name of ["Shadow SM", "Shadow MD", "Shadow LG"]) {
      expect(within(scale).getByText(name)).toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getAllByRole("slider")).toHaveLength(6);
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    const distance = screen.getByRole("slider", { name: "Distance" });
    expect(distance).toHaveValue("16");
    fireEvent.input(distance, { target: { value: "12" } });
    expect(distance).toHaveValue("12");
    expect(within(scale).getByText(/7.1px distance/)).toBeInTheDocument();
    expect(within(scale).getByText(/20.4px distance/)).toBeInTheDocument();

    fireEvent.input(screen.getByRole("slider", { name: "Scale multiplier" }), { target: { value: "3" } });
    expect(within(scale).getByText(/4px distance/)).toBeInTheDocument();
    expect(within(scale).getByText(/36px distance/)).toBeInTheDocument();

    const opacity = screen.getByRole("slider", { name: "Opacity" });
    expect(opacity).toHaveValue("84");
    fireEvent.input(opacity, { target: { value: "35" } });
    expect(within(scale).getAllByText(/35% opacity/)).toHaveLength(3);

    await user.selectOptions(screen.getByRole("combobox", { name: "Color stop" }), "750");
    expect(within(scale).getAllByText("Signal 750")).toHaveLength(3);
  });

  it("supports tab clicks and vertical or horizontal arrow-key navigation", async () => {
    const user = userEvent.setup();
    render(<App />);

    const about = screen.getByRole("tab", { name: /About/ });
    const logo = screen.getByRole("tab", { name: /Logo/ });
    const applications = screen.getByRole("tab", { name: /Use cases/ });

    about.focus();
    await user.keyboard("{ArrowDown}");
    expect(logo).toHaveFocus();
    expect(logo).toHaveAttribute("aria-selected", "true");
    expect(window.location.hash).toBe("#logo");

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /Typography/ })).toHaveFocus();

    await user.click(applications);
    expect(applications).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: /Use cases/ })).toBeVisible();
  });

  it("restores a valid chapter hash and exposes a Pages-safe JSON download", async () => {
    window.location.hash = "#color";
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Color/ })).toHaveAttribute("aria-selected", "true");
    });

    expect(screen.getByRole("link", { name: /Download JSON/ })).toHaveAttribute(
      "href",
      "/brand-dna/brand-dna.json",
    );
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#content");
  });

  it("redirects the legacy applications hash to Use cases", async () => {
    window.location.hash = "#applications";
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Use cases/ })).toHaveAttribute("aria-selected", "true");
    });
    expect(window.location.hash).toBe("#use-cases");
  });

  it("redirects the legacy Layout hash to Borders", async () => {
    window.location.hash = "#layout";
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Borders/ })).toHaveAttribute("aria-selected", "true");
    });
    expect(window.location.hash).toBe("#borders");
  });

  it("redirects the retired Motion hash to Voice & Tone", async () => {
    window.location.hash = "#motion";
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Voice & Tone/ })).toHaveAttribute("aria-selected", "true");
    });
    expect(window.location.hash).toBe("#voice");
  });

  it("opens a contextual editor and previews exact draft changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("complementary", { name: "Brand editor" })).toBeVisible();

    await user.click(screen.getByRole("tab", { name: /Color/ }));
    expect(screen.queryByRole("heading", { name: "Direction" })).not.toBeInTheDocument();
    const signalPicker = screen.getByLabelText("Choose Signal color");
    fireEvent.change(signalPicker, { target: { value: "#00aaff" } });

    expect(screen.getByText("1 change")).toBeInTheDocument();
    expect(document.querySelector("main")).toHaveStyle({ "--signal": "#00AAFF" });
    expect(screen.getByLabelText("Signal: 10 light tones, base color at 500, and 10 dark tones").children).toHaveLength(21);

    await user.click(screen.getByRole("button", { name: "Compare original" }));
    expect(document.querySelector("main")).toHaveStyle({ "--signal": "#FFCA0D" });
    expect(screen.getByRole("button", { name: "Show draft" })).toBeInTheDocument();
  });

  it("uses About as a two-field introduction and removes the direction questionnaire", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Brand name")).toHaveValue("bananas");
    expect(screen.getByLabelText("Purpose")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Direction" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Should feel like")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Should not feel like")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare original" })).toHaveTextContent("Compare");
    expect(screen.getByRole("button", { name: "Copy update prompt" })).toHaveTextContent("Copy");
    expect(screen.getByRole("button", { name: "Download changes" })).toHaveTextContent("Changes");
    expect(screen.getByRole("button", { name: "Download updated JSON" })).toHaveTextContent("JSON");
    expect(screen.getByRole("button", { name: "Reset draft" })).toHaveTextContent("Reset");

    fireEvent.change(screen.getByLabelText("Brand name"), { target: { value: "New name" } });
    expect(screen.getByText("New name", { selector: ".about-statement h2" })).toBeInTheDocument();
  });

  it("edits and previews five voice dimensions plus Say and Don’t say", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Voice & Tone/ }));

    const sliders = screen.getAllByRole("slider");
    expect(sliders).toHaveLength(5);
    expect(screen.getByRole("slider", { name: "Quiet to Loud" })).toHaveValue("87");
    expect(screen.getByLabelText("Say")).toBeInTheDocument();
    expect(screen.getByLabelText("Don’t say")).toBeInTheDocument();
    expect([...screen.getByLabelText("Voice dimensions").querySelectorAll(".voice-spectrum-row > span")].map((item) => item.textContent)).toEqual([
      "Casual", "Formal", "Quiet", "Loud", "Concise", "Expressive", "Simple", "Elaborate", "Rough", "Polished",
    ]);

    fireEvent.input(screen.getByRole("slider", { name: "Quiet to Loud" }), { target: { value: "70" } });
    expect(document.querySelectorAll(".voice-spectrum-track i")[1]).toHaveStyle({ left: "70%" });
  });

  it("uses three Google Fonts links without application-level spacing controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Typography/ }));

    expect(screen.getByRole("link", { name: /Open Google Fonts/ })).toHaveAttribute("href", "https://fonts.google.com/");
    expect(screen.getByRole("link", { name: /Open Google Fonts/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByLabelText("Headings font link")).toHaveAttribute("placeholder", "Paste a Google Fonts link");
    expect(screen.getByLabelText("Body font link")).toBeInTheDocument();
    expect(screen.getByLabelText("Utility font link")).toBeInTheDocument();
    expect(screen.getByText("Headings", { selector: ".type-headings > span" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Type scale")).not.toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: "Headings tracking" })).not.toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: "Body line height" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Headings font link"), {
      target: { value: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@400;700&display=swap" },
    });
    expect(screen.getByText("DM Serif Display · 700")).toBeInTheDocument();
    const headingsWeight = await screen.findByRole("combobox", { name: "Headings preferred weight" });
    expect(headingsWeight).toHaveValue("700");
    await waitFor(() => expect(within(headingsWeight).getByRole("option", { name: "400" })).toBeInTheDocument());
    await user.selectOptions(headingsWeight, "400");
    expect(screen.getByText("DM Serif Display · 400")).toBeInTheDocument();
    await user.selectOptions(headingsWeight, "700");
    expect(screen.getByText("DM Serif Display · 700")).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('link[data-brand-font="headings"]')).toHaveAttribute(
      "href",
      "https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@700&display=swap",
    ));
  });

  it("moves a saved draft onto new source fonts without discarding its own edits", async () => {
    type StoredFont = { family: string; source: string; weight: number };
    type StoredDocument = { meta: { brandName: string }; visual: { typography: { headings: StoredFont } } };
    const user = userEvent.setup();
    const initial = render(<App />);

    const saved = JSON.parse(localStorage.getItem(draftStorageKey) ?? "{}") as {
      draft: StoredDocument;
      source: StoredDocument;
    };
    const sourceHeadings = { ...saved.source.visual.typography.headings };
    const staleHeadings = {
      family: "Sedgwick Ave Display",
      source: "https://fonts.google.com/specimen/Sedgwick+Ave+Display",
      weight: 400,
    };
    const stalePayload = structuredClone(saved);
    stalePayload.draft.visual.typography.headings = { ...staleHeadings };
    stalePayload.source.visual.typography.headings = { ...staleHeadings };
    stalePayload.draft.meta.brandName = "draft name";
    localStorage.setItem(draftStorageKey, JSON.stringify(stalePayload));
    initial.unmount();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Brand name")).toHaveValue("draft name");
    expect(screen.getByText("1 change")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Typography/ }));
    expect(screen.getByText(`${sourceHeadings.family} · ${sourceHeadings.weight}`)).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('link[data-brand-font="headings"]')).toHaveAttribute(
      "href",
      `https://fonts.googleapis.com/css2?family=${sourceHeadings.family.replaceAll(" ", "+")}:wght@${sourceHeadings.weight}&display=swap`,
    ));
  });

  it("exposes the three scale multipliers as editable design decisions", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));
    expect(screen.getByRole("slider", { name: /Hue drift/ })).toHaveAttribute("max", "2");
    expect(screen.getByRole("button", { name: "Flip hue drift" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Flip hue drift" })).toHaveTextContent(/^Flip$/);
    expect(screen.getByRole("slider", { name: /Saturation drift/ })).toHaveAttribute("max", "2");
    expect(screen.getByRole("button", { name: "Flip saturation drift" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Flip saturation drift" })).toHaveTextContent(/^Flip$/);
    expect(screen.getByRole("slider", { name: "Scale contrast" })).toHaveAttribute("min", "0.5");
    expect(screen.queryByRole("slider", { name: "Semantic harmony" })).not.toBeInTheDocument();
    expect(screen.getAllByText("10 light / 10 dark")).toHaveLength(5);
    expect(screen.getByRole("combobox", { name: "Paper / Background stop" })).toHaveValue("100");
    expect(screen.getByRole("combobox", { name: "Ink / Foreground stop" })).toHaveValue("950");
    expect(screen.getByRole("slider", { name: "Border opacity" })).toHaveValue("43");
    expect(within(screen.getByRole("complementary", { name: "Brand editor" })).queryByText("Contrast")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Base position" })).not.toBeInTheDocument();

    fireEvent.input(screen.getByRole("slider", { name: /Hue drift/ }), { target: { value: "1.2" } });
    expect(screen.getByRole("complementary", { name: "Brand editor" })).toHaveTextContent("1 change");
    expect(screen.getByRole("slider", { name: /Hue drift/ })).toHaveValue("1.2");

    await user.click(screen.getByRole("button", { name: "Flip hue drift" }));
    expect(screen.getByRole("button", { name: "Flip hue drift" })).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "Flip saturation drift" }));
    expect(screen.getByRole("button", { name: "Flip saturation drift" })).toHaveAttribute("aria-pressed", "true");
  });

  it("moves a custom color between Default and Adjusted modes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));

    const accent = screen.getByRole("region", { name: "Accent color" });
    expect(within(accent).getByRole("button", { name: "Custom" })).toHaveAttribute("aria-pressed", "true");
    expect(within(accent).getByRole("slider", { name: "Accent hue drift" })).toHaveValue("1.04");
    expect(within(accent).getByLabelText("Choose Accent color")).toHaveValue("#1b4af3");
    await user.click(within(accent).getByRole("button", { name: "Default" }));
    expect(within(accent).queryByRole("slider", { name: "Accent hue drift" })).not.toBeInTheDocument();
    expect(within(accent).queryByLabelText("Choose Accent color")).not.toBeInTheDocument();
    await user.click(within(accent).getByRole("button", { name: "Adjusted" }));

    expect(within(accent).getByRole("button", { name: "Adjusted" })).toHaveAttribute("aria-pressed", "true");
    expect(within(accent).getByRole("slider", { name: "Accent hue drift" })).toHaveValue("1.11");
    expect(within(accent).queryByLabelText("Choose Accent color")).not.toBeInTheDocument();
    fireEvent.input(within(accent).getByRole("slider", { name: "Accent hue drift" }), { target: { value: "1.8" } });
    expect(within(accent).getByRole("slider", { name: "Accent hue drift" })).toHaveValue("1.8");

    await user.click(within(accent).getByRole("button", { name: "Default" }));
    expect(within(accent).queryByRole("slider", { name: "Accent hue drift" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset draft" })).toBeEnabled();
  });

  it("derives Paper and Ink from selectable Signal stops", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));
    const originalPaper = getComputedStyle(document.querySelector("main")!).getPropertyValue("--paper");
    await user.selectOptions(screen.getByRole("combobox", { name: "Paper / Background stop" }), "150");

    expect(getComputedStyle(document.querySelector("main")!).getPropertyValue("--paper")).not.toBe(originalPaper);
    expect(screen.getByRole("complementary", { name: "Brand editor" })).toHaveTextContent("1 change");
    expect(screen.getByText("Paper", { selector: ".is-semantic span" })).toBeInTheDocument();
  });

  it("places Signal scale behavior and utility colors directly after Signal", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));
    const signal = screen.getByLabelText("Signal hex");
    const scaleBehavior = screen.getByText("Signal / Scale behavior");
    const utility = screen.getByText("Utility colors");
    const accent = screen.getByRole("region", { name: "Accent color" });

    expect(signal.compareDocumentPosition(scaleBehavior) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(scaleBehavior.compareDocumentPosition(utility) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(signal.compareDocumentPosition(utility) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(utility.compareDocumentPosition(accent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("derives Border exclusively from editable Ink opacity", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));
    const main = document.querySelector("main")!;
    const originalBorder = getComputedStyle(main).getPropertyValue("--line");

    expect(screen.getByText("43% Ink")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Border mode" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Choose Border color")).not.toBeInTheDocument();
    fireEvent.input(screen.getByRole("slider", { name: "Border opacity" }), { target: { value: "35" } });

    expect(getComputedStyle(main).getPropertyValue("--line")).not.toBe(originalBorder);
    expect(screen.getByRole("complementary", { name: "Brand editor" })).toHaveTextContent("1 change");

    expect(screen.getByText("35% Ink")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Border opacity" })).toHaveValue("35");
  });

  it("loads the canonical custom and adjusted color modes with reversible overrides", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));

    expect(screen.getAllByRole("button", { name: "Default" })).toHaveLength(4);
    expect(screen.getAllByRole("button", { name: "Adjusted" })).toHaveLength(4);
    expect(screen.getAllByRole("button", { name: "Custom" })).toHaveLength(4);
    expect(document.querySelector("main")).toHaveStyle({ "--accent": "#1B4AF3", "--success": "#3DED1F", "--warning": "#ED8026", "--error": "#B82350" });
    expect(screen.getByLabelText("Choose Accent color")).toHaveValue("#1b4af3");
    expect(screen.queryByLabelText("Choose Success color")).not.toBeInTheDocument();

    await user.click(within(screen.getByRole("group", { name: "Accent mode" })).getByRole("button", { name: "Default" }));
    expect(screen.queryByLabelText("Choose Accent color")).not.toBeInTheDocument();
    expect(document.querySelector("main")).not.toHaveStyle({ "--accent": "#1B4AF3" });
    await user.click(within(screen.getByRole("group", { name: "Accent mode" })).getByRole("button", { name: "Custom" }));
    expect(screen.getByLabelText("Choose Accent color")).toHaveValue("#1b4af3");
    expect(document.querySelector("main")).toHaveStyle({ "--accent": "#1B4AF3" });

    fireEvent.input(screen.getByRole("slider", { name: "Accent hue drift" }), { target: { value: "1.7" } });
    expect(screen.getByRole("slider", { name: "Accent hue drift" })).toHaveValue("1.7");
    expect(screen.getByLabelText("Choose Accent color")).toHaveValue("#1b4af3");

    fireEvent.change(screen.getByLabelText("Choose Signal color"), { target: { value: "#00aaff" } });
    expect(document.querySelector("main")).toHaveStyle({ "--accent": "#1B4AF3" });
    expect(document.querySelector("main")).not.toHaveStyle({ "--success": "#3DED1F" });
  });

  it("renders canonical semantic colors without exposing harmony controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));

    expect(screen.getByText("Success · Warning · Error")).toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: "Semantic harmony" })).not.toBeInTheDocument();
    expect(document.querySelector("main")).toHaveStyle({ "--success": "#3DED1F", "--warning": "#ED8026", "--error": "#B82350" });
  });

  it("keeps automatic Contrast endpoints in palette markers without the large examples", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));

    expect(within(screen.getByRole("complementary", { name: "Brand editor" })).queryByText("Contrast", { exact: true })).not.toBeInTheDocument();
    expect(document.querySelector(".color-pairs")).not.toBeInTheDocument();
    expect(screen.queryByText("Signal / Contrast")).not.toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Scale contrast" })).toBeInTheDocument();
    const markers = screen.getAllByRole("button", { name: /Automatic contrast for/ });
    expect(markers).toHaveLength(5);
    expect(markers[0]).toHaveAttribute("data-tooltip", expect.stringContaining("Calculated automatically"));
    expect(markers[0].getAttribute("style")).toMatch(/--opposite-color: #[0-9A-F]{6}/);
  });

  it("renders a distinct example layout for every fixed use case", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Use cases/ }));

    expect(screen.getAllByText("Fixed format")).toHaveLength(3);
    expect(screen.getAllByLabelText("Usage rule")).toHaveLength(3);
    expect(document.querySelector(".mini-web")).toBeInTheDocument();
    expect(document.querySelector(".mini-presentation")).toBeInTheDocument();
    expect(document.querySelector(".mini-social")).toBeInTheDocument();
  });
});
