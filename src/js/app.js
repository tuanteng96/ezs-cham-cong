// Import React and ReactDOM
import React from 'react';
import {
    createRoot
} from 'react-dom/client';
import {
    install
} from 'resize-observer';

// Import Framework7
import Framework7 from './framework7-custom.js';

// Import Framework7-React Plugin
import Framework7React from 'framework7-react';

// Import Framework7 Styles
import '../css/framework7-custom.less';

import "../css/ReactToastify.css";

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.css';

//
import "./bz.js"
import "./prom.js";
import "./event-notification.js";

// Import App Component
import App from '../components/app.jsx';

// Init F7 React Plugin
Framework7.use(Framework7React)

if (typeof window !== "undefined") install();

// Mount React App
const root = createRoot(document.getElementById('app'));

root.render(React.createElement(App));