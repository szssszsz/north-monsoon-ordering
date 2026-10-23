import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUpRight} from 'lucide-react';
import Atmosphere from './Atmosphere';

const CHAPTERS=[
 {en:'I · THE SHAPE OF STILLNESS',name:'雪岭',title:'微光成山，万境初生。',text:'银蓝的微光聚成雪岭。一场关于风土的远行，由此展开。',detail:'冰川银 · 晨雾青 · 初见山河'},
 {en:'II · THE EARTH BECOMES WIND',name:'风纹',title:'山势渐舒，化作风纹。',text:'峻峭渐为起伏，冷冽渐有温度。山河的骨骼，在风中柔软下来。',detail:'山的骨骼，渐有风的轻盈。'},
 {en:'III · A SILK WOVEN FROM CLOUDS',name:'云绸',title:'风的褶皱，舒卷成云。',text:'青碧转入珠光。风纹离开大地，舒展成一幅流动的云绸。',detail:'碧玉青 · 珠光紫 · 无界云绸'},
 {en:'IV · THE TIDE WITHIN THE LIGHT',name:'回澜',title:'层云回澜，光有归处。',text:'云绸沿着风的弧线回旋，玫瑰霞与香槟金在深处相逢。',detail:'一卷云潮，珍藏万里风土。'},
 {en:'V · A PLACE WITHIN THE INFINITE',name:'入席',title:'云开一席，天地相迎。',text:'万千微光向两侧舒展，在云海中央，为相聚留下一个位置。',detail:'晨雾为序 · 季风入席 · 云海作结'},
];
const CUTS=[.125,.375,.625,.875];
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
 return <section id="journey" className="wind-journey" aria-label="一尘万境，风土入席"><div className="journey-sticky">
  <Atmosphere/>
  <div className="journey-masthead"><span>ONE BREATH, A THOUSAND LANDSCAPES</span><span>一尘万境 · 0{chapter+1}</span></div>
  <div className="journey-heading">{CHAPTERS.map((c,i)=>{
   const enter=i===0?1:ease(CUTS[i-1]-.023,CUTS[i-1]+.023,progress);
   const leave=i===CHAPTERS.length-1?0:ease(CUTS[i]-.023,CUTS[i]+.023,progress);
   const opacity=enter*(1-leave);
   return <div className="journey-caption" key={c.en} aria-hidden={i!==chapter} style={{opacity,transform:`translateY(${(1-enter)*8-leave*8}px)`}}><p className="eyebrow">{c.en}</p><h2>{c.title}</h2><p>{c.text}</p></div>;
  })}</div>
  <div className="journey-bottom"><p>{CHAPTERS[chapter].detail}</p><div className="journey-track" aria-label={`一尘万境，第${chapter+1}幕，共5幕`}>{CHAPTERS.map((c,i)=><span key={c.en} className={chapter===i?'active':''}><i>0{i+1}</i>{c.name}</span>)}</div>
   <div className="journey-score" aria-hidden="true"><span style={{transform:`scaleX(${progress})`}}/></div>
   {progress>.90?<a href="#menu" className="gold-button">让风土，为您入席 <ArrowUpRight size={17}/></a>:<span className="journey-scroll">随您滑动 · 万境流转 <ArrowDown size={15}/></span>}
  </div>
 </div></section>;
}
