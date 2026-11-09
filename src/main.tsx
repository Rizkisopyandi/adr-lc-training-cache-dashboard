import {L1CacheProvider} from './components/L1CacheProvider';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {AccessGate} from './components/AccessGate';
import './index.css';

createRoot(document.getElementById('root')!).render(<AccessGate><L1CacheProvider demo={new URLSearchParams(location.search).get('demo')==='1'}><App /></L1CacheProvider></AccessGate>);
