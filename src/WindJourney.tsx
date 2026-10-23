import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUpRight} from 'lucide-react';
import Atmosphere from './Atmosphere';

const CHAPTERS=[
 {en:'I · THE FIRST BREATH',name:'雪岭',title:'一缕风，从雪岭启程。',text:'天光尚冷。它掠过雪脊，带走第一抹银白。',detail:'雪的清冽，是这一席的序章。'},
 {en:'II · THE GOLDEN PASSAGE',name:'金沙',title:'越过山口，旷野渐金。',text:'风沿着山势落入沙海。晨曦所至，起伏的纹理一寸寸亮起。',detail:'带着雪的清冽，拾起旷野的温度。'},
 {en:'III · ABOVE THE TIDES',name:'云渡',title:'托起云潮，越过万山。',text:'金沙的余光升入层云。那缕风向上舒展，把远山与云海连成归途。',detail:'风有了层次，云有了回响。'},
 {en:'IV · A WAY THROUGH THE LIGHT',name:'循光',title:'云海开处，一径流光。',text:'风抵达天际，云潮向两侧舒展。一道暖光，从远方延至眼前。',detail:'万里山河，终于有了相聚的方向。'},
 {en:'V · ALL ROADS LEAD TO THIS MOMENT',name:'入席',title:'万里风土，在此入席。',text:'雪岭、金沙与云海，随同一缕风而来。此刻，天地的丰盛只待与你相逢。',detail:'晨雾为序 · 季风入席 · 云海作结'},
];
const CUTS=[.14,.38,.65,.88];
function ease(a:number,b:number,p:number){const t=Math.max(0,Math.min(1,(p-a)/(b-a)));return t*t*(3-2*t)}
export default function WindJourney(){
 const [progress,setProgress]=useState(0);
 useEffect(()=>{
  let frame=0;
  const update=()=>{frame=0;const el=document.getElementById('journey'),viewport=el?.querySelector('.journey-sticky');if(!el||!viewport)return;const r=el.getBoundingClientRect();setProgress(Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-viewport.clientHeight))))};
  const scroll=()=>{if(!frame)frame=requestAnimationFrame(update)};
  update();window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll)};
 },[]);
 const chapter=CUTS.filter(c=>progress>=c).length;
 return <section id="journey" className="wind-journey" aria-label="风赴山海，万境入席"><div className="journey-sticky">
  <Atmosphere/>
  <div className="journey-masthead"><span>A WIND ACROSS THE WORLD</span><span>风赴山海 · 0{chapter+1}</span></div>
  <div className="journey-heading">{CHAPTERS.map((c,i)=>{
   const enter=i===0?1:ease(CUTS[i-1]-.023,CUTS[i-1]+.023,progress);
   const leave=i===CHAPTERS.length-1?0:ease(CUTS[i]-.023,CUTS[i]+.023,progress);
   const opacity=enter*(1-leave);
   return <div className="journey-caption" key={c.en} aria-hidden={i!==chapter} style={{opacity,transform:`translateY(${(1-enter)*8-leave*8}px)`}}><p className="eyebrow">{c.en}</p><h2>{c.title}</h2><p>{c.text}</p></div>;
  })}</div>
  <div className="journey-bottom"><p>{CHAPTERS[chapter].detail}</p><div className="journey-track" aria-label={`风赴山海，第${chapter+1}幕，共5幕`}>{CHAPTERS.map((c,i)=><span key={c.en} className={chapter===i?'active':''}><i>0{i+1}</i>{c.name}</span>)}</div>
   <div className="journey-score" aria-hidden="true"><span style={{transform:`scaleX(${progress})`}}/></div>
   {progress>.90?<a href="#menu" className="gold-button">让风土，为您入席 <ArrowUpRight size={17}/></a>:<span className="journey-scroll">向下续读 · 一缕风的远行 <ArrowDown size={15}/></span>}
  </div>
 </div></section>;
}
