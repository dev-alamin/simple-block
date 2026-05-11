
import { registerBlockType } from '@wordpress/blocks';

import './style.scss';
import Edit from './edit';
import metadata from './block.json';
import Save from './save';

registerBlockType( metadata.name, {
	edit: Edit,
	save: Save
} );
