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

### Debugmeny

När spelet körs med `npm run dev` finns en liten debugknapp vid skärmens högra kant. Menyn kan också öppnas och stängas med **F2**. Där går det att hoppa till tempelrum eller direkt till vulkanvärlden, klara rum, ge föremål, låsa upp bron, börja temporärt om och slå på noclip. Noclip passerar hinder men stannar vid kartans ytterkant.

Den första debugändringen startar en tillfällig testsession. Inga framsteg skrivs då till den vanliga sparfilen, inte heller om spelet fortsätter normalt efteråt. **Avsluta testsession** eller ladda om sidan för att återgå till den riktiga sparningen. Debugknappen och menyn inkluderas inte i produktionsbygget.

### Lägg till på iPads hemskärm

Öppna spelets publicerade adress i Safari, tryck på **Dela → Lägg till på hemskärmen → Lägg till**. Spelet får en tecknad ikon av hjälten med svärd och sköld och öppnas i ett eget fönster. Både stående och liggande läge stöds. Spelet behöver nätanslutning för att laddas; hemskärmsikonen gör det inte tillgängligt offline. Om en äldre genväg visar fel ikon, ta bort genvägen och lägg till den igen.

Ikonerna ligger i `public/icons/`, med det redigerbara SVG-originalet i `hero.svg` och PNG-originalet i `icon-1024.png`. `public/apple-touch-icon.png` används av iPad och `public/manifest.webmanifest` anger appnamn, ikoner och startadress. Sökvägarna fungerar även under GitHub Pages undermapp `/z-math/`. Inställningarna följer [Apples dokumentation för hemskärmsappar](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).

## Publicering

Varje push till `main` bygger och publicerar spelet till GitHub Pages. Aktivera först **Settings → Pages → Build and deployment → Source: GitHub Actions** i GitHub-repot. Spelet blir sedan tillgängligt på `https://adamlindqvist.github.io/z-math/`.

## Spela

