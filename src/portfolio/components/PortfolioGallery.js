import { Button, PanelRow } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';

const PortfolioGallery = () => {
    const [meta, setMeta] = useEntityProp('postType', 'sblock_portfolio', 'meta');
    const galleryIds = meta.project_gallery || [];

    // Fetch image details for the image preview
    const galleryImages = useSelect((select) => {
        return select('core').getEntityRecords('postType', 'attachment', {
            include: galleryIds.length > 0 ? galleryIds : [0],
            per_page: -1,
        });
    }, [galleryIds]);

    const onRemoveImage = (idToRemove) => {
        const newIds = galleryIds.filter(id => id !== idToRemove);
        setMeta({ ...meta, project_gallery: newIds });
    }

    const buttonStyle = {
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        background: 'red',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        width: '18px',
        height: '18px',
        fontSize: '10px'
    };

    return (
        <PanelRow style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ margin: '10px', fontWeight: 'bold' }}>Project Gallery</label>

            {/* 1. The image preview grid  */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', marginBottom: '15px' }}>
                {galleryImages && galleryImages.map((img) => (
                    <div key={img.id} style={{ position: 'relative' }}>
                        <img
                            src={img.media_details.sizes.thumbnail.source_url}
                            style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <button onClick={() => onRemoveImage(img.id)}
                            style={buttonStyle}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            {/* 2. The Upload Button  */}
            <MediaUploadCheck>
                <MediaUpload
                    onSelect={(media) => {
                        const ids = media.map(m => m.id);
                        setMeta({ ...meta, project_gallery: ids });
                    }}
                    allowedTypes={['image']}
                    multiple={true}
                    value={galleryIds}
                    render={({ open }) => (
                        <Button
                            variant='secondary'
                            onClick={open}
                            style={{
                                width: '100%',
                                justifyContent: 'center'
                            }}
                        >
                            {galleryIds.length > 0 ? 'Edit Gallery' : 'Add Images'}
                        </Button>
                    )}
                />
            </MediaUploadCheck>
        </PanelRow>
    );
}

export default PortfolioGallery;