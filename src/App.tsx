import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  Dice5,
  Gem,
  Heart,
  History,
  Infinity as InfinityIcon,
  MoveUpRight,
  Orbit,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Dice from "./Dice";
import { usePwa } from "./pwa";
import {
  acceptScenario,
  categories,
  destination,
  freshGame,
  getPrediction,
  parseGame,
  rollFace,
  STORAGE_KEY,
  type Decision,
  type Face,
  type Game,
  type Jump,
  type Profile,
  type Scenario,
} from "./engine";

type Screen = "home" | "select" | "roll" | "reveal" | "decision" | "timeline";
type ModalType =
  | "how"
  | "profile"
  | "settings"
  | "reset"
  | "clear"
  | "install"
  | null;
const icons = [Heart, Gem, Brain, Orbit, Trophy, Sparkles];
function CategoryIcon({ face, size = 18 }: { face: Face; size?: number }) {
  const Icon = icons[face - 1];
  return <Icon size={size} strokeWidth={1.4} />;
}
function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input, select, textarea, a[href], [tabindex="0"]',
        ) ?? [],
      );
    focusables()[0]?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key === "Tab") {
        const els = focusables(),
          first = els[0],
          last = els.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal ${wide ? "modal-wide" : ""}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="modal-heading">
          <span className="eyebrow">4FUTURE / YOUR SPACE</span>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="modal-title">{title}</h2>
        {children}
      </motion.div>
    </div>
  );
}
function ProfileForm({
  profile,
  onSave,
  onSkip,
}: {
  profile: Profile;
  onSave: (p: Profile) => void;
  onSkip: () => void;
}) {
  const [draft, setDraft] = useState(profile);
  const field = (key: keyof Profile, value: string) =>
    setDraft((p) => ({ ...p, [key]: value }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(
          Object.fromEntries(
            Object.entries(draft).map(([k, v]) => [k, v.trim()]),
          ) as Profile,
        );
      }}
    >
      <p className="muted modal-intro">
        A little about you makes each possibility more personal. Every field is
        optional.
      </p>
      <div className="form-grid">
        <label>
          First name or nickname
          <input
            autoComplete="off"
            maxLength={60}
            placeholder="What should we call you?"
            value={draft.name}
            onChange={(e) => field("name", e.target.value)}
          />
        </label>
        <label>
          Age range
          <select
            value={draft.age}
            onChange={(e) => field("age", e.target.value)}
          >
            <option value="">Prefer not to say</option>
            {[
              "Under 18",
              "18–24",
              "25–34",
              "35–44",
              "45–54",
              "55–64",
              "65+",
            ].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="full">
          Occupation or field of study
          <input
            maxLength={120}
            placeholder="Design, engineering, still exploring…"
            value={draft.field}
            onChange={(e) => field("field", e.target.value)}
          />
        </label>
        <label className="full">
          Personal interests
          <input
            maxLength={160}
            placeholder="The things that make you curious"
            value={draft.interests}
            onChange={(e) => field("interests", e.target.value)}
          />
        </label>
        <label className="full">
          Biggest ambition
          <textarea
            rows={2}
            maxLength={200}
            placeholder="Something you would love to make possible"
            value={draft.ambition}
            onChange={(e) => field("ambition", e.target.value)}
          />
        </label>
      </div>
      <p className="privacy-note">
        <ShieldCheck size={15} /> Saved only in this browser. Share only what
        you’re comfortable with.
      </p>
      <div className="actions">
        <button className="button primary" type="submit">
          SAVE MY PROFILE <Check size={16} />
        </button>
        <button className="text-button" type="button" onClick={onSkip}>
          SKIP FOR NOW
        </button>
      </div>
    </form>
  );
}
function ScenarioText({ scenario }: { scenario: Scenario }) {
  return (
    <>
      <div className="scenario-story">
        {scenario.story.split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="challenge">
        <span className="eyebrow">THE OTHER SIDE OF POSSIBILITY</span>
        <p>{scenario.challenge}</p>
      </div>
    </>
  );
}
let soundContext: AudioContext | null = null;
function playSound(kind: "roll" | "reveal") {
  try {
    soundContext ??= new AudioContext();
    void soundContext.resume();
    const audio = soundContext;
    [0, 0.1, 0.23, 0.4, 0.65]
      .slice(0, kind === "roll" ? 5 : 3)
      .forEach((offset, i) => {
        const osc = audio.createOscillator(),
          gain = audio.createGain(),
          t = audio.currentTime + offset;
        osc.type = kind === "roll" ? "triangle" : "sine";
        osc.frequency.setValueAtTime(
          kind === "roll" ? 130 - i * 13 : [330, 440, 660][i],
          t,
        );
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.04, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      });
  } catch {
    /* Audio is optional; the game remains usable if a browser disables it. */
  }
}

export default function App() {
  const pwa = usePwa();
  const [initial] = useState(() => {
    try {
      return { game: parseGame(localStorage.getItem(STORAGE_KEY)), error: "" };
    } catch {
      return {
        game: freshGame(),
        error:
          "Your saved journey could not be loaded. A fresh simulation is ready.",
      };
    }
  });
  const [game, setGame] = useState<Game>(initial.game);
  const [screen, setScreen] = useState<Screen>("home");
  const [modal, setModal] = useState<ModalType>(null);
  const [viewed, setViewed] = useState<Scenario | null>(null);
  const [face, setFace] = useState<Face>(initial.game.current?.face ?? 5);
  const [rolling, setRolling] = useState(false);
  const [landed, setLanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(initial.error);
  const [storageError, setStorageError] = useState("");
  const busy = useRef(false);
  const landedOnce = useRef(false);
  const main = useRef<HTMLElement>(null);
  const reduced = !!useReducedMotion();
  const currentYear = new Date().getFullYear(),
    year = destination(game.jump);
  const category = categories[face - 1];
  const current = game.current;
  const aiConfigured = !!import.meta.env.VITE_PREDICTION_ENDPOINT;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
      setStorageError("");
    } catch {
      setStorageError(
        "Browser storage is unavailable. You can keep playing, but this journey may not survive a reload.",
      );
    }
  }, [game]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (screen !== "home") main.current?.focus({ preventScroll: true });
  }, [screen]);

  const navigate = (next: Screen) => {
    if (!busy.current) setScreen(next);
  };
  const toggleSound = () => {
    if (!game.sound) playSound("reveal");
    setGame((g) => ({ ...g, sound: !g.sound }));
  };
  const begin = () => navigate(current ? "reveal" : "select");
  const startRoll = () => {
    if (busy.current) return;
    try {
      const value = rollFace();
      busy.current = true;
      landedOnce.current = false;
      setFace(value);
      setLanded(false);
      setRolling(true);
      if (game.sound) playSound("roll");
    } catch {
      setNotice(
        "Your browser could not roll the dice securely. Please reload and try again.",
      );
    }
  };
  const onLanded = useCallback(async () => {
    if (landedOnce.current) return;
    landedOnce.current = true;
    setRolling(false);
    setLanded(true);
    setLoading(true);
    if (game.sound) playSound("reveal");
    const [result] = await Promise.all([
      getPrediction(
        { face, year, profile: game.profile, decisions: game.decisions },
        game.aiConsent,
      ),
      new Promise((resolve) => setTimeout(resolve, reduced ? 150 : 1100)),
    ]);
    setGame((g) => ({ ...g, current: result.scenario }));
    if (result.fallback)
      setNotice(
        "The AI service is unavailable. Your local story engine created this possibility instead.",
      );
    setLoading(false);
    busy.current = false;
    setScreen("reveal");
  }, [
    face,
    year,
    game.profile,
    game.decisions,
    game.aiConsent,
    game.sound,
    reduced,
  ]);
  const choose = async (choice: Scenario["choices"][number]) => {
    if (!current || busy.current) return;
    busy.current = true;
    setLoading(true);
    const decision: Decision = {
      ...choice,
      year: current.year,
      category: categories[current.face - 1].name,
    };
    const decisions = [...game.decisions, decision].slice(-200);
    const [result] = await Promise.all([
      getPrediction(
        {
          face: current.face,
          year: current.year,
          profile: game.profile,
          decisions,
          previous: current,
        },
        game.aiConsent,
      ),
      new Promise((resolve) => setTimeout(resolve, reduced ? 100 : 650)),
    ]);
    setGame((g) => ({ ...g, decisions, current: result.scenario }));
    if (result.fallback)
      setNotice(
        "Your local story engine continued this chapter while the AI service is unavailable.",
      );
    setLoading(false);
    busy.current = false;
    setScreen("reveal");
  };
  const accept = () => {
    if (!current) return;
    setGame((g) => acceptScenario(g, current));
    setNotice("A possibility saved. Your timeline is taking shape.");
    setScreen("timeline");
  };
  const reset = (all: boolean) => {
    setGame((g) =>
      all
        ? freshGame()
        : {
            ...freshGame(),
            profile: g.profile,
            sound: g.sound,
            aiConsent: g.aiConsent,
          },
    );
    setFace(5);
    setLanded(false);
    setModal(null);
    setViewed(null);
    setScreen("home");
    setNotice(
      all
        ? "Your profile, choices, and saved futures have been cleared."
        : "A new future awaits. Your profile has been kept.",
    );
  };

  return (
    <div className={`app screen-${screen}`}>
      <a className="skip-link" href="#main-content">
        Skip to experience
      </a>
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-light" aria-hidden="true" />
      <header className="header">
        <button
          className="brand"
          aria-label="4FUTURE home"
          onClick={() => navigate("home")}
          disabled={rolling || loading}
        >
          <Dice5 size={23} strokeWidth={1.7} />
          <span>
            4FUTURE<span className="brand-dot">.</span>
          </span>
          <span className="beta">BETA</span>
        </button>
        <nav aria-label="Main navigation">
          <button
            className={screen !== "timeline" ? "active" : ""}
            onClick={() => navigate("home")}
            disabled={rolling || loading}
          >
            The experience
          </button>
          <button onClick={() => setModal("how")} disabled={rolling || loading}>
            How it works <MoveUpRight size={12} />
          </button>
          <button
            className={
              screen === "timeline" ? "active timeline-nav" : "timeline-nav"
            }
            onClick={() => navigate("timeline")}
            disabled={rolling || loading}
          >
            My timeline{" "}
            <span>{String(game.timeline.length).padStart(2, "0")}</span>
          </button>
        </nav>
        <div className="header-tools">
          <button
            className="icon-button sound-toggle"
            aria-label={game.sound ? "Mute sound" : "Enable sound"}
            aria-pressed={game.sound}
            onClick={toggleSound}
          >
            {game.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            className="icon-button"
            aria-label="Open settings"
            onClick={() => setModal("settings")}
            disabled={rolling || loading}
          >
            <Settings2 size={18} />
          </button>
        </div>
      </header>
      {(pwa.offline || pwa.updateAvailable) && (
        <div className="app-status" role="status">
          <span>
            {pwa.offline
              ? "You’re offline. Your local futures are still here."
              : "A fresh version of 4FUTURE is ready."}
          </span>
          {pwa.updateAvailable && (
            <button disabled={rolling || loading} onClick={pwa.applyUpdate}>
              UPDATE APP <RotateCcw size={13} />
            </button>
          )}
        </div>
      )}
      {storageError && (
        <div role="status" className="storage-notice">
          {storageError}
        </div>
      )}
      <main id="main-content" tabIndex={-1} ref={main}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: reduced ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -10 }}
            transition={{ duration: reduced ? 0.01 : 0.32 }}
          >
            {screen === "home" && (
              <>
                <section className="hero">
                  <div className="hero-status">
                    <span className="status-dot" /> THE FUTURE IS UNWRITTEN{" "}
                    <span className="status-slash">/</span> EST. {currentYear}
                  </div>
                  <h1>
                    Roll your destiny<span className="silver-period">.</span>
                  </h1>
                  <p className="hero-subtitle">
                    One roll. Six possibilities. <span>Infinite futures.</span>
                  </p>
                  <div className="hero-stage">
                    <div className="orbital-ring ring-one" />
                    <div className="orbital-ring ring-two" />
                    <div className="orbital-ring ring-three" />
                    <div className="dice-halo" />
                    <span className="star star-one">+</span>
                    <span className="star star-two">+</span>
                    <span className="star star-three">+</span>
                    <div className="stage-note note-left">
                      <span className="eyebrow">A LITTLE CHANCE.</span>
                      <span>A world of possibility.</span>
                      <i />
                    </div>
                    <Dice result={5} home reduced={reduced} />
                    <div className="stage-note note-right">
                      <span className="mini-orbit">
                        <Orbit size={19} strokeWidth={1} />
                      </span>
                      <span className="eyebrow">YOUR NEXT CHAPTER</span>
                      <span>is waiting to happen.</span>
                    </div>
                    <div className="ground-shadow" />
                  </div>
                  <div className="hero-action">
                    <button
                      className="button primary hero-enter"
                      onClick={begin}
                    >
                      {current ? "RESUME YOUR FUTURE" : "ENTER THE FUTURE"}{" "}
                      <ArrowRight size={18} />
                    </button>
                    <p>
                      <span className="tiny-dot" /> Six sides. Endless
                      possibility.
                    </p>
                    {!pwa.installed && (
                      <button
                        className="install-link"
                        onClick={async () => {
                          if (!(await pwa.install())) setModal("install");
                        }}
                      >
                        <Smartphone size={14} /> ADD TO HOME SCREEN{" "}
                        <MoveUpRight size={11} />
                      </button>
                    )}
                  </div>
                  <div className="hero-side left">EXPLORE WHAT COULD BE</div>
                  <div className="hero-side right">CHANCE × CHOICE</div>
                </section>
                <section
                  className="possibilities"
                  aria-labelledby="possibilities-title"
                >
                  <div className="section-overline">
                    <span id="possibilities-title">
                      SIX SIDES. SIX DIFFERENT TOMORROWS.
                    </span>
                    <span className="desktop-only">
                      WHERE WILL YOU LAND? <ArrowDown size={12} />
                    </span>
                  </div>
                  <div className="category-grid">
                    {categories.map((c) => (
                      <button
                        key={c.face}
                        className="category-item"
                        onClick={() => {
                          setFace(c.face);
                          setModal("how");
                        }}
                        aria-label={`Learn about ${c.name}`}
                      >
                        <span className="category-number">0{c.face}</span>
                        <CategoryIcon face={c.face} size={23} />
                        <span>{c.name}</span>
                        <MoveUpRight className="category-arrow" size={13} />
                      </button>
                    ))}
                  </div>
                </section>
                <div className="philosophy">
                  <span className="small-cross">+</span>
                  <p>
                    The dice chooses the possibility.{" "}
                    <span>You choose the path.</span>
                  </p>
                  <InfinityIcon size={20} strokeWidth={1} />
                </div>
              </>
            )}
            {screen === "select" && (
              <section className="experience-panel selection-panel">
                <Step number="01" title="CHOOSE YOUR HORIZON" />
                <h1>How far will you go?</h1>
                <p className="section-description">
                  Your future is unknown. Your possibilities are endless.
                </p>
                <div className="destination-display">
                  <span className="eyebrow">DESTINATION</span>
                  <AnimatePresence mode="wait">
                    <motion.strong
                      key={year}
                      initial={{ opacity: 0, y: reduced ? 0 : 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduced ? 0 : -15 }}
                      transition={{ duration: 0.15 }}
                    >
                      {year}
                    </motion.strong>
                  </AnimatePresence>
                  <span className="year-offset">
                    {game.jump === 100
                      ? "A century of possibilities"
                      : `${game.jump} years from now`}
                  </span>
                </div>
                <div className="time-track">
                  <span className="track-start">
                    {currentYear}
                    <span>YOU ARE HERE</span>
                  </span>
                  <div className="track-line">
                    <motion.div
                      animate={{
                        width: `${({ 10: 20, 20: 40, 50: 70, 100: 100 } as const)[game.jump]}%`,
                      }}
                      transition={{ duration: reduced ? 0 : 0.4 }}
                    />
                  </div>
                  <span className="track-end">{currentYear + 100}</span>
                </div>
                <div
                  className="jump-options"
                  role="group"
                  aria-label="Choose years into the future"
                >
                  {([10, 20, 50, 100] as Jump[]).map((jump) => (
                    <button
                      key={jump}
                      aria-pressed={game.jump === jump}
                      className={game.jump === jump ? "selected" : ""}
                      onClick={() => setGame((g) => ({ ...g, jump }))}
                    >
                      <span>+{jump}</span>
                      <small>YEARS</small>
                      {game.jump === jump && <span className="selection-dot" />}
                    </button>
                  ))}
                </div>
                {game.jump >= 50 && (
                  <p className="legacy-note">
                    A distant chapter may imagine your later life, your legacy,
                    or a fictional future self.
                  </p>
                )}
                <button
                  className="profile-prompt"
                  onClick={() => setModal("profile")}
                >
                  <div className="profile-symbol">
                    <UserRound size={20} />
                  </div>
                  <span>
                    <strong>
                      {game.profile.name
                        ? `A future for ${game.profile.name}`
                        : "Make this future a little more you."}
                    </strong>
                    <small>
                      {Object.values(game.profile).some(Boolean)
                        ? "Edit your optional future profile"
                        : "Add an optional profile for a personal touch"}
                    </small>
                  </span>
                  <span className="optional-label">OPTIONAL</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    setLanded(false);
                    navigate("roll");
                  }}
                >
                  CONTINUE TO {year} <ArrowRight size={17} />
                </button>
                <button
                  className="text-button back-button"
                  onClick={() => navigate("home")}
                >
                  <ArrowLeft size={13} /> BACK TO THE PRESENT
                </button>
              </section>
            )}
            {screen === "roll" && (
              <section className="experience-panel roll-panel">
                <Step number="02" title={`DESTINATION LOCKED / ${year}`} />
                <h1>
                  {landed
                    ? `${category.name} awaits.`
                    : "Let possibility find you."}
                </h1>
                <p className="section-description" aria-live="polite">
                  {rolling
                    ? "A little chance is setting your next chapter in motion."
                    : landed
                      ? `You rolled ${face}. Opening one possible future…`
                      : "One roll opens a door. What happens next is up to you."}
                </p>
                <div className={`roll-stage ${rolling ? "rolling" : ""}`}>
                  <div className="orbital-ring ring-one" />
                  <div className="dice-halo" />
                  <Dice
                    result={face}
                    rolling={rolling}
                    reduced={reduced}
                    home={!rolling && !landed}
                    onLanded={onLanded}
                  />
                  <div className="ground-shadow" />
                </div>
                <div className="roll-category" aria-live="polite">
                  {landed ? (
                    <>
                      <CategoryIcon face={face} />
                      <span>
                        0{face} / {category.name.toUpperCase()}
                      </span>
                    </>
                  ) : (
                    <span>
                      {rolling
                        ? "EXPLORING THE POSSIBLE"
                        : "SIX POSSIBILITIES. ONE FIRST STEP."}
                    </span>
                  )}
                </div>
                <button
                  className="button primary"
                  onClick={startRoll}
                  disabled={rolling || loading}
                >
                  {rolling
                    ? "ROLLING YOUR DESTINY"
                    : loading
                      ? "OPENING YOUR FUTURE"
                      : "ROLL THE DICE"}{" "}
                  {rolling || loading ? (
                    <span className="spinner" />
                  ) : (
                    <Dice5 size={18} />
                  )}
                </button>
                <button
                  className="text-button back-button"
                  onClick={() => navigate("select")}
                  disabled={rolling || loading}
                >
                  <ArrowLeft size={13} /> CHANGE DESTINATION
                </button>
                <div className="mini-categories">
                  {categories.map((c) => (
                    <span
                      key={c.face}
                      className={landed && c.face === face ? "highlighted" : ""}
                    >
                      <CategoryIcon face={c.face} size={14} /> {c.face} {c.name}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {screen === "reveal" && current && (
              <section className="experience-panel reveal-panel">
                <Step number="03" title="A POSSIBLE CHAPTER" />
                <div className="reveal-meta">
                  <span>
                    <CategoryIcon face={current.face} />{" "}
                    {String(current.face).padStart(2, "0")} /{" "}
                    {categories[current.face - 1].name.toUpperCase()}
                  </span>
                  <span>YEAR {current.year}</span>
                </div>
                <h1>{current.title}</h1>
                <p className="fiction-label">
                  <span className="status-dot" />{" "}
                  {current.source === "ai"
                    ? "AI-GENERATED FICTION"
                    : "CREATIVE SIMULATION"}{" "}
                  <span>·</span> ONE POSSIBILITY, NEVER A PROMISE
                </p>
                <ScenarioText scenario={current} />
                <div className="free-will">
                  <span className="eyebrow">
                    THE DICE HAS SPOKEN. NOW IT’S YOUR TURN.
                  </span>
                  <div className="actions">
                    <button className="button primary" onClick={accept}>
                      ACCEPT THIS FUTURE <Check size={17} />
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => navigate("decision")}
                    >
                      CHANGE MY FUTURE <ArrowRight size={17} />
                    </button>
                  </div>
                  <p>
                    Accept to save this chapter. Change it to explore a
                    different path.
                  </p>
                </div>
                <button
                  className="text-button back-button"
                  onClick={() => navigate("select")}
                >
                  <ArrowLeft size={13} /> EXPLORE ANOTHER DESTINATION
                </button>
              </section>
            )}
            {screen === "decision" && current && (
              <section className="experience-panel decision-panel">
                <Step number="04" title="A MOMENT OF FREE WILL" />
                <span className="decision-icon">
                  <Orbit size={34} strokeWidth={1} />
                </span>
                <h1>The next move is yours.</h1>
                <p className="decision-question">{current.question}</p>
                <div className="choices">
                  {current.choices.map((choice, i) => (
                    <button
                      key={choice.id}
                      disabled={loading}
                      onClick={() => void choose(choice)}
                    >
                      <span className="choice-letter">
                        {["A", "B", "C"][i]}
                      </span>
                      <span>{choice.label}</span>
                      <ArrowRight size={19} />
                    </button>
                  ))}
                </div>
                <p className="decision-note" aria-live="polite">
                  {loading
                    ? "Following the thread of your choice…"
                    : "Your choice shapes this story. Your real future remains unwritten."}
                </p>
                <button
                  className="text-button"
                  disabled={loading}
                  onClick={() => navigate("reveal")}
                >
                  <ArrowLeft size={13} /> RETURN TO YOUR CHAPTER
                </button>
              </section>
            )}
            {screen === "timeline" && (
              <section className="experience-panel timeline-panel">
                <Step number="∞" title="YOUR UNFOLDING STORY" />
                <div className="timeline-title">
                  <div>
                    <h1>A collection of could-bes.</h1>
                    <p className="section-description">
                      Different possibilities. One journey that is yours.
                    </p>
                  </div>
                  <div className="timeline-count">
                    <strong>
                      {String(game.timeline.length).padStart(2, "0")}
                    </strong>
                    <span>SAVED FUTURES</span>
                  </div>
                </div>
                {game.timeline.length ? (
                  <>
                    <div className="journey-strip">
                      <span>
                        {currentYear}
                        <small>THE PRESENT</small>
                      </span>
                      {[...new Set(game.timeline.map((s) => s.year))]
                        .sort()
                        .map((y) => (
                          <span key={y}>
                            <ArrowRight size={14} />
                            {y}
                            <small>A POSSIBILITY</small>
                          </span>
                        ))}
                    </div>
                    <div className="timeline-list">
                      {game.timeline.map((s, i) => (
                        <button
                          className="timeline-card"
                          key={s.id}
                          onClick={() => setViewed(s)}
                        >
                          <span className="timeline-index">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="timeline-year">
                            {s.year}
                            <span>
                              <CategoryIcon face={s.face} size={14} /> {s.face}{" "}
                              / {categories[s.face - 1].name}
                            </span>
                          </div>
                          <div className="timeline-card-copy">
                            <h3>{s.title}</h3>
                            <p>
                              {s.decisions.length
                                ? `${s.decisions.length} ${s.decisions.length === 1 ? "choice" : "choices"} shaped this chapter`
                                : "A first glimpse of possibility"}
                            </p>
                          </div>
                          <MoveUpRight size={19} />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="empty-timeline">
                    <History size={42} strokeWidth={1} />
                    <h2>Every journey starts with a possibility.</h2>
                    <p>
                      Accept a future to save it here. Return anytime to revisit
                      your chapters and the choices that shaped them.
                    </p>
                  </div>
                )}
                <div className="timeline-actions">
                  <button
                    className="button primary"
                    onClick={() => navigate(current ? "reveal" : "select")}
                  >
                    {current ? "CONTINUE YOUR CHAPTER" : "EXPLORE A FUTURE"}{" "}
                    <ArrowRight size={18} />
                  </button>
                  {game.timeline.length > 0 && (
                    <button
                      className="text-button"
                      onClick={() => setModal("reset")}
                    >
                      <RotateCcw size={15} /> START NEW FUTURE
                    </button>
                  )}
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="footer">
        <div>
          <span className="footer-brand">4F.</span>
          <span>
            Your future is not written by a dice. This is a simulation of
            possibilities.
          </span>
        </div>
        <span className="footer-status">
          <span className="tiny-dot" />{" "}
          {game.aiConsent && aiConfigured
            ? "AI STORIES ENABLED"
            : "IMAGINATION, NOT PREDICTION"}
        </span>
      </footer>
      <AnimatePresence>
        {notice && (
          <motion.div
            className="toast"
            role="status"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Check size={16} />
            <span>{notice}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {modal === "profile" && (
        <Modal
          title="Your story starts with you."
          onClose={() => setModal(null)}
        >
          <ProfileForm
            profile={game.profile}
            onSave={(profile) => {
              setGame((g) => ({ ...g, profile }));
              setModal(null);
              setNotice("Your profile is saved in this browser.");
            }}
            onSkip={() => setModal(null)}
          />
        </Modal>
      )}
      {modal === "how" && (
        <Modal
          title="A little chance. A lot of choice."
          wide
          onClose={() => setModal(null)}
        >
          <p className="muted modal-intro">
            A playful journey through possible futures. Nothing here predicts
            what will happen.
          </p>
          <div className="how-steps">
            {[
              [
                "01",
                "Choose your horizon",
                "Travel 10, 20, 50, or 100 years from today.",
              ],
              [
                "02",
                "Roll your destiny",
                "An unbiased roll opens one of six story categories.",
              ],
              [
                "03",
                "Choose your path",
                "Save a chapter, or make a choice and see it change.",
              ],
            ].map(([n, title, desc]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
          <div className="how-categories">
            {categories.map((c) => (
              <div
                key={c.face}
                className={c.face === face ? "category-focus" : ""}
              >
                <CategoryIcon face={c.face} />
                <div>
                  <strong>
                    {c.face} / {c.name}
                  </strong>
                  <p>{c.caption}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="privacy-note">
            All chapters are creative speculation, not evidence-based
            projections or personal advice. Distant futures can explore your
            legacy or an imagined self.
          </p>
          <button
            className="button primary"
            onClick={() => {
              setModal(null);
              begin();
            }}
          >
            FIND MY FIRST POSSIBILITY <ArrowRight size={17} />
          </button>
        </Modal>
      )}
      {modal === "settings" && (
        <Modal title="Make yourself at home." onClose={() => setModal(null)}>
          <button
            className="settings-row settings-link"
            onClick={() => setModal("install")}
          >
            <div>
              <strong>
                {pwa.installed ? "Your mobile app" : "Play on your home screen"}
              </strong>
              <p>
                {pwa.offlineReady
                  ? "Ready for offline play on this device."
                  : "Add 4FUTURE to your phone or desktop."}
              </p>
            </div>
            <Smartphone size={20} />
          </button>
          <div className="settings-row">
            <div>
              <strong>Sound effects</strong>
              <p>A subtle soundtrack for each roll.</p>
            </div>
            <button
              className={`toggle ${game.sound ? "on" : ""}`}
              role="switch"
              aria-checked={game.sound}
              aria-label="Sound effects"
              onClick={toggleSound}
            >
              <span />
            </button>
          </div>
          <button
            className="settings-row settings-link"
            onClick={() => setModal("profile")}
          >
            <div>
              <strong>Your future profile</strong>
              <p>
                {game.profile.name ||
                  "Optional, personal, and saved on this device."}
              </p>
            </div>
            <ChevronRight size={20} />
          </button>
          <div className="settings-row">
            <div>
              <strong>Story engine</strong>
              <p>
                {aiConfigured
                  ? "Optional AI stories can use your profile and choices."
                  : "Local imagination engine. No account or API key needed."}
              </p>
            </div>
            <span className="engine-badge">
              {game.aiConsent && aiConfigured ? "AI" : "LOCAL"}
            </span>
          </div>
          {aiConfigured && (
            <label className="consent-control">
              <input
                type="checkbox"
                checked={game.aiConsent}
                onChange={(e) =>
                  setGame((g) => ({ ...g, aiConsent: e.target.checked }))
                }
              />
              <span>
                I consent to sending my optional profile, story, and choices to
                this site’s AI service to generate a chapter. The service may
                process this data externally. I can turn this off anytime.
              </span>
            </label>
          )}
          <p className="privacy-note">
            <ShieldCheck size={17} />{" "}
            {game.aiConsent && aiConfigured
              ? "Your journey is stored in this browser. AI requests are enabled with your consent."
              : "Your profile and journey stay in this browser. No personal data is sent to an AI service."}
          </p>
          <div className="data-actions">
            <button
              className="button secondary"
              onClick={() => setModal("reset")}
            >
              <RotateCcw size={15} /> START NEW FUTURE
            </button>
            <button
              className="text-button danger"
              onClick={() => setModal("clear")}
            >
              CLEAR ALL STORED DATA
            </button>
          </div>
        </Modal>
      )}
      {modal === "install" && (
        <Modal
          title="A little future. In your pocket."
          onClose={() => setModal(null)}
        >
          <div className="install-intro">
            <img
              src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
              width="64"
              height="64"
              alt="4FUTURE app icon"
            />
            <p>Keep 4FUTURE on your home screen and open it like an app.</p>
          </div>
          <ol className="install-steps">
            <li>
              <strong>iPhone & iPad</strong>
              <p>
                Open this link in Safari. Open the Share menu, choose{" "}
                <b>Add to Home Screen</b>, enable <b>Open as Web App</b> if
                shown, then tap Add.
              </p>
            </li>
            <li>
              <strong>Android</strong>
              <p>
                Open this link in Chrome. In the browser menu, choose{" "}
                <b>Install app</b> or <b>Add to Home screen</b>. You can also
                use the install prompt when it appears.
              </p>
            </li>
            <li>
              <strong>Desktop</strong>
              <p>
                Use your browser’s install icon in the address bar when
                available, or keep playing in this tab.
              </p>
            </li>
          </ol>
          <p className="privacy-note">
            <ShieldCheck size={16} />
            {pwa.offlineReady
              ? "Offline play is ready. Your profile and timeline stay on this device."
              : "Visit online first to prepare offline play. Your profile and timeline are saved on this device, without cross-device sync."}
          </p>
          <button className="button primary" onClick={() => setModal(null)}>
            GOT IT <Check size={16} />
          </button>
        </Modal>
      )}
      {(modal === "reset" || modal === "clear") && (
        <Modal
          title={
            modal === "clear" ? "Leave no traces?" : "Begin a new possibility?"
          }
          onClose={() => setModal(null)}
        >
          <p className="muted modal-intro">
            {modal === "clear"
              ? "This clears your profile, saved futures, decisions, and preferences from this browser. This cannot be undone."
              : "This clears your saved timeline and decisions for a fresh simulation. Your optional profile and sound preference will be kept."}
          </p>
          <div className="actions">
            <button
              className="button primary"
              onClick={() => reset(modal === "clear")}
            >
              {modal === "clear" ? "CLEAR ALL DATA" : "START NEW FUTURE"}{" "}
              <ArrowRight size={16} />
            </button>
            <button className="button secondary" onClick={() => setModal(null)}>
              KEEP MY JOURNEY
            </button>
          </div>
        </Modal>
      )}
      {viewed && (
        <Modal title={viewed.title} wide onClose={() => setViewed(null)}>
          <div className="reveal-meta">
            <span>
              <CategoryIcon face={viewed.face} /> {viewed.face} /{" "}
              {categories[viewed.face - 1].name.toUpperCase()}
            </span>
            <span>YEAR {viewed.year}</span>
          </div>
          <p className="fiction-label">CREATIVE SPECULATION · SAVED CHAPTER</p>
          <ScenarioText scenario={viewed} />
          {viewed.decisions.length > 0 && (
            <div className="saved-decisions">
              <span className="eyebrow">THE CHOICES THAT BROUGHT YOU HERE</span>
              {viewed.decisions.map((d, i) => (
                <p key={i}>
                  <span>
                    {d.year} / {d.category}
                  </span>
                  {d.label}
                </p>
              ))}
            </div>
          )}
          <button className="button secondary" onClick={() => setViewed(null)}>
            BACK TO MY TIMELINE <ArrowRight size={16} />
          </button>
        </Modal>
      )}
    </div>
  );
}
function Step({ number, title }: { number: string; title: string }) {
  return (
    <div className="step-label">
      <span>{number}</span>
      <i />
      <span>{title}</span>
    </div>
  );
}
