/**
 * Main Entry Point
 * 
 * Bootstraps the Qwik application.
 */

import { render } from '@builder.io/qwik';
import App from './App';

render(document.getElementById('app') as HTMLElement, <App />);


