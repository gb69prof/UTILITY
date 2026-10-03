import { installErrorHandlers, reportError } from './core/errors.ts';

const removeErrorHandlers = installErrorHandlers();
if (import.meta.hot) import.meta.hot.dispose(removeErrorHandlers);
async function start(){
  if(new URLSearchParams(location.search).has('technical')){
    const {default:markup}=await import('./ui/technical.html?raw');document.body.innerHTML=markup;
    await import('./ui/diagnostics.css');
    const {bootstrap}=await import('./core/bootstrap.ts');await bootstrap();
  }else{const {bootstrapSolar}=await import('./core/solar.ts');await bootstrapSolar();}
}
void start().catch(reportError);
