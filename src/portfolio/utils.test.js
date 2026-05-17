import { formatDate, mapPost } from './utils';

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