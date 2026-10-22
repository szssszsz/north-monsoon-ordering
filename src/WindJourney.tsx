import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUpRight} from 'lucide-react';
const CHAPTERS=[
 {en:'ORIGIN · THE NORTHWEST',title:'风越山河，自有珍藏。',text:'一缕季风，穿越高山与旷野。将万里风土，凝为这一席的序章。',detail:'群山 · 季风 · 天然风土'},
 {en:'COLLECTION · THREE EXPRESSIONS',title:'无形珍馐，三重风味。',text:'晨雾的清冽，气流的深邃，云海的轻盈。以自然之形，呈献云端珍藏。',detail:'冷萃晨雾  /  珍藏气流  /  云端轻享'},
 {en:'RITUAL · THE PRIVATE TABLE',title:'以天地，款待知己。',text:'金色穹顶缓缓揭序，山河风物如约入席。每一次相聚，皆值得隆重以待。',detail:'云端礼遇 · 无限量品鉴 · 零元尊享'},
 {en:'INVITATION · SEALED FOR YOU',title:'一席风景，只候君至。',text:'将风土封存于专属邀约，把此刻留给你与同行者。盛宴，由此开启。',detail:'专属席位 · 私享邀约 · 即刻留席'},
];
export default function WindJourney(){
 const [chapter,setChapter]=useState(0);
 useEffect(()=>{const update=()=>{const el=document.getElementById('journey');if(!el)return;const r=el.getBoundingClientRect(),p=Math.max(0,Math.min(1,-r.top/(r.height-innerHeight)));setChapter(Math.min(3,Math.floor(p*3+.4)))};update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update)}},[]);
 const c=CHAPTERS[chapter];
 return <section id="journey" className="wind-journey" aria-label="山河风土之旅"><div className="journey-sticky"><div className="journey-heading" key={chapter}><p className="eyebrow">{c.en}</p><h2>{c.title}</h2><p>{c.text}</p></div><div className="journey-bottom"><p>{c.detail}</p><div className="journey-track" aria-label={`风土之旅，第${chapter+1}章，共4章`}>{CHAPTERS.map((_,i)=><span key={i} className={chapter===i?'active':''}>0{i+1}</span>)}</div>{chapter===3?<a href="#menu" className="gold-button">甄选您的盛宴 <ArrowUpRight size={17}/></a>:<span className="journey-scroll">继续滑动 · 风土流转 <ArrowDown size={15}/></span>}</div></div></section>;
}
