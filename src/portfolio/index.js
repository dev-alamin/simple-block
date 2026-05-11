import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { useEntityProp } from '@wordpress/core-data';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import {
    Button,
    PanelRow,
    TextControl,
    DatePicker,
    Popover
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { registerBlockType } from '@wordpress/blocks';
import { useState } from '@wordpress/element';

import metadata from './block.json';
import Save from './save';
import Edit from './edit';

import PortfolioGallery from './components/PortfolioGallery';

registerBlockType(metadata.name, {
    edit: Edit,
    save: Save
});

const PortfolioSettingsPanel = () => {
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

    // 1. Get the current post type from the editor store
    const postType = useSelect((select) =>
        select('core/editor').getCurrentPostType(),
        []);

    // 2. The Guard: If it's not a portfolio, render NOTHING
    if (postType !== 'sblock_portfolio') {
        return null;
    }

    // This hooks into the meta we registered in PHP
    const [meta, setMeta] = useEntityProp('postType', 'sblock_portfolio', 'meta');

    // Helpers to prevent "undefined" errors
    const projectUrl = meta?.project_url || '';
    const clientName = meta?.client_name || '';
    const projectCompletionDate = meta?.project_completion_date || '';

    // Simple URL Validation
    const isUrlValid = (url) => {
        if (!url) return true; // Don't show error if empty
        try { return Boolean(new URL(url)); }
        catch (e) { return false; }
    };

    return (
        <PluginDocumentSettingPanel name="portfolio-details" title="Project Details">
            <TextControl
                label="Project URL"
                value={projectUrl}
                onChange={(val) => setMeta({ ...meta, project_url: val })}
                help={!isUrlValid(projectUrl) ? "Please enter a valid URL (including https://)" : ""}
            />

            <TextControl
                label="Client Name"
                value={clientName}
                onChange={(val) => setMeta({ ...meta, client_name: val })}
            />

            {/* Date Picker with Popover */}
            <PanelRow style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', marginBottom: '5px' }}>Completion Date</label>
                <Button
                    variant="secondary"
                    onClick={() => setIsDatePickerVisible(!isDatePickerVisible)}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                    {projectCompletionDate ? new Date(projectCompletionDate).toLocaleDateString() : 'Select Date'}
                </Button>

                {isDatePickerVisible && (
                    <Popover position="bottom center" onClose={() => setIsDatePickerVisible(false)}>
                        <div style={{ padding: '10px' }}>
                            <DatePicker
                                currentDate={projectCompletionDate}
                                onChange={(newDate) => {
                                    setMeta({ ...meta, project_completion_date: newDate });
                                    // Optionally close on select: setIsDatePickerVisible(false);
                                }}
                            />
                        </div>
                    </Popover>
                )}
            </PanelRow>

            <PortfolioGallery />
        </PluginDocumentSettingPanel>
    );
};

registerPlugin('portfolio-settings-plugin', { render: PortfolioSettingsPanel });