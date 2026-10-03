import { Scene } from '@babylonjs/core/scene.js';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine.js';
import type { State } from '../core/interaction.ts';
import '@babylonjs/core/Culling/ray.js';

export function createTechnicalScene(engine: AbstractEngine, texture = true) {
  const scene = new Scene(engine); scene.useRightHandedSystem = true;
  scene.clearColor = new Color4(0.025, 0.045, 0.075, 1);
  const camera = new ArcRotateCamera('screen-camera', -Math.PI / 2, Math.PI / 2.3, 1.3, Vector3.Zero(), scene);
  camera.minZ = 0.02; camera.maxZ = 30; camera.inputs.clear();
  const light = new HemisphericLight('technical-light', new Vector3(-0.4, 1, -0.6), scene); light.intensity = 1.1;
  light.groundColor = new Color3(0.16, 0.2, 0.25);
  // Rendered world is a sibling of the XR camera, never a tracking-rig parent.
  const world = new TransformNode('rendered-world', scene);
  const sphere = CreateSphere('technical-sphere', { diameter: 0.5, segments: 32 }, scene); sphere.parent = world;
  const material = new StandardMaterial('technical-grid', scene);
  material.specularColor.set(0.12, 0.16, 0.18); sphere.material = material;
  let textureError: string | null = null;
  if (texture) {
    let grid: DynamicTexture | undefined;
    try {
      grid = new DynamicTexture('generated-grid-512', 512, scene, false);
      const c = grid.getContext() as CanvasRenderingContext2D;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) { c.fillStyle = (x + y) % 2 ? '#619ca8' : '#244755'; c.fillRect(x * 32, y * 64, 32, 64); }
      c.strokeStyle = '#c3eee2'; c.lineWidth = 2;
      for (let x = 0; x <= 512; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 512); c.stroke(); }
      c.strokeStyle = '#efd59b'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 256); c.lineTo(512, 256); c.stroke();
      c.font = 'bold 24px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffffff';
      for (let x = 0; x < 4; x++) { c.fillText(`${x * 90}°`, x * 128 + 32, 290); c.fillText('N', x * 128 + 32, 70); c.fillText('S', x * 128 + 32, 460); }
      // Sphere UVs need a vertical flip; store it on the texture so context rebuild preserves it.
      grid.vScale = -1; grid.vOffset = 1; grid.update(); material.diffuseTexture = grid;
    } catch (error) { grid?.dispose(); textureError = String(error); material.diffuseColor.set(0.3, 0.65, 0.7); }
  }
  const apply = (state: State) => {
    material.emissiveColor.copyFrom(state.selectedBody ? new Color3(0.10, 0.19, 0.15) : Color3.Black());
    if (['active', 'entering', 'exiting'].includes(state.xrSessionState)) return;
    camera.alpha = state.camera.yaw; camera.beta = state.camera.pitch; camera.radius = state.camera.distance;
    camera.target.set(-Math.sin(camera.alpha) * state.camera.right, state.camera.up, Math.cos(camera.alpha) * state.camera.right);
  };
  let disposed = false;
  return { scene, camera, world, sphere, material, textureError, apply,
    dispose: () => { if (!disposed) { disposed = true; scene.dispose(); } }
  };
}
export type TechnicalScene = ReturnType<typeof createTechnicalScene>;
