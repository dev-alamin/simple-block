import { store, getContext } from '@wordpress/interactivity';

const {state} = store('simple-block', {
    state: {
        activeItemId: 1
    },
    actions: {
        moggle: () => {
            const context = getContext();
            state.activeItemId = (state.activeItemId === context.id) ? null : context.id;
        }
    },
    callbacks: {
        // This is a "derived" value. It updates automatically 
        // whenever state.activeItemId changes.
        
        isItemOpen: () => {
            const context = getContext();
            return state.activeItemId === context.id;
        }
    }
});

window.myStore = state; // Its only for debugging