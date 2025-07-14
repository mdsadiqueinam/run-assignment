export const MODES = {
  INIT: 'init',
  BOOTSTRAP_FULL: 'bootstrap-full',
  BOOTSTRAP_DELTA: 'bootstrap-delta',
  REAL_TIME_INIT: 'real-time-init',
  REAL_TIME: 'real-time',
  REAL_TIME_DISCONNECTED: 'real-time-disconnected',
  OFFLINE: 'offline',
  ERROR_LOADING_BOOTSTRAP: 'error-loading-bootstrap',
};

export const TAB_LOCK_KEY = 'tab-queue-processing-lock';
export const TAB_LOCK_TIMEOUT = 5000; //standard lock timeout
export const TAB_LOCK_INIT_TIMEOUT = 10000;
export const MAX_RECENT_MUTATIONS = 10;
export const RECENT_MUTATION_TIMEOUT = 10000; // 10 seconds - maximum age for considering a mutation as recent
export const DEBOUNCE_TIME = 500; // 500ms
