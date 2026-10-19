export type Face = 1 | 2 | 3 | 4 | 5 | 6;
export type Jump = 10 | 20 | 50 | 100;
export type Profile = {
  name: string;
  age: string;
  field: string;
  interests: string;
  ambition: string;
};
export type Decision = {
  id: string;
  label: string;
  effect: string;
  year: number;
  category: string;
};
export type Scenario = {
  id: string;
  year: number;
  face: Face;
  title: string;
  story: string;
  challenge: string;
  question: string;
  choices: { id: string; label: string; effect: string }[];
  decisions: Decision[];
  source: "local" | "ai";
  createdAt: string;
};
export type Game = {
  version: 1;
  jump: Jump;
  profile: Profile;
  timeline: Scenario[];
  decisions: Decision[];
  current: Scenario | null;
  sound: boolean;
  aiConsent: boolean;
};
export const categories = [
  {
    face: 1,
    name: "Love",
    caption: "The connections that find you",
    word: "CONNECTION",
    icon: "heart",
  },
  {
    face: 2,
    name: "Wealth",
    caption: "The value you create",
    word: "OPPORTUNITY",
    icon: "gem",
  },
  {
    face: 3,
    name: "Intelligence",
    caption: "The mind you become",
    word: "DISCOVERY",
    icon: "brain",
  },
  {
    face: 4,
    name: "Destiny",
    caption: "The paths you never planned",
    word: "POSSIBILITY",
    icon: "orbit",
  },
  {
    face: 5,
    name: "Success",
    caption: "The mark you leave",
    word: "PURPOSE",
    icon: "trophy",
  },
  {
    face: 6,
    name: "Mystery",
    caption: "The beauty of the unknown",
    word: "THE UNKNOWN",
    icon: "sparkles",
  },
] as const;
export const emptyProfile = (): Profile => ({
  name: "",
  age: "",
  field: "",
  interests: "",
  ambition: "",
});
export const freshGame = (): Game => ({
  version: 1,
  jump: 20,
  profile: emptyProfile(),
  timeline: [],
  decisions: [],
  current: null,
  sound: false,
  aiConsent: false,
});
export const destination = (jump: Jump, now = new Date()) =>
  now.getFullYear() + jump;

/** Rejection sampling avoids modulo bias, including for all six die faces. */
export function randomInt(
  max: number,
  fill: (a: Uint32Array) => Uint32Array = (a) => crypto.getRandomValues(a),
): number {
  if (!Number.isInteger(max) || max < 1 || max > 0xffffffff)
    throw new Error("Invalid random range");
  const range = 0x100000000,
    limit = range - (range % max);
  const data = new Uint32Array(1);
  do {
    fill(data);
  } while (data[0] >= limit);
  return data[0] % max;
}
export const rollFace = (): Face => (randomInt(6) + 1) as Face;

