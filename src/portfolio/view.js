import { store, getContext, getElement } from '@wordpress/interactivity';
import { mapPost, formatDate, fetchPosts } from './utils';

let searchTimeout;

const { state } = store('sblock-portfolio', {
    actions: {
        filter: async (event) => {
            const categoryId = event.currentTarget.value

            state.query.category = categoryId;
            state.isLoading = true;
            state.isLastPage = false;
            state.query.page = 1;

            const { data, totalPages } = await fetchPosts(state.baseUrl, state.perPage, state.query);
            state.posts = data;

            state.isLastPage = state.query.page >= totalPages;
            state.isLoading = false;
        },
        loadMore: async () => {
            if (state.isLoading || state.isLastPage) return;

            state.query.page += 1;
            state.isLoading = true;
            state.isLastPage = false;

            // console.log( 'fetching page:', state.page ); // what page?

            const { data, totalPages } = await fetchPosts(state.baseUrl, state.perPage, state.query);
            console.log(totalPages);

            state.isLastPage = state.query.page >= totalPages;

            // state.posts = [...state.posts, ...data]; // Append items
            state.posts = data; // replace items
            state.isLoading = false;
        },
        setSearchTerm: async (e) => {
            state.isLoading = true;
            state.query.search = e.target.value;
            state.query.page = 1;

            clearTimeout(searchTimeout);

            searchTimeout = setTimeout(async () => {
                try {
                    const { data, totalPages } = await fetchPosts(state.baseUrl, state.perPage, state.query);
                    state.posts = data;
                    state.isLastPage = state.query.page >= totalPages;
                } catch (err) {
                    console.log('Getting error to fetch search term: ', err);
                }

                state.isLoading = false;
            }, 300);

        },
        clearSearchTerm: async () => {
            if (state.query.search === "") return;

            state.query.search = "";
            state.query.page = 1;

            try {
                const { data } = await fetchPosts(state.baseUrl, state.perPage, state.query);
                state.posts = data;
            } catch (err) {
                console.log('Getting error to fetch search term: ', err);
            }

        },
        openModal: () => {
            const context = getContext();
            state.activePost = context.item;
            state.isModalOpen = true;
            document.body.style.overflow = 'hidden';
        },
        closeModal: () => {
            state.isModalOpen = false;
            state.activePost = null;
            document.body.style.overflow = '';
        },
        closeModalOnBackdrop: (event) => {
            if (event.target === event.currentTarget) {
                state.isModalOpen = false;
                state.activePost = null;
                document.body.style.overflow = '';
            }
        }
    },
    callbacks: {
        setIsLastPage: () => {
            return state.isLastPage;
        },
        modalDisplay: () => {
            return state.isModalOpen ? 'flex' : 'none';
        },
        isActive: (event) => {
            const context = getContext();
            const el = context.element ?? event?.currentTarget;
            return el?.value === state.query.category;
        },
        gridOpacity: () => {
            return state.isLoading ? '0.4' : '1';
        },
        gridPointerEvents: () => {
            return state.isLoading ? 'none' : 'all';
        },
        hasGallery: () => {
            return state.activePost?.gallery_images?.length > 0;
        },
    }
})