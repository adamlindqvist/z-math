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
- Prata med Zelda, följ Rupees längs stigen och lös kistans tre additionsfrågor. Fel svar kostar inget.
- Kistan ger fem Rupees en gång; fyra Rupees finns längs stigen.
- Gå till stenporten norr om stigen för att besöka Mosstemplet. Ingången är öppen direkt. Gå in i den mörka stjärnportalen så teleporteras du automatiskt; ingen knapp behövs.
- I Ljusporten tänder fem räknefrågor varsin lampa. Räkna bilderna och välj bland tre svar med siffror och prickar.
- I Stensalen: matcha sol, löv och måne. Gå mot stenen från vänster eller höger för att knuffa den längs spåret. Pilen visar riktningen. Ingen actionknapp behövs. Stenar på rätt symbol kan flyttas igen tills alla tre ligger rätt; då låses alla och porten öppnas. Knappen med återställningspilen börjar om med den olösta stengåtan.
- I Skattkammaren öppnar fem bildadditioner (summa högst fem) kistan och ger fem Rupees en gång. Gå genom porten så teleporteras du tillbaka till gläntan. Den låga porten bakom dig leder alltid tillbaka.
- Rätt mattesvar och stenknuffar i templet sparas direkt. Efter omladdning börjar du vid det sparade rummets säkra startpunkt. Lösta rum förblir lösta tills du börjar om med hela äventyret.
- Framsteg sparas automatiskt i webbläsaren. Pausmenyn låter dig börja om. Lagring delas inte mellan enheter och kan rensas av webbläsaren.

## Struktur

`src/game/` äger värld, kamera, input, kollisionssystem, modeller och renderloop. `src/components/` äger UI och touchkontroller. `src/store/gameStore.ts` är den typade bryggan mellan dem och sparar framsteg. React uppdateras bara när spelstatus ändras, aldrig varje bildruta. `src/math/` innehåller frågekontrakt samt generatorer för addition och bildfrågor.

## Fler tempel

`src/game/Area.ts` beskriver ett område med startpunkt, kamera, kollisioner, interaktioner, automatiska passager, stenknuffar och resursstädning. `Game` byter mellan gläntan och ett tempelrum i taget och frigör det gamla områdets geometrier och material.

Lägg till ett objekt i `DUNGEONS` i `src/game/dungeons/definitions.ts` för ett nytt tempel. Ange ett unikt ID, en fri ingångsposition i gläntan och en ordnad lista av rum med unika ID:n. Varje rum använder antingen en matteutmaning (bildräkning eller addition, antal rätt och belöning) eller stenar med symbol, spårposition och mål. Föregående rum måste vara löst innan nästa kan öppnas. Den sista porten leder till gläntan.

`DungeonArea` bygger rum, portar, lampor, stenar och kistor från definitionerna. Stenspåren använder fem fasta x-lägen; lämna minst 2,6 enheter mellan spåren och fria gångvägar vid sidorna. Ett mål ska ha samma golvsymbol som stenen och ligga utanför startläget 2. Testa framkomlighet och båda skärmorienteringarna för nya layouter. Nya typer av pussel kräver en ny regel och motsvarande byggdel; ingen baneditor ingår.

Sparformatet är version 3 under nyckeln `glantans-skatt-v1`; äldre och ogiltiga sparningar börjar om. Ändras definitionernas sparade struktur behöver även sparversionen ändras. Spelet fungerar utan åtkomst till lagring. Kräver en webbläsare med WebGL; grafikfel visas med möjlighet att ladda om.

## Verifiering

Automatiska tester täcker frågegenerering, sparning efter enstaka svar och knuffar, engångsbelöningar, rumsordning, stenregler, kollisioner, tangentbordsrörelse, multitouch, fokusförlust och vägen till båda skatterna. Mosstemplet har granskats i Chrome med simulerade iPad-format 820 × 1180 och 1180 × 820. Automatisk passage genom portarna, stenknuffar genom fingerdrag och vägen till tempelskatten har också kontrollerats i samma webbläsare, inklusive omladdning efter belöningen. Fysisk iPad/Safari och faktisk bildfrekvens på enheten behöver fortfarande provas.
