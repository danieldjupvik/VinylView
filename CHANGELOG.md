# Changelog

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
