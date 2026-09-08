# Legend of Matte

Ett svenskt vibe-kodat matteäventyr för barn, byggt med React, TypeScript, Three.js, Tailwind CSS och Vite. Alla modeller är egna geometriska former.

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

## Publicering

Varje push till `main` bygger och publicerar spelet till GitHub Pages. Aktivera först **Settings → Pages → Build and deployment → Source: GitHub Actions** i GitHub-repot. Spelet blir sedan tillgängligt på `https://adamlindqvist.github.io/z-math/`.

## Spela

- WASD eller piltangenter: gå. E eller Space: prata/öppna. Escape: pausa.
- På touchskärm: dra joysticken och tryck på actionknappen.
- Prata med Zelda, följ Rupees längs stigen och lös kistans tre additionsfrågor. Fel svar kostar inget.
- Kistan ger fem Rupees en gång; fyra Rupees finns längs stigen.
- Gå till stenporten norr om stigen för att besöka Vattentemplet. Ingången är öppen direkt. Gå in i den blå vattenportalen så teleporteras du automatiskt; ingen knapp behövs.
- Vattentemplet har aqua-färgade golv, blågrå sten, turkosa väggband, vågor, droppar och grunda vattenkanaler. Vattnet är ofarlig utsmyckning och påverkar inte rörelse eller pussel. Det interna ID:t `moss` och sparformatet är oförändrade.
- I Ljusporten tänder fem räknefrågor varsin lampa. Räkna bilderna och välj bland tre svar med siffror och prickar.
- I Stensalen: matcha sol, löv och måne. Gå mot stenen från vänster eller höger för att knuffa den längs spåret. Pilen visar riktningen. Ingen actionknapp behövs. Stenar på rätt symbol kan flyttas igen tills alla tre ligger rätt; då låses alla och porten öppnas. Knappen med återställningspilen börjar om med den olösta stengåtan.
- I Skattkammaren öppnar fem bildadditioner (summa högst fem) kistan och ger fem Rupees en gång. Gå genom porten så teleporteras du tillbaka till gläntan. Den låga porten bakom dig leder alltid tillbaka.
- Rätt mattesvar och stenknuffar i templet sparas direkt. Efter omladdning börjar du vid det sparade rummets säkra startpunkt. Lösta rum förblir lösta tills du börjar om med hela äventyret.
- Följ stigen söderut till träbron. Bokoblin vaktar bron tills du har fått både svärd och sköld i Vattentemplet. Tryck på **Skräm iväg** så springer Bokoblin undan och bron öppnas permanent. Den första kistan behöver inte vara öppnad.
- Gå över bron till södra gläntan. Den nya kistan har tre additionsfrågor och ger fem ädelstenar en gång, oberoende av den första kistan. Fel svar kostar inget; stänger du ett pågående kistquiz börjar dess tre frågor om nästa gång.
- Brons upplåsning och båda öppnade kistorna sparas. Äldre sparningar börjar om med sparversion 5. Efter omladdning i gläntan börjar spelaren vid den ursprungliga startpunkten.
- Framsteg sparas automatiskt i webbläsaren. Pausmenyn låter dig börja om. Lagring delas inte mellan enheter och kan rensas av webbläsaren.

## Struktur

`src/game/` äger värld, kamera, input, kollisionssystem, modeller och renderloop. `src/components/` äger UI och touchkontroller. `src/store/gameStore.ts` är den typade bryggan mellan dem och sparar framsteg. React uppdateras bara när spelstatus ändras, aldrig varje bildruta. `src/math/` innehåller frågekontrakt samt generatorer för addition och bildfrågor.

## Fler tempel

`src/game/Area.ts` beskriver ett område med startpunkt, kamera, kollisioner, interaktioner, automatiska passager, stenknuffar och resursstädning. `Game` byter mellan gläntan och ett tempelrum i taget och frigör det gamla områdets geometrier och material.

Lägg till ett objekt i `DUNGEONS` i `src/game/dungeons/definitions.ts` för ett nytt tempel. Ange ett unikt ID, en fri ingångsposition i gläntan och en ordnad lista av rum med unika ID:n. Varje rum använder antingen en matteutmaning (bildräkning eller addition, antal rätt och belöning) eller stenar med symbol, spårposition och mål. Föregående rum måste vara löst innan nästa kan öppnas. Den sista porten leder till gläntan.

