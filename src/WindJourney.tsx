import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUpRight} from 'lucide-react';
const CHAPTERS=[
 {en:'I · GLACIAL DAWN',title:'雪域初光，万境初开。',text:'雪脊、星芒与高纬流光，共同铺陈一席风土的起点。',detail:'冰川银 · 晨曦金 · 雪山风土'},
 {en:'II · WINDS OF JADE',title:'风过旷野，流金成缎。',text:'季风穿越峡谷与沙海，将山河的纹理，织成一幅无形锦缎。',detail:'翡翠青 · 香槟金 · 万里季风'},
 {en:'III · OPAL CLOUDSCAPE',title:'云海生辉，琉光入梦。',text:'霞光掠过雪峰，层云在脚下舒展。将天地最轻盈的一刻，化作私享珍藏。',detail:'月光蓝 · 珠光紫 · 玫瑰霞'},
 {en:'IV · THE PRIVATE COLLECTION',title:'三重风味，各有风华。',text:'以晨雾为盏，以气流为韵，以云端为冕。自然的层次，尽在这一席。',detail:'冷萃晨雾  /  珍藏气流  /  云端轻享'},
 {en:'V · THE GRAND UNVEILING',title:'琉璃映席，盛宴启封。',text:'杯盏映照云光，金色穹顶随君揭启。以一席天地，隆重款待知己。',detail:'琉璃杯盏 · 云端珍馐 · 零元礼遇'},
 {en:'VI · YOUR TABLE ABOVE THE CLOUDS',title:'穿过云海，山河入席。',text:'金色拱廊之外，群峰为幕，云海为席。这一刻的辽阔，只为相聚的你们珍藏。',detail:'云端露台 · 山河私宴 · 即刻留席'},
];
export default function WindJourney(){
 const [chapter,setChapter]=useState(0);
 useEffect(()=>{const update=()=>{const el=document.getElementById('journey');if(!el)return;const r=el.getBoundingClientRect(),p=Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-innerHeight)));setChapter(Math.min(5,Math.floor(p*5+.5)))};update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update)}},[]);
 const c=CHAPTERS[chapter];
 return <section id="journey" className="wind-journey" aria-label="山河风土之旅"><div className="journey-sticky"><div className="journey-heading"><p className="eyebrow">{c.en}</p><h2>{c.title}</h2><p>{c.text}</p></div><div className="journey-bottom"><p>{c.detail}</p><div className="journey-track" aria-label={`风土之旅，第${chapter+1}章，共6章`}>{CHAPTERS.map((_,i)=><span key={i} className={chapter===i?'active':''}>0{i+1}</span>)}</div>{chapter===5?<a href="#menu" className="gold-button">甄选您的盛宴 <ArrowUpRight size={17}/></a>:<span className="journey-scroll">随您滑动 · 山河流转 <ArrowDown size={15}/></span>}</div></div></section>;
}
