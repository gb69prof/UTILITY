export function reportError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[Planetario]', error);
  const panel = document.getElementById('error');
  if (panel) { panel.hidden = false; panel.textContent = `Avvio interrotto: ${message}`; }
  const status = document.getElementById('status');
  if (status) status.textContent = 'Fase 3 — errore di inizializzazione';
}
export function installErrorHandlers(): void {
  window.addEventListener('error', event => reportError(event.error ?? event.message));
  window.addEventListener('unhandledrejection', event => reportError(event.reason));
}
