import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MinuteVanguardApp } from './MinuteVanguardApp';
import './app.css';

const root = document.getElementById('root');
if (root === null) throw new Error('Missing #root host.');

createRoot(root).render(
  <StrictMode>
    <MinuteVanguardApp />
  </StrictMode>,
);
