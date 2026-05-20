import { formatDate, mapPost, range, getPageNumbers } from './utils';

describe( 'formatDate', () => {

    it( 'returns empty string for empty input', () => {
        expect( formatDate( '' ) ).toBe( '' );
        expect( formatDate( null ) ).toBe( '' );
        expect( formatDate( undefined ) ).toBe( '' );
    });

    it( 'formats ISO date correctly', () => {
        expect( formatDate( '2026-05-13' ) ).toBe( '13 May 2026' );
    });

    it( 'returns raw string if date is invalid', () => {
        expect( formatDate( 'not-a-date' ) ).toBe( 'not-a-date' );
    });
});

describe( 'mapPost', () => {

    const mockPost = {
        id:    1,
        title: { rendered: 'Test Post' },
        link:  'https://example.com',
        excerpt: { rendered: '<p>Short description</p>' },
        meta: {
            client_name:              'John Doe',
            project_completion_date:  '2026-05-13',
            project_url:              'https://project.com',
        },
        gallery_images: [
            { url: 'https://example.com/img.jpg', alt: 'Image' }
        ],
        _embedded: {
            'wp:featuredmedia': [ { source_url: 'https://example.com/featured.jpg' } ]
        },
    };

    it( 'maps post id correctly', () => {
        expect( mapPost( mockPost ).id ).toBe( 1 );
    });

    it( 'strips HTML from excerpt', () => {
        expect( mapPost( mockPost ).content ).toBe( 'Short description' );
    });

    it( 'extracts featured image url', () => {
        expect( mapPost( mockPost ).featured_image_url ).toBe( 'https://example.com/featured.jpg' );
    });

    it( 'falls back to empty string when no featured image', () => {
        const post = { ...mockPost, _embedded: {} };
        expect( mapPost( post ).featured_image_url ).toBe( '' );
    });

    it( 'maps gallery count correctly', () => {
        expect( mapPost( mockPost ).gallery_count ).toBe( 1 );
    });
});

describe( 'fetchPosts', () => {

    beforeEach( () => {
        global.fetch = jest.fn(); // mock fetch
    });

    it( 'builds correct url for all categories', async () => {
        global.fetch.mockResolvedValue({
            json: () => Promise.resolve( [] ),
            headers: { get: () => '1' },
        });

        const { fetchPosts } = await import( './utils' );
        await fetchPosts( 'https://example.com/wp-json/wp/v2/posts', 6, {
            page: 1, category: 'all', search: ''
        });

        expect( global.fetch ).toHaveBeenCalledWith(
            expect.stringContaining( 'per_page=6&page=1' )
        );
        expect( global.fetch ).not.toHaveBeenCalledWith(
            expect.stringContaining( 'sblock_portfolio_category' )
        );
    });

    it( 'adds category param when not all', async () => {
        global.fetch.mockResolvedValue({
            json: () => Promise.resolve( [] ),
            headers: { get: () => '1' },
        });

        const { fetchPosts } = await import( './utils' );
        await fetchPosts( 'https://example.com/wp-json/wp/v2/posts', 6, {
            page: 1, category: '42', search: ''
        });

        expect( global.fetch ).toHaveBeenCalledWith(
            expect.stringContaining( 'sblock_portfolio_category=42' )
        );
    });
});

describe( "range", () => {
    it( 'returns correct range array', () => {
        expect( range( 5 ) ).toEqual( [ 1, 2, 3, 4, 5 ] );
    });

    it( 'returns empty array for zero', () => {
        expect( range( 0 ) ).toEqual( [] );
    });
} );

describe("caching in fetchPosts", () => {
    let fetchPosts;

    beforeEach(async () => {
        // Clear module cache so fetchPosts internal cache resets too
        jest.resetModules();

        global.fetch = jest.fn().mockResolvedValue({
            json: () => Promise.resolve([]),
            headers: { get: () => '1' },
        });

        // Import AFTER mock is set up and modules are reset
        ({ fetchPosts } = await import('./utils'));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('caches results based on params', async () => {
        const params = { page: 1, category: 'all', search: '' };

        // First call should fetch
        await fetchPosts('https://example.com/wp-json/wp/v2/posts', 6, params);
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Second call with same params should use cache
        await fetchPosts('https://example.com/wp-json/wp/v2/posts', 6, params);
        expect(global.fetch).toHaveBeenCalledTimes(1); // still 1, served from cache
    });
});

describe( "getpageNumbers Pagi Funciton", () => {
    it( "returns empty array if params 0", () => {
        expect( getPageNumbers(0, 0) ).toEqual( [] );
    });

    it("returns correct page numbers for more than 7 total pages", () => {
        // currentPage=1, near start — no leading ellipsis
        expect( getPageNumbers(1, 10) ).toEqual( [1, 2, 3, "...", 10] );
    });

    it("returns correct page numbers for current page in the middle", () => {
        // currentPage=5, middle — ellipsis on both sides
        expect( getPageNumbers(5, 10) ).toEqual( [1, "...", 3, 4, 5, 6, 7, "...", 10] );
    });

    it("returns correct page numbers for current page near the end", () => {
        // currentPage=9, near end — no trailing ellipsis
        expect( getPageNumbers(9, 10) ).toEqual( [1, "...", 7, 8, 9, 10] );
    });
});