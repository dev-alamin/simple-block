<?php

if ( defined( 'WP_CLI' ) && WP_CLI ) {

    class Portfolio_Seeder {

        /**
         * Seeds real-looking portfolio items with remote images and richer content.
         *
         * ## OPTIONS
         *
         * [--count=<number>]
         * : Number of portfolios to generate.
         * ---
         * default: 10
         * ---
         *
         * @param array $args
         * @param array $assoc_args
         */
        public function __invoke( $args, $assoc_args ) {
            $count = (int) ( $assoc_args['count'] ?? 10 );

            WP_CLI::line( sprintf( 'Starting seed of %d portfolio items...', $count ) );

            for ( $i = 0; $i < $count; $i++ ) {
                $title   = $this->generate_unique_title();
                $content = $this->generate_rich_content( $title );

                $post_id = wp_insert_post(
                    [
                        'post_type'    => 'sblock_portfolio',
                        'post_status'  => 'publish',
                        'post_title'   => $title,
                        'post_content' => $content,
                    ]
                );

                if ( is_wp_error( $post_id ) ) {
                    WP_CLI::warning( 'Failed creating portfolio post.' );
                    continue;
                }

                // Add random realistic client meta
                $clients = [ 'Nordic Media Group', 'Stavanger Tech AS', 'Oslo Retail Corp', 'Fjord Logistics' ];
                update_post_meta( $post_id, 'client_name', $clients[ array_rand( $clients ) ] );

                // Fetch a unique, high-quality image from Picsum Photos API and sideload it into the Media Library
                WP_CLI::line( "Sideloading featured image from API for Post ID: {$post_id}..." );
                $featured_image_id = $this->sideload_remote_image( $post_id, $title );

                if ( $featured_image_id ) {
                    set_post_thumbnail( $post_id, $featured_image_id );
                    
                    // Mocking a gallery array with the featured image and a couple of your safe fallback local attachment IDs
                    $gallery = array_filter( [ $featured_image_id, 12, 14 ] );
                    update_post_meta( $post_id, 'project_gallery', $gallery );
                }

                // Assign default custom taxonomy terms safely
                wp_set_object_terms( $post_id, [ 48, 47, 49], 'sblock_portfolio_category' );

                WP_CLI::success( "Successfully seeded: \"{$title}\" (ID: {$post_id})" );
            }
        }

        /**
         * Dynamically generates unique titles to prevent exact matches.
         */
        private function generate_unique_title() {
            $verbs   = [ 'Scaling', 'Optimizing', 'Refactoring', 'Migrating', 'Architecting', 'Redesigning' ];
            $systems = [ 'WooCommerce Core', 'Redis Caching Layers', 'Headless Next.js Frontend', 'Enterprise Cloud Infra', 'REST API Gateways' ];
            $results = [ 'for High Traffic', 'for Global Scale', 'to AWS Ecosystem', 'with Zero Downtime', 'under Heavy Load' ];

            return sprintf(
                '%s %s %s #%d',
                $verbs[ array_rand( $verbs ) ],
                $systems[ array_rand( $systems ) ],
                $results[ array_rand( $results ) ],
                rand( 100, 999 )
            );
        }

        /**
         * Assembles realistic multi-paragraph blocks of text.
         */
        private function generate_rich_content( $title ) {
            $intro = [
                "Our engineering team was brought on to handle the comprehensive development of: {$title}.",
                "The core goal of this project was addressing architectural debt while rolling out modern performance updates.",
                "This case study goes behind the scenes of how we planned, developed, and deployed our solution smoothly."
            ];

            $body = [
                "During execution, we integrated specific Gutenberg custom blocks to make landing pages flexible for editors. We focused on decoupling heavy components to minimize initial server overhead.",
                "Database query execution paths were analyzed closely. Profiling showed bottlenecked transactions which were resolved by scaling object caching rules and indexes.",
                "Continuous Integration (CI) and modern DevOps setups allowed the development branch to test structural mutations reliably across target stage servers before hitting final validation steps."
            ];

            $outro = [
                "The target architecture yielded a 40% improvement in performance overall.",
                "The platform now scales predictably under peak traffic spikes without manual monitoring.",
                "Maintenance overhead dropped significantly, letting internal development squads move much faster."
            ];

            $paragraphs = [
                $intro[ array_rand( $intro ) ],
                $body[ array_rand( $body ) ],
                $body[ ( array_rand( $body ) + 1 ) % count( $body ) ], // Ensure secondary paragraphs alternate safely
                $outro[ array_rand( $outro ) ]
            ];

            return implode( "\n\n", array_map( 'wpautop', $paragraphs ) );
        }

        /**
         * Downloads a real image via standard WordPress admin sideload utilities 
         * and registers it perfectly inside the Media Library.
         */
        private function sideload_remote_image( $post_id, $title ) {
            // Include backend media functions required in CLI context
            if ( ! function_exists( 'download_url' ) ) {
                require_once ABSPATH . 'wp-admin/includes/file.php';
                require_once ABSPATH . 'wp-admin/includes/image.php';
                require_once ABSPATH . 'wp-admin/includes/media.php';
            }

            // Using the Picsum Photos API with a random query param to bypass cache checks
            $url = 'https://picsum.photos/1200/800?random=' . rand( 1, 10000 );

            // Download file to temp folder
            $tmp_file = download_url( $url );

            if ( is_wp_error( $tmp_file ) ) {
                WP_CLI::warning( 'Could not download placeholder image from API: ' . $tmp_file->get_error_message() );
                return false;
            }

            $file_array = [
                'name'     => sanitize_title( $title ) . '.jpg',
                'tmp_name' => $tmp_file,
            ];

            // Sideload it explicitly into the media system
            $attachment_id = media_handle_sideload( $file_array, $post_id, $title );

            if ( is_wp_error( $attachment_id ) ) {
                @unlink( $tmp_file ); // Cleanup temp file
                WP_CLI::warning( 'Failed registering image attachment: ' . $attachment_id->get_error_message() );
                return false;
            }

            return $attachment_id;
        }
    }

    WP_CLI::add_command( 'portfolio seed', 'Portfolio_Seeder' );
}