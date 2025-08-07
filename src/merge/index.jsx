import { createRoot } from 'react-dom/client';

import App from './App.jsx';

import { findConflicts } from '../util/conflicts';

import './styles.scss';

findConflicts(window.baseXml, window.localXml, window.remoteXml).then(conflicts => console.log('Conflicts:', conflicts));

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);