type Seed = {
  title: string;
  scene: string;
  challenge: string;
  question: string;
  options: [string, string, string];
};
const seeds: Record<Face, Seed[]> = {
  1: [
    {
      title: "A familiar kind of unknown.",
      scene:
        "An ordinary invitation could introduce you to someone who sees the world a little differently. A conversation that begins with a shared curiosity grows into a connection built on showing up, again and again.",
      challenge:
        "Closeness may ask you to make room in a life that already feels full. Being understood also means letting yourself be seen.",
      question:
        "A meaningful connection asks for more of your time. What do you choose?",
      options: [
        "Make space for the connection",
        "Protect your own pace",
        "Build something together",
      ],
    },
    {
      title: "The people who feel like home.",
      scene:
        "You may find yourself around a table with a chosen family you could never have predicted. The life you built looks different from the plan, but the laughter feels wonderfully familiar.",
      challenge:
        "Distance and changing priorities could test these bonds. A small, consistent ritual might matter more than a grand gesture.",
      question:
        "Your closest people now live in different places. How do you reconnect?",
      options: [
        "Make the journey to them",
        "Create a regular shared ritual",
        "Bring everyone somewhere new",
      ],
    },
    {
      title: "A second first conversation.",
      scene:
        "A message from someone you once knew could reopen an unfinished conversation. Neither of you is quite who you were. There may be room for a new kind of friendship, on terms you choose now.",
      challenge:
        "Nostalgia can blur the present. You may need to listen to who someone has become, rather than who you remember.",
      question: "An old connection reaches out. Where do you begin?",
      options: [
        "Meet with an open mind",
        "Take it slowly, one message at a time",
        "Let the past inspire a new connection",
      ],
    },
  ],
  2: [
    {
      title: "The idea you almost left behind.",
      scene:
        "An idea you once put aside could become a small venture with unexpected reach. Its value comes from solving an everyday problem that others overlooked, and from the people who trust how you work.",
      challenge:
        "Growth might arrive faster than your capacity. You could have to choose between expanding and protecting the quality that made the idea matter.",
      question:
        "Your small venture has a chance to grow. Which path feels right?",
      options: [
        "Grow with a trusted partner",
        "Keep it small and sustainable",
        "Share the idea with your community",
      ],
    },
    {
      title: "A different kind of abundance.",
      scene:
        "You may redefine wealth as the freedom to choose your days. A series of modest, patient decisions could create space for work you enjoy and people you want to spend time with.",
      challenge:
        "That freedom may involve saying no to a prestigious opportunity. Enough can be a difficult word to define for yourself.",
      question:
        "A lucrative opportunity would take away your free time. What do you value?",
      options: [
        "Try it for a defined season",
        "Choose flexibility and time",
        "Negotiate a different arrangement",
      ],
    },
    {
      title: "Value in an unexpected place.",
      scene:
        "A skill you developed simply because it interested you could turn into a useful source of income. An unexpected collaborator helps you see its value through someone else’s eyes.",
      challenge:
        "Turning an interest into work might change your relationship with it. Clear boundaries could keep the original joy alive.",
      question:
        "Someone wants to turn your interest into a business. How do you respond?",
      options: [
        "Test the idea on a small scale",
        "Keep your interest personal",
        "Teach the skill instead",
      ],
    },
  ],
  3: [
    {
      title: "The beginner you become.",
      scene:
        "You could be learning a subject that does not yet have a familiar name. What begins as a small question leads to a new way of seeing the world, alongside people from entirely different backgrounds.",
      challenge:
        "Starting again may feel uncomfortable when you are used to being capable. Curiosity could take you further than the need to be right.",
      question:
        "A new field invites you to become a beginner again. How do you learn?",
      options: [
        "Join an immersive learning program",
        "Explore through a small personal project",
        "Find a mentor and a community",
      ],
    },
    {
      title: "When two worlds meet.",
      scene:
        "Two seemingly unrelated interests could connect in your mind. The result might be a tool, a piece of art, or a way of explaining something that once felt impossible to understand.",
      challenge:
        "Others may not immediately see what you see. Translating your insight into something useful could be the real creative work.",
      question: "You have an unconventional idea. How do you develop it?",
      options: [
        "Build a first working version",
        "Explore the underlying question",
        "Invite someone to challenge your thinking",
      ],
    },
    {
      title: "Knowledge worth passing on.",
      scene:
        "Someone younger could ask you a question that changes how you understand your own experience. Teaching what you know opens a door to learning something you had never considered.",
      challenge:
        "Your old methods might no longer fit the world around you. Sharing knowledge may also mean being willing to revise it.",
      question:
        "Your knowledge could help a new generation. What do you create?",
      options: [
        "Start a small mentoring circle",
        "Write a guide anyone can use",
        "Learn alongside your students",
      ],
    },
  ],
  4: [
    {
      title: "Somewhere you never planned.",
      scene:
        "An invitation could take you to a city you once knew only from a map. A temporary visit becomes a turning point, opening a quieter, unexpected version of your life.",
      challenge:
        "A new beginning can come with practical uncertainty. You might need to build a support network before deciding where to put down roots.",
      question:
        "An opportunity invites you to live somewhere new. What do you do?",
      options: [
        "Accept the invitation",
        "Stay and deepen your roots",
        "Try a temporary move first",
      ],
    },
    {
      title: "The beautifully unplanned turn.",
      scene:
        "A detour on an ordinary day could introduce a new possibility. What seems inconvenient at first gives you time to notice something you have been passing by for years.",
      challenge:
        "Recognizing an opening does not tell you whether to take it. You may have to decide with incomplete information.",
      question:
        "An unexpected path opens beside your current one. Which way do you go?",
      options: [
        "Follow the new possibility",
        "Continue with renewed intention",
        "Explore without committing yet",
      ],
    },
    {
      title: "A quieter compass.",
      scene:
        "You may discover that the place where you feel most yourself is different from the place you expected to reach. A small daily practice gradually changes the shape of your life.",
      challenge:
        "Other people might still measure your progress using your old goals. Giving yourself permission to change could take patience.",
      question: "Your priorities have shifted. What becomes your next step?",
      options: [
        "Make room for the new direction",
        "Find meaning in your existing path",
        "Take a season to explore",
      ],
    },
  ],
  5: [
    {
      title: "A mark that feels like yours.",
      scene:
        "A project you cared about could finally reach the people it was meant for. The most meaningful moment might be a quiet message from someone whose day became better because of your work.",
      challenge:
        "Recognition can bring expectations that pull you away from your original purpose. Success may require choosing which requests to decline.",
      question:
        "Your work is receiving attention. How do you use the momentum?",
      options: [
        "Take on a bigger challenge",
        "Refine the work you care about",
        "Help someone else find their start",
      ],
    },
    {
      title: "The milestone nobody saw.",
      scene:
        "You could reach a goal that once seemed out of reach, without a stage or an audience. Its meaning comes from knowing how much patience, practice, and help went into getting there.",
      challenge:
        "After the celebration, there may be a surprising sense of uncertainty. You do not have to replace every finished goal immediately.",
      question: "You have reached a meaningful milestone. What comes next?",
      options: [
        "Set a new ambitious goal",
        "Pause and enjoy what you built",
        "Share the lessons of the journey",
      ],
    },
    {
      title: "The courage to redefine it.",
      scene:
        "An impressive title could lose its appeal just as a smaller, more personal ambition comes into focus. You may build a version of success that fits your values more closely.",
      challenge:
        "Changing direction might mean giving up familiar validation. You could need a different way to recognize your own progress.",
      question:
        "Two versions of success are in front of you. What guides your decision?",
      options: [
        "Pursue a wider impact",
        "Choose work that fits your daily life",
        "Combine your strengths in a new role",
      ],
    },
  ],
  6: [
    {
      title: "A message from the possible.",
      scene:
        "Imagine an archive that lets people explore imagined versions of lives they never lived. One story feels strangely close to your own, and leaves you with a question you cannot quite put down.",
      challenge:
        "A compelling simulation is still a story. Its value may lie in the questions it helps you ask about the life you actually have.",
      question:
        "An imagined alternative life intrigues you. What do you take from it?",
      options: [
        "Explore the unfamiliar possibility",
        "Reconnect with what matters now",
        "Create your own version of the story",
      ],
    },
    {
      title: "Under an unfamiliar sky.",
      scene:
        "In one speculative future, a new kind of observatory lets ordinary people help explore distant worlds. Your small contribution becomes part of a question much larger than any one person.",
      challenge:
        "The discovery might remain incomplete. You may need to find meaning in participating, without knowing how the story ends.",
      question:
        "You can join a project exploring the unknown. How do you contribute?",
      options: [
        "Learn the tools and take part",
        "Help explain it to others",
        "Ask a question nobody has tried yet",
      ],
    },
    {
      title: "The museum of tomorrow.",
      scene:
        "Imagine walking through an exhibition of everyday objects from your own past. A thing you once took for granted has become a puzzle, and your memory helps someone understand what it meant.",
      challenge:
        "Memory is selective, and the world rarely changes in a straight line. Your account might sit beside other, equally human perspectives.",
      question: "A future archive wants your story. What would you preserve?",
      options: [
        "An ordinary moment that mattered",
        "A lesson learned through change",
        "A question for the next generation",
      ],
    },
  ],
};

