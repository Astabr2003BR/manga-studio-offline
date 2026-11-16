// Local, deterministic hair surface relaxation. No topology, UV or skin-weight changes.
// The caller owns the buffers; this function never mutates them.
export function refineHairSurface(position,normal,triangles){
 if(!(position instanceof Float32Array)||!(normal instanceof Float32Array)||position.length!==normal.length||position.length%3||position.length<9||position.length>30000||!ArrayBuffer.isView(triangles)||triangles.length%3||triangles.length>60000)return null;
 const n=position.length/3,adj=Array.from({length:n},()=>new Set()),edges=new Map();
 for(const v of position)if(!Number.isFinite(v))return null;
 for(const v of normal)if(!Number.isFinite(v))return null;
 const edge=(a,b)=>{if(a===b)return;adj[a].add(b);adj[b].add(a);const k=Math.min(a,b)*n+Math.max(a,b);edges.set(k,(edges.get(k)||0)+1);};
 for(let i=0;i<triangles.length;i+=3){const a=triangles[i],b=triangles[i+1],c=triangles[i+2];if(![a,b,c].every(v=>Number.isInteger(v)&&v>=0&&v<n))return null;edge(a,b);edge(b,c);edge(c,a);}
 const fixed=new Uint8Array(n);
 for(const [k,count] of edges)if(count!==2){fixed[Math.floor(k/n)]=1;fixed[k%n]=1;}
 const next=new Float32Array(position),limit=.003;let moved=0,maxDelta=0,boundary=0;
 for(let i=0;i<n;i++){if(fixed[i]){boundary++;continue;}if(adj[i].size<3)continue;const k=i*3;let x=0,y=0,z=0;
  for(const j of adj[i]){x+=position[j*3];y+=position[j*3+1];z+=position[j*3+2];}
  const m=adj[i].size;let dx=(x/m-position[k])*.48,dy=(y/m-position[k+1])*.48,dz=(z/m-position[k+2])*.48;const l=Math.hypot(dx,dy,dz);if(l<1e-6)continue;const scale=Math.min(1,limit/l);next[k]+=dx*scale;next[k+1]+=dy*scale;next[k+2]+=dz*scale;const d=Math.hypot(next[k]-position[k],next[k+1]-position[k+1],next[k+2]-position[k+2]);moved++;maxDelta=Math.max(maxDelta,d);
 }
 // Rebuild area-weighted normals for interior vertices, blend with authored
 // normals, and leave open edges intact (including UV seams).
 const acc=new Float64Array(position.length),smooth=new Float32Array(normal);let normalsChanged=0;
 for(let i=0;i<triangles.length;i+=3){const a=triangles[i]*3,b=triangles[i+1]*3,c=triangles[i+2]*3,ux=next[b]-next[a],uy=next[b+1]-next[a+1],uz=next[b+2]-next[a+2],vx=next[c]-next[a],vy=next[c+1]-next[a+1],vz=next[c+2]-next[a+2],x=uy*vz-uz*vy,y=uz*vx-ux*vz,z=ux*vy-uy*vx;for(const k of [a,b,c]){acc[k]+=x;acc[k+1]+=y;acc[k+2]+=z;}}
 for(let i=0;i<n;i++){if(fixed[i]||adj[i].size<3)continue;const k=i*3,l=Math.hypot(acc[k],acc[k+1],acc[k+2]);if(l<1e-12)continue;const x=acc[k]/l,y=acc[k+1]/l,z=acc[k+2]/l;if(x*normal[k]+y*normal[k+1]+z*normal[k+2]<.5)continue;const a=normal[k]*.55+x*.45,b=normal[k+1]*.55+y*.45,c=normal[k+2]*.55+z*.45,d=Math.hypot(a,b,c);if(d<1e-8)continue;smooth[k]=a/d;smooth[k+1]=b/d;smooth[k+2]=c/d;normalsChanged++;}
 return {position:next,normal:smooth,moved,maxDelta,boundary,normalsChanged,vertices:n,triangles:triangles.length/3};
}
