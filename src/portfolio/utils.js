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

export const fetchPosts = async (BASE_URL, PER_PAGE, params = {}) => {
    const { page = 1, category = 'all', search = "" } = params;

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

        const totalPages = Number(response.headers.get('X-WP-TotalPages'));

        return {
            data: data?.map(mapPost),
            totalPages: totalPages
        }
    } catch (err) {
        console.log('Error getting portfolio posts: ', err);
        return [];
    }
}