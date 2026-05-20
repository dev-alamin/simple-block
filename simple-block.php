<?php

/**
 * Plugin Name:       Simple Block
 * Description:       A few essential blocks for your next website.
 * Version:           0.1.0
 * Requires at least: 6.8
 * Requires PHP:      7.4
 * Author:            Al Amin
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       simple-block
 *
 * @package SimpleBlock
 */

if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}
require_once __DIR__ . '/Portfolio_Seeder.php';
/**
 * Registers the block(s) metadata from the `blocks-manifest.php` and registers the block type(s)
 * based on the registered block metadata. Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
 */
function simple_block_simple_block_block_init()
{
    wp_register_block_types_from_metadata_collection(__DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php');

    $labels = array(
        'name'                  => _x('Portfolio', 'Post Type General Name', 'text_domain'),
        'singular_name'         => _x('Portfolio Item', 'Post Type Singular Name', 'text_domain'),
        'menu_name'             => __('Portfolio', 'text_domain'),
        'add_new_item'          => __('Add New Project', 'text_domain'),
    );

    $args = array(
        'label'                 => __('Portfolio Item', 'text_domain'),
        'labels'                => $labels,
        'supports'              => array('title', 'editor', 'thumbnail', 'excerpt'), // Essential for Gutenberg
        'taxonomies'            => array('portfolio_category'),
        'public'                => true,
        'show_ui'               => true,
        'show_in_menu'          => true,
        'menu_position'         => 5,
        'menu_icon'             => 'dashicons-portfolio',
        'show_in_nav_menus'     => true,
        'has_archive'           => true,
        'show_in_rest'          => true, // CRITICAL: Enables Gutenberg & Interactivity API access
        'capability_type'       => 'post',
    );
    register_post_type('sblock_portfolio', $args);

    $labels = array(
        'name'              => _x('Project Categories', 'taxonomy general name', 'text_domain'),
        'singular_name'     => _x('Project Category', 'taxonomy singular name', 'text_domain'),
    );

    $args = array(
        'hierarchical'      => true, // Like standard categories
        'labels'            => $labels,
        'show_ui'           => true,
        'show_admin_column' => true,
        'show_in_rest'      => true, // CRITICAL: So we can fetch categories via JS
    );
    register_taxonomy('sblock_portfolio_category', array('sblock_portfolio'), $args);

    // Project External URL
    register_post_meta('sblock_portfolio', 'project_url', array(
        'show_in_rest' => true,
        'single'       => true,
        'type'         => 'string',
        'sanitize_callback' => 'esc_url_raw',
    ));

    // Client Name
    register_post_meta('sblock_portfolio', 'client_name', array(
        'show_in_rest' => true,
        'single'       => true,
        'type'         => 'string',
        'sanitize_callback' => 'sanitize_text_field',
    ));

    // 1. Completion Date (e.g., "2024-05" or "May 2024")
    register_post_meta('sblock_portfolio', 'project_completion_date', array(
        'show_in_rest' => true,
        'single'       => true,
        'type'         => 'string',
        'sanitize_callback' => 'sanitize_text_field',
    ));

    // 2. Project Gallery (Array of Attachment IDs)
    register_post_meta('sblock_portfolio', 'project_gallery', array(
        'show_in_rest' => array(
            'schema' => array(
                'type'  => 'array',
                'items' => array(
                    'type' => 'integer',
                ),
            ),
        ),
        'single'        => true,
        'type'          => 'array',
    ));
}
add_action('init', 'simple_block_simple_block_block_init');

add_action('rest_api_init', function () {
    register_rest_field('sblock_portfolio', 'gallery_images', [
        'get_callback' => function ($post) {
            $ids = get_post_meta($post['id'], 'project_gallery', true);
            return array_map(function ($id) {
                return [
                    'url' => wp_get_attachment_image_url($id, 'full'),
                    'alt' => get_post_meta($id, '_wp_attachment_image_alt', true) ?: get_the_title($id),
                ];
            }, $ids ?: []);
        },
    ]);
});

add_action( 'rest_api_init', function() {

    register_rest_route( 'simple-block/v1', '/term-counts', [
        'methods'             => 'GET',
        'callback'            => 'sblock_get_contextual_term_counts',
        'permission_callback' => '__return_true',
        'args'                => [
            'search'   => [ 'type' => 'string',  'default' => '' ],
            'category' => [ 'type' => 'integer', 'default' => 0  ],
        ],
    ] );

} );

function sblock_get_contextual_term_counts( \WP_REST_Request $request ) {
    $search   = sanitize_text_field( $request->get_param( 'search' ) );
    $category = absint( $request->get_param( 'category' ) );

    // Build the same query your filter block uses (no paging — get all IDs)
    $args = [
        'post_type'      => 'sblock_portfolio',
        'posts_per_page' => -1,
        'fields'         => 'ids',  // lightweight — only fetch IDs
        'post_status'    => 'publish',
        'no_found_rows'  => true,
    ];

    if ( $search ) {
        $args['s'] = $search;
    }

    if ( $category ) {
        $args['tax_query'] = [ [
            'taxonomy' => 'sblock_portfolio_category',
            'field'    => 'term_id',
            'terms'    => $category,
        ] ];
    }

    $query    = new WP_Query( $args );
    $post_ids = $query->posts; // just IDs

    if ( empty( $post_ids ) ) {
        // Return all terms with 0 count
        $terms = get_terms( [ 'taxonomy' => 'sblock_portfolio_category', 'hide_empty' => false ] );
        return array_map( fn( $t ) => [ 'id' => $t->term_id, 'name' => $t->name, 'count' => 0 ], $terms );
    }

    // Count how many matching posts belong to each term
    $terms = get_terms( [
        'taxonomy'   => 'sblock_portfolio_category',
        'hide_empty' => false,
        'object_ids' => $post_ids,  // ← key: scope terms to matching posts
    ] );

    $counts = [];
    foreach ( $terms as $term ) {
        // get_objects_in_term gives IDs of posts in this term
        $term_post_ids   = get_objects_in_term( $term->term_id, 'sblock_portfolio_category' );
        $intersect_count = count( array_intersect( $post_ids, $term_post_ids ) );

        $counts[] = [
            'id'    => $term->term_id,
            'slug'  => $term->slug,
            'name'  => $term->name,
            'count' => $intersect_count,
        ];
    }

    global $wpdb;
    $post_ids_placeholder = implode(',', array_fill(0, count($post_ids), '%d'));

    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT t.term_id, COUNT(*) as count
            FROM {$wpdb->term_relationships} tr
            JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
            JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
            WHERE tt.taxonomy = %s
            AND tr.object_id IN ($post_ids_placeholder)
            GROUP BY t.term_id",
            array_merge(['sblock_portfolio_category'], $post_ids)
        )
    );

    return $counts;
}

function get_page_numbers( int $current_page, int $total_pages ): array {
    if ( $total_pages <= 7 ) {
        return range( 1, $total_pages );
    }

    $delta = 2;
    $pages = [];

    // Always show first page
    $pages[] = 1;

    $range_start = max( 2, $current_page - $delta );
    $range_end   = min( $total_pages - 1, $current_page + $delta );

    // Ellipsis after page 1 — only if there's an actual gap
    if ( $range_start > 2 ) {
        $pages[] = '...';
    }

    for ( $i = $range_start; $i <= $range_end; $i++ ) {
        $pages[] = $i;
    }

    // Ellipsis before last page — only if there's an actual gap
    if ( $range_end < $total_pages - 1 ) {
        $pages[] = '...';
    }

    // Always show last page — but only if it's not already included
    if ( $total_pages > 1 ) {
        $pages[] = $total_pages;
    }

    // Always show last page
    $pages[] = $total_pages;

    return $pages;
}