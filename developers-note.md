# WordPress Block Development — Developer Notes
> **Author:** Al Amin  
> **Repo:** [github.com/dev-alamin/simple-block](https://github.com/dev-alamin/simple-block)  
> **Purpose:** Production-grade learning reference — built through real problems, real bugs, real fixes.  
> **Stack:** PHP · JavaScript · WordPress Interactivity API · Gutenberg Block Editor

---

## Table of Contents

1. [Plugin Structure](#1-plugin-structure)
2. [block.json — The Block Brain](#2-blockjson--the-block-brain)
3. [Dynamic Blocks & render.php](#3-dynamic-blocks--renderphp)
4. [Custom Post Type & Taxonomy](#4-custom-post-type--taxonomy)
5. [Block Editor — edit.js](#5-block-editor--editjs)
6. [SlotFill — Post Meta Fields](#6-slotfill--post-meta-fields)
7. [WP Data Layer](#7-wp-data-layer)
8. [REST API Integration](#8-rest-api-integration)
9. [WordPress Interactivity API (iAPI)](#9-wordpress-interactivity-api-iapi)
10. [State vs Context — Deep Dive](#10-state-vs-context--deep-dive)
11. [Performance Patterns](#11-performance-patterns)
12. [Unit Testing](#12-unit-testing)
13. [Common Bugs & Fixes](#13-common-bugs--fixes)
14. [Quick Reference Cheatsheet](#14-quick-reference-cheatsheet)

---

## 1. Plugin Structure

```
simple-block/
├── simple-block.php          # Plugin entry point
├── src/
│   ├── portfolio/            # Portfolio block
│   │   ├── block.json        # Block config — the brain
│   │   ├── edit.js           # Editor UI
│   │   ├── index.js          # Block registration + SlotFill
│   │   ├── render.php        # Server-side render (dynamic block)
│   │   ├── view.js           # Frontend iAPI store
│   │   ├── style.scss        # Frontend styles
│   │   ├── editor.scss       # Editor-only styles
│   │   ├── utils.js          # Pure utility functions
│   │   └── utils.test.js     # Unit tests
│   │   └── components/
│   │       └── PortfolioGallery.js
├── build/                    # Compiled output (wp-scripts)
├── package.json
└── README.md
```

**Why this structure?**  
Each block is a self-contained folder. `block.json` is the single source of truth — it tells WordPress everything: attributes, scripts, styles, supports. Everything else follows from it.

---

## 2. block.json — The Block Brain

```json
{
    "$schema": "https://schemas.wp.org/trunk/block.json",
    "apiVersion": 3,
    "name": "sblock/portfolio",
    "version": "0.1.0",
    "title": "Portfolio",
    "category": "widgets",
    "icon": "portfolio",
    "description": "A filterable portfolio grid with modal preview.",
    "supports": {
        "html": false,
        "align": ["wide", "full"]
    },
    "attributes": {
        "postsPerPage": {
            "type": "number",
            "default": 6
        },
        "category": {
            "type": "string",
            "default": "all"
        },
        "cardBackground": {
            "type": "string",
            "default": "#ffffff"
        },
        "headingColor": {
            "type": "string",
            "default": "#000000"
        }
    },
    "textdomain": "simple-block",
    "editorScript": "file:./index.js",
    "editorStyle": "file:./editor.css",
    "style": "file:./style-index.css",
    "viewScript": "file:./view.js",
    "render": "file:./render.php",
    "interactivity": true
}
```

**Key concepts:**

- `"render": "file:./render.php"` — makes it a **dynamic block**. No `save.js` needed. PHP renders the HTML every time.
- `"viewScript"` — only loaded on the frontend (not in the editor). This is where your iAPI `view.js` goes.
- `"interactivity": true` — required to use the WP Interactivity API.
- `"attributes"` — everything you want to persist in the database and pass to `render.php` goes here. Think of attributes as the block's settings.

---

## 3. Dynamic Blocks & render.php

A **dynamic block** renders its HTML via PHP on every page load instead of saving static HTML to the database. This is the right choice when:
- Content comes from a database query (posts, terms)
- Output depends on the current user, date, or other runtime values
- You need server-side filtering or access control

```php
<?php
// $attributes comes from block.json attributes — automatically available
// $content is the inner blocks content (not used in dynamic blocks usually)
// $block is the WP_Block object

$posts_per_page    = $attributes['postsPerPage'] ?? 6;
$selected_category = $attributes['category'] ?? 'all';
$card_background   = $attributes['cardBackground'] ?? '#ffffff';

// Run your query
$args = array(
    'post_type'      => 'sblock_portfolio',
    'posts_per_page' => $posts_per_page,
    'post_status'    => 'publish',
    'no_found_rows'  => false, // set true if you don't need total count — faster
);

// Conditional taxonomy filter
if ( ! empty( $selected_category ) && 'all' !== $selected_category ) {
    $args['tax_query'] = array(
        array(
            'taxonomy' => 'sblock_portfolio_category',
            'field'    => 'term_id',
            'terms'    => (int) $selected_category,
        ),
    );
}

$query = new WP_Query( $args );

// Build posts array for iAPI hydration
$posts = array();

if ( $query->have_posts() ) {
    while ( $query->have_posts() ) {
        $query->the_post();

        $raw_date    = get_post_meta( get_the_ID(), 'project_completion_date', true );
        $gallery_raw = get_post_meta( get_the_ID(), 'project_gallery' ); // no 'true' = nested array

        $gallery = array_map( function( $id ) {
            return array(
                'url' => wp_get_attachment_image_url( $id, 'large' ),
                'alt' => get_post_meta( $id, '_wp_attachment_image_alt', true )
                        ?: get_the_title( $id ),
            );
        }, $gallery_raw[0] ?: [] );

        $posts[] = array(
            'id'                 => get_the_ID(),
            'title'              => array( 'rendered' => get_the_title() ),
            'content'            => get_the_excerpt(),
            'link'               => get_permalink(),
            'featured_image_url' => get_the_post_thumbnail_url( get_the_ID(), 'large' ),
            'client'             => get_post_meta( get_the_ID(), 'client_name', true ) ?: '',
            'completion_date'    => $raw_date
                                    ? date_i18n( 'F j, Y', strtotime( $raw_date ) )
                                    : '',
            'gallery_images'     => $gallery,
            'gallery_count'      => count( $gallery ),
        );
    }

    wp_reset_postdata(); // always reset after a custom query
}
```

**`get_post_meta` — third argument matters:**

```php
get_post_meta( $id, 'key', true );  // returns value directly → "John Doe"
get_post_meta( $id, 'key' );        // returns array of all values → [ [ 123, 456 ] ]
```

For gallery IDs stored as an array, omit `true` and access `$result[0]` to get the array.

**PHP date formatting:**

```php
// Always use date_i18n() not date() — respects WP locale and timezone
date_i18n( 'F j, Y', strtotime( $raw_date ) ); // → "May 13, 2026"
```

**PHP null coalescing vs Elvis:**

```php
$value ?? 'fallback';  // only catches null/undefined — won't catch empty string or 0
$value ?: 'fallback';  // catches all falsy — empty string, 0, null, false
```

Use `?:` for meta values (empty string should fall back). Use `??` for array key access where 0 is a valid value.

---

## 4. Custom Post Type & Taxonomy

```php
// Register CPT
add_action( 'init', function() {
    register_post_type( 'sblock_portfolio', array(
        'labels'      => array(
            'name'          => 'Portfolio',
            'singular_name' => 'Portfolio Item',
        ),
        'public'      => true,
        'has_archive' => true,
        'supports'    => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
        'show_in_rest'=> true, // required for Gutenberg and REST API
        'rewrite'     => array( 'slug' => 'sblock_portfolio' ),
    ));

    register_taxonomy( 'sblock_portfolio_category', 'sblock_portfolio', array(
        'labels'       => array(
            'name'          => 'Portfolio Categories',
            'singular_name' => 'Category',
        ),
        'hierarchical' => true,
        'show_in_rest' => true, // required for REST API
        'rewrite'      => array( 'slug' => 'portfolio-category' ),
    ));
});
```

**`show_in_rest: true` is mandatory** for:
- Gutenberg to work with the post type
- The REST API to expose the post type
- `useSelect` / `useEntityProp` hooks to access it in the editor

---

## 5. Block Editor — edit.js

```jsx
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, PanelRow, RangeControl, SelectControl, ColorPicker } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

export default function Edit( { attributes, setAttributes } ) {
    const { postsPerPage, category, cardBackground, headingColor } = attributes;

    const terms = useSelect( ( select ) => {
        return select( 'core' ).getEntityRecords( 'taxonomy', 'sblock_portfolio_category', {
            per_page: -1,
            hide_empty: true,
        });
    }, [] );

    const categoryOptions = [
        { label: 'All', value: 'all' },
        ...( terms || [] ).map( ( term ) => ({
            label: term.name,
            value: String( term.id ),
        })),
    ];

    return (
        <>
            <InspectorControls>
                <PanelBody title="Query Settings" initialOpen={ true }>
                    <RangeControl
                        label="Posts Per Page"
                        value={ postsPerPage }
                        onChange={ ( val ) => setAttributes({ postsPerPage: val }) }
                        min={ 1 }
                        max={ 24 }
                    />
                    <SelectControl
                        label="Default Category"
                        value={ category }
                        options={ categoryOptions }
                        onChange={ ( val ) => setAttributes({ category: val }) }
                    />
                </PanelBody>

                <PanelBody title="Card Style" initialOpen={ false }>
                    <PanelRow>
                        <label>Card Background</label>
                        <ColorPicker
                            color={ cardBackground }
                            onChange={ ( val ) => setAttributes({ cardBackground: val }) }
                        />
                    </PanelRow>
                </PanelBody>
            </InspectorControls>

            <div { ...useBlockProps() }>
                <p>Portfolio Block — configure in sidebar →</p>
            </div>
        </>
    );
}
```

**Key concepts:**

- `attributes` — the values from `block.json`, stored in the DB, passed to `render.php`
- `setAttributes` — the only way to update attribute values. Never mutate `attributes` directly.
- `InspectorControls` — renders into the right sidebar panel. Requires import from `@wordpress/block-editor`.
- `useBlockProps()` — required on the root editor element. Applies accessibility, selection, and block wrapper attributes.

---

## 6. SlotFill — Post Meta Fields

SlotFill lets you **inject UI into existing editor areas** without modifying core. The `PluginDocumentSettingPanel` SlotFill adds a panel to the Document tab in the sidebar.

```jsx
// index.js — block registration AND SlotFill registration
import { registerBlockType } from '@wordpress/blocks';
import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import Edit from './edit';
import metadata from './block.json';
import PortfolioGallery from './components/PortfolioGallery';
import PortfolioMeta from './components/PortfolioMeta';

// 1. Register the block
registerBlockType( metadata.name, {
    edit: Edit,
    save: () => null, // dynamic block — PHP renders
});

// 2. Register the SlotFill plugin — shows only on our CPT
registerPlugin( 'sblock-portfolio-meta', {
    render: () => {
        // Conditionally render only on sblock_portfolio post type
        const postType = useSelect( ( select ) =>
            select( 'core/editor' ).getCurrentPostType()
        );

        if ( postType !== 'sblock_portfolio' ) return null;

        return (
            <PluginDocumentSettingPanel
                name="portfolio-meta"
                title="Project Details"
                className="portfolio-meta-panel"
            >
                <PortfolioMeta />
                <PortfolioGallery />
            </PluginDocumentSettingPanel>
        );
    },
});
```

**Why SlotFill over InspectorControls for meta?**

`InspectorControls` only shows when your block is selected. `PluginDocumentSettingPanel` shows in the Document tab always — better UX for post-level meta that belongs to the post, not a specific block instance.

---

## 7. WP Data Layer

The WP Data layer is WordPress's state management system in the editor — powered by `@wordpress/data`.

### `useSelect` — read data

```jsx
import { useSelect } from '@wordpress/data';

// Read terms from the core store
const terms = useSelect( ( select ) => {
    return select( 'core' ).getEntityRecords( 'taxonomy', 'sblock_portfolio_category', {
        per_page: -1,
    });
}, [] ); // dependency array — re-runs when these change
```

`getEntityRecords` returns `null` while loading — always guard:

```jsx
if ( ! terms ) return <Spinner />;
```

### `useEntityProp` — read/write post meta

```jsx
import { useEntityProp } from '@wordpress/core-data';

const PortfolioMeta = () => {
    const [ meta, setMeta ] = useEntityProp( 'postType', 'sblock_portfolio', 'meta' );

    const clientName = meta?.client_name || '';

    return (
        <TextControl
            label="Client Name"
            value={ clientName }
            onChange={ ( val ) => setMeta({ ...meta, client_name: val }) }
        />
    );
};
```

**Why spread `...meta`?** Meta is an object with many keys. `setMeta` replaces the whole object — if you don't spread, you lose all other meta fields.

### `useDispatch` — trigger actions

```jsx
import { useDispatch } from '@wordpress/data';

const { savePost } = useDispatch( 'core/editor' );
// Call savePost() to programmatically save
```

### Register meta for REST API access

Meta fields must be registered in PHP to be accessible in the editor and REST API:

```php
add_action( 'init', function() {
    $meta_fields = [
        'client_name'              => 'string',
        'project_completion_date'  => 'string',
        'project_url'              => 'string',
        'project_gallery'          => 'array',
    ];

    foreach ( $meta_fields as $key => $type ) {
        register_post_meta( 'sblock_portfolio', $key, array(
            'show_in_rest'  => true,  // makes it available to editor
            'single'        => true,
            'type'          => $type,
            'auth_callback' => function() {
                return current_user_can( 'edit_posts' );
            },
        ));
    }
});
```

---

## 8. REST API Integration

### Expose custom data via `register_rest_field`

By default, the REST API only exposes standard fields. Custom meta is in `meta` but gallery IDs aren't image URLs. Use `register_rest_field` to add computed fields:

```php
add_action( 'rest_api_init', function() {
    register_rest_field( 'sblock_portfolio', 'gallery_images', array(
        'get_callback' => function( $post ) {
            $ids = get_post_meta( $post['id'], 'project_gallery', true );
            return array_map( function( $id ) {
                return array(
                    'url' => wp_get_attachment_image_url( $id, 'large' ),
                    'alt' => get_post_meta( $id, '_wp_attachment_image_alt', true )
                            ?: get_the_title( $id ),
                );
            }, $ids ?: [] );
        },
    ));
});
```

Now `gallery_images` appears in every REST response automatically.

### Useful REST API query params

```
/wp-json/wp/v2/sblock_portfolio
    ?per_page=6
    &page=2
    &_embed                              # includes featured media, terms
    &sblock_portfolio_category=42        # filter by term ID
    &search=keyword                      # full-text search
    &orderby=date&order=desc             # sorting
```

### Pagination headers

```js
const response  = await fetch( url );
const total     = response.headers.get( 'X-WP-Total' );      // total posts
const totalPages = response.headers.get( 'X-WP-TotalPages' ); // total pages
```

Always use these headers to know when to hide "Load More".

---

## 9. WordPress Interactivity API (iAPI)

The WP Interactivity API is WordPress's official reactive frontend framework for blocks. Think Alpine.js but built into WordPress.

### How it works

```
PHP (render.php)
  → Sets initial state via wp_interactivity_state()
  → Sets instance data via data-wp-context
  → Renders HTML with data-wp-* directives

JavaScript (view.js)
  → Registers store with actions and callbacks
  → Hydrates the HTML — no re-render, just attaches reactivity
  → Actions update state/context → DOM updates automatically
```

### Setting up

```php
// render.php — seed initial data
wp_interactivity_state( 'sblock-portfolio', array(
    'baseUrl'    => rest_url( 'wp/v2/sblock_portfolio' ),
    'perPage'    => $posts_per_page,
    'posts'      => $posts,
    'isLoading'  => false,
    'isLastPage' => false,
    'isModalOpen'=> false,
    'activePost' => null,
    'query'      => array(
        'page'     => 1,
        'search'   => '',
        'category' => $selected_category ?: 'all',
    ),
));
```

```html
<!-- The block wrapper — required attributes -->
<div
    data-wp-interactive="sblock-portfolio"
    data-wp-context='{ "filterValue": "all" }'
>
    <!-- your block HTML -->
</div>
```

```js
// view.js
import { store, getContext, getElement } from '@wordpress/interactivity';

const { state } = store( 'sblock-portfolio', {
    actions:   { ... },
    callbacks: { ... },
});
```

### Directives reference

| Directive | Purpose | Example |
|-----------|---------|---------|
| `data-wp-interactive` | Marks the block root | `data-wp-interactive="my-plugin"` |
| `data-wp-context` | Sets local instance data | `data-wp-context='{"key": "val"}'` |
| `data-wp-text` | Sets text content | `data-wp-text="state.title"` |
| `data-wp-bind--{attr}` | Binds any HTML attribute | `data-wp-bind--href="state.url"` |
| `data-wp-bind--hidden` | Show/hide (server renders) | `data-wp-bind--hidden="!state.client"` |
| `data-wp-style--{prop}` | Binds inline style | `data-wp-style--display="callbacks.modalDisplay"` |
| `data-wp-class--{class}` | Toggles a CSS class | `data-wp-class--is-active="callbacks.isActive"` |
| `data-wp-on--{event}` | Attaches event listener | `data-wp-on--click="actions.openModal"` |
| `data-wp-each` | Loops over an array | `data-wp-each="state.posts"` |
| `data-wp-if` | Conditional render | `data-wp-if="!state.posts.length"` |
| `data-wp-init` | Runs callback on mount | `data-wp-init="callbacks.onMount"` |

### `data-wp-each` and `context.item`

Inside a `data-wp-each` loop, the current iteration item is automatically available as `context.item` — it's a reserved iAPI keyword:

```html
<template data-wp-each="state.posts">
    <article>
        <h3 data-wp-text="context.item.title.rendered"></h3>
        <a  data-wp-bind--href="context.item.link">View</a>
    </article>
</template>
```

You cannot rename `context.item` — this causes problems with nested loops. Solution: flatten data in PHP, or move inner loop outside the outer loop (modal pattern).

### `<template>` vs regular elements for conditionals

```html
<!-- ✅ Use <template> for data-wp-if — inert, nothing renders until condition is true -->
<template data-wp-if="context.item.client">
    <p>Client: <span data-wp-text="context.item.client"></span></p>
</template>

<!-- ✅ Use data-wp-bind--hidden for show/hide on regular elements -->
<p data-wp-bind--hidden="!state.activePost.client">
    <span data-wp-text="state.activePost.client"></span>
</p>

<!-- ❌ data-wp-if on a regular element still renders server-side -->
<p data-wp-if="context.item.client">...</p>
```

`<template>` is completely inert — nothing inside it renders or executes until the iAPI evaluates the condition. Use it for `data-wp-if` and `data-wp-each`.

**Nested `<template>` issue:** Nested `data-wp-if` inside `data-wp-each` is unreliable in the current iAPI. Use `data-wp-bind--hidden` on a regular element instead.

---

## 10. State vs Context — Deep Dive

This is the most important concept to understand in iAPI.

### State — global, shared

```
wp_interactivity_state() in PHP  +  state: {} in store()  →  merged into ONE global state object
```

- One copy for the **entire page**
- Shared across **all instances** of all blocks with the same namespace
- Accessible via destructured `const { state } = store()`
- Safe to destructure because it's a **persistent proxy** — the reference never changes

```js
const { state } = store( 'my-plugin', {
    state: { count: 0 },
    actions: {
        increment: () => {
            state.count += 1; // ✅ safe — state is a persistent proxy
        }
    }
});
```

### Context — local, per DOM element

- One copy **per element** with `data-wp-context`
- Private to that block instance
- Must be read via `getContext()` inside actions/callbacks
- **Never destructure to write** — you lose the proxy connection

```js
actions: {
    doSomething: () => {
        const context = getContext();       // ✅ get fresh proxy
        context.isLoading = true;           // ✅ updates DOM

        const { isLoading } = getContext(); // ❌ primitive copy — proxy lost
        isLoading = true;                   // ❌ does nothing
    }
}
```

### When to use which

| Use State for | Use Context for |
|---------------|-----------------|
| Posts list | `context.item` (loop variable) |
| isLoading, isModalOpen | Per-button data (`filterValue`) |
| activePost | Things truly unique per DOM node |
| query params (page, search, category) | |
| Config (baseUrl, perPage) | |
| Anything shared across block instances | |

### PHP merging rule

If you define the same key in both PHP `wp_interactivity_state()` and JS `store( state: {} )`, **PHP wins** because it's rendered into the HTML before JS runs.

```php
wp_interactivity_state( 'my-plugin', [ 'posts' => $posts ] ); // PHP sets real data
```

```js
store( 'my-plugin', {
    state: {
        // ❌ don't define 'posts: []' here — it would race with PHP value
        isLoading: false, // ✅ fine — PHP doesn't set this
    }
});
```

**Rule:** Only define in JS state what PHP doesn't set.

### `getContext()` only works inside iAPI-triggered functions

```js
// ✅ works — called inside an action triggered by iAPI
actions: {
    openModal: () => {
        const context = getContext(); // ✅
    }
}

// ❌ fails — outside iAPI execution context
setTimeout( () => {
    const context = getContext(); // ❌ undefined or wrong context
}, 1000 );
```

---

## 11. Performance Patterns

### In-memory fetch cache

Prevents duplicate network requests when the user clicks the same filter multiple times:

```js
// utils.js
const cache = new Map();

export const fetchPosts = async ( baseUrl, perPage, params = {} ) => {
    const key = JSON.stringify( params );

    if ( cache.has( key ) ) {
        return cache.get( key ); // instant — no network call
    }

    let url = `${ baseUrl }?per_page=${ perPage }&page=${ params.page || 1 }&_embed`;

    if ( params.category && params.category !== 'all' ) {
        url += `&sblock_portfolio_category=${ params.category }`;
    }

    if ( params.search ) {
        url += `&search=${ encodeURIComponent( params.search ) }`;
    }

    const response   = await fetch( url );
    const data       = await response.json();
    const mapped     = data?.map( mapPost ) || [];
    const totalPages = Number( response.headers.get( 'X-WP-TotalPages' ) ) || 1;

    const result = { data: mapped, totalPages };
    cache.set( key, result ); // store for next time

    return result;
};
```

### Debounce for search

Prevents a fetch on every keystroke:

```js
let searchTimeout;

actions: {
    setSearchTerm: async ( e ) => {
        state.query.search = e.target.value;
        state.query.page   = 1;
        state.isLoading    = true;

        clearTimeout( searchTimeout );

        searchTimeout = setTimeout( async () => {
            try {
                const { data, totalPages } = await fetchPosts(
                    state.baseUrl, state.perPage, state.query
                );
                state.posts     = data;
                state.isLastPage = state.query.page >= totalPages;
            } catch ( err ) {
                console.error( err );
            } finally {
                state.isLoading = false; // ✅ inside timeout, after fetch
            }
        }, 300 ); // wait 300ms after last keystroke
    }
}
```

**Common mistake:** Setting `isLoading = false` after the `setTimeout` call (outside it) — it fires immediately, not after the fetch completes.

### WP_Query optimization

```php
$args = array(
    'post_type'      => 'sblock_portfolio',
    'posts_per_page' => $posts_per_page,
    'no_found_rows'  => true,  // skips COUNT(*) SQL query — faster when you don't need total
    'update_post_meta_cache' => true,  // batches meta queries
    'update_post_term_cache' => true,  // batches term queries
);
```

### Image sizes — right size for the right place

```php
// Card thumbnail
get_the_post_thumbnail_url( get_the_ID(), 'medium' );   // 300px — fast

// Modal gallery
wp_get_attachment_image_url( $id, 'large' );            // 1024px — quality

// Never use 'full' for grids — wastes bandwidth
```

---

## 12. Unit Testing

### Setup

```bash
npm install --save-dev @wordpress/scripts
```

```json
// package.json
{
    "scripts": {
        "test":       "wp-scripts test-unit-js",
        "test:watch": "wp-scripts test-unit-js --watch"
    }
}
```

No Jest config needed — `@wordpress/scripts` handles everything.

### File location

Co-locate test files next to the file being tested:

```
src/portfolio/
├── utils.js
└── utils.test.js   ← right next to utils.js
```

### What to test

```
✅ Test  — pure utility functions (formatDate, mapPost, URL building)
✅ Test  — edge cases (missing meta, no image, invalid date, empty array)
✅ Test  — fetch URL construction with different params

❌ Skip  — iAPI store (too coupled to WP internals)
❌ Skip  — DOM interactions (use Playwright/Cypress for E2E)
❌ Skip  — WP PHP functions (use PHPUnit for that)
```

### Example test

```js
// utils.test.js
import { formatDate, mapPost } from './utils';

describe( 'formatDate', () => {
    it( 'returns empty string for falsy input', () => {
        expect( formatDate( '' ) ).toBe( '' );
        expect( formatDate( null ) ).toBe( '' );
        expect( formatDate( undefined ) ).toBe( '' );
    });

    it( 'formats ISO date correctly', () => {
        expect( formatDate( '2026-05-13' ) ).toBe( '13 May 2026' );
    });

    it( 'returns raw string if unparseable', () => {
        expect( formatDate( 'not-a-date' ) ).toBe( 'not-a-date' );
    });
});

describe( 'mapPost — edge cases', () => {
    it( 'falls back gracefully when featured media missing', () => {
        const post = { id: 1, title: {}, link: '', meta: {}, _embedded: {} };
        expect( mapPost( post ).featured_image_url ).toBe( '' );
    });

    it( 'returns empty gallery_count when no gallery', () => {
        const post = { id: 1, title: {}, link: '', meta: {}, gallery_images: [] };
        expect( mapPost( post ).gallery_count ).toBe( 0 );
    });
});
```

---

## 13. Common Bugs & Fixes

### `callBacks` typo — nothing works

```js
// ❌ wrong — capital B, iAPI ignores entirely
callBacks: { ... }

// ✅ correct
callbacks: { ... }
```

### `selectedCategory=0` — REST returns empty

When PHP initializes `selectedCategory` as `0` (default attribute), JS builds URLs like `&sblock_portfolio_category=0` — category 0 doesn't exist.

```php
// ❌ wrong
'category' => (string) $selected_category, // → "0"

// ✅ correct
'category' => $selected_category && $selected_category !== 'all'
              ? (string) $selected_category
              : 'all',
```

### `data-wp-bind--hidden` doesn't hide on load

`hidden` is a real HTML attribute — it renders server-side regardless of iAPI. Use `data-wp-style--display` for elements that should start hidden:

```js
// callbacks
modalDisplay: () => state.isModalOpen ? 'flex' : 'none',
```

```html
data-wp-style--display="callbacks.modalDisplay"
```

```css
.portfolio-modal-backdrop {
    display: none; /* hidden by default before JS hydrates */
}
```

### `getContext()` returns wrong data

`getContext()` only works correctly when called **synchronously inside an iAPI action or callback**. Calling it after `await` or inside a `setTimeout` loses the binding:

```js
// ❌ wrong
actions: {
    loadMore: async () => {
        const context = getContext();
        await fetch( url );
        context.posts = data; // ✅ actually fine — context captured before await
    }
}

// ❌ wrong — inside setTimeout
setTimeout( () => {
    const context = getContext(); // wrong context or undefined
}, 300 );
```

Capture context at the top of the action before any async operations.

### Nested `<template>` unreliable

`data-wp-if` inside `data-wp-each` template doesn't always work. Use `data-wp-bind--hidden` on a real element instead:

```html
<!-- ❌ unreliable -->
<template data-wp-each="state.posts">
    <template data-wp-if="context.item.client">...</template>
</template>

<!-- ✅ reliable -->
<template data-wp-each="state.posts">
    <p data-wp-bind--hidden="!context.item.client">...</p>
</template>
```

### `media_details` crash in editor component

`getEntityRecords` returns `null` while loading. Always guard:

```js
const galleryImages = useSelect( ( select ) => {
    if ( ! galleryIds?.length ) return [];

    const attachments = select( 'core' ).getEntityRecords( 'postType', 'attachment', {
        include: galleryIds,
        per_page: -1,
    });

    if ( ! attachments ) return null; // still loading — show Spinner

    return attachments.map( ( img ) => ({
        id:  img.id,
        url: img?.media_details?.sizes?.thumbnail?.source_url
            || img?.media_details?.sizes?.medium?.source_url
            || img?.source_url || '',
        alt: img?.alt_text || '',
    }));
}, [ galleryIds ] );
```

### `isLoading` false before search fetch completes

```js
// ❌ wrong — isLoading = false runs immediately
setSearchTerm: async ( e ) => {
    state.isLoading = true;
    setTimeout( async () => {
        const data = await fetch( ... );
        state.posts = data;
    }, 300 );
    state.isLoading = false; // fires before fetch completes
}

// ✅ correct — isLoading = false inside the timeout
setSearchTerm: async ( e ) => {
    state.isLoading = true;
    setTimeout( async () => {
        const data = await fetch( ... );
        state.posts = data;
        state.isLoading = false; // fires after fetch
    }, 300 );
}
```

---

## 14. Quick Reference Cheatsheet

### PHP → iAPI data flow

```php
// Config (never changes) + initial posts → state
wp_interactivity_state( 'namespace', [ 'posts' => $posts, 'baseUrl' => rest_url() ] );

// Per-instance data → context
$context = array( 'filterValue' => 'all' );
echo 'data-wp-context="' . esc_attr( wp_json_encode( $context ) ) . '"';
```

### Store shape

```js
const { state } = store( 'namespace', {
    // state: {}       — only define keys PHP doesn't set
    actions:   {},     // change state/context, handle events
    callbacks: {},     // read state/context, return derived values for directives
});
```

### iAPI mental model

```
state     →  Redux store   (global, whole page, persistent proxy)
context   →  useState      (local, per DOM element, fresh proxy each call)
actions   →  event handlers (write to state/context)
callbacks →  computed values (read state/context, return value for directive)
```

### The Golden Rules

1. **Never define in JS state what PHP already sets** — PHP wins on merge
2. **Never destructure `getContext()` to write** — loses proxy, DOM won't update
3. **Always capture `getContext()` at the top of an action** — before any `await`
4. **Use `<template>` for `data-wp-if`** — regular elements render server-side
5. **Use `data-wp-bind--hidden` inside loops** — more reliable than nested `<template data-wp-if>`
6. **`isLoading = false` goes inside async callbacks** — not after them
7. **`selectedCategory` default must be `'all'`** — not `0` or empty string
8. **`wp_reset_postdata()`** — always call after a custom `WP_Query`
9. **`show_in_rest: true`** — required on CPT and meta for Gutenberg to work
10. **Test pure functions** — keep business logic in `utils.js`, keep it testable

---

*Built with real problems, real bugs, real fixes. — Al Amin*  
*Repo: [github.com/dev-alamin/simple-block](https://github.com/dev-alamin/simple-block)*