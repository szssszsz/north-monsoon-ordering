import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUpRight} from 'lucide-react';
import Atmosphere from './Atmosphere';

const CHAPTERS=[
 {en:'I · THE BREATH OF THE MOUNTAIN',name:'起山',title:'一息，山河起。',text:'微光循着山脊奔流。静默的天地，开始呼吸。',detail:'银蓝 · 山脊 · 初息'},
 {en:'II · WHERE THE WIND BREAKS FREE',name:'逐风',title:'长风，卷万重。',text:'山的脉络舒展成风。千丝万缕，汇成一道奔涌的光。',detail:'碧青 · 风涌 · 万里'},
 {en:'III · WINGS OVER THE INFINITE',name:'生羽',title:'振羽，向无垠。',text:'风有了羽翼。把万里山河，带向相聚的一席。',detail:'流金 · 振羽 · 归席'},
];
const CUTS=[.25,.75];
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
 return <section id="journey" className="wind-journey" aria-label="风生万象，一息山河"><div className="journey-sticky">
  <Atmosphere/>
  <div className="journey-masthead"><span>THE SHAPE OF A BREATH</span><span>风生万象 · 0{chapter+1}</span></div>
  <div className="journey-heading">{CHAPTERS.map((c,i)=>{
   const enter=i===0?1:ease(CUTS[i-1]+.003,CUTS[i-1]+.032,progress);
   const leave=i===CHAPTERS.length-1?0:ease(CUTS[i]-.032,CUTS[i]-.003,progress);
   const opacity=enter*(1-leave);
   return <div className="journey-caption" key={c.en} aria-hidden={i!==chapter} style={{opacity,transform:`translateY(${(1-enter)*8-leave*8}px)`}}><p className="eyebrow">{c.en}</p><h2>{c.title}</h2><p>{c.text}</p></div>;
  })}</div>
  <div className="journey-bottom"><p>{CHAPTERS[chapter].detail}</p><div className="journey-track" aria-label={`风生万象，第${chapter+1}幕，共${CHAPTERS.length}幕`}>{CHAPTERS.map((c,i)=><span key={c.en} className={chapter===i?'active':''}><i>0{i+1}</i>{c.name}</span>)}</div>
   <div className="journey-score" aria-hidden="true"><span style={{transform:`scaleX(${progress})`}}/></div>
   {progress>.90?<a href="#menu" className="gold-button">赴这一席山河 <ArrowUpRight size={17}/></a>:<span className="journey-scroll">向下滑动 · 逐风而行 <ArrowDown size={15}/></span>}
  </div>
 </div></section>;
}
