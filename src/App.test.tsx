import React, { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { emptyProfile, getPrediction, STORAGE_KEY } from "./engine";
import App from "./App";

// Component tests exercise the real game UI and persistence without a browser or WebGL.
// Dice geometry and outcome orientations are separately verified in engine.test.ts.
vi.mock("./Dice", () => ({
  default: ({
    result,
    rolling,
    onLanded,
  }: {
    result: number;
    rolling: boolean;
    onLanded: () => void;
  }) => {
    useEffect(() => {
      if (rolling) {
        const timer = setTimeout(onLanded, 10);
        return () => clearTimeout(timer);
      }
    }, [rolling, onLanded]);
    return <div role="img" aria-label={`Dice showing ${result}`} />;
  },
}));
beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
const click = async (name: string | RegExp) =>
  fireEvent.click(await screen.findByRole("button", { name }));

describe("complete player journey", () => {
  it("offers installation instructions when a browser has no automatic prompt", async () => {
    render(<App />);
    await click("ADD TO HOME SCREEN");
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("iPhone & iPad")).toBeTruthy();
    expect(within(dialog).getByText("Android")).toBeTruthy();
    await click("GOT IT");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("uses a native browser install prompt when one is available", async () => {
    render(<App />);
    const event = new Event("beforeinstallprompt", { cancelable: true });
    const prompt = vi.fn().mockResolvedValue(undefined);
    Object.assign(event, {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    fireEvent(window, event);
    expect(event.defaultPrevented).toBe(true);
    await click("ADD TO HOME SCREEN");
    expect(prompt).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "ADD TO HOME SCREEN" }),
      ).toBeNull(),
    );
  });
  it("shows offline status without interrupting the local story flow", async () => {
    render(<App />);
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    fireEvent(window, new Event("offline"));
    expect(screen.getByText(/You’re offline/)).toBeTruthy();
    await click("ENTER THE FUTURE");
    await screen.findByRole("heading", { name: "How far will you go?" });
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    fireEvent(window, new Event("online"));
    expect(screen.queryByText(/You’re offline/)).toBeNull();
  });
  it("selects a year, personalizes, rolls, branches, saves, revisits, and reloads a chapter", async () => {
    const view = render(<App />);
    await click("ENTER THE FUTURE");
    await click("+50 YEARS");
    await click(/Make this future a little more you/);
    fireEvent.change(await screen.findByLabelText("First name or nickname"), {
      target: { value: "River" },
    });
    fireEvent.change(screen.getByLabelText("Personal interests"), {
      target: { value: "architecture" },
    });
    await click("SAVE MY PROFILE");
    await click(`CONTINUE TO ${new Date().getFullYear() + 50}`);
    await click("ROLL THE DICE");
    await screen.findByRole("button", { name: "CHANGE MY FUTURE" });
    expect(
      screen.getByText(/River, this is one possible chapter/).textContent,
    ).toContain("architecture");
    const first = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(first.current.year).toBe(new Date().getFullYear() + 50);
    expect(first.current.face).toBeGreaterThanOrEqual(1);
    expect(first.current.face).toBeLessThanOrEqual(6);
    await click("CHANGE MY FUTURE");
    await click(new RegExp(first.current.choices[1].label));
    await screen.findByRole("button", { name: "ACCEPT THIS FUTURE" });
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(STORAGE_KEY)!).decisions,
      ).toHaveLength(1),
    );
    const revised = JSON.parse(localStorage.getItem(STORAGE_KEY)!).current;
    expect(revised.face).toBe(first.current.face);
    expect(revised.story).not.toBe(first.current.story);
    expect(revised.story).toContain(
      first.current.choices[1].label.toLowerCase(),
    );
    await click("ACCEPT THIS FUTURE");
    await screen.findByRole("heading", { name: "A collection of could-bes." });
    await click(
      new RegExp(revised.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(first.current.choices[1].label),
    ).toBeTruthy();
    await click("BACK TO MY TIMELINE");
    view.unmount();
    render(<App />);
    await click("My timeline 01");
    await screen.findByRole("heading", { name: revised.title });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).profile.name).toBe(
      "River",
    );
  });
  it("requires confirmation to clear data and resets all personal content", async () => {
    render(<App />);
    await click("Open settings");
    await click(/Your future profile/);
    fireEvent.change(await screen.findByLabelText("First name or nickname"), {
      target: { value: "Test Person" },
    });
    await click("SAVE MY PROFILE");
    await click("Open settings");
    await click("CLEAR ALL STORED DATA");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).profile.name).toBe(
      "Test Person",
    );
    await click("CLEAR ALL DATA");
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).profile.name).toBe(
        "",
      ),
    );
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY)!).timeline,
    ).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "ENTER THE FUTURE" }),
    ).toBeTruthy();
  });
  it("recovers gracefully from damaged local data and keeps the app playable", async () => {
    localStorage.setItem(STORAGE_KEY, "{invalid");
    render(<App />);
    expect(
      screen.getByText(/Your saved journey could not be loaded/),
    ).toBeTruthy();
    await click("ENTER THE FUTURE");
    await screen.findByRole("heading", { name: "How far will you go?" });
  });
  it("offers skip, settings, and how-it-works controls with working dialog dismissal", async () => {
    render(<App />);
    await click(/How it works/);
    expect(await screen.findByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await click("ENTER THE FUTURE");
    await click(/Make this future a little more you/);
    await click("SKIP FOR NOW");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).profile.name).toBe(
      "",
    );
  });
  it("never sends profile data without consent and uses local stories on service failure", async () => {
    vi.stubEnv("VITE_PREDICTION_ENDPOINT", "/api/predict");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("Service unavailable"));
    const input = {
      face: 3 as const,
      year: 2046,
      profile: { ...emptyProfile(), name: "Private name" },
      decisions: [],
    };
    const privateResult = await getPrediction(input, false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(privateResult.scenario.source).toBe("local");
    const fallback = await getPrediction(input, true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fallback.fallback).toBe(true);
    expect(fallback.scenario.face).toBe(3);
    expect(fallback.scenario.story).toContain("Private name");
  });
  it("rejects cross-origin AI configuration without transmitting any profile", async () => {
    vi.stubEnv(
      "VITE_PREDICTION_ENDPOINT",
      "https://invalid.example/api/predict",
    );
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const result = await getPrediction(
      { face: 1, year: 2036, profile: emptyProfile(), decisions: [] },
      true,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.fallback).toBe(true);
  });
});
