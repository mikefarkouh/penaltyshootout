# La Copa De Penalties — Penalty Shootout

A playable penalty shootout prototype. Pick one of eight nations, get drawn against a random
rival, and settle it from twelve yards: best of five, then sudden death.

Built with React 19, TypeScript, Vite and Framer Motion. Every graphic — the stadium, crowd,
flags, goal net, players and ball — is drawn from scratch in SVG. There are no image assets and
no third-party artwork, and all match audio is synthesised with the Web Audio API.

## Running it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Serve the production build |
| `npm run lint` | Lint with oxlint |
| `npm run simulate` | Play 20,000 shootouts headlessly and report the balance |

## How the game plays

Each round you take a kick and then face one. Kicks alternate, you always go first, and the
shootout ends the moment one team cannot be caught.

**When you shoot**, click one of six targets in the goal — left, middle or right, high or low —
or press `1`–`6` across the goal (`Q`/`W`/`E` over `A`/`S`/`D` also mirrors the layout). Then stop
the power meter with a click or the spacebar. Power is a real trade-off: pace beats the keeper's
hands, but past roughly 80% the strike starts to drift into a neighbouring zone or off the frame
entirely. Below about 35% the keeper can hold almost anything. The green band on the meter is the
balance point.

**When you keep**, you commit to one of the six zones before the taker strikes. Guessing right is
not an automatic save — a well-struck ball into the top corner still beats you most of the time,
whereas a tame one down the middle rarely will. Picking the right side but the wrong height still
gives you about half a chance, because a full-length dive covers a lot of its own side of the
goal; going the wrong way leaves you with nothing.

Forwards convert more reliably than defenders, and a kick that would lose the shootout carries a
nerves penalty, so the order your takers step up in matters.

## Project layout

```
src/
  data/
    rosters.ts         Squad data for the eight nations
    appearance.ts      Skin tone palette for every drawn figure
  game/
    types.ts           Zones, attempts, match state
    engine.ts          Shot resolution, CPU decisions, shootout maths
    useShootout.ts     The state machine and its timeline
  scene/
    geometry.ts        Shared pitch coordinates and depth scaling
    Stadium.tsx        Sky, floodlights, crowd, hoardings, pitch
    Goal.tsx           Frame, three-dimensional net, net bulge
    Keeper.tsx         Parametric keeper rig with dives
    Kicker.tsx         Parametric taker rig with run-up and strike
    Ball.tsx           The ball
    PitchScene.tsx     Composes the scene and the ball flight
  ui/                  Scoreboard, power meter, flags, announcer
  screens/             Team select, matchup, shootout, result
  audio/sfx.ts         Synthesised crowd and match audio
scripts/simulate.ts    Headless balance and rules check
```

### The shot model

`resolveShot` in `src/game/engine.ts` is pure and takes the aim zone, the keeper's zone, power,
the taker and whether the kick is under pressure. It resolves in three steps: the shot may drift
to a neighbouring zone at high power, it may miss the frame, and then the keeper gets a chance
proportional to how close their guess was and how hard the ball was hit. It returns an impact
point in goal-mouth coordinates, which `src/scene/geometry.ts` maps to pixels — so the animation
always shows exactly what the rules decided.

Running `npm run simulate` plays 20,000 CPU-versus-CPU shootouts and asserts the rules hold
(kick counts stay level, sudden death only starts from a tied score, the winner really did score
more). It currently reports roughly 79% conversion and an even split between the two sides.

## Squad data

Player names come from the ESPN national-team squad pages, seeded into `src/data/rosters.ts`:

- [Brazil](https://www.espn.com/soccer/team/squad/_/id/205/brazil)
- [France](https://www.espn.com/soccer/team/squad/_/id/478/france)
- [Spain](https://www.espn.com/soccer/team/squad/_/id/164/spain)
- [Argentina](https://www.espn.com/soccer/team/squad/_/id/202/argentina)
- [England](https://www.espn.com/soccer/team/squad/_/id/448/england)
- [United States](https://www.espn.com/soccer/team/squad/_/id/660/united-states)
- [Canada](https://www.espn.com/soccer/team/squad/_/id/206/canada)
- [Bosnia-Herzegovina](https://www.espn.com/soccer/team/squad/_/id/452/bosnia-herzegovina)

Each team carries its goalkeepers, fifteen outfield players, brand colours, kit colours and its
source URL. `penaltyOrder` sorts takers the way a manager would — forwards first, defenders last.
This is a fictional game that happens to use real names; the flags and players are original
illustrations.

### How players are drawn

`src/data/appearance.ts` holds a four-step skin tone palette running light to deep, split so half
of it is in the darker range. A player's tone comes from a hash of their name, so every squad —
including any added later — reads as roughly half darker skinned with no per-player data to
maintain. Set `skin` on a `Player` to pin a specific tone instead.

## Accessibility notes

Targets are focusable and respond to `Enter`/`Space`, the goal can be aimed entirely from the
number keys, audio can be muted from any screen, and `prefers-reduced-motion` disables the
looping ambient animations.
# penaltyshootout
