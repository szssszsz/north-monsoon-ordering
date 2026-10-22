import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUpRight} from 'lucide-react';
import Atmosphere from './Atmosphere';
const CHAPTERS=[
 {en:'I · WHERE THE WIND BEGINS',title:'风起，万境生。',text:'山脊被晨光轻轻描亮。风，从更远的地方来到这里。',detail:'雪脊银 · 冰川青 · 初光'},
 {en:'II · A THOUSAND GOLDEN CURRENTS',title:'旷野流金，天地成绸。',text:'沙丘起伏如绸，万千微光，循着季风的方向汇流。',detail:'流沙金 · 碧玉绿 · 远风'},
 {en:'III · THE SOFTNESS OF DISTANCE',title:'云有回声，光有温度。',text:'层云漫过旷野。青碧与珠光，在风中彼此照见。',detail:'月光蓝 · 珠光紫 · 云潮'},
 {en:'IV · ALL THAT THE EARTH HOLDS',title:'一席之间，万象丰盈。',text:'掠过山海的光，慢慢汇成一场，只属于此刻的丰盛。',detail:'山海为序 · 季风为韵 · 私享无界'},
 {en:'V · BEYOND THE VISIBLE',title:'循光而行，不设边界。',text:'一缕风，携万里山河。一束光，照见未抵达的远方。',detail:'玫瑰霞 · 香槟金 · 无尽风土'},
 {en:'VI · A PLACE KEPT FOR YOU',title:'天地留白，只待君至。',text:'云与风渐次舒展。把天地之间最好的位置，为你留着。',detail:'晨雾 · 季风 · 云海 · 一席珍藏'},
];
export default function WindJourney(){
 const [progress,setProgress]=useState(0);
 useEffect(()=>{let frame=0;const update=()=>{frame=0;const el=document.getElementById('journey'),viewport=el?.querySelector('.journey-sticky');if(!el||!viewport)return;const r=el.getBoundingClientRect();setProgress(Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-viewport.clientHeight))))};const scroll=()=>{if(!frame)frame=requestAnimationFrame(update)};update();window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll)}},[]);
 const coordinate=progress*5,chapter=Math.min(5,Math.round(coordinate));
 return <section id="journey" className="wind-journey" aria-label="山河风土之旅"><div className="journey-sticky"><Atmosphere/><div className="journey-masthead"><span>THE NORTH MONSOON ATELIER</span><span>风土手记 · 0{chapter+1}</span></div><div className="journey-heading">{CHAPTERS.map((c,i)=>{const distance=Math.abs(coordinate-i),opacity=Math.max(0,Math.min(1,(.49-distance)/.18));return <div className="journey-caption" key={c.en} aria-hidden={i!==chapter} style={{opacity,transform:`translateY(${(i-coordinate)*12}px)`}}><p className="eyebrow">{c.en}</p><h2>{c.title}</h2><p>{c.text}</p></div>})}</div><div className="journey-bottom"><p>{CHAPTERS[chapter].detail}</p><div className="journey-track" aria-label={`风土之旅，第${chapter+1}章，共6章`}>{CHAPTERS.map((_,i)=><span key={i} className={chapter===i?'active':''}>0{i+1}</span>)}</div>{progress>.88?<a href="#menu" className="gold-button">甄选此间珍藏 <ArrowUpRight size={17}/></a>:<span className="journey-scroll">随您滑动 · 风与光同行 <ArrowDown size={15}/></span>}</div></div></section>;
}
