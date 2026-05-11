import {
    useBlockProps,
    InnerBlocks,
    BlockControls,
    InspectorControls,
    ColorPalette,
    PanelColorSettings
} from "@wordpress/block-editor";

import {
    ToolbarGroup,
    ToolbarButton,
    PanelBody,
    FontSizePicker,
    RangeControl
} from '@wordpress/components';

import { plus } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { createBlock } from "@wordpress/blocks";
import { __ } from "@wordpress/i18n";

const Edit = ({ clientId, attributes, setAttributes }) => {

    const {
        headingTextSize,
        contentTextSize,
        hoverBgColor,
        activeBgColor,
        hoverHeadingColor,
        activeHeadingColor,
        hoverContentColor,
        activeContentColor
    } = attributes;

    const style = {
        '--acc-heading-size': `${headingTextSize}px`,
        '--acc-content-size': `${contentTextSize}px`,
        '--acc-hover-bg': hoverBgColor,
        '--acc-active-bg': activeBgColor,
        '--acc-hover-heading': hoverHeadingColor,
        '--acc-active-heading': activeHeadingColor,
        '--acc-hover-content': hoverContentColor,
        '--acc-active-content': activeContentColor,
    }

    const blockProps = useBlockProps({ style });

    const { insertBlock } = useDispatch("core/block-editor");
    const addItem = () => {
        const newBlock = createBlock("simple-block/accordion-item");
        insertBlock(newBlock, undefined, clientId);
    }

    const ALLOWED_BLOCKS = ['simple-block/accordion-item'];
    const TEMPLATE = [
        ["simple-block/accordion-item", {
            title: "What is your return policy?",
            content: "You can return items within 30 days."
        }
        ],
        ["simple-block/accordion-item", {
            title: "Do you offer support?",
            content: "Yes, 24/7 email support is available."
        },
        ]
    ];

    const fontSizes = [
        {
            name: __('Small', 'simple-block'),
            slug: 'small',
            size: 12
        },
        {
            name: __('Medium', 'simple-block'),
            slug: 'medium',
            size: 18
        },
        {
            name: __('Large', 'simple-block'),
            slug: 'large',
            size: 25
        },
    ]

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Typography Settings', 'simple-block')}>

                    <RangeControl
                        __next40pxDefaultSize
                        label="Heading Font Size"
                        value={headingTextSize}
                        onChange={(newSize) => setAttributes({ headingTextSize: newSize })}
                        min={2}
                        max={100}
                    />

                    <RangeControl
                        __next40pxDefaultSize
                        label="Content Font Size"
                        value={contentTextSize}
                        onChange={(newSize) => setAttributes({ contentTextSize: newSize })}
                        min={2}
                        max={50}
                    />

                </PanelBody>

                <PanelBody title={ __( 'Interaction Colors', 'simple-block' ) }>
                    <PanelColorSettings
                    title={__('Interaction Colors', 'simple-block')}
                    colorSettings={[
                        { value: hoverBgColor, onChange: (v) => setAttributes({ hoverBgColor: v }), label: __('Hover Background', 'simple-block') },
                        { value: activeBgColor, onChange: (v) => setAttributes({ activeBgColor: v }), label: __('Active Background', 'simple-block') },
                        { value: hoverHeadingColor, onChange: (v) => setAttributes({ hoverHeadingColor: v }), label: __('Heading Hover Color', 'simple-block') },
                        { value: activeHeadingColor, onChange: (v) => setAttributes({ activeHeadingColor: v }), label: __('Active Heading Color', 'simple-block') },
                        { value: hoverContentColor, onChange: (v) => setAttributes({ hoverContentColor: v }), label: __('Hover Content Color', 'simple-block') },
                        { value: activeContentColor, onChange: (v) => setAttributes({ activeContentColor: v }), label: __('Active Content Color', 'simple-block') }
                    ]}
                />
                </PanelBody>
            </InspectorControls>

            <BlockControls>
                <ToolbarGroup>
                    <ToolbarButton
                        icon={plus}
                        label="Add Accordion Item"
                        onClick={addItem}
                    />
                </ToolbarGroup>
            </BlockControls>

            <div {...blockProps}>
                <InnerBlocks
                    allowedBlocks={ALLOWED_BLOCKS}
                    template={TEMPLATE}
                    templateLock={false}
                    renderAppender={InnerBlocks.ButtonBlockAppender}
                />
            </div>
        </>
    )
}

export default Edit