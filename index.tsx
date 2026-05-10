import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GameErrorBoundary } from './components/ErrorBoundary';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GameErrorBoundary>
      <App />
    </GameErrorBoundary>
  </React.StrictMode>
);