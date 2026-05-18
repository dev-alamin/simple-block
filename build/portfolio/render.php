<?php
// Initial data, we get $attributes from global storage
// From block context, block.json brain
$posts_per_page  = $attributes['postsPerPage'] ?? 6;
$selected_category = $attributes['category'] ?? 'all';

$card_background  = $attributes['cardBackground'] ?? '#ffffff';
$heading_color    = $attributes['headingColor'] ?? '#000000';
$pagination_style = $attributes['loadMoreType'] ?? 'infinite';

// -------------------------------------
// Initial Server Query
// -------------------------------------

$args = array(
    'post_type'      => 'sblock_portfolio',
    'posts_per_page' => $posts_per_page ?: 6,
    'post_status'    => 'publish',
    'update_post_meta_cache' => true, // Performance enhancement: prime post meta cache in bulk
    'update_post_term_cache' => true,
    // 'no_found_rows' => true,
);

if (
    ! empty($selected_category) &&
    'all' !== $selected_category
) {
    $args['tax_query'] = array(
        array(
            'taxonomy' => 'sblock_portfolio_category',
            'field'    => 'term_id',
            'terms'    => (int) $selected_category,
        ),
    );
}

$terms = get_terms(array(
    'taxonomy'   => 'sblock_portfolio_category',
    'hide_empty' => true,
));

$query = new WP_Query($args);

// -------------------------------------
// Prepare Initial Posts for Hydration
// -------------------------------------
$posts = array();

if ($query->have_posts()) {
    while ($query->have_posts()) {
        $query->the_post();

        $raw_date = get_post_meta(get_the_id(), 'project_completion_date', true);
        $date = $raw_date ? date_i18n('F j, Y', strtotime($raw_date)) : '';

        $gallery_raw = get_post_meta(get_the_ID(), 'project_gallery');
        $gallery = array();

        if( is_array( $gallery_raw ) ) {
            foreach( $gallery_raw as $id ) {
                $gallery[] = array(
                    'url' => wp_get_attachment_image_url( $id, 'full' ),
                    'alt' => get_post_meta( $id, '_wp_attachment_image_alt', true ) ?: get_the_title( $id ),
                );
            }
        }

        $posts[] = array(
            'id'    => get_the_ID(),
            'title' => array(
                'rendered' => get_the_title(),
            ),
            'content' => get_the_excerpt(get_the_ID()),
            'link'               => get_permalink(),
            'featured_image_url' => get_the_post_thumbnail_url(get_the_ID(), 'large'),
            'client'             => get_post_meta(get_the_ID(), 'client_name', true) ?: '',
            'completion_date'   => $date,
            'gallery_images'    => $gallery,
            'gallery_count'    => count($gallery),
        );
    }

    wp_reset_postdata();
}

wp_interactivity_state( 'sblock-portfolio', [
    'baseUrl' => rest_url( '/wp/v2/sblock_portfolio' ),
    'posts'      => $posts,
    'perPage' => $posts_per_page,
    'totalPages' => $query->max_num_pages,
    'pageNumbers' => range(1, $query->max_num_pages),
    'isLoading'  => false,
    'isLastPage' => false,
    'isModalOpen' => false,
    'activePost'  => null,
    'pagiStyle' => $pagination_style,
    'query'       => [
        'page'     => 1,
        'search'   => '',
        'category' => $selected_category ? (string) $selected_category : 'all',
    ],
]);

// -------------------------------------
// Interactivity Context
// -------------------------------------
$context = array(
    'filterValue'    => 'all',   // for isActive callback per button
    'item'           => null,    // loop item placeholder
    '_searchTimeout' => null,
);
?>

