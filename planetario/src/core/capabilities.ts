export type CapabilityStatus = 'available' | 'unavailable' | 'unverified';
export interface Capability { readonly status: CapabilityStatus; readonly detail: string }
export type Capabilities = Readonly<Record<'webgl2' | 'touch' | 'pointer' | 'webxr' | 'webgpu', Capability>>;
// Minimal API surface: no session creation and no dependency on browser UA strings.
export interface CapabilityProbe {
  webgl2(): boolean;
  touch(): boolean;
  pointer(): boolean;
  secureContext: boolean;
  xr?: { isSessionSupported(mode: 'immersive-vr'): Promise<boolean> };
  gpu: boolean;
}
const result = (supported: boolean, detail: string): Capability => ({ status: supported ? 'available' : 'unavailable', detail });
export async function detectCapabilities(probe: CapabilityProbe): Promise<Capabilities> {
  let webgl2: Capability;
  try { webgl2 = result(probe.webgl2(), 'Creazione di un contesto WebGL 2 di prova.'); }
  catch { webgl2 = { status: 'unverified', detail: 'Impossibile completare la prova del contesto.' }; }
  let webxr: Capability = result(false, 'API WebXR assente o contesto non sicuro.');
  if (probe.secureContext && probe.xr) {
    // Bound a browser/driver query that may never settle; late responses are ignored.
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const supported = await Promise.race([
        probe.xr.isSessionSupported('immersive-vr'),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 3000); })
      ]);
      webxr = result(supported, 'Esito isSessionSupported(immersive-vr); nessuna sessione richiesta.');
    } catch { webxr = { status: 'unverified', detail: 'Interrogazione XR negata, fallita o scaduta.' }; }
    finally { clearTimeout(timer); }
  }
  return {
    webgl2, webxr,
    touch: result(probe.touch(), 'maxTouchPoints o puntatore coarse: indizio di input touch, non prova delle gesture.'),
    pointer: result(probe.pointer(), 'API Pointer Events.'),
    webgpu: probe.gpu
      ? { status: 'unverified', detail: 'API WebGPU rilevata; adattatore non richiesto. Non è un requisito.' }
      : result(false, 'API WebGPU non rilevata. Non è un requisito.')
  };
}
export function browserProbe(): CapabilityProbe {
  const nav = navigator;
  return {
    webgl2: () => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return false;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return true;
    },
    touch: () => nav.maxTouchPoints > 0 || matchMedia('(any-pointer: coarse)').matches,
    pointer: () => 'PointerEvent' in window,
    secureContext: window.isSecureContext,
    ...(nav.xr ? { xr: nav.xr } : {}),
    gpu: 'gpu' in nav && !!nav.gpu
  };
}
