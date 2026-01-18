# Changelog

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
