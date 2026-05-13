import { store, getContext } from '@wordpress/interactivity';

const BASE_URL = '/devspark/wordpress-backend/wp-json/wp/v2/sblock_portfolio';
const PER_PAGE = 3;

const formatDate = (raw) => {
    if (!raw) return '';
    const date = new Date(raw);
    return isNaN(date) ? raw : date.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
}

const mapPost = (post) => ({
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
});

const fetchPosts = async (page, categoryId) => {

    let url = `${BASE_URL}?per_page=${PER_PAGE}&page=${page}&_embed`;

    if (categoryId !== 'all') {
        url += `&sblock_portfolio_category=${categoryId}`;
    }

    const response = await fetch(url);
    const data = await response.json();

        console.log( 'total posts:', response.headers.get( 'X-WP-Total' ) );
    console.log( 'total pages:', response.headers.get( 'X-WP-TotalPages' ) );
    console.log( 'fetching url:', url ); // add this

    return data.map(mapPost)
}

store('sblock-portfolio', {
    actions: {
        filter: async (event) => {
            const context = getContext();
            const categoryId = event.currentTarget.value

            context.selectedCategory = categoryId;
            context.isLoading = true;
            context.page = 1;

            context.posts = await fetchPosts(context.page, context.selectedCategory);

            context.isLoading = false;
        },
        loadMore: async () => {
            const context = getContext();
            context.page += 1;
            context.isLoading = true;

            console.log( 'fetching page:', context.page ); // what page?

            const loadedPosts = await fetchPosts( context.page, context.selectedCategory );

            console.log( 'new posts count:', loadedPosts.length ); // how many returned?
            console.log( 'new post ids:', loadedPosts.map( p => p.id ) ); // same ids as page 1?

            context.posts = [ ...context.posts, ...loadedPosts ];
            context.isLoading = false;
        },
        openModal: () => {
            const context = getContext();
            context.activePost = context.item;
            context.isModalOpen = true;
            document.body.style.overflow = 'hidden';
        },
        closeModal: () => {
            const context = getContext();
            context.isModalOpen = false;
            context.activePost = null;
            document.body.style.overflow = '';
        },
        closeModalOnBackdrop: (event) => {
            if (event.target === event.currentTarget) {
                const context = getContext();
                context.isModalOpen = false;
                context.activePost = null;
                document.body.style.overflow = '';
            }
        }
    },
    callbacks: {
        modalDisplay: () => {
            const context = getContext();
            return context.isModalOpen ? 'flex' : 'none';
        },
        isActive: (event) => {
            const context = getContext();
            const el = context.element ?? event?.currentTarget;
            return el?.value === context.selectedCategory;
        },

        gridOpacity: () => {
            const context = getContext();
            return context.isLoading ? '0.4' : '1';
        },

        gridPointerEvents: () => {
            const context = getContext();
            return context.isLoading ? 'none' : 'all';
        },

        hasGallery: () => {
            const context = getContext();
            return context.activePost?.gallery_images?.length > 0;
        },
    }
})