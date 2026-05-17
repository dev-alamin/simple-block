import * as __WEBPACK_EXTERNAL_MODULE__wordpress_interactivity_8e89b257__ from "@wordpress/interactivity";
/******/ var __webpack_modules__ = ({

/***/ "./src/portfolio/utils.js"
/*!********************************!*\
  !*** ./src/portfolio/utils.js ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fetchPosts: () => (/* binding */ fetchPosts),
/* harmony export */   formatDate: () => (/* binding */ formatDate),
/* harmony export */   mapPost: () => (/* binding */ mapPost)
/* harmony export */ });
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
const caches = new Map();
const fetchPosts = async (BASE_URL, PER_PAGE, params = {}) => {
  const {
    page = 1,
    category = 'all',
    search = ""
  } = params;
  const key = JSON.stringify(params);
  if (caches.has(key)) {
    return caches.get(key);
  }
  let url = `${BASE_URL}?per_page=${PER_PAGE}&page=${page}&_embed`;
  if (category !== 'all') {
    url += `&sblock_portfolio_category=${category}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  try {
    const response = await fetch(url);
    const data = await response.json();
    const mapped = data?.map(mapPost) || [];
    const totalPages = Number(response.headers.get('X-WP-TotalPages'));
    caches.set(key, {
      data: mapped,
      totalPages
    });
    return {
      data: mapped,
      totalPages: totalPages
    };
  } catch (err) {
    console.log('Error getting portfolio posts: ', err);
    return [];
  }
};

/***/ },

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
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
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
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./src/portfolio/utils.js");


let searchTimeout;
const {
  state
} = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.store)('sblock-portfolio', {
  actions: {
    filter: async event => {
      const categoryId = event.currentTarget.value;
      state.query.category = categoryId;
      state.isLoading = true;
      state.isLastPage = false;
      state.query.page = 1;
      const {
        data,
        totalPages
      } = await (0,_utils__WEBPACK_IMPORTED_MODULE_1__.fetchPosts)(state.baseUrl, state.perPage, state.query);
      state.posts = data;
      state.isLastPage = state.query.page >= totalPages;
      state.isLoading = false;
    },
    loadMore: async () => {
      if (state.isLoading || state.isLastPage) return;
      state.query.page += 1;
      state.isLoading = true;
      state.isLastPage = false;

      // console.log( 'fetching page:', state.page ); // what page?

      const {
        data,
        totalPages
      } = await (0,_utils__WEBPACK_IMPORTED_MODULE_1__.fetchPosts)(state.baseUrl, state.perPage, state.query);
      console.log(totalPages);
      state.isLastPage = state.query.page >= totalPages;

      // state.posts = [...state.posts, ...data]; // Append items
      state.posts = data; // replace items
      state.isLoading = false;
    },
    setSearchTerm: async e => {
      state.isLoading = true;
      state.query.search = e.target.value;
      state.query.page = 1;
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        try {
          const {
            data,
            totalPages
          } = await (0,_utils__WEBPACK_IMPORTED_MODULE_1__.fetchPosts)(state.baseUrl, state.perPage, state.query);
          state.posts = data;
          state.isLastPage = state.query.page >= totalPages;
        } catch (err) {
          console.log('Getting error to fetch search term: ', err);
        }
        state.isLoading = false;
      }, 300);
    },
    clearSearchTerm: async () => {
      if (state.query.search === "") return;
      state.query.search = "";
      state.query.page = 1;
      try {
        const {
          data
        } = await (0,_utils__WEBPACK_IMPORTED_MODULE_1__.fetchPosts)(state.baseUrl, state.perPage, state.query);
        state.posts = data;
      } catch (err) {
        console.log('Getting error to fetch search term: ', err);
      }
    },
    openModal: () => {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      state.activePost = context.item;
      state.isModalOpen = true;
      document.body.style.overflow = 'hidden';
    },
    closeModal: () => {
      state.isModalOpen = false;
      state.activePost = null;
      document.body.style.overflow = '';
    },
    closeModalOnBackdrop: event => {
      if (event.target === event.currentTarget) {
        state.isModalOpen = false;
        state.activePost = null;
        document.body.style.overflow = '';
      }
    }
  },
  callbacks: {
    setIsLastPage: () => {
      return state.isLastPage;
    },
    modalDisplay: () => {
      return state.isModalOpen ? 'flex' : 'none';
    },
    isActive: event => {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      const el = context.element ?? event?.currentTarget;
      return el?.value === state.query.category;
    },
    gridOpacity: () => {
      return state.isLoading ? '0.4' : '1';
    },
    gridPointerEvents: () => {
      return state.isLoading ? 'none' : 'all';
    },
    hasGallery: () => {
      return state.activePost?.gallery_images?.length > 0;
    }
  }
});
})();


//# sourceMappingURL=view.js.map