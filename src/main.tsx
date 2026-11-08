import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {AccessGate} from './components/AccessGate';
import './index.css';

createRoot(document.getElementById('root')!).render(<AccessGate><App /></AccessGate>);
