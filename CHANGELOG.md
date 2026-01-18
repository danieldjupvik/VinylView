# Changelog

## [0.2.0-beta.1](https://github.com/danieldjupvik/VinylView/compare/vinyldeck-v0.1.0-beta.1...vinyldeck-v0.2.0-beta.1) (2026-01-18)


### Features

* Add grid/table view toggle for collection page with enhanced features ([#5](https://github.com/danieldjupvik/VinylView/issues/5)) ([d8964c1](https://github.com/danieldjupvik/VinylView/commit/d8964c1f8a61807e29babb8d94001b8647f66b49))
* Add reshuffle functionality and genre formatting improvements ([a9cb766](https://github.com/danieldjupvik/VinylView/commit/a9cb766cc1b8cdd0fa29358e291f241191b6e4f6))
* Add user profile management with avatar customization and Gravatar support ([#3](https://github.com/danieldjupvik/VinylView/issues/3)) ([70bcdec](https://github.com/danieldjupvik/VinylView/commit/70bcdec39b4ee8f89774861d8262fa463e4506f5))
* Enhance Discogs API integration with OAuth support and user profile management ([#6](https://github.com/danieldjupvik/VinylView/issues/6)) ([c41905d](https://github.com/danieldjupvik/VinylView/commit/c41905df791877055fcb759d918cc0edd4a16f63))
* Enhance rate limiting and accessibility in API client and UI components ([9f1d33f](https://github.com/danieldjupvik/VinylView/commit/9f1d33f909ec5220c394b4482f6af49b99d17695))
* implement authentication and collection features with routing, UI components, and API integration ([70bcdec](https://github.com/danieldjupvik/VinylView/commit/70bcdec39b4ee8f89774861d8262fa463e4506f5))
* implement authentication and collection features with routing, UI components, and API integration ([dbf4323](https://github.com/danieldjupvik/VinylView/commit/dbf432373f4b3f9f7a76b96eb0a59eb15058d804))
* Improve VinylCard image handling and enhance useCollection hook ([b72f1c0](https://github.com/danieldjupvik/VinylView/commit/b72f1c0c44469bc8ed0b77505b21a1d4f18cac70))
* initial release (v0.1.0-beta) ([79168df](https://github.com/danieldjupvik/VinylView/commit/79168df2bc84acd3cc0aeaaebab4aaea4f36aa8a))
* Initial skeleton with Vite + React Compiler, React 19, Bun, Shadcn and tailwindcss ([#1](https://github.com/danieldjupvik/VinylView/issues/1)) ([5b3ecac](https://github.com/danieldjupvik/VinylView/commit/5b3ecac4a0709e16f1ea74d8d9270013241df6ce))


### Bug Fixes

* nitpicks fixes, harden UI wrappers, accessibility, and rate handling ([#10](https://github.com/danieldjupvik/VinylView/issues/10)) ([50a9025](https://github.com/danieldjupvik/VinylView/commit/50a90250b8a5e8e31c383c7d3ac85e79a3fbcccb))

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
