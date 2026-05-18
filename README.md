# Simple Block

> A production-grade WordPress Gutenberg block plugin featuring a fully interactive portfolio block — built with the WordPress Interactivity API, custom post types, SlotFill meta panels, and REST API integration.

---

## Overview

**Simple Block** started as a learning project and grew into a reference implementation for modern WordPress block development. It demonstrates real patterns used in production — not simplified examples.

The centerpiece is a **Portfolio Block** that showcases:

- Server-side rendering with PHP hydration
- Client-side filtering, search, and pagination via the WP Interactivity API
- A quick-view modal with image gallery
- Custom post type with taxonomy filtering
- Post meta management via SlotFill panels in the block editor

If you're learning Gutenberg block development or want a solid reference for iAPI patterns, this plugin is built for you.

---

## Features

- **Filterable portfolio grid** — filter by category, search by keyword, paginate with Load More
- **Quick-view modal** — opens per card, shows gallery, excerpt, and meta — no page reload
- **Single project page** — standard WP single template for full project detail
- **In-memory fetch cache** — avoids duplicate REST API calls on repeated filters
- **Debounced search** — 300ms debounce prevents unnecessary requests on keystroke
- **Server-side first** — initial posts rendered by PHP, hydrated by JS — no layout shift
- **Block editor controls** — posts per page, default category, card colors via sidebar
- **SlotFill meta panel** — client name, completion date, project URL, gallery picker in Document tab
- **REST API integration** — custom `register_rest_field` for gallery image resolution
- **Unit tested utilities** — `formatDate`, `mapPost`, `fetchPosts` covered by Jest

---

## Blocks

### Portfolio Block (`sblock/portfolio`)

A dynamic, interactive portfolio grid with filtering, search, modal preview, and load more pagination.

**Block Controls (Sidebar)**
| Control | Description |
|---------|-------------|
| Posts Per Page | Number of posts to show initially (1–24) |
| Default Category | Pre-filter by a portfolio category |
| Card Background | Card background color |
| Heading Color | Card title color |

**Post Meta Panel (Document Tab)**
| Field | Description |
|-------|-------------|
| Client Name | Client or company name |
| Completion Date | Project completion date |
| Project URL | Live project link |
| Project Gallery | Multi-image gallery picker |

---

## Requirements

- WordPress 6.4+
- PHP 8.0+
- Node.js 18+ (for development)
- npm 9+

---

## Installation

### From GitHub

```bash
cd wp-content/plugins
git clone https://github.com/dev-alamin/simple-block.git
cd simple-block
npm install
npm run build
```

Activate the plugin in **WordPress Admin → Plugins**.

### Development mode

```bash
npm run start   # watch mode with hot reload
```

### Build for production

```bash
npm run build
```

---

## Project Structure

```
simple-block/
├── simple-block.php          # Plugin entry — registers CPT, taxonomy, meta
├── src/
│   └── portfolio/            # Portfolio block
│       ├── block.json        # Block config, attributes, scripts
│       ├── edit.js           # Block editor UI
│       ├── index.js          # Block + SlotFill registration
│       ├── render.php        # Server-side render (dynamic block)
│       ├── view.js           # Frontend iAPI store
│       ├── style.scss        # Frontend styles
│       ├── editor.scss       # Editor-only styles
│       ├── utils.js          # Pure utility functions (mapPost, fetchPosts, formatDate)
│       ├── utils.test.js     # Unit tests
│       └── components/
│           ├── PortfolioGallery.js   # Gallery media picker component
│           └── PortfolioMeta.js      # Meta fields component
├── build/                    # Compiled output — do not edit
├── package.json
└── README.md
```

---

## Scripts

```bash
npm run start        # Development build with watch
npm run build        # Production build
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run lint:js      # Lint JavaScript
npm run lint:css     # Lint CSS/SCSS
```

---

## How It Works

### Architecture

```
block.json          → defines attributes, scripts, render file
render.php          → PHP query → wp_interactivity_state() → HTML with data-wp-* directives
view.js             → iAPI store → hydrates HTML → reactive on user interaction
REST API            → powers client-side filtering, search, pagination
```

### Data Flow

```
1. PHP renders initial posts server-side (fast, SEO-friendly)
2. wp_interactivity_state() seeds global state with posts + config
3. iAPI hydrates the HTML — no re-render, just attaches reactivity
4. User clicks filter → JS fetch → state.posts updates → DOM updates
5. Load More → fetch next page → append to state.posts
6. Search → debounced fetch → replace state.posts
7. Quick view → openModal action → state.activePost set → modal appears
```

### State Management

The plugin uses the WP Interactivity API's global state for all UI data:

```js
// Seeded by PHP via wp_interactivity_state()
state.posts        // current post list
state.query        // { page, category, search }
state.isLoading    // loading indicator
state.isLastPage   // hides Load More when exhausted
state.activePost   // currently open modal post
state.isModalOpen  // modal visibility
state.baseUrl      // REST API base URL
state.perPage      // posts per page
```

---

## Developer Notes

A comprehensive reference document covering every concept used in this plugin — written tutorial-style with real examples, real bugs, and real fixes.

📖 **[Read the Developer Notes](https://github.com/dev-alamin/simple-block/blob/main/developers-note.md)**

Topics covered:

- `block.json` deep dive
- Dynamic blocks and `render.php` patterns
- Custom Post Type and Taxonomy registration
- Block editor with `InspectorControls` and attributes
- SlotFill — `PluginDocumentSettingPanel` for post meta
- WP Data layer — `useSelect`, `useEntityProp`, `useDispatch`
- REST API — `register_rest_field`, pagination headers, query params
- WordPress Interactivity API — state vs context, actions, callbacks, all directives
- Performance — in-memory caching, debounce, WP_Query optimization
- Unit testing with `@wordpress/scripts`
- 13 real bugs and their fixes
- Golden rules cheatsheet

---

## Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repo
2. Create a branch — `git checkout -b feature/your-feature`
3. Commit your changes
4. Push and open a Pull Request

Please run `npm run test` and `npm run lint:js` before submitting.

---

## Roadmap

- [ ] URL sync — shareable filtered URLs with browser history support
- [ ] Infinite scroll — `IntersectionObserver` alternative to Load More
- [ ] Skeleton loading — placeholder cards during fetch
- [ ] Sort controls — newest, oldest, alphabetical
- [ ] Multiple block instances communicating via shared state
- [ ] PHP unit tests with PHPUnit

---

## License

GPL-2.0 — see [LICENSE](LICENSE) for details.

---

## Author

**Al Amin**  
WordPress block developer  
[github.com/dev-alamin](https://github.com/dev-alamin)

---

*Built block by block — literally.*