import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUpRight} from 'lucide-react';
import Atmosphere from './Atmosphere';

const CHAPTERS=[
 {en:'I · BEFORE THE WORLD AWAKES',name:'万籁',title:'山河未醒。',text:'一缕清冽，穿过万籁。',detail:'THE STILLNESS'},
 {en:'II · A WIND FROM A THOUSAND MILES',name:'风起',title:'风起，万境开。',text:'听见辽阔，向你奔来。',detail:'THE AWAKENING'},
 {en:'III · CARRIED BY THE INFINITE',name:'振羽',title:'借长风，赴山海。',text:'万里风土，托起一瞬相逢。',detail:'THE ASCENT'},
 {en:'IV · A PLACE BENEATH THE MOON',name:'归席',title:'月落一席。',text:'山河归于静谧，你我恰好在此。',detail:'THE ARRIVAL'},
];
const CUTS=[.25,.56,.87];
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
 return <section id="journey" className="wind-journey" aria-label="听风入境，山河归席"><div className="journey-sticky">
  <Atmosphere/>
  <div className="journey-masthead"><span>A JOURNEY INTO THE UNSEEN</span><span>听风入境 · 0{chapter+1}</span></div>
  <div className="journey-heading">{CHAPTERS.map((c,i)=>{
   const enter=i===0?1:ease(CUTS[i-1]+.003,CUTS[i-1]+.032,progress);
   const leave=i===CHAPTERS.length-1?0:ease(CUTS[i]-.032,CUTS[i]-.003,progress);
   const opacity=enter*(1-leave);
   return <div className="journey-caption" key={c.en} aria-hidden={i!==chapter} style={{opacity,transform:`translateY(${(1-enter)*8-leave*8}px)`}}><p className="eyebrow">{c.en}</p><h2>{c.title}</h2><p>{c.text}</p></div>;
  })}</div>
  <div className="journey-bottom"><p>{CHAPTERS[chapter].detail}</p><div className="journey-track" aria-label={`听风入境，第${chapter+1}幕，共${CHAPTERS.length}幕`}>{CHAPTERS.map((c,i)=><span key={c.en} className={chapter===i?'active':''}><i>0{i+1}</i>{c.name}</span>)}</div>
   <div className="journey-score" aria-hidden="true"><span style={{transform:`scaleX(${progress})`}}/></div>
   {progress>.90?<a href="#menu" className="gold-button">赴这一席山河 <ArrowUpRight size={17}/></a>:<span className="journey-scroll">慢慢向下 · 随风入境 <ArrowDown size={15}/></span>}
  </div>
 </div></section>;
}
