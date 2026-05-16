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