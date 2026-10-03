// Canonical body frame: +Z north, +X longitude 0, +Y east 90. Map center is longitude 0.
export function sphereGeometry(segments=96,rings=48){
  const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(let j=0;j<=rings;j++){const lat=-Math.PI/2+j*Math.PI/rings;
    for(let i=0;i<=segments;i++){const lon=-Math.PI+i*2*Math.PI/segments,x=Math.cos(lat)*Math.cos(lon),y=Math.cos(lat)*Math.sin(lon),z=Math.sin(lat);positions.push(x,y,z);normals.push(x,y,z);uvs.push(i/segments,1-j/rings);}
  }
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);}
  return {positions,normals,uvs,indices};
}
