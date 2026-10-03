export function reportError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[Planetario]', error);
  const panel = document.getElementById('error');
  if (panel) { panel.hidden = false; panel.textContent = `Avvio interrotto: ${message}`; }
  const status = document.getElementById('status');
  if (status) status.textContent = 'Errore di inizializzazione';
}
export function installErrorHandlers(): () => void {
  const controller = new AbortController();
  window.addEventListener('error', event => reportError(event.error ?? event.message), { signal: controller.signal });
  window.addEventListener('unhandledrejection', event => reportError(event.reason), { signal: controller.signal });
  return () => controller.abort();
}
