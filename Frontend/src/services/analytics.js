import ReactGA from 'react-ga4';

const isProduction = import.meta.env.VITE_ENV === 'production';
const TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID;

export const initGA = () => {
  if (TRACKING_ID) {
    ReactGA.initialize(TRACKING_ID, {
      gaOptions: {
        debug_mode: !isProduction
      }
    });
  }
};

export const logPageView = (path) => {
  if (TRACKING_ID) {
    const cleanPath = path.replace(/^\/grocery-buddy/, '');
    ReactGA.send({ 
      hitType: "pageview", 
      page: cleanPath || '/',
      title: document.title 
    });
  }
};

export const logEvent = (category, action, label) => {
  if (TRACKING_ID) {
    ReactGA.event({
      category,
      action,
      label
    });
  }
}; 