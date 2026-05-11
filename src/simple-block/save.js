import { useBlockProps, RichText, InnerBlocks } from "@wordpress/block-editor"

const Save = ({ attributes }) => {
    // console.log(attributes);
    const { title, desc, avatarUrl } = attributes;

    return (
        <div {...useBlockProps.save()}>

            <div className="my-custom-image-wrapper">
                <InnerBlocks.Content />
            </div>

            {avatarUrl && (
                <img
                    src={avatarUrl}
                    alt={title}
                    className="wp-block-image-block-avatar"
                />
            )}

            <RichText.Content
                tagName="h2"
                className="simple-block-title"
                value={title}
            />
            <RichText.Content
                tagName="p"
                className="simple-block-desc"
                value={desc}
            />
        </div>
    )
}

export default Save