import { store, getContext } from '@wordpress/interactivity';
import { mapPost, formatDate } from './utils';
const BASE_URL = '/devspark/wordpress-backend/wp-json/wp/v2/sblock_portfolio';
const PER_PAGE = 3;
let searchTimeout;

const fetchPosts = async (page, categoryId) => {

    let url = `${BASE_URL}?per_page=${PER_PAGE}&page=${page}&_embed`;

    if (categoryId !== 'all') {
        url += `&sblock_portfolio_category=${categoryId}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    const totalPosts = Number(response.headers.get('X-WP-Total'));
    const totalPages = Number(response.headers.get('X-WP-TotalPages'));

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

            const { data, totalPages } = await fetchPosts(context.page, context.selectedCategory);
            context.posts = data;

            context.isLoading = false;
            context.isLastPage = context.page >= totalPages;
        },
        loadMore: async () => {
            const context = getContext();

            if (context.isLoading || context.isLastPage) return;

            context.page += 1;
            context.isLoading = true;
            context.isLastPage = false;

            // console.log( 'fetching page:', context.page ); // what page?

            const { data, totalPosts, totalPages } = await fetchPosts(context.page, context.selectedCategory);

            // console.log( 'Remaining pages', totalPages - context.page );
            context.isLastPage = context.page >= totalPages;

            context.posts = [...context.posts, ...data];
            context.isLoading = false;
        },
        setSearchTerm: async (e) => {
            const context = getContext();
            context.isLoading = true;
            context.searchTerm = e.target.value;

            clearTimeout(searchTimeout);

            searchTimeout = setTimeout(async () => {
                try {

                    const response = await fetch(`${BASE_URL}?search=${context.searchTerm}&per_page=${PER_PAGE}&_embed`);
                    const data = await response.json();
                    context.posts = data.map(mapPost);
                    // console.log('searched posts', data.map(mapPost));
                } catch (err) {
                    console.log('Getting error to fetch search term: ', err);
                }
            }, 300);

            context.isLoading = false;
        },
        clearSearchTerm: async () => {
            const context = getContext();
            context.searchTerm = "";

            try {

                const response = await fetch(`${BASE_URL}?search=${context.searchTerm}&per_page=${PER_PAGE}&_embed`);
                const data = await response.json();
                context.posts = data.map(mapPost);
                console.log('searched posts', data.map(mapPost));
            } catch (err) {
                console.log('Getting error to fetch search term: ', err);
            }

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