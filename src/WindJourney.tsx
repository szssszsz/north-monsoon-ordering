import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUpRight} from 'lucide-react';
import Atmosphere from './Atmosphere';

const CHAPTERS=[
 {en:'I · MOON OVER THE SILENT RIDGES',name:'月起',title:'月白山青，天地无声。',text:'月光落在雪脊。远山，隐入一缕雾里。',detail:'月照雪岭 · 一缕清冽'},
 {en:'II · A WIND WITHOUT BOUNDARIES',name:'风行',title:'风过无垠，山河成诗。',text:'风拂过沙海，把冷冽的银蓝，慢慢写成流金。',detail:'风过沙海 · 万里流金'},
 {en:'III · THE WARMTH WITHIN THE CLOUDS',name:'云渡',title:'云行无迹，光有余温。',text:'白鹤掠过霞色。山海渐远，云潮无声。',detail:'鹤渡云海 · 霞色无声'},
 {en:'IV · A PLACE KEPT WITHIN THE LIGHT',name:'光归',title:'万里风土，只此一席。',text:'山与水，为光让出一条归途。此刻，静候君至。',detail:'山河归光 · 一席私享'},
];
const CUTS=[1/6,1/2,5/6];
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
 return <section id="journey" className="wind-journey" aria-label="山河有信，一席天地"><div className="journey-sticky">
  <Atmosphere/>
  <div className="journey-masthead"><span>A LETTER FROM THE LANDSCAPE</span><span>山河有信 · 0{chapter+1}</span></div>
  <div className="journey-heading">{CHAPTERS.map((c,i)=>{
   const enter=i===0?1:ease(CUTS[i-1]+.003,CUTS[i-1]+.032,progress);
   const leave=i===CHAPTERS.length-1?0:ease(CUTS[i]-.032,CUTS[i]-.003,progress);
   const opacity=enter*(1-leave);
   return <div className="journey-caption" key={c.en} aria-hidden={i!==chapter} style={{opacity,transform:`translateY(${(1-enter)*8-leave*8}px)`}}><p className="eyebrow">{c.en}</p><h2>{c.title}</h2><p>{c.text}</p></div>;
  })}</div>
  <div className="journey-bottom"><p>{CHAPTERS[chapter].detail}</p><div className="journey-track" aria-label={`山河有信，第${chapter+1}幕，共${CHAPTERS.length}幕`}>{CHAPTERS.map((c,i)=><span key={c.en} className={chapter===i?'active':''}><i>0{i+1}</i>{c.name}</span>)}</div>
   <div className="journey-score" aria-hidden="true"><span style={{transform:`scaleX(${progress})`}}/></div>
   {progress>.90?<a href="#menu" className="gold-button">赴这一席山河 <ArrowUpRight size={17}/></a>:<span className="journey-scroll">随您滑动 · 续读山河 <ArrowDown size={15}/></span>}
  </div>
 </div></section>;
}
