<?php
// This file is generated. Do not modify it manually.
return array(
	'accordion-item' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'simple-block/accordion-item',
		'title' => 'Accordion Item',
		'version' => '1.0.0',
		'category' => 'widgets',
		'keywords' => array(
			'accordion',
			'tab'
		),
		'parent' => array(
			'simple-block/simple-accordion'
		),
		'description' => 'A simple block for creating beautiful accordion',
		'supports' => array(
			'html' => false,
			'spacing' => array(
				'margin' => true,
				'padding' => true
			),
			'interactivity' => true
		),
		'attributes' => array(
			'id' => array(
				'type' => 'string'
			),
			'title' => array(
				'type' => 'string',
				'default' => '',
				'selector' => '.accordion-title'
			),
			'content' => array(
				'type' => 'string',
				'default' => '',
				'selector' => '.accordion-content'
			)
		),
		'textdomain' => 'simple-block',
		'editorStyle' => 'file:./index.css',
		'editorScript' => 'file:./index.js',
		'style' => 'file:./style-index.css',
		'viewScriptModule' => 'file:./view.js'
	),
	'portfolio' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'simple-block/portfolio',
		'version' => '1.0.0',
		'title' => 'Portfolio Grid',
		'category' => 'widgets',
		'icon' => 'smiley',
		'keywords' => array(
			'portfolio',
			'grid'
		),
		'description' => 'A block to display a portfolio grid.',
		'example' => array(
			
		),
		'attributes' => array(
			'category' => array(
				'type' => 'number',
				'default' => 0
			),
			'postsPerPage' => array(
				'type' => 'number',
				'default' => 5
			),
			'headingColor' => array(
				'type' => 'string',
				'default' => '#000000'
			),
			'cardBackground' => array(
				'type' => 'string',
				'default' => '#ffffff'
			)
		),
		'providesContext' => array(
			'sblock/headingColor' => 'headingColor',
			'sblock/cardBackground' => 'cardBackground'
		),
		'supports' => array(
			'html' => false,
			'color' => array(
				'background' => true,
				'text' => true
			),
			'spacing' => array(
				'padding' => true,
				'margin' => true
			),
			'typography' => array(
				'fontSize' => true,
				'lineHeight' => true,
				'fontWeight' => true,
				'letterSpacing' => true,
				'textTransform' => true,
				'fontStyle' => true,
				'textDecoration' => true
			)
		),
		'selectors' => array(
			'typography' => array(
				'root' => '.content'
			)
		),
		'textdomain' => 'portfolio-block',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScriptModule' => 'file:./view.js'
	),
	'portfolio-item' => array(
		'name' => 'simple-block/portfolio-item',
		'title' => 'Portfolio Item',
		'parent' => array(
			'simple-block/portfolio'
		),
		'usesContext' => array(
			'sblock/headingColor',
			'sblock/cardBackground'
		),
		'supports' => array(
			'color' => array(
				'background' => true,
				'text' => true
			),
			'typography' => array(
				'fontSize' => true,
				'lineHeight' => true
			),
			'spacing' => array(
				'padding' => true,
				'margin' => true
			)
		)
	),
	'simple-accordion' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'simple-block/simple-accordion',
		'title' => 'Simple Accordion',
		'version' => '1.0.0',
		'category' => 'widgets',
		'keywords' => array(
			'accordion',
			'tab'
		),
		'description' => 'A simple block for creating beautiful accordion',
		'supports' => array(
			'html' => false,
			'interactivity' => true,
			'spacing' => array(
				'padding' => true,
				'margin' => true
			),
			'color' => array(
				'text' => true,
				'link' => true,
				'background' => true
			)
		),
		'attributes' => array(
			'headingTextSize' => array(
				'type' => 'number',
				'default' => '22'
			),
			'contentTextSize' => array(
				'type' => 'number',
				'default' => '14'
			),
			'hoverBgColor' => array(
				'type' => 'string',
				'default' => '#fff'
			),
			'activeBgColor' => array(
				'type' => 'string',
				'default' => ''
			),
			'hoverHeadingColor' => array(
				'type' => 'string',
				'default' => ''
			),
			'activeHeadingColor' => array(
				'type' => 'string',
				'default' => ''
			),
			'hoverContentColor' => array(
				'type' => 'string',
				'default' => ''
			),
			'activeContentColor' => array(
				'type' => 'string',
				'default' => ''
			)
		),
		'textdomain' => 'simple-block',
		'editorStyle' => 'file:./index.css',
		'editorScript' => 'file:./index.js',
		'style' => 'file:./style-index.css',
		'viewScriptModule' => 'file:./view.js'
	),
	'simple-block' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'simple-block/block-one',
		'version' => '0.1.0',
		'title' => 'Simple Block',
		'category' => 'widgets',
		'icon' => 'smiley',
		'keywords' => array(
			'simple',
			'gutenberg'
		),
		'description' => 'Example block scaffolded with Create Block tool.',
		'example' => array(
			
		),
		'supports' => array(
			'html' => false,
			'color' => array(
				'background' => true,
				'text' => true
			),
			'spacing' => array(
				'padding' => true,
				'margin' => true
			),
			'typography' => array(
				'fontSize' => true,
				'lineHeight' => true,
				'fontWeight' => true,
				'letterSpacing' => true,
				'textTransform' => true,
				'fontStyle' => true,
				'textDecoration' => true
			)
		),
		'selectors' => array(
			'typography' => array(
				'root' => '.content'
			)
		),
		'attributes' => array(
			'avatarUrl' => array(
				'default' => '',
				'type' => 'string'
			),
			'avatar' => array(
				'default' => '',
				'type' => 'string'
			),
			'title' => array(
				'default' => 'Put the title...',
				'type' => 'string'
			),
			'desc' => array(
				'default' => '',
				'type' => 'string'
			)
		),
		'textdomain' => 'simple-block',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScriptModule' => 'file:./view.js'
	)
);
