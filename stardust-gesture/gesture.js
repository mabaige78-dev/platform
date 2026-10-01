// The index finger drives rotation, so its landmarks are deliberately excluded here.
const FINGERS=[[9,10,11,12],[13,14,15,16],[17,18,19,20]];

function distance(a,b){
  return Math.hypot(a.x-b.x,a.y-b.y,(a.z??0)-(b.z??0));
}

export function palmOpenAmount(hand){
  const straightness=FINGERS.reduce((sum,[mcp,pip,dip,tip])=>{
    const chain=distance(hand[mcp],hand[pip])+distance(hand[pip],hand[dip])+distance(hand[dip],hand[tip]);
    return sum+distance(hand[mcp],hand[tip])/Math.max(chain,1e-5);
  },0)/FINGERS.length;
  const t=Math.max(0,Math.min(1,(straightness-.60)/.35));
  return t*t*(3-2*t);
}

export function stepExpansion(current,target,seconds,palmSpeed,handActive){
  const dt=Math.max(0,Math.min(seconds,.05));
  const difference=target-current;
  const speed=handActive
    ?Math.min(2.1,.38+Math.min(1.35,palmSpeed*2.2)+Math.min(.35,Math.abs(difference)*.16))
    :2;
  return current+Math.sign(difference)*Math.min(Math.abs(difference),speed*dt);
}

