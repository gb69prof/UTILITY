import {Engine} from '@babylonjs/core/Engines/engine.js';
import {Scene} from '@babylonjs/core/scene.js';
import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera.js';
import {DirectionalLight} from '@babylonjs/core/Lights/directionalLight.js';
import {Mesh} from '@babylonjs/core/Meshes/mesh.js';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {FresnelParameters} from '@babylonjs/core/Materials/fresnelParameters.js';
import {Texture} from '@babylonjs/core/Materials/Textures/texture.js';
import {CreateLines} from '@babylonjs/core/Meshes/Builders/linesBuilder.js';
import {Vector3,Quaternion,Matrix} from '@babylonjs/core/Maths/math.vector.js';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color.js';
import '@babylonjs/core/Culling/ray.js';
import type {BodyId,ScaleMode,Snapshot,ViewContext,Vec3} from '../data/contracts.ts';
import type {DatasetDraft} from '../data/dataset.ts';
import {hermite,type EphemerisData} from '../physics/ephemeris.ts';
import {bodyIds} from '../physics/provider.ts';
import {Projection,settingsFor,frameToRender} from '../physics/projection.ts';
import {orbitBasis,add,mul} from '../physics/model.ts';
import {Lifetime} from '../core/lifecycle.ts';
import {sphereGeometry} from './sphere-geometry.ts';
import earthMap from '../assets/2k_earth_daymap.jpg';
import moonMap from '../assets/2k_moon.jpg';
import marsMap from '../assets/2k_mars.jpg';
import sunMap from '../assets/2k_sun.jpg';

