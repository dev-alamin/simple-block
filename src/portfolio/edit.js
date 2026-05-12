import { useSelect } from '@wordpress/data';
import {
  useBlockProps,
  InspectorControls,
  PanelColorSettings
} from '@wordpress/block-editor';
import {
  PanelBody,
  QueryControls,
  Placeholder,
  Spinner
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const Edit = ({ attributes, setAttributes }) => {
  const { category, postsPerPage, headingColor, cardBackground } = attributes;
  const blockProps = useBlockProps();

  // 1. Fetch Portfolio Items
  const { portfolioItems, hasResolved } = useSelect((select) => {
    const query = {
      per_page: postsPerPage,
      _embed: true, // Crucial for getting featured image URLs
    };

    if (category) {
      query.sblock_portfolio_category = category;
    }

    return {
      portfolioItems: select('core').getEntityRecords('postType', 'sblock_portfolio', query),
      hasResolved: select('core').hasFinishedResolution('getEntityRecords', ['postType', 'sblock_portfolio', query]),
    }
  }, [category, postsPerPage]);

  // 2. Fetch Categories for the Sidebar Dropdown
  const categories = useSelect((select) => {
    const terms = select('core').getEntityRecords('taxonomy', 'sblock_portfolio_category', { per_page: -1 });
    return terms ? terms.map(term => ({
      id: term.id,
      name: term.name,
      parent: term.parent,
    })) : [];
  }, []);

  // 1. Format for categorySuggestions (An object keyed by name)
  const categoriesMap = useSelect((select) => {
    const terms = select('core').getEntityRecords('taxonomy', 'sblock_portfolio_category', { per_page: -1 });
    if (!terms) return {};

    const map = {};
    terms.forEach(term => {
      map[term.name] = {
        id: term.id,
        name: term.name,
        parent: term.parent
      };
    });
    return map;
  }, []);

  // 2. Format selectedCategories (An array of objects)
  // You'll need to update your block.json attribute "category" to an array type
  const selectedCats = attributes.categoriesArray || [];

  // 3. Loading Sate
  if (!hasResolved) {
    return (
      <div {...blockProps}>
        <Placeholder label='Portfolio Grid'>
          <Spinner />
        </Placeholder>
      </div>
    );
  }

  return (
    <div {...blockProps}>
      <InspectorControls>
        <PanelBody title='Grid Settings'>
          <QueryControls
            numberOfItems={postsPerPage}
            onNumberOfItemsChange={(val) => setAttributes({ postsPerPage: val })}
            categoriesList={categories} // Fixed prop name
            selectedCategoryId={category ? parseInt(category, 10) : undefined}
            onCategoryChange={(val) => setAttributes({ category: val.toString() })}
          />
        </PanelBody>
        <PanelColorSettings
          title="Card Styles"
          colorSettings={[
            {
              value: headingColor,
              onChange: (val) => setAttributes({ headingColor: val }),
              label: 'Heading Color',
            },
            {
              value: cardBackground,
              onChange: (val) => setAttributes({ cardBackground: val }),
              label: 'Card Background',
            },
          ]}
        />
      </InspectorControls>

      <div className='portfolio-grid-preview' style={{
        display: 'grid',
        gridTemplateColumns: `repeat(3, 1fr)`,
        gap: '20px'
      }}>
        {portfolioItems?.length > 0 ? (
          portfolioItems.map((post) => {
            const projectMeta = post.meta || {};

            return (
              <div key={post.id}>
                {post._embedded?.['wp:featuredmedia']?.[0]?.source_url ? (
                  <img
                    src={post._embedded['wp:featuredmedia'][0].source_url}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />

                ) : (
                  <div style={{ height: '200px', background: '#eee' }} />
                )}
                <h4>{post.title.rendered}</h4>

                {/* Displaying the custom meta field  */}
                <div className='portfolio-meta-info' style={{
                  fontSize: '13px',
                  color: '#666'
                }}>
                  {projectMeta.client_name && (
                    <p style={{ margin: '0' }}><strong>Client Name: </strong> {projectMeta.client_name}</p>
                  )}

                  {projectMeta.project_completion_date && (
                    <p style={{ margin: '0' }}><strong>Completion Date: </strong> {new Date(projectMeta.project_completion_date).toLocaleDateString()}</p>
                  )}

                  {projectMeta.project_url && (
                    <a
                      href={projectMeta.project_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      style={{ display: 'inline-block', marginTop: '5px', color: '#007cba' }}
                    >
                      View Project →
                    </a>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <p>No project found</p>
        )}
      </div>
    </div>
  )
}

export default Edit