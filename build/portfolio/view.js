import * as __WEBPACK_EXTERNAL_MODULE__wordpress_interactivity_8e89b257__ from "@wordpress/interactivity";
/******/ var __webpack_modules__ = ({

/***/ "@wordpress/interactivity"
/*!*******************************************!*\
  !*** external "@wordpress/interactivity" ***!
  \*******************************************/
(module) {

module.exports = __WEBPACK_EXTERNAL_MODULE__wordpress_interactivity_8e89b257__;

/***/ }

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	if (!(moduleId in __webpack_modules__)) {
/******/ 		delete __webpack_module_cache__[moduleId];
/******/ 		var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 		e.code = 'MODULE_NOT_FOUND';
/******/ 		throw e;
/******/ 	}
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*******************************!*\
  !*** ./src/portfolio/view.js ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/interactivity */ "@wordpress/interactivity");

const BASE_URL = '/devspark/wordpress-backend/wp-json/wp/v2/sblock_portfolio';
const PER_PAGE = 3;
const formatDate = raw => {
  if (!raw) return '';
  const date = new Date(raw);
  return isNaN(date) ? raw : date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
const mapPost = post => ({
  id: post.id,
  title: post.title,
  link: post.link,
  content: post.excerpt?.rendered ? post.excerpt.rendered.replace(/<[^>]*>/g, '').trim() : '',
  featured_image_url: post?._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
  client: post.meta?.client_name || '',
  completion_date: formatDate(post.meta?.project_completion_date),
  project_url: post.meta?.project_url || '',
  gallery_images: post.gallery_images || [],
  gallery_count: post.gallery_images?.length || 0
});
const fetchPosts = async (page, categoryId) => {
  let url = `${BASE_URL}?per_page=${PER_PAGE}&page=${page}&_embed`;
  if (categoryId !== 'all') {
    url += `&sblock_portfolio_category=${categoryId}`;
  }
  const response = await fetch(url);
  const data = await response.json();
  console.log('total posts:', response.headers.get('X-WP-Total'));
  console.log('total pages:', response.headers.get('X-WP-TotalPages'));
  console.log('fetching url:', url); // add this

  return data.map(mapPost);
};
(0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.store)('sblock-portfolio', {
  actions: {
    filter: async event => {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      const categoryId = event.currentTarget.value;
      context.selectedCategory = categoryId;
      context.isLoading = true;
      context.page = 1;
      context.posts = await fetchPosts(context.page, context.selectedCategory);
      context.isLoading = false;
    },
    loadMore: async () => {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.page += 1;
      context.isLoading = true;
      console.log('fetching page:', context.page); // what page?

      const loadedPosts = await fetchPosts(context.page, context.selectedCategory);
      console.log('new posts count:', loadedPosts.length); // how many returned?
      console.log('new post ids:', loadedPosts.map(p => p.id)); // same ids as page 1?

      context.posts = [...context.posts, ...loadedPosts];
      context.isLoading = false;
    },
    openModal: () => {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.activePost = context.item;
      context.isModalOpen = true;
      document.body.style.overflow = 'hidden';
    },
    closeModal: () => {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isModalOpen = false;
      context.activePost = null;
      document.body.style.overflow = '';
    },
    closeModalOnBackdrop: event => {
      if (event.target === event.currentTarget) {
        const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
        context.isModalOpen = false;
        context.activePost = null;
        document.body.style.overflow = '';
      }
    }
  },
  callbacks: {
    modalDisplay: () => {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      return context.isModalOpen ? 'flex' : 'none';
    },
    isActive: event => {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      const el = context.element ?? event?.currentTarget;
      return el?.value === context.selectedCategory;
    },
    gridOpacity: () => {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      return context.isLoading ? '0.4' : '1';
    },
    gridPointerEvents: () => {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      return context.isLoading ? 'none' : 'all';
    },
    hasGallery: () => {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      return context.activePost?.gallery_images?.length > 0;
    }
  }
});
})();


//# sourceMappingURL=view.js.map