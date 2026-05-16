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

    const totalPosts = response.headers.get( 'X-WP-Total' );
    const totalPages = response.headers.get( 'X-WP-TotalPages' );

    return {
        data: data.map(mapPost),
        totalPosts: totalPosts,
        totalPages: totalPages
    }
}

store('sblock-portfolio', {
    actions: {
        filter: async (event) => {
            const context = getContext();
            const categoryId = event.currentTarget.value

            context.selectedCategory = categoryId;
            context.isLoading = true;
            context.isLastPage = false;
            context.page = 1;

            const {data, totalPages} = await fetchPosts(context.page, context.selectedCategory);
            context.posts = data;

            context.isLoading = false;
            ( totalPages - context.page ) === 0 ?  context.isLastPage = true : context.isLastPage = false;
        },
        loadMore: async () => {
            const context = getContext();
            context.page += 1;
            context.isLoading = true;
            context.isLastPage = false;
            
            // console.log( 'fetching page:', context.page ); // what page?
            
            const {data, totalPosts, totalPages} = await fetchPosts( context.page, context.selectedCategory );
            
            // console.log( 'Remaining pages', totalPages - context.page );
            ( totalPages - context.page ) === 0 ?  context.isLastPage = true : context.isLastPage = false;

            context.posts = [ ...context.posts, ...data ];
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
        setIsLastPage: () => {
            const context = getContext();
            return context.isLastPage;
        },
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