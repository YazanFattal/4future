import test from "node:test";
import assert from "node:assert/strict";
import { Euler, Quaternion, Vector3 } from "three";
import {
  acceptScenario,
  categories,
  destination,
  emptyProfile,
  freshGame,
  generateLocal,
  parseGame,
  randomInt,
  validScenario,
  type Decision,
  type Face,
} from "./engine";
import { FACE_NORMALS, FACE_ROTATIONS, PIPS } from "./dice-math";

test("every landed orientation presents the generated face directly toward the player", () => {
  for (let n = 1; n <= 6; n++) {
    const face = n as Face;
    const normal = new Vector3(...FACE_NORMALS[face]).applyQuaternion(
      new Quaternion().setFromEuler(new Euler(...FACE_ROTATIONS[face])),
    );
    assert.ok(
      normal.distanceTo(new Vector3(0, 0, 1)) < 1e-10,
      `face ${face} must face the camera`,
    );
    assert.equal(PIPS[face].length, face);
    assert.equal(categories[face - 1].face, face);
  }
});
test("random generation rejects the biased tail before mapping a face", () => {
  let calls = 0;
  const result = randomInt(6, (a) => {
    a[0] = calls++ === 0 ? 0xffffffff : 5;
    return a;
  });
  assert.equal(calls, 2);
  assert.equal(result, 5);
  for (let n = 0; n < 6; n++)
    assert.equal(
      randomInt(6, (a) => {
        a[0] = n;
        return a;
      }),
      n,
    );
});
test("destination follows the calendar year instead of a fixed baseline", () => {
  assert.equal(destination(20, new Date(2026, 0, 1)), 2046);
  assert.equal(destination(100, new Date(2028, 11, 31)), 2128);
});
test("all categories and horizons produce complete, varied, valid chapters", () => {
  for (let face = 1; face <= 6; face++) {
    const variants = new Set<string>();
    for (const offset of [10, 20, 50, 100])
      for (let variant = 0; variant < 3; variant++) {
        const story = generateLocal(
          face as Face,
          new Date().getFullYear() + offset,
          emptyProfile(),
          [],
          null,
          variant,
        );
        assert.ok(validScenario(story));
        assert.equal(story.face, face);
        assert.equal(story.choices.length, 3);
        variants.add(story.title);
        if (offset === 100) assert.match(story.story, /fictional legacy/);
      }
    assert.equal(variants.size, 3);
  }
});
test("profile and earlier decisions persist through a revised and later chapter", () => {
  const profile = {
    name: "Alex",
    age: "25–34",
    field: "design",
    interests: "astronomy",
    ambition: "build a community",
  };
  const first = generateLocal(4, 2046, profile, [], null, 0);
  const decision: Decision = {
    ...first.choices[1],
    year: 2046,
    category: "Destiny",
  };
  const branch = generateLocal(4, 2046, profile, [decision], first, 0);
  assert.match(branch.story, /Alex/);
  assert.match(branch.story, /design/);
  assert.match(branch.story, /astronomy/);
  assert.match(branch.story, /build a community/);
  assert.ok(branch.story.includes(decision.label.toLowerCase()));
  assert.notEqual(branch.story, first.story);
  const later = generateLocal(1, 2076, profile, [decision], null, 0);
  assert.ok(later.story.includes(decision.label));
  assert.match(later.story, /2046/);
  assert.deepEqual(later.decisions, [decision]);
});
test("accepted chapters are deduplicated and survive a persistence round trip", () => {
  const scenario = generateLocal(2, 2046, emptyProfile(), [], null, 0);
  const game = acceptScenario({ ...freshGame(), current: scenario }, scenario);
  const again = acceptScenario(game, scenario);
  assert.equal(again.timeline.length, 1);
  assert.equal(again.current, null);
  assert.deepEqual(parseGame(JSON.stringify(again)), again);
});
test("invalid saves are rejected before they reach UI rendering", () => {
  assert.throws(() => parseGame("{broken"));
  assert.throws(() =>
    parseGame(JSON.stringify({ ...freshGame(), timeline: [{ face: 9 }] })),
  );
  assert.throws(() =>
    parseGame(JSON.stringify({ ...freshGame(), decisions: [null] })),
  );
  assert.throws(() =>
    parseGame(JSON.stringify({ ...freshGame(), profile: { name: 5 } })),
  );
  assert.deepEqual(parseGame(null), freshGame());
});