`DungeonArea` bygger rum, portar, lampor, stenar och kistor från definitionerna. Stenspåren använder fem fasta x-lägen; lämna minst 2,6 enheter mellan spåren och fria gångvägar vid sidorna. Ett mål ska ha samma golvsymbol som stenen och ligga utanför startläget 2. Testa framkomlighet och båda skärmorienteringarna för nya layouter. Nya typer av pussel kräver en ny regel och motsvarande byggdel; ingen baneditor ingår.

Sparformatet är version 5 under nyckeln `glantans-skatt-v1`; äldre och ogiltiga sparningar börjar om. Ändras definitionernas sparade struktur behöver även sparversionen ändras. Spelet fungerar utan åtkomst till lagring. Kräver en webbläsare med WebGL; grafikfel visas med möjlighet att ladda om.

## Verifiering

Automatiska tester täcker frågegenerering, sparning efter enstaka svar och knuffar, engångsbelöningar, rumsordning, stenregler, kollisioner, tangentbordsrörelse, multitouch, fokusförlust och vägen till båda skatterna. Vattentemplets entré, alla tre rum, mattelås och belöningsdialog har bildgranskats manuellt i Chrome med simulerade iPad-format 820 × 1180 och 1180 × 820 (2026-09-08). En automatiserad genomspelning verifierade båda mattelåsen, fem stenknuffar, portpassager, omladdning efter lampor, stenar och belöning, återgång till gläntan samt återbesök utan dubbel belöning. Testet använde spelmotorns rörelseinmatning och tangentbord, pekningar på svarsknappar och testpositionering inför vissa knuffar och passager. Avbruten pekning, paus och dialogöppning med nedtryckt styrspak kontrollerades också; den samtidiga handlingsknappen aktiverades med ett automatiserat klick. Detta är en simulering, inte en fullständig manuell tvåfingerkontroll eller ett prestandatest på fysisk iPad/Safari. Dessa enhetskontroller återstår.

### Barnanpassat gränssnitt

Gränssnittet använder Tailwind med gemensamma temafärger, stora dialoger, korta instruktioner och SVG-bilder. Joysticken är 160 pixlar bred och kan användas samtidigt som handlingsknappen. Stjärneffekter följer inställningen för minskad rörelse. Uppläsning ingår ännu inte.

Den nya layouten har kontrollerats i Brave/Chromium med simulerad touch i 768 × 1024, 1024 × 768, 820 × 1180 och 1180 × 820. Kontrollerna omfattade NPC-, kist-, paus- och återställningsdialoger, matte, återförsök, rätt svar, belöning, tempelfrågor och stenhjälp. Dialogknapparna rymdes utan rullning i dessa format. Kistbelöningen bevarades efter omladdning. Automatiska tester täcker spelvägen och touchavbrott. Detta är inte ett prestandatest eller ett test på fysisk iPad/Safari.

### Väska och utrustning

Tryck på **Väska** för att se dina föremål. Spelet pausas medan väskan är öppen. Stäng med knappen eller Escape. Gröna kläder finns från start. Vattentemplets sista mattelås ger fem ädelstenar, ett svärd och en sköld en gång. Svärdet och skölden tas på automatiskt och kan sedan tas av och på i väskan. De syns på figuren. När du äger båda kan du skrämma iväg Bokoblin vid bron; de behöver inte vara påtagna. Strid ingår inte.

Föremålsregistret i `src/items/definitions.ts` definierar namn, bildsymboler och kategorier. Spelstatus sparar ägda föremål och utrustning. Nya belöningar anges med `items` i utmaningsdefinitionerna; `grantItems` kan användas av framtida insamlingshändelser. Övriga föremål visas utan användningsknapp. Nya kläder behöver även kopplas till figurens utseende.

### Södra gläntan

`World` håller ihop båda landytorna och bron i samma scen. `SouthGlade` bygger den södra miljön och brons gränser; `Bokoblin` äger vaktens modell och flykt. Utomhuskistor identifieras med `glade` och `south`, och den aktiva kistan behålls under hela frågeomgången.
