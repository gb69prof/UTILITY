import { WebXRSessionManager } from '@babylonjs/core/XR/webXRSessionManager.js';
import { WebXRCamera } from '@babylonjs/core/XR/webXRCamera.js';
import { WebXRInput } from '@babylonjs/core/XR/webXRInput.js';
import { CreateLines } from '@babylonjs/core/Meshes/Builders/linesBuilder.js';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Ray } from '@babylonjs/core/Culling/ray.js';
import type { TechnicalScene } from '../rendering/technical-scene.ts';
import { actionChannel, technicalId, type Store } from '../core/interaction.ts';
import { Lifetime } from '../core/lifecycle.ts';
import { localReference, SemanticSelectGate } from './contracts.ts';

// Only the browser's semantic `select` confirms. No Gamepad polling or selectend action.
export async function prepareXR(content: TechnicalScene, store: Store, notice: (message: string) => void) {
  const life = new Lifetime(); const { scene, world, camera: screenCamera, sphere } = content;
  const manager = new WebXRSessionManager(scene); life.own(() => manager.dispose());
  try {
    await manager.initializeAsync();
    manager.worldScalingFactor = 1;
    const camera = new WebXRCamera('native-xr-camera', scene, manager); camera.compensateOnFirstFrame = false; camera.minZ = 0.05; camera.maxZ = 30;
    life.own(() => camera.dispose());
    const input = new WebXRInput(manager, camera, { doNotLoadControllerMeshes: true, disableOnlineControllerRepository: true }); life.own(() => input.dispose());
    const send = actionChannel(store, 'xr');
    life.own(() => send.dispose());
    const panel = CreatePlane('xr-info-panel', { width: 0.95, height: 0.42 }, scene);
    life.own(() => panel.dispose());
    panel.parent = world; panel.position.set(0, -0.58, 0); panel.setEnabled(false);
    const material = new StandardMaterial('xr-panel-material', scene); material.disableLighting = true; material.backFaceCulling = false;
    life.own(() => material.dispose());
    const texture = new DynamicTexture('xr-panel-1024', { width: 1024, height: 512 }, scene, false);
    life.own(() => texture.dispose());
    material.emissiveTexture = texture; panel.material = material;
    const redraw = () => {
      const s = store.state; panel.setEnabled(s.xrSessionState === 'active' && !!s.info);
      const c = texture.getContext() as CanvasRenderingContext2D; c.fillStyle = '#102536'; c.fillRect(0, 0, 1024, 512);
      c.textAlign = 'center'; c.fillStyle = '#ecf7f4'; c.font = 'bold 56px sans-serif'; c.fillText('Oggetto tecnico di prova', 512, 130);
      c.font = '42px sans-serif'; c.fillText(s.selectedBody ? 'Selezionato' : 'Nessuna selezione', 512, 235);
      c.fillStyle = '#b6e4d8'; c.fillRect(250, 310, 524, 130); c.fillStyle = '#0b2027'; c.font = 'bold 50px sans-serif'; c.fillText('Chiudi', 512, 395); texture.update();
    };
    life.own(store.subscribe(redraw));
    const ray = new Ray(Vector3.Zero(), Vector3.Forward(), 10);
    const gate = new SemanticSelectGate();
    const select = (event: XRInputSourceEvent) => {
      if (!gate.accept(event, event.type, store.state.xrSessionState === 'active')) return;
      const controller = input.controllers.find(c => c.inputSource === event.inputSource); if (!controller) return;
      controller.getWorldPointerRayToRef(ray);
      const ui = scene.pickWithRay(ray, mesh => mesh === panel && panel.isEnabled());
      if (ui?.hit) {
        const uv = ui.getTextureCoordinates();
        if (uv && uv.x >= 250 / 1024 && uv.x <= 774 / 1024 && uv.y >= 1 - 440 / 512 && uv.y <= 1 - 310 / 512) send({ type: 'closeInfo' });
        return; // An info panel consumes the ray before a body behind it.
      }
      if (scene.pickWithRay(ray, mesh => mesh === sphere)?.hit) send({ type: 'selectBody', bodyId: technicalId });
    };
    const added = input.onControllerAddedObservable.add(controller => {
      const line = CreateLines(`ray-${controller.uniqueId}`, { points: [Vector3.Zero(), new Vector3(0, 0, -3)] }, scene);
      line.color = new Color3(0.55, 0.9, 0.8); line.isPickable = false; line.parent = controller.pointer;
      controller.onDisposeObservable.addOnce(() => line.dispose());
    });
    life.own(() => input.onControllerAddedObservable.remove(added));
    let detachSession = () => {};
    // Reuse one target: Babylon's managed canvas registers manager observers in its constructor.
    const renderTarget = manager.getWebXRRenderTarget();
    let awaitingPose = false;
    const restore = () => {
      detachSession(); awaitingPose = false;
      for (const eye of camera.rigCameras) eye.outputRenderTarget = null;
      scene.activeCamera = screenCamera; world.position.setAll(0); world.rotation.setAll(0);
      if (!life.disposed) { store.xr('idle'); content.apply(store.state); notice('Sessione XR terminata. Vista desktop ripristinata.'); }
    };
    const ended = manager.onXRSessionEnded.add(restore);
    const frame = manager.onXRFrameObservable.add(() => {
      if (!awaitingPose || !manager.currentFrame?.getViewerPose(manager.referenceSpace)) return;
      awaitingPose = false;
      // Place the world once from native pose. No head, eye, IPD or tracking-space transforms.
      const forward = camera.getForwardRay().direction; forward.y = 0; forward.normalize();
      world.position.copyFrom(camera.position.add(forward.scale(2)));
      world.rotation.y = Math.atan2(-forward.x, -forward.z);
      store.xr('active'); notice('XR attivo · osservatorio fermo · tracciamento in metri');
    });
    life.own(() => { detachSession(); manager.onXRSessionEnded.remove(ended); manager.onXRFrameObservable.remove(frame); renderTarget.dispose(); });
    return {
      async enter(): Promise<void> {
        if (!['idle', 'error'].includes(store.state.xrSessionState) || life.disposed) return;
        store.xr('entering'); notice('Richiesta della sessione XR…');
        try {
          const session = await manager.initializeSessionAsync('immersive-vr', { optionalFeatures: ['local-floor'] });
          if (life.disposed) { await session.end(); return; }
          const reference = await localReference(kind => session.requestReferenceSpace(kind));
          manager.viewerReferenceSpace = await session.requestReferenceSpace('viewer');
          if (life.disposed || !manager.inXRSession || manager.session !== session) return;
          manager.baseReferenceSpace = reference; manager.referenceSpace = reference;
          manager.onXRReferenceSpaceInitialized.notifyObservers(reference);
          const baseLayer = await renderTarget.initializeXRLayerAsync(session);
          if (life.disposed || !manager.inXRSession || manager.session !== session) return;
          manager.updateRenderState({ depthNear: camera.minZ, depthFar: camera.maxZ, baseLayer });
          session.addEventListener('select', select); detachSession = () => session.removeEventListener('select', select);
          scene.activeCamera = camera; awaitingPose = true; manager.runXRRenderLoop();
        } catch (error) {
          if (manager.inXRSession) await manager.exitXRAsync().catch(() => {});
          restore();
          if (!life.disposed) { store.xr('error', String(error)); notice(`XR non avviato: ${String(error)}. Il planetario desktop resta utilizzabile.`); }
        }
      },
      async exit(): Promise<void> {
        if (!manager.inXRSession) return;
        store.xr('exiting');
        try { await manager.exitXRAsync(); }
        catch (error) { store.xr('active', String(error)); notice('Uscita XR non riuscita: usa il menu del visore.'); }
      },
      async dispose(): Promise<void> { if (life.disposed) return; if (manager.inXRSession) await manager.exitXRAsync(); life.dispose(); }
    };
  } catch (error) { life.dispose(); throw error; }
}