- WASD eller piltangenter: gå. E eller Space: prata/öppna. Escape: pausa.
- Tryck på prat-ikonen uppe till vänster i en dialog eller quizet för svensk uppläsning. Tryck igen för att läsa från början. Uppläsningen stannar när texten ändras eller rutan stängs. Rösten beror på enhetens tillgängliga röster.
- På touchskärm: dra joysticken och tryck på actionknappen.
- Prata med Zelda, följ Rupees längs stigen och lös kistans tre additionsfrågor. Fel svar kostar inget.
- Kistan ger fem Rupees en gång; fyra Rupees finns längs stigen.
- Gå till stenporten norr om stigen för att besöka Vattentemplet. Ingången är öppen direkt. Gå in i den blå vattenportalen så teleporteras du automatiskt; ingen knapp behövs.
- Vattentemplet har aqua-färgade golv, blågrå sten, turkosa väggband, vågor, droppar och grunda vattenkanaler. Vattnet är ofarlig utsmyckning och påverkar inte rörelse eller pussel. Det interna ID:t är `moss`.
- I Låsta porten öppnar fem räknefrågor porten; varje rätt svar tänder en lampa ovanför porten. Räkna bilderna och välj bland tre svar med siffror och prickar.
- I Stensalen: matcha sol, löv och måne. Gå mot stenen från vänster eller höger för att knuffa den längs spåret. Pilen visar riktningen. Ingen actionknapp behövs. Stenar på rätt symbol kan flyttas igen tills alla tre ligger rätt; då låses alla och porten öppnas. Knappen med återställningspilen börjar om med den olösta stengåtan.
- I Skattkammaren öppnar fem bildadditioner (summa högst fem) kistan och ger fem Rupees en gång. Gå genom porten så teleporteras du tillbaka till gläntan. Den låga porten bakom dig leder alltid tillbaka.
- Rätt mattesvar och stenknuffar i templet sparas direkt. Efter omladdning börjar du vid det sparade rummets säkra startpunkt. Lösta rum förblir lösta tills du börjar om med hela äventyret.
- Följ stigen söderut till träbron. Bokoblin vaktar bron tills du har fått både svärd och sköld i Vattentemplet. Tryck på **Skräm iväg** så springer Bokoblin undan och bron öppnas permanent. Den första kistan behöver inte vara öppnad.
- Gå över bron till södra gläntan. Den nya kistan har tre additionsfrågor och ger fem rupees en gång, oberoende av den första kistan. Fel svar kostar inget; stänger du ett pågående kistquiz börjar dess tre frågor om nästa gång.
- Samma fråga kommer aldrig igen i samma quiz eller räknesession. Har alla frågor i en kort omgång, som de fem bildfrågorna, redan använts återanvänds de äldsta först.
- Ett fel svar markeras i rött och det rätta svaret visas samtidigt i lugnt blått, så att barnet ser vad som var rätt. Efter en kort stund byts frågan mot en ny i stället för att man får försöka igen på samma fråga; svarsknapparna är låsta under tiden. Antalet rätt påverkas inte av fel svar.
- Till vänster om stigen i södra gläntan ligger Eldtemplet. Eldportalen vetter mot stigen; gå in från höger. När du lämnar templet kommer du ut på samma sida, med fri väg tillbaka till stigen. Bron måste vara upplåst.
- Eldtemplet har vulkansten, varma golv, flammotiv, eldfat och glödande lavakanaler. Elden och lavan är ofarliga. Låsta porten och Skattkammaren har samma fem bildfrågor vardera som Vattentemplet.
- Eldtemplets Stensal har tre separata L-formade spår. Följ spåret och matcha sol, löv och måne. Gå runt stenen vid böjen och knuffa från nästa sida. Pusslet kräver minst sju knuffar, både i sidled och djupled. Du kan knuffa tillbaka eller börja om utan straff.
- Eldtemplets skatt ger fem rupees, ett eldsvärd och en eldsköld en gång. Eldutrustningen tas på direkt och syns med egna flammotiv. Den vanliga utrustningen finns kvar i väskan, där du kan byta mellan dem.
- Brons upplåsning och båda öppnade kistorna sparas. Äldre sparningar börjar om med sparversion 8. Efter omladdning i gläntan börjar spelaren vid den ursprungliga startpunkten.
- Två turkosa fjärilar gömmer små hemligheter: en vid dammens nordvästra strand och en längre ner längs huvudstigen i södra gläntan. När du kommer nära flyger fjärilen till nästa av fem stopp och väntar. Inga uppdrag eller extra instruktioner visas. Vid sista stoppet tonar en gömd kista fram under 1,5 sekunder. Den öppnas med vanliga handlingsknappen och ger tio rupees en gång, utan mattefrågor. Fjärilen flyger sedan upp och försvinner med glitter.
- Fjärilarnas framsteg sparas separat. Före avslöjandet börjar en ofärdig fjäril om vid sitt första stopp efter omladdning. När kistan väl har avslöjats finns den kvar och fjärilen väntar vid den. Öppnade kistor förblir öppnade och deras fjärilar kommer inte tillbaka.
- Framsteg sparas automatiskt i webbläsaren. Pausmenyn låter dig börja om. Lagring delas inte mellan enheter och kan rensas av webbläsaren.

### Kungasalen

Gå genom entréhallens norra dörr till den tomma Kungasalen. Undersök skölden, den tomma rustningen och kungaporträttet med handlingsknappen eller genom att trycka på föremålet när du står nära. Märkena kan aktiveras i valfri ordning och sparas direkt. Boken visar en bildledtråd. Det finns inga personer, tidsgränser eller felval i rummet.

När märkena lyser glider tronen åt sidan. Om spelaren står i vägen väntar tronen tills vägen är fri. Den högra sidogången är öppen; överflödig dekoration har tagits bort så att huvudföremålen syns tydligare. Kistan öppnas efter tre enkla additionsfrågor och ger 20 rupees och en **kungakrona** en gång. Fel svar kostar inget. Stänger du quizet börjar de tre frågorna om nästa gång. Kronan tas på direkt och kan bytas i väskan. En lös hjälm och en kruka gömmer dessutom varsin rupee.

Kungasalen använder sparversion 10. Äldre eller ogiltiga sparningar börjar om. En omladdning efter löst pussel visar tronen i sitt öppna läge utan att spela om ljud eller dela ut belöningar igen.

### Vulkanvärlden

