# Changelog

## [0.4.0-beta.1](https://github.com/danieldjupvik/VinylDeck/compare/vinyldeck-v0.3.1-beta.1...vinyldeck-v0.4.0-beta.1) (2026-01-28)


### Features

* add real logo support ([#64](https://github.com/danieldjupvik/VinylDeck/issues/64)) ([842e354](https://github.com/danieldjupvik/VinylDeck/commit/842e3549dd964f8ee1a2e19128f3b4609f9a2fcb))
* consolidate storage from 11 keys to 4, add IndexedDB caching ([#61](https://github.com/danieldjupvik/VinylDeck/issues/61)) ([26292b4](https://github.com/danieldjupvik/VinylDeck/commit/26292b4d81bc3b29236887e2adcda742cbce1863))
* fully support offline mode ([#67](https://github.com/danieldjupvik/VinylDeck/issues/67)) ([05b89e4](https://github.com/danieldjupvik/VinylDeck/commit/05b89e4006aace38afadf7a1be22fa198f7266ac))


### Bug Fixes

* improve UX on login page fixes ([#54](https://github.com/danieldjupvik/VinylDeck/issues/54)) ([7b661a7](https://github.com/danieldjupvik/VinylDeck/commit/7b661a7325cc17f04627f0c73e04a368ad8bbdfc))
* resolve Vite build warnings ([#56](https://github.com/danieldjupvik/VinylDeck/issues/56)) ([d488084](https://github.com/danieldjupvik/VinylDeck/commit/d48808426a7f62113ed958f469b9a03cba3c1eb0))

## [0.3.1-beta.1](https://github.com/danieldjupvik/VinylDeck/compare/vinyldeck-v0.3.0-beta.1...vinyldeck-v0.3.1-beta.1) (2026-01-21)


### Features

* improve sidebar buttons ([#48](https://github.com/danieldjupvik/VinylDeck/issues/48)) ([f5244dd](https://github.com/danieldjupvik/VinylDeck/commit/f5244dde16473a9895f78267f46f34f688a42ce0))
* Redesign login page with public browsing and animations ([#51](https://github.com/danieldjupvik/VinylDeck/issues/51)) ([ccf2fb2](https://github.com/danieldjupvik/VinylDeck/commit/ccf2fb275e43eaa239a4368314083cfa32caab25))
* update base color and accent ([#50](https://github.com/danieldjupvik/VinylDeck/issues/50)) ([2d71976](https://github.com/danieldjupvik/VinylDeck/commit/2d719766c29f1ff56bb239221a6b24a1a1fa6caa))

## [0.3.0-beta.1](https://github.com/danieldjupvik/VinylDeck/compare/vinyldeck-v0.2.0-beta.1...vinyldeck-v0.3.0-beta.1) (2026-01-20)


### Features

* OAuth Login Integration & tRPC API Migration ([#30](https://github.com/danieldjupvik/VinylDeck/issues/30)) ([b0a9d7a](https://github.com/danieldjupvik/VinylDeck/commit/b0a9d7a03be66361711f5bdc736a2fcfdd1fac92))
* preserve url after login ([#27](https://github.com/danieldjupvik/VinylDeck/issues/27)) ([5f7d0f5](https://github.com/danieldjupvik/VinylDeck/commit/5f7d0f56d65dc3ce125f4c71b66e694de35dc6b0))

## [0.2.0-beta.1](https://github.com/danieldjupvik/VinylView/compare/vinyldeck-v0.1.0-beta.1...vinyldeck-v0.2.0-beta.1) (2026-01-19)


### Features

* Add grid/table view toggle for collection page with enhanced features ([#5](https://github.com/danieldjupvik/VinylView/issues/5)) ([755e81f](https://github.com/danieldjupvik/VinylView/commit/755e81f9aa8845d9f3771c3421f64c44d439a10f))
* Add reshuffle functionality and genre formatting improvements ([82374ee](https://github.com/danieldjupvik/VinylView/commit/82374eeae276087436216ae35b8b8d16dda1518c))
* Add user profile management with avatar customization and Gravatar support ([#3](https://github.com/danieldjupvik/VinylView/issues/3)) ([70bcdec](https://github.com/danieldjupvik/VinylView/commit/70bcdec39b4ee8f89774861d8262fa463e4506f5))
* Enhance Discogs API integration with OAuth support and user profile management ([#6](https://github.com/danieldjupvik/VinylView/issues/6)) ([d2b86e3](https://github.com/danieldjupvik/VinylView/commit/d2b86e3c7a33d8dd0c9808769b649b947ed71862))
* Enhance rate limiting and accessibility in API client and UI components ([84b53dc](https://github.com/danieldjupvik/VinylView/commit/84b53dc5cd56e1cd93ee9a7521d44896c211a80b))
* implement authentication and collection features with routing, UI components, and API integration ([70bcdec](https://github.com/danieldjupvik/VinylView/commit/70bcdec39b4ee8f89774861d8262fa463e4506f5))
* implement authentication and collection features with routing, UI components, and API integration ([dbf4323](https://github.com/danieldjupvik/VinylView/commit/dbf432373f4b3f9f7a76b96eb0a59eb15058d804))
* Improve VinylCard image handling and enhance useCollection hook ([46115f7](https://github.com/danieldjupvik/VinylView/commit/46115f7a27bf49fd29840786ac450717f402ce15))
* Initial skeleton with Vite + React Compiler, React 19, Bun, Shadcn and tailwindcss ([#1](https://github.com/danieldjupvik/VinylView/issues/1)) ([5b3ecac](https://github.com/danieldjupvik/VinylView/commit/5b3ecac4a0709e16f1ea74d8d9270013241df6ce))


### Bug Fixes

* nitpicks fixes, harden UI wrappers, accessibility, and rate handling ([#10](https://github.com/danieldjupvik/VinylView/issues/10)) ([f99453a](https://github.com/danieldjupvik/VinylView/commit/f99453afa7c34be32d5423c7a469fb75c2e02b7f))

## Changelog

All notable changes to VinylDeck will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Browse your Discogs vinyl collection with a beautiful grid view
- Search and filter your collection by artist, title, genre, style, label, and more
- Sort collection by date added, artist, album, release year, and more
- Dark and light theme support with system preference detection
- English and Norwegian language support
- Progressive Web App (PWA) support for offline access
- Customizable avatar using Discogs profile image or Gravatar
- Collapsible sidebar navigation with Browse and Analyze sections
- Grid/table view toggle for the collection page with persisted preference
- Responsive collection table view with a loading skeleton
- Manual refresh action and "last updated" timestamp for collection data
- Filter option counts and improved filter option structure
- Caching rules for Discogs and Gravatar images
- Settings link in the sidebar with view transitions

### Changed

- Collection loading and animation handling for clearer feedback
- Filter layout for improved mobile responsiveness
- Vinyl card layering adjustments for cleaner UI
- useIsMobile initializes from window width for faster first render
- Vite PWA dev options to disable development mode
