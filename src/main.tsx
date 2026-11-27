import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AccountProvider } from './account/AccountProvider';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/caveat/latin-400.css';
import '@fontsource/caveat/latin-500.css';
import '@fontsource/la-belle-aurore/latin-400.css';
import './index.css';
import './editorial.css';
import './styles/garden.css';
import './styles/handwritten-copy.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccountProvider><App /></AccountProvider>
  </StrictMode>,
);