När Eldtemplets slutskatt öppnas tänds stenportalen i södra gläntans sydöstra del. Följ ask-/jordstigen dit och gå genom den orange öppningen. Portalen leder till Vulkanvärlden, med basaltstenar, askstigar, lava och en vulkan. Lavan går inte att gå i men gör ingen skada. Den gröna trädportalen leder tillbaka till södra gläntan.

Fyra rupees längs askstigen leder till en skattkista väster om vulkanen, nästan i höjd med den. Stigens rupees kan samlas en gång och sparas. Tre bildadditioner med summa högst fem öppnar kistan och ger fem rupees en gång. Fel svar kostar inget och quizet kan avbrytas och provas igen. Den öppnade kistan sparas. Två andra öppna platser lämnar utrymme för kommande innehåll. Sparversionen är nu 14; äldre sparningar börjar om. Platsen sparas som `{ world: "volcano" }`; vid ankomst och omladdning står spelaren på vulkansidan av returportalen och kan fortsätta framåt längs stigen. För att återvända vänder man om och går tillbaka genom portalen. Upplåsningen följer Eldtemplets belöning och påverkas inte av vilken utrustning som används. Marken är sotig och levande: små lågor, glödande sprickor och gnistor, förkolnade grässtrån samt ask- och basaltflisor är utspridda över hela ytan, aldrig på stigarna eller i lavan. Lågorna och gnistorna delar vulkanens glödmaterial och pulserar därför i takt med lavan. Utspridningen använder samma fröade system som gläntans blommor, `scatterDetail` i `src/game/gladeScenery.ts`, så layouten är identisk vid varje omladdning. Miljön byggs i `src/game/VolcanoArea.ts`, markdetaljerna i `src/game/volcanoScenery.ts`, och de två portalerna delar modeller och placeringar i `src/game/volcanoPortal.ts`.

## Struktur

`src/game/` äger värld, kamera, input, kollisionssystem, modeller och renderloop. `src/components/` äger UI och touchkontroller. `src/store/gameStore.ts` är den typade bryggan mellan dem och sparar framsteg. React uppdateras bara när spelstatus ändras, aldrig varje bildruta. `src/math/` innehåller frågekontrakt samt generatorer för addition och bildfrågor.

## Små hemligheter

`src/game/secrets/definitions.ts` innehåller hemligheternas ID, typ, fem väntpositioner, kistposition och eventuell brospärr. `butterfly-01` börjar vid dammen på `(4.8, 1.2)` och leder via södra och västra delen av den ursprungliga gläntan till kistan på `(-3.4, -5.2)`. `butterfly-02` börjar längre ner längs södra gläntans huvudstig på `(0, 21)` och leder till en undangömd plats på `(-4.5, 24.4)`. Koordinaterna är världens `x/z`.

`Butterfly` bygger modellen och hanterar hovring, närhetsreaktion, bågformad flygning mellan stopp och avslutningen. Närhetsradien är 2,2 enheter. Fjärilen väntar minst 0,8 sekunder vid ett stopp, reagerar i 0,4 sekunder och flyger i 2,5 sekunder. Animationerna pausas med spelets dialoger. Glitter använder en fast pool av enkla geometriska former. `World` skapar en separat fjäril och befintlig `Chest` per definition, utan en generell hemlighetsmotor.

`src/game/entities/chestDefinitions.ts` anger utomhuskistornas öppningssätt och belöning. Fjärilskistorna ger tio rupees direkt; de vanliga kistorna behåller sina mattefrågor och fem rupees. En dold kista har inget interaktionsmål eller kollisionshinder. När fjärilen når sista stoppet avslöjas kistan och tonar fram under 1,5 sekunder; öppna-knappen blir tillgänglig när framtoningen är klar.

Progressionen ligger i det befintliga sparsystemets `secrets`, indexerat med hemlighetens ID: `discovered` sätts vid första närhetsaktiveringen, `revealed` när fjärilen når sista stoppet och `completed` när kistan öppnas. Kistans öppnade tillstånd, tio rupees och completion sparas i samma uppdatering. Brospärren gäller även den södra hemligheten. Omladdning efter avslöjandet visar kistan direkt; exakt waypoint eller pågående framtoning sparas inte. Återställning och tillfälliga debugsessioner hanterar båda hemligheterna.

