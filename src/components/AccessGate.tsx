import type {ReactNode} from 'react';
/** Public Vercel UI. API secrets remain on the server; no session is required. */
export function AccessGate({children}:{children:ReactNode}){return <>{children}</>;}
