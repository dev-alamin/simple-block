<?php

/**
 * Portfolio Grid Render Template
 */

// -------------------------------------
// Setup Defaults
// -------------------------------------

$posts_per_page  = $attributes['postsPerPage'] ?? 6;
$selected_category = $attributes['category'] ?? 'all';

$card_background = $attributes['cardBackground'] ?? '#ffffff';
$heading_color   = $attributes['headingColor'] ?? '#000000';

// -------------------------------------
// Initial Server Query
// -------------------------------------

$args = array(
    'post_type'      => 'sblock_portfolio',
    'posts_per_page' => $posts_per_page,
    'post_status'    => 'publish',
);

if (
    ! empty( $selected_category ) &&
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

$query = new WP_Query( $args );

// -------------------------------------
// Prepare Initial Posts for Hydration
// -------------------------------------

$posts = array();

if ( $query->have_posts() ) {

    while ( $query->have_posts() ) {

        $query->the_post();

        $posts[] = array(
            'id'    => get_the_ID(),
            'title' => array(
                'rendered' => get_the_title(),
            ),
            'link'  => get_permalink(),
            'featured_image_url' => get_the_post_thumbnail_url(
                get_the_ID(),
                'medium'
            ),
            'client' => get_post_meta(
                get_the_ID(),
                'client_name',
                true
            ),
        );
    }

    wp_reset_postdata();
}

// -------------------------------------
// Interactivity Context
// -------------------------------------

$context = array(
    'selectedCategory' => (string) $selected_category,
    'isLoading'        => false,
    'posts'            => $posts,
);

?>

<div
    <?php echo get_block_wrapper_attributes(); ?>
    data-wp-interactive="sblock-portfolio"
    data-wp-context="<?php echo esc_attr( wp_json_encode( $context ) ); ?>"
>

    <!-- =====================================
    Filter Navigation
    ====================================== -->

    <nav class="portfolio-filters">

        <button
            value="all"
            data-wp-on--click="actions.filter"
            data-wp-class--is-active="callbacks.isActive"
        >
            All
        </button>

        <?php
        $terms = get_terms(
            array(
                'taxonomy'   => 'sblock_portfolio_category',
                'hide_empty' => true,
            )
        );

        if ( ! is_wp_error( $terms ) ) :
            foreach ( $terms as $term ) :
                ?>

                <button
                    value="<?php echo esc_attr( $term->term_id ); ?>"
                    data-wp-on--click="actions.filter"
                    data-wp-class--is-active="callbacks.isActive"
                >
                    <?php echo esc_html( $term->name ); ?>
                </button>

                <?php
            endforeach;
        endif;
        ?>

    </nav>

    <!-- =====================================
    Portfolio Grid
    ====================================== -->

    <div
        class="portfolio-grid"
        data-wp-style--opacity="callbacks.gridOpacity"
        data-wp-style--pointer-events="callbacks.gridPointerEvents"
    >

        <!-- Client-side Rendered Posts -->
        <template data-wp-each="context.posts">

            <article
                class="portfolio-card"
                style="background: <?php echo esc_attr( $card_background ); ?>;"
            >

                <a data-wp-bind--href="context.item.link">

                    <img
                        data-wp-bind--src="context.item.featured_image_url"
                        alt=""
                    />

                </a>

                <h4
                    style="color: <?php echo esc_attr( $heading_color ); ?>;"
                    data-wp-text="context.item.title.rendered"
                >
                </h4>

                <template data-wp-if="context.item.client">

                    <span>

                        Client:
                        <span data-wp-text="context.item.client"></span>

                    </span>

                </template>

            </article>

        </template>

        <!-- Empty State -->
        <template data-wp-if="!context.posts.length">

            <p>No projects found.</p>

        </template>

    </div>

</div>