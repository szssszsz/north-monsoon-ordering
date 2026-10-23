import {isReverie} from './edition';
export default function MenuArtwork({index}:{index:number}){
 const lines=Array.from({length:16},(_,i)=>i);
 return <svg className="collection-engraving" viewBox="0 0 360 240" fill="none" aria-hidden="true">
  <circle cx="180" cy="114" r="80" className="engraving-orbit"/><path d="M45 190H315M180 24V35M180 194V207" className="engraving-rule"/>
  {index===0&&<>{lines.map(i=><path key={i} opacity={.16+i*.035} d={`M35 ${164+i*2} Q79 ${133+i*2} 111 ${146+i} L151 ${68+i*3} L177 ${112+i*2} L209 ${88+i*3} Q244 ${148+i} 325 ${157+i*2}`}/>)}<circle cx="245" cy="69" r="14"/>{isReverie&&<g>{['#72b7cc','#c98c99','#d7a873','#94bca4','#b6a6d1'].map((c,i)=><path key={c} d={`M${125+i*28} 182l7 -9 9 4 2 9 -12 3z`} fill={c} stroke="none"/>)}</g>}</>}
  {index===1&&<>{lines.map(i=><path key={i} opacity={.15+i*.036} d={`M${43+i*2} ${142+i} C${88+i} ${34+i*2},${298-i} ${32+i*4},${308-i*3} ${123+i} S${110+i} ${202-i*2},${111+i*3} ${114-i} S${255-i*2} ${77+i},${247-i} ${135+i}`}/>)}{isReverie&&<g className="secret-etch" transform="translate(140 66)"><path d="M0 35C-5-8 76-12 80 35Q40 49 0 35ZM31 43L28 70H43L42 46M29 70L18 78M42 69L54 77M10 32Q39 39 70 31"/><circle cx="27" cy="20" r="3"/><circle cx="56" cy="18" r="4"/></g>}</>}
  {index===2&&<>{lines.map(i=><path key={i} opacity={.15+i*.035} d={`M${30+i} ${162+i*2} Q${110+i*2} ${133+i*3} 180 ${164+i} T${329-i} ${164+i*2}`}/>)}{isReverie?<g className="secret-etch"><path d="M136 69L164 55L177 91L203 110L229 114Q239 126 225 135H155Q138 131 136 114ZM150 139V153M221 139V151M132 156Q193 167 240 147M165 72L177 68M169 82L182 78M173 93L187 88"/><circle cx="250" cy="62" r="13"/><path d="M241 51L236 31L249 37L260 30L258 51M245 62L249 57L253 62L249 68Z"/></g>:<><circle cx="231" cy="76" r="30"/><circle cx="222" cy="68" r="27" className="moon-cut"/></>}</>}
  <path d="M171 215H189M180 210V220" className="engraving-rule"/>
 </svg>
}
export function MoonSeal(){return <div className="moon-seal" aria-hidden="true"><svg viewBox="0 0 240 70" fill="none">{[0,1,2,3,4].map(i=><g key={i} transform={`translate(${27+i*46} 30)`}><path d="M-14-3Q0-19 14-3L10 11Q0 22-10 11Z"/><path d="M-10 0L-3 3M3 3L10 0M-3 12Q0 14 3 12"/></g>)}</svg><span>DOLORIS · MORTIS · TIMORIS · AMORIS · OBLIVIONIS</span></div>}
