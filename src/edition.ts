declare const __EDITION__: 'classic'|'reverie';
export const isReverie=__EDITION__==='reverie';
export const edition=isReverie?'月下回响':'山河珍藏';
export const reverieDishes=[
 {en:'HARUHIKAGE · DAWN RESERVE',name:'春日影',tag:'雨后 · 五色 · 共鸣',desc:'珍藏雨停之前的一缕清风。把各自拾来的微光，汇成同一席春日；即使迷路，也在这里相聚。'},
 {en:'THE DUNGEON TABLE',name:'迷宫暖雾',tag:'苔香 · 柴火 · 探索',desc:'循石阶向深处，采一缕行走菇旁的林雾，以炉火慢煨。冒险再远，也要好好吃饭。'},
 {en:'INORI · A GOLDEN TRACE',name:'冰上祈愿',tag:'冰晶 · 旋舞 · 金色',desc:'以冰面的清冽作序，把祈愿交给起跳的一瞬。循着光的方向，留下属于自己的金色轨迹。'},
];
export const chapterText=isReverie?[
 {en:'I · A SPRING LIGHT WE FOUND',name:'拾光',title:'迷路，也会相逢。',text:'把拾来的微光，写成同一首春日。',detail:'THE FIRST NOTE'},
 {en:'II · A FEAST ALONG THE WAY',name:'寻味',title:'向深处，寻一席暖。',text:'冒险的路上，总有一锅热气等你。',detail:'THE WANDERER’S TABLE'},
 {en:'III · A PRAYER TAKES FLIGHT',name:'逐光',title:'把祈愿，交给风。',text:'冰面上的一步，也能抵达金色远方。',detail:'THE GOLDEN TRACE'},
 {en:'IV · A NOCTURNE FOR FIVE',name:'月宴',title:'今夜，月下再会。',text:'当帷幕落下，五道回响恰好归席。',detail:'THE MOONLIT ENCORE'},
]:[
 {en:'I · BEFORE THE WORLD AWAKES',name:'万籁',title:'山河未醒。',text:'一缕清冽，穿过万籁。',detail:'THE STILLNESS'},
 {en:'II · A WIND FROM A THOUSAND MILES',name:'风起',title:'风起，万境开。',text:'听见辽阔，向你奔来。',detail:'THE AWAKENING'},
 {en:'III · CARRIED BY THE INFINITE',name:'振羽',title:'借长风，赴山海。',text:'万里风土，托起一瞬相逢。',detail:'THE ASCENT'},
 {en:'IV · A PLACE BENEATH THE MOON',name:'归席',title:'月落一席。',text:'山河归于静谧，你我恰好在此。',detail:'THE ARRIVAL'},
];
