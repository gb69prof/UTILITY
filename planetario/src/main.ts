import './ui/diagnostics.css';
import { bootstrap } from './core/bootstrap.ts';
import { installErrorHandlers, reportError } from './core/errors.ts';

const removeErrorHandlers = installErrorHandlers();
if (import.meta.hot) import.meta.hot.dispose(removeErrorHandlers);
void bootstrap().catch(reportError);
