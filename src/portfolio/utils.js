export const formatDate = (raw) => {
    if (!raw) return '';
    const date = new Date(raw);
    return isNaN(date) ? raw : date.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
}

export const mapPost = (post) => ( {
    id: post.id,
    title: post.title,
    link: post.link,
    content: post.excerpt?.rendered
        ? post.excerpt.rendered.replace(/<[^>]*>/g, '').trim()
        : '',
    featured_image_url: post?._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
    client: post.meta?.client_name || '',
    completion_date: formatDate(post.meta?.project_completion_date),
    project_url: post.meta?.project_url || '',
    gallery_images: post.gallery_images || [],
    gallery_count: post.gallery_images?.length || 0
} );

const caches = new Map();
const CACHE_TTL = 3000; // Need to implement TTL to invalidate cache

/**
 * Utility general function to fetch posts from WP CPT.
 * @param {string} BASE_URL 
 * @param {number} PER_PAGE 
 * @param {object} params 
 * @returns object
 */
export const fetchPosts = async (BASE_URL, PER_PAGE, params = {}) => {
    const { page = 1, category = 'all', search = "" } = params;

    const key = JSON.stringify( params );
    if( caches.has( key ) ) {
        return caches.get( key );
    }

    let url = `${BASE_URL}?per_page=${PER_PAGE}&page=${page}&_embed`;

    if (category !== 'all') {
        url += `&sblock_portfolio_category=${category}`;
    }

    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        const mapped = data?.map( mapPost ) || [];
        const totalPages = Number( response.headers.get( 'X-WP-TotalPages' ) );
        const totalPosts = Number( response.headers.get( 'X-WP-Total' ) );

        caches.set( key, { data: mapped, totalPages, totalPosts } );

        return {
            data: mapped,
            totalPosts,
            totalPages
        }
    } catch (err) {
        console.log('Error getting portfolio posts: ', err);
        return [];
    }
}

/**
 * Convert input number into Array.
 * @param {number} size 
 * @returns 
 */
export const range = (size) => {
	return Array.from({ length: size }, (_, i) => i + 1);
}

/**
 * Get Pagination Numder as an Array.
 * @param {number} current 
 * @param {number} total 
 * @returns array
 */
export function getPageNumbers(currentPage, totalPages) {
    if( totalPages <= 1 ) return [];
    
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const delta = 2;

    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd   = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);

    if (rangeStart > 2) {
        pages.push('...');
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i);
    }

    if (rangeEnd < totalPages - 1) {
        pages.push('...');
    }

    pages.push(totalPages);

    return pages;
}