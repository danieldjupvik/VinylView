# Changelog

## [0.2.0-beta.1](https://github.com/danieldjupvik/VinylView/compare/vinyldeck-v0.1.0-beta.1...vinyldeck-v0.2.0-beta.1) (2026-01-18)


### Features

* Complete MVP with Discogs collection management ([207dd3c](https://github.com/danieldjupvik/VinylView/commit/207dd3c4d4d8995346287b36a072e6aa742c7549))
* Initial skeleton with Vite + React Compiler, React 19, Bun, Shadcn and tailwindcss ([#1](https://github.com/danieldjupvik/VinylView/issues/1)) ([5b3ecac](https://github.com/danieldjupvik/VinylView/commit/5b3ecac4a0709e16f1ea74d8d9270013241df6ce))


### Bug Fixes

* add packages config for release-please ([5dcd628](https://github.com/danieldjupvik/VinylView/commit/5dcd6289a358451b4d69a46f9abe68e92791cdec))
* remove invalid prerelease-type property from config ([9d80a41](https://github.com/danieldjupvik/VinylView/commit/9d80a41bfed2cabe7c40da277d2ca62ed2f28c0e))

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
