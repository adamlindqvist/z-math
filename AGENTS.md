# AGENTS.md

## Project overview

Legend of Matte is a Swedish math adventure set in a three-dimensional game world. The game runs in the browser without a login or backend.

## Audience and platform

- **The game is intended for a five-year-old child.** Make all product, design, and gameplay decisions with this audience in mind.
- **The game will be played on an iPad.** Prioritize touch controls and Safari on iPad during development and verification.
- Use simple Swedish, short instructions, clear pictures, and recognizable symbols in the game. Do not assume the child can read independently.
- Make the next step clear and limit the number of choices presented at once. Give friendly feedback and allow retries without punishment or time pressure.
- Make buttons and other touch targets large, well spaced, and easy to hit. Essential actions must work without a keyboard, mouse, or hover.
- Preserve support for both portrait and landscape orientations on iPad. Account for screen safe areas and avoid controls or dialogs obscuring important gameplay.
- Preserve simultaneous use of the joystick and action button. Canceled touches, lost focus, and opening dialogs must not leave movement active.
- Keep keyboard controls as an additional option for development and desktop play.

## Technology and structure

The project uses React 19, TypeScript with strict type checking, Three.js, Tailwind CSS 4, and Vite 6. Icons come from Lucide. The 3D models are built from custom geometric shapes.

- `src/game/`: world, player, camera, input, collisions, interactions, and render loop. `Game.ts` coordinates the game; `entities/` contains game objects.
- `src/components/`: React UI for the HUD, dialogs, math questions, rewards, and touch controls.
- `src/store/gameStore.ts`: typed bridge between the game and React, including progress persistence.
- `src/math/`: question types and question generation.
- `src/App.tsx`: mounts the game and UI and displays graphics errors.
- `src/styles.css`: shared styles; components also use Tailwind classes.
- `tests/`: Vitest tests for math, persistence, collisions, and gameplay interactions.

## Development guidelines and key behavior

- The game is under development. Do not account for backward compatibility; breaking changes are acceptable.
- Follow the existing separation between Three.js gameplay logic and the React UI. React should update when game state changes, not on every frame.
- Preserve one-time rewards and safeguards against collecting the same coin more than once.
- Progress is saved in `localStorage` under the key `glantans-skatt-v1`, with save-version validation. Save format changes do not need to preserve existing saves. The game must remain playable when storage is unavailable or contains invalid data.
- Keep 3D rendering lightweight for iPad. Preserve the pixel-ratio cap and clean up listeners, the render loop, geometries, and materials when the game unmounts.
- Maintain understandable error handling when WebGL is unavailable or the graphics context is lost.
- Keep changes focused on the task and update the README when usage or project structure changes.
- Always use Tailwind for UI styling.

## Commands

```sh
npm install         # Install dependencies
npm run dev         # Start the development server with network access
npm test            # Run the Vitest tests
npm run build       # Type-check and build for production
npm run preview     # Preview the production build
```

## Verification

- Verify only what the change affects; stop when relevant checks pass. Expand checks only for failures or concrete regression risks.
- After code changes, run `npm run build` once and relevant existing tests. Add or adjust tests for changed game rules or error-prone behavior.
- For changes that affect visuals or browser interactions, complete implementation and automated checks first. Then ask in Swedish: "Vill du att jag gör de visuella testerna, eller vill du testa manuellt själv?" Wait for the user's answer before starting browser verification or declaring the task complete. If the user has already chosen a verification method for this task, follow that choice without asking again.
- If the user chooses manual testing, provide a short checklist of affected behavior and how to open the game, then wait for feedback. Treat confirmation such as "allt ser bra ut" as completed manual verification; do not run additional browser checks or ask for another confirmation.
- If the user chooses Codex testing, use only Codex's built-in browser (`iab`): inspect the affected view at landscape iPad size and capture one screenshot. Check portrait only for layout changes. If `iab` is unavailable, report the limitation and offer manual testing; do not use `agent-browser` or claim verification passed.
- For either verification method, cover only affected interactions.
- If verification reveals issues, fix them, rerun only affected automated checks, and repeat the relevant verification using the chosen method.
- After manual approval or successful Codex verification, finish any remaining work within the agreed scope, such as documentation updates and cleanup of temporary files created for the task. If further code changes affect verified behavior, verify that behavior again. End with a brief summary of changes and verification, clearly distinguishing user testing from Codex testing and reporting any unresolved limitations. Approval of testing alone does not request a commit, push, deployment, or task archival.
- Documentation-only changes need no build, tests, or browser checks. Summarize verification briefly without routine logs or repeated screenshots.