<div
    <?php echo get_block_wrapper_attributes(); ?>
    data-wp-interactive="sblock-portfolio"
    data-wp-context="<?php echo esc_attr(wp_json_encode($context)); ?>">

    <!-- Filter Navigation -->
    <div class="search-filter-wrapper">
        <nav class="portfolio-filters">
            <button
                value="all"
                data-wp-on--click="actions.filter"
                data-wp-class--is-active="callbacks.isActive">All</button>

            <?php
            if (! is_wp_error($terms)) :
                foreach ($terms as $term) : ?>
                    <button
                        value="<?php echo esc_attr($term->term_id); ?>"
                        data-wp-on--click="actions.filter"
                        data-wp-class--is-active="callbacks.isActive">
                        <?php echo esc_html($term->name); ?>
                        <span style="opacity: .7;">(<?php echo esc_attr($term->count); ?>)</span>
                    </button>
            <?php endforeach;
            endif; ?>

        </nav>

        <!-- Search area  -->
        <div class="search-wraper">
            <form class="search-form" onsubmit="return false;">
                <button class="clear-search-term" data-wp-on--click="actions.clearSearchTerm">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="2"
                        />

                        <path
                            d="M8 8L16 16"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        />

                        <path
                            d="M16 8L8 16"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                    </svg>
                </button>   
                <input
                    type="text"
                    placeholder="Search projects..."
                    data-wp-on--input="actions.setSearchTerm"
                    data-wp-bind--value="state.query.search" />

                <input type="submit" value="Search" data-wp-on--click="actions.setSearchTerm" />
            </form>
        </div>

    </div>

    <!-- Portfolio Grid -->
    <!-- Portfolio Grid -->
    <div
        class="portfolio-grid"
        data-wp-style--opacity="callbacks.gridOpacity"
        data-wp-style--pointer-events="callbacks.gridPointerEvents">

        <!-- SSR Fallback: Search engines read this perfectly, Interactivity replaces it instantly on load -->
        <div class="ssr-fallback-container" data-wp-bind--hidden="state.isLoaded" style="display: none;">
            <?php if ( ! empty( $posts ) ) : foreach ( $posts as $fallback_post ) : ?>
                <article class="portfolio-card fallback-static">
                    <div class="portfolio-card__thumb">
                        <a href="<?php echo esc_url( $fallback_post['link'] ); ?>">
                            <img src="<?php echo esc_url( $fallback_post['featured_image_url'] ); ?>" alt="<?php echo esc_attr( $fallback_post['title']['rendered'] ); ?>" />
                        </a>
                    </div>
                    <div class="portfolio-card__body">
                        <h3 class="portfolio-card__title"><?php echo esc_html( $fallback_post['title']['rendered'] ); ?></h3>
                    </div>
                </article>
            <?php endforeach; endif; ?>
        </div>

        <!-- Client-Side Reactive Component Template Loop -->
        <template data-wp-each="state.posts">
            <article class="portfolio-card">

                <div class="portfolio-card__thumb">
                    <a data-wp-bind--href="context.item.link">
                        <img data-wp-bind--src="context.item.featured_image_url" alt="" />
                    </a>
                    <span
                        class="portfolio-card__gallery-count"
                        data-wp-bind--hidden="!context.item.gallery_count">
                        <i class="ti ti-photo" aria-hidden="true"></i>
                        <span data-wp-text="context.item.gallery_count"></span>
                    </span>
                </div>

                <div class="portfolio-card__body">
                    <h3
                        class="portfolio-card__title"
                        data-wp-text="context.item.title.rendered"></h3>
                    <div class="project-meta">
                        <p data-wp-bind--hidden="!context.item.client">
                            <i class="ti ti-user" aria-hidden="true"></i>
                            <span data-wp-text="context.item.client"></span>
                        </p>
                        <p data-wp-bind--hidden="!context.item.completion_date">
                            <i class="ti ti-calendar" aria-hidden="true"></i>
                            <span data-wp-text="context.item.completion_date"></span>
                        </p>
                    </div>
                </div>

                <div class="portfolio-card__footer">
                    <a class="portfolio-card__link" data-wp-bind--href="context.item.link">
                        <i class="ti ti-external-link" aria-hidden="true"></i> View project
                    </a>
                    <button
                        class="portfolio-card__open-modal"
                        data-wp-on--click="actions.openModal">
                        <i class="ti ti-layout-grid" aria-hidden="true"></i> Quick view
                    </button>
                </div>

            </article>
        </template>

        <template data-wp-if="!state.posts.length">
            <p class="portfolio-empty">No projects found.</p>
        </template>
    </div>

    <div class="pagination-wrapper">

        <?php if( $pagination_style == "classicWithLoadMore" || $pagination_style == "classicAjax" ): ?>

                <button class="loadmore-button" 
                    data-wp-on--click="actions.loadMore" 
                    data-wp-bind--hidden="callbacks.setIsLastPage">Load More</button>

            <?php elseif( $pagination_style == "classicButton" ): ?>

            <template data-wp-each="state.pageNumbers">

                <button 
                data-wp-text="context.item"
                data-wp-on--click="actions.goToPage"
                data-wp-class--is-active="callbacks.isCurrentPage"
                ></button>

            </template>

        <?php endif; ?>
    </div>

    <?php if( $pagination_style == "infinite" ): ?>
        <div
            class="scroll-sentinel"
            data-wp-init="actions.setupEffects"
        ></div>
    <?php endif; ?>
    <!-- Modal — outside the loop, no nesting problem -->
    <div
        class="portfolio-modal-backdrop"
        data-wp-style--display="callbacks.modalDisplay" data-wp-on--click="actions.closeModalOnBackdrop">
        <div class="portfolio-modal">
            <div class="portfolio-modal__header">
                <h3
                    class="portfolio-modal__title"
                    data-wp-text="state.activePost.title.rendered"></h3>
                <button
                    class="portfolio-modal__close"
                    data-wp-on--click="actions.closeModal"
                    aria-label="Close modal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Portfolio content  -->
            <div class="portfolio-modal__body">
                <p data-wp-text="state.activePost.content"></p>
            </div>

            <!-- Gallery loop here — no nesting conflict since it's outside main loop -->
            <div class="portfolio-modal__gallery">
                <template data-wp-each="state.activePost.gallery_images">
                    <img
                        data-wp-bind--src="context.item.url"
                        data-wp-bind--alt="context.item.alt" />
                </template>
            </div>

            <div class="portfolio-modal__meta">
                <p data-wp-bind--hidden="!state.activePost.client">
                    <i class="ti ti-user" aria-hidden="true"></i>
                    <span data-wp-text="state.activePost.client"></span>
                </p>
                <p data-wp-bind--hidden="!state.activePost.completion_date">
                    <i class="ti ti-calendar" aria-hidden="true"></i>
                    <span data-wp-text="state.activePost.completion_date"></span>
                </p>
            </div>

            <div class="portfolio-modal__footer">
                <a class="btn-primary" data-wp-bind--href="state.activePost.link">
                    <i class="ti ti-external-link" aria-hidden="true"></i> View full project
                </a>
                <button class="btn-secondary" data-wp-on--click="actions.closeModal">
                    <i class="ti ti-x" aria-hidden="true"></i> Close
                </button>
            </div>
        </div>
    </div>

</div>