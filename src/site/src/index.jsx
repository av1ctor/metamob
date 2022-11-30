import React from "react";
import { createRoot } from 'react-dom/client';
import {App} from './App';

import '../../../node_modules/react-loading-skeleton/dist/skeleton.css';
import '../sass/mystyles.scss';

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);
