import { Engine } from '@babylonjs/core/Engines/engine.js';

// Deliberately no Engine instance, Scene, camera, mesh or render loop in Phase 3.
// Phase 4 can use this same module as the boundary between bootstrap and renderer.
export function prepareRenderer(canvas: HTMLCanvasElement) {
  return Object.freeze({
    canvas,
    EngineConstructor: Engine,
    version: Engine.Version,
    backend: 'webgl2' as const,
    sceneConvention: 'right-handed' as const
  });
}
