// accordion-item/save.js
import { RichText, useBlockProps } from "@wordpress/block-editor";

const Save = ({ attributes, clientId }) => {
    const { title, content, id } = attributes;

    return (
        <div 
            { ...useBlockProps.save() }
            data-wp-interactive="simple-block"
            // We store the ID in context so the 'toggle' action knows who called it
            data-wp-context={ JSON.stringify( { id: id } ) }
            data-wp-class--is-active="callbacks.isItemOpen"
        >
            <h3 
                className="accordion-title"
                data-wp-on--click="actions.moggle"
                // Binding: If global activeItemId matches my local id, I am expanded
                data-wp-bind--aria-expanded="callbacks.isItemOpen"
            >
                { title }
            </h3>

            <div 
                className="accordion-content"
                // Directive: Add 'is-open' class if the callback returns true
                data-wp-class--is-open="callbacks.isItemOpen"
            >
                <div className="inner-content">
                    <RichText.Content tagName="div" value={ content } />
                </div>
            </div>
        </div>
    );
};
export default Save;