import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Brand DNA site", () => {
  it("renders every editorial chapter from the canonical Brand DNA", () => {
    render(<App />);

    for (const heading of [
      "Brand essence",
      "Voice & tone",
      "Visual identity",
      "Imagery system",
      "Motion & sound",
      "Information & data language",
      "Accessibility & boundaries",
      "Channel profiles",
      "AI contract",
      "Build yours",
    ]) {
      expect(screen.getByText(heading, { selector: "h2" })).toBeInTheDocument();
    }
  });

  it("supports tab clicks and vertical or horizontal arrow-key navigation", async () => {
    const user = userEvent.setup();
    render(<App />);

    const overview = screen.getByRole("tab", { name: /Overview/ });
    const strategy = screen.getByRole("tab", { name: /Strategy/ });
    const buildYours = screen.getByRole("tab", { name: /Build yours/ });

    overview.focus();
    await user.keyboard("{ArrowDown}");
    expect(strategy).toHaveFocus();
    expect(strategy).toHaveAttribute("aria-selected", "true");
    expect(window.location.hash).toBe("#strategy");

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /Expression/ })).toHaveFocus();

    await user.click(buildYours);
    expect(buildYours).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: /Build yours/ })).toBeVisible();
  });

  it("restores a valid chapter hash and exposes a Pages-safe JSON download", async () => {
    const user = userEvent.setup();
    window.location.hash = "#visual";
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Visual identity/ })).toHaveAttribute("aria-selected", "true");
    });

    await user.click(screen.getByRole("tab", { name: /AI contract/ }));
    expect(screen.getByRole("link", { name: /Download the complete Brand DNA/ })).toHaveAttribute(
      "href",
      "/brand-dna/brand/brand-dna.json",
    );
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#content");
  });
});