export interface SolarView {mode:ScaleMode;focus:BodyId|null;context:ViewContext;yaw:number;pitch:number;distance:number;right:number;up:number;guides:boolean;axes:boolean}
export const initialView=():SolarView=>({mode:'scientific',focus:null,context:'system',yaw:-Math.PI/2,pitch:.55,distance:4.8,right:0,up:0,guides:true,axes:false});
export function createSolarScene(canvas:HTMLCanvasElement,data:DatasetDraft,ephemeris:EphemerisData,notice:(s:string)=>void,onContext:(lost:boolean)=>void){
  const life=new Lifetime();
  try {
    const engine=new Engine(canvas,true,{stencil:true,preserveDrawingBuffer:false,powerPreference:'high-performance'});life.own(()=>engine.dispose());
    if(engine.webGLVersion!==2)throw new Error('WebGL 2 non disponibile. Usa l’elenco dei corpi e riprova con un browser compatibile.');
    engine.setHardwareScalingLevel(1/Math.min(1.5,devicePixelRatio));
    const scene=new Scene(engine);life.own(()=>scene.dispose());scene.useRightHandedSystem=true;scene.clearColor=new Color4(.009,.016,.029,1);
    const camera=new ArcRotateCamera('solar-camera',-Math.PI/2,.55,4.8,Vector3.Zero(),scene);camera.inputs.clear();camera.minZ=.00001;camera.maxZ=80;
    const projection=new Projection(),radii=Object.fromEntries(bodyIds.map(id=>[id,data.bodies[id].physical.meanRadius!.value])) as Record<BodyId,number>;
    const meshes={} as Record<BodyId,Mesh>,lights:Partial<Record<BodyId,DirectionalLight>>={},materials={} as Record<BodyId,StandardMaterial>,loaded=new Set<BodyId>();
    const maps={sun:sunMap,earth:earthMap,moon:moonMap,mars:marsMap},colors={sun:'#f4b65d',earth:'#4c91bb',moon:'#a6a5a0',mars:'#c27852'};
    const geometry=sphereGeometry();
    const axes={} as Record<BodyId,ReturnType<typeof CreateLines>>;
    for(const id of bodyIds){
      const mesh=new Mesh(id,scene),vertex=new VertexData();Object.assign(vertex,geometry);vertex.applyToMesh(mesh);meshes[id]=mesh;
      const material=new StandardMaterial(id+'-surface',scene);material.diffuseColor=Color3.FromHexString(colors[id]);material.specularColor=Color3.Black();material.backFaceCulling=false;mesh.material=material;materials[id]=material;
      if(id==='sun'){material.disableLighting=true;material.emissiveColor=Color3.FromHexString(colors[id]);material.emissiveFresnelParameters=new FresnelParameters({leftColor:new Color3(.35,.25,.15),rightColor:Color3.White(),power:2,bias:0});}
      else{const light=new DirectionalLight(id+'-sunlight',new Vector3(1,0,0),scene);light.includedOnlyMeshes=[mesh];light.intensity=1.1;lights[id]=light;}
      const axis=CreateLines(id+'-pole',{points:[new Vector3(0,0,-1.4),new Vector3(0,0,1.4)]},scene);axis.parent=mesh;axis.color=Color3.FromHexString('#b9e6d9');axis.isPickable=false;axes[id]=axis;
    }
    function loadTexture(id:BodyId){if(loaded.has(id))return;loaded.add(id);canvas.dataset['texture'+id]='loading';
      const texture=new Texture(maps[id],scene,false,false,Texture.TRILINEAR_SAMPLINGMODE,()=>{
        if(life.disposed)return;
        if(id==='sun'){materials[id].emissiveTexture=texture;materials[id].emissiveColor=Color3.Black();}else{materials[id].diffuseTexture=texture;materials[id].diffuseColor=Color3.White();}
        canvas.dataset['texture'+id]='ready';
      },message=>{canvas.dataset['texture'+id]='fallback';notice(`Mappa di ${data.bodies[id].name} non disponibile: colore di riserva. ${message??''}`);});
      texture.anisotropicFilteringLevel=4;texture.wrapV=Texture.CLAMP_ADDRESSMODE;
    }
    // Deterministic illustrative star field; no catalog identities or photometric claim.
    const star=new Mesh('illustrative-stars',scene),starData=new VertexData(),starPositions:number[]=[];let seed=9052;
    const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<1100;i++){const z=2*random()-1,a=random()*2*Math.PI,r=Math.sqrt(1-z*z);starPositions.push(30*r*Math.cos(a),30*z,30*r*Math.sin(a));}
    starData.positions=starPositions;starData.indices=Array.from({length:1100},(_,i)=>i);starData.applyToMesh(star);
    const starMat=new StandardMaterial('stars-material',scene);starMat.disableLighting=true;starMat.emissiveColor=new Color3(.42,.5,.64);starMat.pointsCloud=true;starMat.pointSize=1.5;star.material=starMat;star.isPickable=false;star.alwaysSelectAsActiveMesh=true;
    const guides:{kind:'emb-sun'|'mars-sun';mesh:ReturnType<typeof CreateLines>;points:Vec3[]}[]=[];
    for(const kind of ['emb-sun','mars-sun'] as const){const o=data.orbits[kind],[x,y]=orbitBasis(o),points:Vec3[]=[];for(let i=0;i<=2048;i++){const E=i*2*Math.PI/2048;points.push(add(mul(x,o.a.value*(Math.cos(E)-o.e.value)),mul(y,o.a.value*Math.sqrt(1-o.e.value**2)*Math.sin(E))));}
      const mesh=CreateLines(kind+'-model-guide',{points:points.map(p=>Vector3.FromArray(frameToRender(p)).scale(1/149597870700))},scene);mesh.color=Color3.FromHexString(kind==='emb-sun'?'#285870':'#624638');mesh.isPickable=false;guides.push({kind,mesh,points});}
    const lunarPath=Array.from({length:2881},(_,i)=>hermite(ephemeris.nodes['moon-earth'],-1296000+i*900).position);
    const trajectory=CreateLines('moon-relative-30-days',{points:lunarPath.map(r=>Vector3.FromArray(frameToRender(r)).scale(1/radii.earth/10)),updatable:true},scene);trajectory.color=Color3.FromHexString('#6b7788');trajectory.isPickable=false;
    let currentSettings=settingsFor('scientific','system',[0,0,0],radii.earth);
    function apply(snapshot:Snapshot,view:SolarView){
      const origin=view.focus?snapshot.states[view.focus].positionM:[0,0,0] as const;
      currentSettings=settingsFor(view.mode,view.context,origin,view.focus?radii[view.focus]:radii.earth);
      const projected=projection.project(snapshot,currentSettings,radii);if(!projected.ok)throw new Error(projected.error.message);
      camera.alpha=view.yaw;camera.beta=view.pitch;camera.radius=view.distance;
      camera.target.set(-Math.sin(view.yaw)*view.right,view.up,Math.cos(view.yaw)*view.right);
      camera.minZ=view.context==='system'?.00001:.0001;
      for(const body of projected.value.bodies){const mesh=meshes[body.id];const distance=Math.hypot(...body.position);mesh.setEnabled(distance<25);mesh.position.copyFromFloats(...body.position);mesh.scaling.setAll(body.radius);mesh.rotationQuaternion=Quaternion.FromArray(body.bodyToRender);axes[body.id].setEnabled(view.axes&&mesh.isEnabled());
        if(body.id!=='sun')lights[body.id]!.direction.copyFrom(Vector3.FromArray(frameToRender(snapshot.states[body.id].positionM)).normalize());
        if(view.focus===body.id||(view.mode==='didactic'&&view.context==='system'))loadTexture(body.id);
      }
      for(const g of guides)g.mesh.setEnabled(view.guides&&view.context==='system');
      const showMoon=view.guides&&(view.focus==='earth'||view.focus==='moon');trajectory.setEnabled(showMoon);
      if(showMoon){const earth=snapshot.states.earth.positionM;CreateLines('moon-relative-30-days',{points:lunarPath.map(r=>Vector3.FromArray(projection.projectPoint(add(earth,r),currentSettings))),instance:trajectory},scene);}
      canvas.dataset['context']=view.context;canvas.dataset['focus']=view.focus??'system';canvas.dataset['metersPerUnit']=String(currentSettings.metersPerUnit);canvas.dataset['earthRadius']=String(radii.earth*currentSettings.radiusFactors.earth/currentSettings.metersPerUnit);canvas.dataset['time']=String(snapshot.tTdbSeconds);canvas.dataset['distance']=String(view.distance);canvas.dataset['yaw']=String(view.yaw);
      return projected.value.disclosures[0]!;
    }
    const resize=new ResizeObserver(()=>engine.resize());resize.observe(canvas);life.own(()=>resize.disconnect());
    const lost=engine.onContextLostObservable.add(()=>{onContext(true);notice('Contesto grafico perso: simulazione in pausa. Ripristino in corso.');});
    const restored=engine.onContextRestoredObservable.add(()=>{onContext(false);notice('Grafica ripristinata. Premi Avvia per riprendere il tempo.');});life.own(()=>{engine.onContextLostObservable.remove(lost);engine.onContextRestoredObservable.remove(restored);});
    return {engine,scene,radii,apply,
      draw:()=>{star.position.copyFrom(camera.position);scene.render();},
      marker:(id:BodyId)=>{const p=Vector3.Project(meshes[id].position,Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(canvas.clientWidth,canvas.clientHeight));return {x:p.x,y:p.y,visible:meshes[id].isEnabled()&&p.z>0&&p.z<1};},
      pick:(x:number,y:number):BodyId|null=>{const rect=canvas.getBoundingClientRect(),hit=scene.pick(x-rect.left,y-rect.top,m=>bodyIds.includes(m.name as BodyId));return hit?.hit?hit.pickedMesh!.name as BodyId:null;},
      dispose:()=>life.dispose()};
  }catch(e){life.dispose();throw e;}
}