För ytterligare en fjäril: lägg till dess kista i kistregistret och en definition med unikt ID och en framkomlig rutt. För nästa typ av hemlighet: utöka definitionstypen och lägg till dess separata beteende i världen; återanvänd progressionen och kistbelöningar där de passar. Stenhemligheter använder samma progression och befintliga world pickups; ingen separat manager behövs. Ändras det sparade innehållet behöver sparversionen ändras enligt projektets policy.

## Fler tempel

`src/game/Area.ts` beskriver ett område med startpunkt, kamera, kollisioner, interaktioner, automatiska passager, stenknuffar och resursstädning. `Game` byter mellan gläntan och ett tempelrum i taget och frigör det gamla områdets geometrier och material.

Lägg till ett objekt i `DUNGEONS` i `src/game/dungeons/definitions.ts` för ett nytt tempel. Ange ett unikt ID, en fri ingångsposition i gläntan och en ordnad lista av rum med unika ID:n. Ingångens valfria `rotation` anges i radianer och styr portal, stolpkollisioner, gångplattor, passageriktning och återkomstpunkt. `requiresBridge` kräver den upplåsta bron även vid rumsbyten och sparvalidering. Varje rum använder antingen en matteutmaning (bildräkning eller addition, antal rätt och belöning) eller stenar med symbol, spårpunkter, startindex och målindex. Föregående rum måste vara löst innan nästa kan öppnas. Den sista porten leder till gläntan.

`DungeonArea` bygger rum, portar, lampor, stenar och kistor från definitionerna. Varje sten har en ordnad lista av `points: { x, z }[]`, ett `start`-index, ett `goal`-index och golvsymboler per punkt. Intilliggande punkter ska ligga 1,6 enheter isär längs en enda axel. Knuffar flyttar stenen ett index framåt eller bakåt från rätt fysisk sida. Animation, riktningspil och kollisionsvolym följer x/z-riktningen. Vattentemplets fempunktsbanor är raka; Eldtemplets separata banor böjer av. Lämna plats att gå runt alla stenar och nå båda knuffsidorna, även vid böjar och ändlägen. Målet ska ha samma symbol som stenen och ligga utanför startläget. Testa framkomlighet och båda skärmorienteringarna för nya layouter. Ingen baneditor ingår.

Sparformatet är version 8 under nyckeln `glantans-skatt-v1`; äldre och ogiltiga sparningar börjar om. Ändras definitionernas sparade struktur behöver även sparversionen ändras. Spelet fungerar utan åtkomst till lagring. Kräver en webbläsare med WebGL; grafikfel visas med möjlighet att ladda om.

## Verifiering

Eldtemplet har verifierats i Chromium med simulerad touch i 820 × 1180 och 1180 × 820 (2026-09-08). Bildgranskningen omfattade den vridna entrén till vänster om stigen, alla rum, mattefrågor, paus, belöning och väskan. En automatiserad genomspelning gick runt stenarna med spelarens rörelse och kollisioner, genomförde sju knuffar och båda mattelåsen, laddade om vid en böj och efter löst pussel och belöning, bytte utrustning och återvände genom entrén utan dubbel belöning. Vattentemplets utrustning och broöppningen förbereddes som testdata; Eldtemplets matte besvarades via gränssnittet. Två samtidiga simulerade pekningar på styrspak och handlingsknapp, avbruten pekning och paus med hållen styrspak kontrollerades. De 49 automatiska testerna och produktionsbygget passerar. Detta är webbläsarsimulering, inte test på fysisk iPad/Safari.

Automatiska tester täcker frågegenerering, sparning efter enstaka svar och knuffar, engångsbelöningar, rumsordning, stenregler, kollisioner, tangentbordsrörelse, multitouch, fokusförlust och vägen till båda skatterna. Vattentemplets entré, alla tre rum, mattelås och belöningsdialog har bildgranskats manuellt i Chrome med simulerade iPad-format 820 × 1180 och 1180 × 820 (2026-09-08). En automatiserad genomspelning verifierade båda mattelåsen, fem stenknuffar, portpassager, omladdning efter lampor, stenar och belöning, återgång till gläntan samt återbesök utan dubbel belöning. Testet använde spelmotorns rörelseinmatning och tangentbord, pekningar på svarsknappar och testpositionering inför vissa knuffar och passager. Avbruten pekning, paus och dialogöppning med nedtryckt styrspak kontrollerades också; den samtidiga handlingsknappen aktiverades med ett automatiserat klick. Detta är en simulering, inte en fullständig manuell tvåfingerkontroll eller ett prestandatest på fysisk iPad/Safari. Dessa enhetskontroller återstår.

