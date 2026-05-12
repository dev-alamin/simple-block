import { store, getContext } from '@wordpress/interactivity';

store( 'sblock-portfolio', {
    actions: {
        filter: async ( event ) => {
            const context = getContext();

            const categoryId = event.currentTarget.value;

            context.selectedCategory = categoryId;
            context.isLoading = true;

            try {
                let url =
                    '/devspark/wordpress-backend/wp-json/wp/v2/sblock_portfolio?per_page=6&_embed';

                if ( categoryId !== 'all' ) {
                    url += `&sblock_portfolio_category=${ categoryId }`;
                }

                const response = await fetch( url );

                const data = await response.json();

                context.posts = data.map( ( post ) => ( {
                    ...post,
                    featured_image_url:
                        post?._embedded?.[ 'wp:featuredmedia' ]?.[0]
                            ?.source_url || '',
                } ) );

            } catch ( error ) {
                console.error( error );
            }

            context.isLoading = false;
        },
    },
} );