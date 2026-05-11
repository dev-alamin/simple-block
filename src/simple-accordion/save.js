// accordion-parent/save.js
import { useBlockProps, useInnerBlocksProps } from "@wordpress/block-editor";

const Save = ( { attributes } ) => {
    const style = {
        '--acc-heading-size': `${attributes.headingTextSize}px`,
        '--acc-content-size': `${attributes.contentTextSize}px`,
        '--acc-hover-bg': attributes.hoverBgColor,
        '--acc-active-bg': attributes.activeBgColor,
        '--acc-hover-heading': attributes.hoverHeadingColor,
        '--acc-active-heading': attributes.activeHeadingColor,
        '--acc-hover-content': attributes.hoverContentColor,
        '--acc-active-content': attributes.activeContentColor,
    };

    const blockProps = useBlockProps.save( {style} );
    // This helper merges the wrapper div with all the child Accordion Items
    const innerBlockProps = useInnerBlocksProps.save(blockProps);

    return (
        <div {...innerBlockProps} />
    );
}
export default Save;