export function generateLocal(
  face: Face,
  year: number,
  profile: Profile,
  decisions: Decision[],
  previous?: Scenario | null,
  variant = randomInt(3),
): Scenario {
  const seed = seeds[face][variant % 3];
  const jump = year - new Date().getFullYear();
  const horizon =
    jump >= 100
      ? "A century ahead, this is a fictional legacy chapter: imagine how your values might live on through people, projects, or an imagined future self."
      : jump >= 50
        ? "Half a century ahead, imagine a later-life or legacy chapter shaped by the things you choose to nurture today."
        : jump >= 20
          ? "Two decades ahead, familiar parts of your life may have taken an unexpected shape."
          : "A decade ahead, small choices may have grown into something you can finally see.";
  const personal = [
    profile.name ? `${profile.name}, this is one possible chapter.` : "",
    profile.field
      ? `Your experience in ${profile.field} could give this story a distinctive starting point.`
      : "",
    profile.interests
      ? `An interest in ${profile.interests} might become the thread that brings people and ideas together.`
      : "",
    profile.ambition
      ? `Your ambition — “${profile.ambition}” — remains a compass, even if its meaning changes.`
      : "",
    profile.age && jump < 50
      ? `From where you are now (${profile.age}), there is room for your priorities to evolve.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  const last = decisions.at(-1);
  const continuity = last
    ? previous && previous.face === face && previous.year === year
      ? `The possibility in “${previous.title}” now takes a different turn. You chose to ${last.label.toLowerCase()}. ${last.effect}`
      : `Your earlier choice in ${last.year} — “${last.label}” — echoes into this chapter. ${last.effect}`
    : "";
  const scene =
    previous && previous.face === face && previous.year === year && last
      ? `The situation remains open, but your priorities have shifted. ${last.id === "a" ? "Taking a step outward could introduce new collaborators and a faster pace. You may gain momentum while learning where your limits are." : last.id === "b" ? "A more deliberate pace could give you space to notice what is already working. Some opportunities may pass, while the foundations you care about grow stronger." : "An experimental path could reveal an option that neither of the original choices offered. A small trial may teach you more than a perfect plan."}`
      : seed.scene;
  const title =
    previous && last
      ? ([
          "A door you chose to open.",
          "A future at your own pace.",
          "A third possibility.",
        ][["a", "b", "c"].indexOf(last.id)] ?? seed.title)
      : seed.title;
  const effects = [
    "You made room for exploration, accepting some uncertainty in exchange for a new experience.",
    "You chose a deliberate pace, giving stability and existing commitments more weight.",
    "You chose to experiment, looking for a path that combines curiosity with flexibility.",
  ];
  return {
    id: crypto.randomUUID(),
    face,
    year,
    title,
    story: [horizon, personal, continuity, scene].filter(Boolean).join("\n\n"),
    challenge:
      previous && last
        ? `${seed.challenge} Your latest choice creates a different balance of opportunity, effort, and uncertainty.`
        : seed.challenge,
    question: seed.question,
    choices: seed.options.map((label, i) => ({
      id: ["a", "b", "c"][i],
      label,
      effect: effects[i],
    })),
    decisions: [...decisions],
    source: "local",
    createdAt: new Date().toISOString(),
  };
}

export const STORAGE_KEY = "4future.game.v1";
const shortText = (value: unknown, max = 300) =>
  typeof value === "string" && value.length <= max;
function validDecision(value: unknown): value is Decision {
  if (!value || typeof value !== "object") return false;
  const d = value as Decision;
  return (
    ["a", "b", "c"].includes(d.id) &&
    shortText(d.label) &&
    shortText(d.effect, 1000) &&
    Number.isInteger(d.year) &&
    shortText(d.category)
  );
}
export function validScenario(value: unknown): value is Scenario {
  if (!value || typeof value !== "object") return false;
  const s = value as Scenario;
  return (
    shortText(s.id) &&
    [1, 2, 3, 4, 5, 6].includes(s.face) &&
    Number.isInteger(s.year) &&
    s.year >= 2000 &&
    s.year < 10000 &&
    shortText(s.title, 180) &&
    shortText(s.story, 12000) &&
    shortText(s.challenge, 2000) &&
    shortText(s.question, 1000) &&
    Array.isArray(s.choices) &&
    s.choices.length === 3 &&
    s.choices.every(
      (c, i) =>
        c &&
        c.id === ["a", "b", "c"][i] &&
        shortText(c.label) &&
        shortText(c.effect, 1000),
    ) &&
    Array.isArray(s.decisions) &&
    s.decisions.length <= 200 &&
    s.decisions.every(validDecision) &&
    ["local", "ai"].includes(s.source) &&
    shortText(s.createdAt)
  );
}
export function parseGame(raw: string | null): Game {
  if (!raw) return freshGame();
  const game = JSON.parse(raw) as Game;
  if (
    game?.version !== 1 ||
    ![10, 20, 50, 100].includes(game.jump) ||
    !game.profile ||
    !Object.keys(emptyProfile()).every((k) =>
      shortText(game.profile[k as keyof Profile], 200),
    ) ||
    !Array.isArray(game.timeline) ||
    game.timeline.length > 200 ||
    !game.timeline.every(validScenario) ||
    !Array.isArray(game.decisions) ||
    game.decisions.length > 200 ||
    !game.decisions.every(validDecision) ||
    (game.current !== null && !validScenario(game.current)) ||
    typeof game.sound !== "boolean" ||
    typeof game.aiConsent !== "boolean"
  )
    throw new Error("Saved journey could not be read.");
  return game;
}
export function acceptScenario(game: Game, scenario: Scenario): Game {
  return {
    ...game,
    current: null,
    timeline: game.timeline.some((s) => s.id === scenario.id)
      ? game.timeline
      : [...game.timeline, scenario].slice(-200),
  };
}

/** Optional same-origin endpoint. No vendor credentials or provider SDK enter this bundle. */
export async function getPrediction(
  input: {
    face: Face;
    year: number;
    profile: Profile;
    decisions: Decision[];
    previous?: Scenario | null;
  },
  consent: boolean,
): Promise<{ scenario: Scenario; fallback: boolean }> {
  const endpoint: string | undefined = import.meta.env.VITE_PREDICTION_ENDPOINT;
  if (!endpoint || !consent)
    return {
      scenario: generateLocal(
        input.face,
        input.year,
        input.profile,
        input.decisions,
        input.previous,
      ),
      fallback: false,
    };
  try {
    const url = new URL(endpoint, window.location.origin);
    if (url.origin !== window.location.origin)
      throw new Error("Prediction endpoint must be same-origin");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(15000),
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error("Prediction service unavailable");
    const result: unknown = await response.json();
    if (
      !validScenario(result) ||
      result.face !== input.face ||
      result.year !== input.year
    )
      throw new Error("Invalid prediction response");
    return {
      scenario: {
        ...result,
        source: "ai",
        decisions: [...input.decisions],
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      },
      fallback: false,
    };
  } catch {
    return {
      scenario: generateLocal(
        input.face,
        input.year,
        input.profile,
        input.decisions,
        input.previous,
      ),
      fallback: true,
    };
  }
}
