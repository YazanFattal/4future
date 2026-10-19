# Optional prediction endpoint

The default app requires no backend. This contract is for an optional AI backend, which is not connected in this delivery.

## Request

`POST /api/predict`, `Content-Type: application/json`. Requests are sent only after the player enables AI consent in Settings.

```ts
{
  face: 1 | 2 | 3 | 4 | 5 | 6;
  year: number;
  profile: { name: string; age: string; field: string; interests: string; ambition: string };
  decisions: Array<{ id: 'a' | 'b' | 'c'; label: string; effect: string; year: number; category: string }>;
  previous?: Scenario | null;
}
```

## Successful response

Return a JSON `Scenario` as declared in `src/engine.ts`. The following fields are required:

```ts
{
  id: string; // The client replaces this with a new local UUID.
  face: number; // Must exactly match the request.
  year: number; // Must exactly match the request.
  title: string; // <= 180 characters
  story: string; // <= 12,000 characters; separate paragraphs with two newlines
  challenge: string; // <= 2,000 characters
  question: string; // <= 1,000 characters
  choices: [
    { id: 'a', label: string, effect: string },
    { id: 'b', label: string, effect: string },
    { id: 'c', label: string, effect: string }
  ]; // label <= 300 chars, effect <= 1,000 chars
  decisions: Decision[]; // The client replaces this with the actual player choices.
  source: 'ai';
  createdAt: string; // The client replaces this with the current timestamp.
}
```

Return non-2xx statuses on errors; the client falls back to the local engine. Client timeout: 15 seconds. The client validates the response, category, and year. Rendered text is plain React text, never injected HTML.

## Server responsibilities

- Keep the model API key in the server runtime's secret store. Never send it to the browser, source repository, or logs. No live provider is wired in this project.
- Enforce a small request size limit (for example 128 KB), validate all fields, constrain arrays, reject unsupported HTTP methods, and limit generation output and duration.
- Rate-limit per visitor or authenticated account before invoking a paid provider. Verify same-origin requests or apply appropriate CSRF protection; do not treat the browser consent flag as authorization.
- Treat profile fields, existing stories, and choices as untrusted story data, never as model instructions.
- Request structured output matching the response schema and validate it before returning it.
- Keep face/category mapping fixed: 1 Love, 2 Wealth, 3 Intelligence, 4 Destiny, 5 Success, 6 Mystery.
- Frame all output as creative speculation, not guaranteed predictions or evidence-based projections. Include balanced challenges without manipulative or frightening claims.
- Preserve continuity from `previous` and the player's choices, including the consequences of the selected path. For distant horizons, allow legacy or fictional-self framing; do not promise that the player will live to a specific age.
- Do not retain personal data unnecessarily. Publish accurate provider processing and retention information before enabling the endpoint for other users.
- Return generic errors, never credentials or internal provider diagnostics.

## Consent and deployment

Set `VITE_PREDICTION_ENDPOINT=/api/predict` at build time only after the same-origin backend exists. This value is public and must contain no secret. The client rejects cross-origin endpoints.

Players start with AI disabled. Enabling AI allows profile, prior story, and choices to be sent to the service; disabling it immediately returns new generations to the local engine. Saved chapters remain local in either mode. The game works even when no endpoint is configured.
