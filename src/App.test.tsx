import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { draftStorageKey } from "./editor";

const chapterNames = [
  "Principles",
  "Logo",
  "Typography",
  "Color",
  "Layout",
  "Imagery",
  "Iconography",
  "Motion",
  "Voice & Tone",
  "Applications",
];

describe("Brand DNA site", () => {
  beforeEach(() => {
    localStorage.removeItem(draftStorageKey);
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
  });

  it("groups the palette into Brand, Utility, and Semantic rows", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /Color/ }));
    expect(within(screen.getByRole("region", { name: "Brand" })).getAllByRole("article").map((item) => item.querySelector("b")?.textContent)).toEqual(["Signal", "Accent"]);
    expect(within(screen.getByRole("region", { name: "Utility" })).getAllByRole("article").map((item) => item.querySelector("b")?.textContent)).toEqual(["Ink", "Paper", "Border"]);
    expect(within(screen.getByRole("region", { name: "Semantic" })).getAllByRole("article").map((item) => item.querySelector("b")?.textContent)).toEqual(["Success", "Warning", "Error"]);
  });

  it("supports tab clicks and vertical or horizontal arrow-key navigation", async () => {
    const user = userEvent.setup();
    render(<App />);

    const principles = screen.getByRole("tab", { name: /Principles/ });
    const logo = screen.getByRole("tab", { name: /Logo/ });
    const applications = screen.getByRole("tab", { name: /Applications/ });

    principles.focus();
    await user.keyboard("{ArrowDown}");
    expect(logo).toHaveFocus();
    expect(logo).toHaveAttribute("aria-selected", "true");
    expect(window.location.hash).toBe("#logo");

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /Typography/ })).toHaveFocus();

    await user.click(applications);
    expect(applications).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: /Applications/ })).toBeVisible();
  });

  it("restores a valid chapter hash and exposes a Pages-safe JSON download", async () => {
    window.location.hash = "#color";
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Color/ })).toHaveAttribute("aria-selected", "true");
    });

    expect(screen.getByRole("link", { name: /Download JSON/ })).toHaveAttribute(
      "href",
      "/brand-dna/brand/brand-dna.json",
    );
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#content");
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
    expect(document.querySelector("main")).toHaveStyle({ "--signal": "#FF5C35" });
    expect(screen.getByRole("button", { name: "Show draft" })).toBeInTheDocument();
  });

  it("keeps global direction fields only in Principles and uses concise action labels", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("heading", { name: "Direction" })).toBeInTheDocument();
    expect(screen.getByLabelText("Should feel like")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare original" })).toHaveTextContent("Compare");
    expect(screen.getByRole("button", { name: "Copy update prompt" })).toHaveTextContent("Copy");
    expect(screen.getByRole("button", { name: "Download changes" })).toHaveTextContent("Download");
    expect(screen.getByRole("button", { name: "Reset draft" })).toHaveTextContent("Reset");

    await user.click(screen.getByRole("tab", { name: /Typography/ }));
    expect(screen.queryByRole("heading", { name: "Direction" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Should feel like")).not.toBeInTheDocument();
  });

  it("uses three Google Fonts links without application-level spacing controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Typography/ }));

    expect(screen.getByRole("link", { name: /Open Google Fonts/ })).toHaveAttribute("href", "https://fonts.google.com/");
    expect(screen.getByRole("link", { name: /Open Google Fonts/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByLabelText("Display font link")).toHaveAttribute("placeholder", "Paste a Google Fonts link");
    expect(screen.getByLabelText("Body font link")).toBeInTheDocument();
    expect(screen.getByLabelText("Utility font link")).toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: "Display tracking" })).not.toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: "Body line height" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Display font link"), {
      target: { value: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@400;700&display=swap" },
    });
    expect(screen.getByText("DM Serif Display · 400")).toBeInTheDocument();
    expect(await screen.findByRole("combobox", { name: "Display preferred weight" })).toHaveValue("400");
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Display preferred weight" })).toHaveTextContent("700"));
    await user.selectOptions(screen.getByRole("combobox", { name: "Display preferred weight" }), "700");
    expect(screen.getByText("DM Serif Display · 700")).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('link[data-brand-font="display"]')).toHaveAttribute(
      "href",
      "https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@700&display=swap",
    ));
  });

  it("exposes the three scale multipliers as editable design decisions", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));
    expect(screen.getByRole("slider", { name: /Hue drift/ })).toHaveAttribute("max", "2");
    expect(screen.getByRole("button", { name: "Flip hue drift" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Flip hue drift" })).toHaveTextContent(/^Flip$/);
    expect(screen.getByRole("slider", { name: /Saturation drift/ })).toHaveAttribute("max", "2");
    expect(screen.getByRole("button", { name: "Flip saturation drift" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Flip saturation drift" })).toHaveTextContent(/^Flip$/);
    expect(screen.getByRole("slider", { name: "Scale contrast" })).toHaveAttribute("min", "0.5");
    expect(screen.queryByRole("slider", { name: "Semantic harmony" })).not.toBeInTheDocument();
    expect(screen.getByText("10 light / 10 dark")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Paper / Background stop" })).toHaveValue("50");
    expect(screen.getByRole("combobox", { name: "Ink / Foreground stop" })).toHaveValue("900");
    expect(screen.getByRole("slider", { name: "Border opacity" })).toHaveValue("20");
    expect(within(screen.getByRole("complementary", { name: "Brand editor" })).queryByText("Contrast")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Base position" })).not.toBeInTheDocument();

    fireEvent.input(screen.getByRole("slider", { name: /Hue drift/ }), { target: { value: "1.2" } });
    expect(screen.getByRole("complementary", { name: "Brand editor" })).toHaveTextContent("1 change");
    expect(screen.getByText("1.20×")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Flip hue drift" }));
    expect(screen.getByRole("button", { name: "Flip hue drift" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/1\.20× · Flipped/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Flip saturation drift" }));
    expect(screen.getByRole("button", { name: "Flip saturation drift" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/1\.10× · Flipped/)).toBeInTheDocument();
  });

  it("keeps derived colors minimal until Adjusted is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));

    const accent = screen.getByRole("region", { name: "Accent color" });
    expect(within(accent).getByRole("button", { name: "Default" })).toHaveAttribute("aria-pressed", "true");
    expect(within(accent).queryByRole("slider", { name: "Accent hue drift" })).not.toBeInTheDocument();
    expect(within(accent).queryByLabelText("Choose Accent color")).not.toBeInTheDocument();
    await user.click(within(accent).getByRole("button", { name: "Adjusted" }));

    expect(within(accent).getByRole("button", { name: "Adjusted" })).toHaveAttribute("aria-pressed", "true");
    expect(within(accent).getByRole("slider", { name: "Accent hue drift" })).toHaveValue("1.1");
    expect(within(accent).queryByLabelText("Choose Accent color")).not.toBeInTheDocument();
    fireEvent.input(within(accent).getByRole("slider", { name: "Accent hue drift" }), { target: { value: "1.8" } });
    expect(within(accent).getByRole("slider", { name: "Accent hue drift" })).toHaveValue("1.8");

    await user.click(within(accent).getByRole("button", { name: "Default" }));
    expect(within(accent).queryByRole("slider", { name: "Accent hue drift" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset draft" })).toBeDisabled();
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

    expect(screen.getByText("20% Ink")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Border mode" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Choose Border color")).not.toBeInTheDocument();
    fireEvent.input(screen.getByRole("slider", { name: "Border opacity" }), { target: { value: "35" } });

    expect(getComputedStyle(main).getPropertyValue("--line")).not.toBe(originalBorder);
    expect(screen.getByRole("complementary", { name: "Brand editor" })).toHaveTextContent("1 change");

    expect(screen.getByText("35% Ink")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Border opacity" })).toHaveValue("35");
  });

  it("defaults Accent and semantic states to Signal-derived modes with custom overrides", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));

    expect(screen.getAllByRole("button", { name: "Default" })).toHaveLength(4);
    expect(screen.getAllByRole("button", { name: "Adjusted" })).toHaveLength(4);
    expect(screen.getAllByRole("button", { name: "Custom" })).toHaveLength(4);
    expect(document.querySelector("main")).toHaveStyle({ "--accent": "#35D8FF", "--success": "#51ED26", "--warning": "#EFB539", "--error": "#ED2B26" });
    expect(screen.queryByLabelText("Choose Accent color")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Choose Success color")).not.toBeInTheDocument();

    await user.click(within(screen.getByRole("group", { name: "Accent mode" })).getByRole("button", { name: "Custom" }));
    expect(screen.getByLabelText("Choose Accent color")).toHaveValue("#6657ff");
    expect(screen.getByRole("slider", { name: "Accent hue drift" })).toHaveValue("1.1");
    expect(document.querySelector("main")).toHaveStyle({ "--accent": "#6657FF" });

    fireEvent.input(screen.getByRole("slider", { name: "Accent hue drift" }), { target: { value: "1.7" } });
    expect(screen.getByRole("slider", { name: "Accent hue drift" })).toHaveValue("1.7");
    expect(screen.getByLabelText("Choose Accent color")).toHaveValue("#6657ff");

    fireEvent.change(screen.getByLabelText("Choose Signal color"), { target: { value: "#00aaff" } });
    expect(document.querySelector("main")).toHaveStyle({ "--accent": "#6657FF" });
    expect(document.querySelector("main")).not.toHaveStyle({ "--success": "#51ED26" });
  });

  it("derives Success, Warning, and Error without exposing harmony controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));

    expect(screen.getByText("Success · Warning · Error")).toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: "Semantic harmony" })).not.toBeInTheDocument();
    expect(document.querySelector("main")).toHaveStyle({ "--success": "#51ED26", "--warning": "#EFB539", "--error": "#ED2B26" });
  });

  it("shows an automatic Contrast endpoint for every base color", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Color/ }));

    expect(within(screen.getByRole("complementary", { name: "Brand editor" })).queryByText("Contrast", { exact: true })).not.toBeInTheDocument();
    expect(screen.getByText("Signal / Contrast")).toBeInTheDocument();
    expect(screen.getByText("Accent / Contrast")).toBeInTheDocument();
    expect(screen.getByText("Success / Contrast")).toBeInTheDocument();
    expect(screen.getByText("Warning / Contrast")).toBeInTheDocument();
    expect(screen.getByText("Error / Contrast")).toBeInTheDocument();
    expect(screen.getAllByText(/#[0-9A-F]{6} · Stop (0|1000) · \d+\.\d{2}:1/)).toHaveLength(5);
    expect(screen.getByRole("slider", { name: "Scale contrast" })).toBeInTheDocument();
    const markers = screen.getAllByRole("button", { name: /Automatic contrast for/ });
    expect(markers).toHaveLength(5);
    expect(markers[0]).toHaveAttribute("data-tooltip", expect.stringContaining("Calculated automatically"));
    expect(markers[0].getAttribute("style")).toMatch(/--opposite-color: #[0-9A-F]{6}/);
  });

  it("keeps the four application formats fixed while their rules remain editable", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("tab", { name: /Applications/ }));

    expect(screen.getAllByText("Fixed format")).toHaveLength(4);
    expect(screen.getAllByLabelText("Usage rule")).toHaveLength(4);
  });
});
