# Crustulator

Pizza dough calculator for a crust that will make you do a little jig when you take a bite.

Crustulator works out flour, water, salt and yeast for any pizza style, schedule and kitchen. It sizes dough by ball weight, round diameter or pan size, handles poolish, biga and sourdough, turns time and temperature into a yeast amount and plans every step until bake time.

## What lives where

| Path | What it is |
| --- | --- |
| `apps/mobile` | The iOS app (Expo, React Native, Expo Router) |
| `apps/web` | [crustulator.com](https://crustulator.com), the web calculator (Astro with a React island) |
| `apps/site` | [crustulator.app](https://crustulator.app), the website for the app (Astro) |
| `packages/core` | The dough engine shared by every app: styles, math, fermentation model, schedules, units and share links |
| `brand` | Logo, icon, fonts and color tokens |

## Getting started

You need Node 22+ and pnpm 10.

```sh
pnpm install
pnpm test
```

### Mobile

The first run builds the native app with Xcode and installs it on the iOS simulator.

```sh
pnpm --filter @crustulator/mobile ios
```

After that `pnpm mobile` starts Metro and the installed app reloads as you edit.

### Web

```sh
pnpm web
pnpm site
```

Both sites build to static files with `pnpm build`.

## How the math works

Every amount is a baker's percentage of the total flour. The total dough weight comes from the number of pizzas and their size plus a little extra for bowl residue. Preferments and sourdough starters carry part of the flour and water, so the final mix subtracts what they already bring.

Yeast comes from a fermentation model in `packages/core/src/yeast.ts`:

- Commercial yeast follows a fit of Craig's yeast prediction chart from the pizzamaking.com forum. Every step of the schedule adds its share of the rise, so fridge days and counter hours combine naturally. Dough coming out of the fridge warms up gradually instead of jumping to room temperature.
- Salt, fat and hydration nudge the amount using the terms from La Confraternita della Pizza's yeast formula, so rich deep dish dough gets more yeast than lean Neapolitan dough.
- Poolish and biga follow Piergiorgio Giorilli's poolish table, scaled for temperature. Whatever yeast the preferment carries comes off the final dough.
- Sourdough follows Craig's starter model with extra credit for long cold retards.
- Real bakers use a bit more yeast than the chart, so the default aims for dough that is ready a little early. "Just in time" gives the chart amount and "Well ahead" adds more.

The numbers are a great starting point. Flour, starters and kitchens all differ, so watch the dough more than the clock.

## Share links

Recipes travel inside the link itself, for example `https://crustulator.com/r?d=…`. Nothing is stored on a server and the app opens the same links.
