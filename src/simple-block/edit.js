import { __ } from '@wordpress/i18n';
import { InnerBlocks, MediaUpload, RichText, useBlockProps, MediaUploadCheck } from '@wordpress/block-editor';
import './editor.scss';
import { Button } from '@wordpress/components';

export default function Edit({ attributes, setAttributes }) {
	const { title, desc, avatar, avatarUrl } = attributes;
	const blockProps = useBlockProps();

	const updateTitle = (newTitle) => {
		setAttributes({ title: newTitle });
	}

	const updateDesc = (desc) => {
		setAttributes({ desc });
	}

	const updateAvatar = (media) => {
		setAttributes({
			avatar: media.id,
			avatarUrl: media.url
		});
	}

	const ALLOWED_BLOCKS = ['core/image'];

	const MY_TEMPLATE = [
		['core/image', { label: 'Avatar' }]
	];

	return (
		<div {...blockProps}>
			<div className="my-custom-image-wrapper">

				<InnerBlocks
					template={MY_TEMPLATE}
					allowedBlocks={ALLOWED_BLOCKS}
					templateLock="all"
				/>
			</div>

			{avatarUrl && (
				<img
					src={avatarUrl}
					alt={__('Avatar', 'simple-block')}
					style={{ maxWidth: '50px', height: 'auto', display: 'block', marginBottom: '10px' }}
				/>
			)}

		<MediaUploadCheck>
			<MediaUpload
				label={__('Update Image', 'simple-block')}
				onSelect={updateAvatar}
				allowedTypes={['image']}
				render={({ open }) => (
					<Button onClick={open} variant='primary'>
						{avatarUrl ? 'Change image' : 'Upload image'}
					</Button>
				)}
				value={avatar}
				/>
			</MediaUploadCheck>

			

			<RichText
				tagName='h2'
				value={title}
				onChange={updateTitle}
				allowedFormats={['core/bold', 'core/italic']}
				placeholder={__('Hello world', 'simple-block')}
			/>

			<RichText
				tagName='p'
				value={desc}
				onChange={updateDesc}
				placeholder={__('Lorem ipsum dolor, sit amet...', 'simple-block')}
			/>
		</div>
	);
}
