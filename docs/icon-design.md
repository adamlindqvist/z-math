# Appikon

Ikonen är en handritad SVG av spelets hjälte med blont hår, spetsiga öron, grön luva och tunika, silversvärd med gyllene parerstång och blå sköld. Färgerna och sköldens emblem följer karaktären i `src/game/models.ts`. Stora färgfält, mörka konturer och ett vänligt ansikte ger ett tecknat uttryck som passar spelets yngre spelare.

## Original och export

Det redigerbara originalet finns i `public/icons/hero.svg`. Det renderades med Chromium via Playwright till `public/icons/icon-1024.png` i en 1024 × 1024 pixlar stor viewport med `deviceScaleFactor: 1`. SVG:n öppnas direkt och hela viewporten sparas som PNG.

PNG-originalet skalades med ImageMagick och Lanczos-filter till följande storlekar:

- `public/icons/favicon-16.png`: 16 × 16
- `public/icons/favicon-32.png`: 32 × 32
- `public/apple-touch-icon.png`: 180 × 180
- `public/icons/icon-192.png`: 192 × 192
- `public/icons/icon-512.png`: 512 × 512

Exempel på skalning:

```sh
magick public/icons/icon-1024.png -filter Lanczos -resize 180x180 public/apple-touch-icon.png
```

Alla ikoner har en opak, ljust gräddfärgad bakgrund (`#f8f4e7`). Operativsystemet rundar hemskärmsikonens hörn. Befintliga referenser i `index.html` och `public/manifest.webmanifest` använder PNG-filerna.
