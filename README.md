# Gläntans skatt

Ett svenskt matteäventyr för barn, byggt med React, TypeScript, Three.js, Tailwind CSS och Vite. Alla modeller är egna geometriska former.

## Starta

```sh
npm install
npm run dev
```

Öppna adressen som visas. För iPad: anslut till samma nätverk och öppna datorns nätverksadress på port 5173 i Safari. Ingen inloggning krävs.

```sh
npm test
npm run build
npm run preview
```

## Spela

- WASD eller piltangenter: gå. E eller Space: prata/öppna. Escape: pausa.
- På touchskärm: dra joysticken och tryck på actionknappen.
- Prata med Maja, följ mynten och lös kistans additionsfråga. Fel svar kostar inget.
- Kistan ger fem mynt en gång; fyra mynt finns längs stigen.
- Framsteg sparas automatiskt i webbläsaren. Pausmenyn låter dig börja om. Lagring delas inte mellan enheter och kan rensas av webbläsaren.

## Struktur

`src/game/` äger värld, kamera, input, kollisionssystem, modeller och renderloop. `src/components/` äger UI och touchkontroller. `src/store/gameStore.ts` är den typade bryggan mellan dem och sparar framsteg. React uppdateras bara när spelstatus ändras, aldrig varje bildruta. `src/math/` innehåller frågekontrakt och additionsgenerator.

V1 omfattar en glänta, en NPC och en skattkista. Fler områden, matematiktyper, fiender och föremål kan läggas till senare. Kräver en modern webbläsare med WebGL. Grafikkontextfel visas med möjlighet att ladda om.

## Verifiering

Automatiska tester täcker frågegenerering, sparning, engångsbelöning, kollisioner, tangentbordsrörelse, multitouch och hela vägen till kistan. Gränssnittet har granskats i desktopformat samt stående och liggande iPad-storlek. Fysisk iPad/Safari och faktisk bildfrekvens på enheten behöver fortfarande provas.
