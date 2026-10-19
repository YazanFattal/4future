import { useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
let registrationPromise: Promise<ServiceWorkerRegistration> | undefined;
export function usePwa() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      !!(navigator as Navigator & { standalone?: boolean }).standalone,
  );
  const [offline, setOffline] = useState(!navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [update, setUpdate] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const installedEvent = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const onlineEvent = () => setOffline(!navigator.onLine);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installedEvent);
    window.addEventListener("online", onlineEvent);
    window.addEventListener("offline", onlineEvent);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installedEvent);
      window.removeEventListener("online", onlineEvent);
      window.removeEventListener("offline", onlineEvent);
    };
  }, []);
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let active = true;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    const inspect = () => {
      if (!active || !registration) return;
      if (registration.active?.state === "activated") setOfflineReady(true);
      if (registration.waiting) setUpdate(registration.waiting);
      if (installing?.state === "activated") setOfflineReady(true);
      if (
        installing?.state === "installed" &&
        navigator.serviceWorker.controller
      )
        setUpdate(registration.waiting);
    };
    const track = () => {
      installing?.removeEventListener("statechange", inspect);
      installing = registration?.installing ?? null;
      installing?.addEventListener("statechange", inspect);
      inspect();
    };
    registrationPromise ??= navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}sw.js`,
      { scope: import.meta.env.BASE_URL, updateViaCache: "none" },
    );
    registrationPromise
      .then((reg) => {
        if (!active) return;
        registration = reg;
        track();
        reg.addEventListener("updatefound", track);
        void navigator.serviceWorker.ready.then(() => {
          if (active) setOfflineReady(true);
        });
      })
      .catch(() => {
        registrationPromise =
          undefined; /* Online play remains available when offline storage is blocked. */
      });
    return () => {
      active = false;
      registration?.removeEventListener("updatefound", track);
      installing?.removeEventListener("statechange", inspect);
    };
  }, []);
  return {
    installed,
    offline,
    offlineReady,
    updateAvailable: !!update,
    install: async () => {
      if (!prompt) return false;
      try {
        await prompt.prompt();
        const result = await prompt.userChoice;
        if (result.outcome === "accepted") setInstalled(true);
        setPrompt(null);
        return true;
      } catch {
        setPrompt(null);
        return false;
      }
    },
    applyUpdate: () => {
      if (!update) return;
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => window.location.reload(),
        { once: true },
      );
      update.postMessage({ type: "SKIP_WAITING" });
    },
  };
}