### Barnanpassat gränssnitt

Gränssnittet använder Tailwind med gemensamma temafärger, stora dialoger, korta instruktioner och SVG-bilder. Joysticken är 160 pixlar bred och kan användas samtidigt som handlingsknappen. Stjärneffekter följer inställningen för minskad rörelse. Uppläsning ingår ännu inte.

Den nya layouten har kontrollerats i Brave/Chromium med simulerad touch i 768 × 1024, 1024 × 768, 820 × 1180 och 1180 × 820. Kontrollerna omfattade NPC-, kist-, paus- och återställningsdialoger, matte, återförsök, rätt svar, belöning, tempelfrågor och stenhjälp. Dialogknapparna rymdes utan rullning i dessa format. Kistbelöningen bevarades efter omladdning. Automatiska tester täcker spelvägen och touchavbrott. Detta är inte ett prestandatest eller ett test på fysisk iPad/Safari.

### Väska och utrustning

Tryck på **Väska** för att se dina föremål. Spelet pausas medan väskan är öppen. Stäng med knappen eller Escape. Gröna kläder finns från start. Vattentemplets sista mattelås ger fem rupees, ett svärd och en sköld en gång. Svärdet och skölden tas på automatiskt och kan sedan tas av och på i väskan. De syns på figuren. När du äger båda kan du skrämma iväg Bokoblin vid bron; de behöver inte vara påtagna. Strid ingår inte.

Föremålsregistret i `src/items/definitions.ts` definierar namn, bildsymboler och kategorier. Spelstatus sparar ägda föremål och utrustning. Nya belöningar anges med `items` i utmaningsdefinitionerna; `grantItems` kan användas av framtida insamlingshändelser. Övriga föremål visas utan användningsknapp. Nya kläder anger `garment` i föremålsregistret.

### Södra gläntan

`World` håller ihop båda landytorna och bron i samma scen. `SouthGlade` bygger den södra miljön och brons gränser. `gladeScenery` ger båda gläntorna samma mjukt slingrande stigar, rundade träd, blommande buskar, stenar, blommor och grästuvor, och dess `scatterDetail` delas med vulkanvärldens markdetaljer; `Bokoblin` äger vaktens modell och flykt. Utomhuskistor identifieras med `glade` och `south`, och den aktiva kistan behålls under hela frågeomgången.

### Konstiga stenarna

Vid `gladePosition(5, 5.2)` strax söder om dammen finns en mossig sten med en svag spiral. Två likadana stenar finns i södra gläntan vid `gladePosition(-6.8, 26)` och `gladePosition(6.2, 21.8)` och kan användas när bron är upplåst. De tre hemligheterna sparas separat och ger fem rupees vardera. Vanliga handlingsknappen visar **Flytta** inom 1,85 meter. Stenen skakar och glider 1,6 meter åt sidan under 1,2 sekunder, med en liten studs och två glitterpartiklar. Under den finns en grund grop med fem vanliga rupees. Inget uppdrag eller någon pil visas.

`StrangeRock` hanterar geometrin och animationen; `WorldSecret` skiljer mellan fjärilar och stenar. Första interaktionen sparar `discovered`, färdig animation sparar `revealed`, och sista upphämtningen sparar `completed` tillsammans med rupees och `collected`. Delvis hämtad belöning bevaras vid omladdning; ett avbrott mitt i flytten tillåter ett nytt försök. Avklarade stenar förblir flyttade utan ny belöning. Animationen pausas med dialoger, och slutkollisionen väntar tills spelaren lämnat landningsplatsen. Fjärilarnas ursprungliga rutter är oförändrade.

### Ljudeffekter

Mjuka, magiska ljudeffekter följer insamling, quiz, interaktioner, stenpussel och upptäckter. Slå på eller av dem med **Ljudeffekter på/av** i pausmenyn. Valet sparas separat och behålls när äventyret startas om. Uppläsning fungerar även med effekterna avstängda och tystar effekterna medan den talar.

