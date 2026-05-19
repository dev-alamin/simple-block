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

add_filter('rest_prepare_sblock_portfolio', function ( $response, $post, $request ) {

    static $already_added = false;
    if ($already_added) {
        return $response;
    }
    $already_added = true;

    $search = $request->get_param('search');
    $matching_posts = get_posts([
        'post_type'      => 'sblock_portfolio',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        's'              => $search,
    ]);

    $terms = wp_get_object_terms(
        $matching_posts,
        'sblock_portfolio_category',
        [
            'fields' => 'all_with_object_id'
        ]
    );

    $counts = array();
    foreach ( $terms as $term ) {
        if ( ! isset( $counts[ $term->term_id ] ) ) {
            $counts[ $term->term_id ] = 0;
        }

        $counts[ $term->term_id ]++;
    }

    $data = $response->get_data();
    $data['termCounts'] = $counts;
    $response->set_data($data);

    return $response;
}, 10, 3);
