import * as T from 'three';
// Deterministic two-bone inverse kinematics for VRM finger joints.
// Returns desired joint positions only; does not mutate the input or alter bone lengths.
export function solveGripFinger(base,middle,distal,target,bendHint,maxBend=1.65){
 const vectors=[base,middle,distal,target,bendHint];
 if(vectors.some(v=>!v?.isVector3||![v.x,v.y,v.z].every(Number.isFinite))||!Number.isFinite(maxBend)||maxBend<=0||maxBend>=Math.PI)return null;
 const l1=middle.distanceTo(base),l2=distal.distanceTo(middle);
 if(l1<.003||l2<.002||l1>.10||l2>.10)return null;
 const displacement=target.clone().sub(base),rawDistance=displacement.length();
 if(rawDistance<1e-7)return null;
 const direction=displacement.multiplyScalar(1/rawDistance);
 const shortest=Math.sqrt(l1*l1+l2*l2+2*l1*l2*Math.cos(maxBend));
 const distance=T.MathUtils.clamp(rawDistance,shortest+1e-6,l1+l2-1e-6);
 if(!(distance>0))return null;
 const end=base.clone().addScaledVector(direction,distance);
 const along=(l1*l1-l2*l2+distance*distance)/(2*distance);
 const height=Math.sqrt(Math.max(0,l1*l1-along*along));
 // Preserve the authored natural bend plane where possible.
 const rest=middle.clone().sub(base),hint=bendHint.clone().addScaledVector(direction,-bendHint.dot(direction));
 if(hint.lengthSq()<1e-8)hint.copy(rest).addScaledVector(direction,-rest.dot(direction));
 if(hint.lengthSq()<1e-8){const axis=Math.abs(direction.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0);hint.crossVectors(direction,axis);}
 if(hint.lengthSq()<1e-10)return null;
 hint.normalize();
 const joint=base.clone().addScaledVector(direction,along).addScaledVector(hint,height);
 const bend=Math.acos(T.MathUtils.clamp((distance*distance-l1*l1-l2*l2)/(2*l1*l2),-1,1));
 if(![...joint.toArray(),...end.toArray(),bend].every(Number.isFinite))return null;
 return {joint,end,bend,reachError:end.distanceTo(target),firstLength:l1,secondLength:l2};
}
