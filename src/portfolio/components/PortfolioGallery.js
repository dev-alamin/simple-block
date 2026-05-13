import { Button, PanelRow, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';

const PortfolioGallery = () => {
    const [ meta, setMeta ] = useEntityProp( 'postType', 'sblock_portfolio', 'meta' );
    const galleryIds = meta?.project_gallery || [];

    const galleryImages = useSelect( ( select ) => {
        if ( ! galleryIds.length ) return [];

        const attachments = select( 'core' ).getEntityRecords( 'postType', 'attachment', {
            include: galleryIds,
            per_page: -1,
        });

        if ( ! attachments ) return null; // still loading

        return attachments.map( ( img ) => ({
            id:  img.id,
            url: img?.media_details?.sizes?.thumbnail?.source_url
                || img?.media_details?.sizes?.medium?.source_url
                || img?.source_url
                || '',
            alt: img?.alt_text || '',
        }));
    }, [ galleryIds ] );

    const onRemoveImage = ( idToRemove ) => {
        setMeta({ ...meta, project_gallery: galleryIds.filter( ( id ) => id !== idToRemove ) });
    };

    const buttonStyle = {
        position: 'absolute', top: '-5px', right: '-5px',
        background: 'red', color: 'white', border: 'none',
        borderRadius: '50%', cursor: 'pointer',
        width: '18px', height: '18px', fontSize: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        lineHeight: 1,
    };

    return (
        <PanelRow style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ margin: '10px 0', fontWeight: 'bold' }}>Project Gallery</label>

            { galleryIds.length > 0 && (
                <div style={{ width: '100%', marginBottom: '12px' }}>
                    { galleryImages === null ? (
                        <Spinner />
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                            { galleryImages.map( ( img ) => (
                                <div key={ img.id } style={{ position: 'relative' }}>
                                    <img
                                        src={ img.url }
                                        alt={ img.alt }
                                        style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                                    />
                                    <button onClick={ () => onRemoveImage( img.id ) } style={ buttonStyle }>
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <MediaUploadCheck>
                <MediaUpload
                    onSelect={ ( media ) => setMeta({ ...meta, project_gallery: media.map( ( m ) => m.id ) }) }
                    allowedTypes={ [ 'image' ] }
                    multiple={ true }
                    value={ galleryIds }
                    render={ ({ open }) => (
                        <Button
                            variant="secondary"
                            onClick={ open }
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            { galleryIds.length > 0 ? 'Edit Gallery' : 'Add Images' }
                        </Button>
                    )}
                />
            </MediaUploadCheck>
        </PanelRow>
    );
};

export default PortfolioGallery;