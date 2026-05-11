
import { useBlockProps, RichText } from "@wordpress/block-editor"
import { __ } from "@wordpress/i18n";
import { useEffect } from "@wordpress/element";

const Edit = ({ attributes, setAttributes, clientId }) => {
    const { title, content, id } = attributes;

    const blockProps = useBlockProps({
        className: 'accordion-item'
    });

    useEffect(() => {
        if( ! attributes.id ) {
            setAttributes( { id: clientId } );
        }
    }, []);

    return (
        <div {...blockProps}>
            <RichText
                tagName="h4"
                className="accordion-header"
                value={title}
                onChange={(value) => setAttributes({ title: value })}
                placeholder={__('Accordion Title', 'simple-block')}
            />

            <RichText
                tagName="div"
                className="accordion-content"
                value={content}
                onChange={(content) => setAttributes({ content })}
                placeholder={__('Accordion Content', 'simple-block')}
            />
        </div>
    )
}

export default Edit