`src/audio/` innehåller Web Audio-syntes, typade ljudhändelser och kopplingen till appens livscykel. Inga ljudfiler eller extra paket behövs. Ljud aktiveras genom beröring eller tangenttryckning; om webbläsaren blockerar ljud går det fortfarande att spela.


### Slottsbutiken

Gå fram till slottets ytterdörr för att komma till entréhallen. Butiken ligger till höger; biblioteket och kungssalen är stängda. Hos Handlare Bosse kan du trycka på handlaren eller en utställd vara när du står nära, eller använda handlingsknappen/E. Bosse hälsar kort när du närmar dig.

Sortimentet består av grön äventyrsmössa med fjäder (15 rupees), Skogsäventyrarens tunika (20), träsvärd (30) och träsköld (25). Köp en gång och välj **Ta på** eller **Fortsätt handla**. Väskan låter dig byta och ta av saker. Grundmössan och de gröna kläderna återkommer när nya kläder tas av. Allt är kosmetiskt; bron kräver fortfarande ägande av tempelsvärdet och tempelskölden. Befintliga engångsbelöningar är oförändrade: spelaren behöver välja hur rupees används.

`src/game/castle/` innehåller entréhallen, `ShopScene` och geometriska varumodeller. `hall.ts` bygger slottshallens inredning: pelare, banér, öppen spis, vaktriddare, långbord och lampor med fladdrande lågor. Båda rummen använder `Area`, samma renderare och rumskamera som templen. `src/items/shop.ts` innehåller fasta priser; föremålsregistret skiljer kategori från utrustningsplats (`head`, `body`, `weapon`, `shield`). Köphistoriken sparas tillsammans med ägande och utrustning, och saldot valideras som intjänade rupees minus köp.

Sparversionen är **9**, under nyckeln `glantans-skatt-v1`. Äldre sparningar startar ett nytt spel. Vid lagringsfel går det att fortsätta spela och handla under sessionen. I utvecklingsläget finns hallen och butiken som debugdestinationer samt **Prova butiksköp (100 test-rupees)**. Testpengarna och testköpen sparas inte; avsluta testsessionen för att återgå till ditt riktiga spel.

Butiksdialoger och interiör har granskats i Codex inbyggda webbläsare med 1024 × 768 och 768 × 1024. Automatiska tester täcker köp, sparande, utrustning, passagekollisioner, träfftestning och inmatningsavbrott. Fysisk iPad/Safari och manuell tvåfingerkontroll återstår.

### Förhandsvisa gubben

I väskan och butiken visas gubben i ett eget 3D-fönster. Dra direkt i 3D-fönstret åt sidan för att snurra. På smala skärmar ligger fönstret ovanför den rullbara listan. Väskans ändringar syns direkt. I butiken provar gubben vald vara utan köp eller ändring av sparad utrustning. **Ta på** utrustar varan och håller butiken öppen; **Spela vidare** återgår till spelet.

`src/game/heroModel.ts` delar modellbygge och utrustningsutseende mellan spelaren och `CharacterPreview`. Förhandsvisningen har egna grafikresurser och renderas bara vid ändringar.

### Delbaserade plagg

`src/items/garments.ts` definierar plagg som material och en lista visuella delar: grundmodell, ärmar, krage, bälte, dekor och accessoarer. Delarna har namn, materialnyckel, form (box, ellipsoid eller avsmalnande cylinder), position och valfri rotation. Måtten anges relativt kroppens ankare på höjd 0,65; positiv z pekar framåt. Alla delar följer kroppens gångrörelse.

För ett nytt plagg: skapa en `GarmentDefinition`, koppla den via `garment` till ett föremål med `equipSlot: "body"` och lägg vid behov till pris i `shop.ts`. Samma modellbyggare används på spelaren, i förhandsvisningen och på butikens ställ. Inga nya villkor i spelarmodellen behövs. Varje instans äger sina grafikresurser; plaggbyte frigör det gamla plagget och oförändrad utrustning återanvänder modellen.

Skogsäventyrarens tunika har grönt tyg, ljus underskjorta med krage och ärmar samt brunt bälte. Dess interna föremåls-ID är `blue-tunic`; sparformat och pris är oförändrade.
