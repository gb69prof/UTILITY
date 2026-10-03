import './ui/diagnostics.css';
import { bootstrap } from './core/bootstrap.ts';
import { installErrorHandlers, reportError } from './core/errors.ts';

installErrorHandlers();
void bootstrap().catch(reportError);
