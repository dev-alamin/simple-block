import { store, getContext, getElement } from '@wordpress/interactivity';
import { mapPost, formatDate, fetchPosts, range, getPageNumbers } from './utils';

const { state, actions, callbacks } = store('sblock-portfolio', {
    actions: {
        setupEffects: () => {
            const { ref } = getElement();
            if (!ref) return;

            callbacks.manageObserver(ref);
        },
        filter: async (event) => {
            const categoryId = event.currentTarget.value

            state.query.category = categoryId;
            state.isLoading = true;
            state.isLastPage = false;
            state.query.page = 1;

            const { data, totalPages } = await fetchPosts(state.baseUrl, state.perPage, state.query);
            state.pageNumbers = getPageNumbers( state.query.page, totalPages );
            state.posts = data;

            state.isLastPage = state.query.page >= totalPages;
            state.isLoading = false;
        },
        async fetchTermCounts() {
            try {
                const res = await fetch( `${state.termRestUrl}?search=${ state.query.search }` );

                if ( ! res.ok ) {
                    return;
                }

                const data = await res.json();
                state.termCounts = Object.fromEntries(
                    data?.map( ( { id, count } ) => [ id, count ] )
                );
            } catch ( err ) {
                console.warn( 'fetchTermCounts failed:', err );
            }
        },
        goToPage: async () => {
            const context = getContext();
            const pageNumber = Number(context.item);
            if( ! Number.isFinite( pageNumber ) ) return;

            state.query.page = pageNumber;
            state.isLoading = true;

            const { data, totalPages } = await fetchPosts(state.baseUrl, state.perPage, state.query);
            state.posts = data;

            state.isLoading = false;
            state.pageNumbers = getPageNumbers( pageNumber, totalPages );
            state.isLastPage = state.query.page >= totalPages;
        },
        loadMore: async () => {
            if (state.isLoading || state.isLastPage) return;

            state.query.page += 1;
            state.isLoading = true;
            state.isLastPage = false;

            // console.log( 'fetching page:', state.page ); // what page?

            const { data, totalPages } = await fetchPosts(state.baseUrl, state.perPage, state.query);
            state.pageNumbers = range(totalPages);

            state.isLastPage = state.query.page >= totalPages;

            if (state.pagiStyle === 'classicAjax') {
                state.posts = data; // replace items
            } else if (state.pagiStyle === 'classicWithLoadMore') {
                state.posts = [...state.posts, ...data]; // Append items
            }

            state.isLoading = false;
        },
        setSearchTerm: async (e) => {
            const context = getContext();

            state.isLoading = true;
            state.query.search = e.target.value;
            state.query.page = 1;

            clearTimeout( context._searchTimeout );

            context._searchTimeout = setTimeout( async () => {
                try {
                    const [{ data, totalPages, totalPosts }] = await Promise.all([
                        fetchPosts( state.baseUrl, state.perPage, state.query ),
                        actions.fetchTermCounts(), // fires in parallel, same query state
                    ]);

                    state.posts       = data;
                    state.pageNumbers = getPageNumbers( state.query.page, totalPages );
                    state.totalPosts  = totalPosts;
                    state.isLastPage  = state.query.page >= totalPages;
                } catch ( err ) {
                    console.warn( 'Search fetch error:', err );
                }

                state.isLoading = false;
            }, 300 );
        },
        clearSearchTerm: async () => {
            if (state.query.search === "") return;

            state.query.search = "";
            state.query.page = 1;
            state.isLastPage = false;
            state.isLoading = true;

            try {
                const { data, totalPosts, totalPages } = await fetchPosts(state.baseUrl, state.perPage, state.query);
                state.posts = data;

                state.totalPosts = totalPosts;
                state.pageNumbers = getPageNumbers( state.query.page, totalPages );
                state.isLastPage = state.query.page >= totalPages;
                await actions.fetchTermCounts();
            } catch (err) {
                console.log('Getting error to fetch search term: ', err);
            }finally{
                state.isLoading = false;
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
        isCurrentPage: () => {
            const context = getContext();
            return context.item === state.query.page;
        },
        setIsLastPage: () => {
            return state.isLastPage;
        },
        modalDisplay: () => {
            return state.isModalOpen ? 'flex' : 'none';
        },
        isCurrentFilterActive: () => {
            const { ref } = getElement();

            return String(ref?.value) === String( state.query.category);
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
        manageObserver: async (targetElement) => {
            //----
            // -- Track dependencies. When category, search, or last-page changes, 
            // -- this re-runs automatically!
            //----
            const currentCategory = state.query.category;
            const currentSearch = state.query.search;
            const isLastPage = state.isLastPage;

            // 1. Clean up existing observer instantly on state mutation
            if (targetElement._blockObserver) {
                targetElement._blockObserver.disconnect();
            }

            // 2. If it's the last page, don't spin up a new observer instance
            if (isLastPage || state.pagiStyle !== 'infinite') return;

            // 3. Re-initialize observer for the new state query context
            targetElement._blockObserver = new IntersectionObserver(async (entries) => {
                
                const entry = entries[0];
                if (!entry || !entry.isIntersecting) return;
                if (state.isLoading || state.isLastPage) return;

                state.query.page += 1;
                state.isLoading = true;

                const { data, totalPages } = await fetchPosts(
                    state.baseUrl,
                    state.perPage,
                    state.query
                );

                const combinedPosts = [...state.posts, ...data];

                if (combinedPosts.length > (state.maxDomPostsSize ?? 100)) {
                    // Only allow maximum allowed items to the dom for memory management
                    state.posts = combinedPosts.slice(combinedPosts.length - state.maxDomPostsSize ?? 100);
                } else {
                    state.posts = combinedPosts;
                }

                state.pageNumbers = range(totalPages);
                state.isLastPage = state.query.page >= totalPages;
                state.isLoading = false;

            }, {
                root: null,
                rootMargin: '200px',
                threshold: 0,
            });

            // Re-observe target
            targetElement._blockObserver.observe(targetElement);
        },
        getTotalposts: () => {
            return state.totalPosts || 0;
        },
        getTermCount: () => {
            const { termId } = getContext();
            const count = state.termCounts?.[ termId ];
            // Return empty string until counts load, avoids showing "undefined"
            return count !== undefined ? `(${ count })` : '';
        },
        isDots: () => {
            const context = getContext();
            return context.item === '...';
        },
    }
})