// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

const updateLanguage = vi.fn(async (language: string) => {
  await i18n.changeLanguage(language);
});

vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({ updateLanguage }),
}));

import { LanguageSelector } from "./language-selector";

Object.defineProperties(HTMLElement.prototype, {
  hasPointerCapture: { value: () => false },
  setPointerCapture: { value: () => undefined },
  releasePointerCapture: { value: () => undefined },
  scrollIntoView: { value: () => undefined },
});

function openLanguageMenu() {
  fireEvent.pointerDown(screen.getByRole("button", { name: /idioma: español/i }), {
    button: 0,
    ctrlKey: false,
  });
}

describe("LanguageSelector", () => {
  afterEach(cleanup);

  beforeEach(async () => {
    updateLanguage.mockClear();
    await i18n.changeLanguage("es");
  });

  it("opens an accessible menu with every supported language", () => {
    render(<LanguageSelector />);
    openLanguageMenu();

    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Español",
      "English",
      "Français",
      "Português",
      "Deutsch",
      "Italiano",
    ]);
  });

  it("changes language immediately when an option is selected", async () => {
    render(<LanguageSelector />);
    openLanguageMenu();
    fireEvent.click(screen.getByText("Français"));

    await waitFor(() => expect(updateLanguage).toHaveBeenCalledWith("fr"));
    await waitFor(() => expect(i18n.resolvedLanguage).toBe("fr"));
  });
});
