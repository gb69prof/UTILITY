import type { AppConfig } from '../core/config.ts';
import type { Capabilities, CapabilityStatus } from '../core/capabilities.ts';

const statuses: Record<CapabilityStatus, string> = {
  available: 'Disponibile', unavailable: 'Non disponibile', unverified: 'Non ancora verificato'
};
export function renderDiagnostics(config: AppConfig, capabilities: Capabilities, babylonVersion: string): void {
  const diagnostics = document.getElementById('diagnostics');
  const status = document.getElementById('status');
  const label = document.getElementById('build-label');
  if (!diagnostics || !status || !label) throw new Error('Struttura della diagnostica incompleta.');
  const rows = [
    { name: 'Babylon.js', state: 'available', value: `Caricato · ${babylonVersion}`, detail: 'Motore WebGL 2; misure della scena riportate sopra.' },
    ...Object.entries(capabilities).map(([key, capability]) => ({ name: key === 'webxr' ? 'WebXR / VR' : key, state: capability.status, value: statuses[capability.status], detail: capability.detail }))
  ];
  diagnostics.replaceChildren(...rows.map(row => {
    const item = document.createElement('div'); item.className = 'diagnostic';
    const name = document.createElement('dt'); name.textContent = row.name;
    const value = document.createElement('dd'); value.textContent = row.value; value.dataset['state'] = row.state;
    const detail = document.createElement('dd'); detail.className = 'detail'; detail.textContent = row.detail;
    item.append(name, value, detail); return item;
  }));
  status.textContent = 'Fase 4 — avvio della scena';
  label.textContent = `Build ${config.version} · ${config.basePath}`;
}
