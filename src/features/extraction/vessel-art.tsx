import { useId, type CSSProperties } from 'react'
import type { ExtractionProjection } from '@/application/scenarios/extraction-projection.js'
import styles from './apparatus.module.css'

export type VisibleVessel=ExtractionProjection['vessels'][number]
export function liquidLayout(vessel:VisibleVessel) {
  const total=vessel.waterMl+vessel.organicMl,bottom=vessel.id==='F'?200:221
  const fraction=total/250
  const height=total>0?Math.min(155,155*(vessel.id==='F'?Math.cbrt(fraction):vessel.id.startsWith('R')?Math.sqrt(fraction):fraction)):0
  const water=total?height*vessel.waterMl/total:0
  return {bottom,height,water,organic:height-water}
}
/** Geometry and colors describe the apparatus/phase only, never the hidden A/B/N inventory. */
export function VesselArt({vessel,previous,compact=false,motion='idle'}:{vessel:VisibleVessel;previous?:VisibleVessel|undefined;compact?:boolean;motion?:string}) {
  const uid=useId(),funnel=vessel.id==='F',flask=vessel.id.startsWith('R'),waste=vessel.id==='W'
  const shape=funnel?'M48 38H132Q145 100 111 152L97 176V201H83V176L69 152Q35 100 48 38Z':flask?'M74 35H106V77L145 194Q153 219 133 224H47Q27 219 35 194L74 77Z':waste?'M71 32H109V61L128 85V213Q128 225 115 225H65Q52 225 52 213V85L71 61Z':'M38 42H142V211Q90 231 38 211Z'
  const {bottom,height,water,organic}=liquidLayout(vessel)
  const before=liquidLayout(previous??vessel)
  const changing=!!previous&&['transfer','receiving','add_reagent','filter','evaporate','dry'].includes(motion)
  const maxWater=Math.max(water,changing?before.water:0),maxOrganic=Math.max(organic,changing?before.organic:0)
  const layerStyle=(start:number,end:number,max:number,base:number,shift=0):CSSProperties=>({
    '--phase-start-scale':max?start/max:0,'--phase-end-scale':max?end/max:0,
    '--phase-start-shift':shift+'px',transformOrigin:'0px '+base+'px',
  } as CSSProperties)
  const maxMixed=Math.max(height,changing?before.height:0)
  return <svg viewBox="0 0 180 250" aria-hidden="true" className={styles.vesselArt}>
    <defs>
      <linearGradient id={uid+'glass'} x1="0" x2="1"><stop stopColor="#f9fdff" stopOpacity=".94"/><stop offset=".35" stopColor="#e6f0f5" stopOpacity=".4"/><stop offset=".8" stopColor="#fff" stopOpacity=".8"/><stop offset="1" stopColor="#cadfe9" stopOpacity=".65"/></linearGradient>
      <linearGradient id={uid+'water'} x1="0" x2="1"><stop stopColor="#aedbdd"/><stop offset=".55" stopColor="#d7eeed"/><stop offset="1" stopColor="#8cbfc5"/></linearGradient>
      <linearGradient id={uid+'organic'} x1="0" x2="1"><stop stopColor="#dfbf81"/><stop offset=".55" stopColor="#f5e5bc"/><stop offset="1" stopColor="#e8cd98"/></linearGradient>
      <clipPath id={uid+'clip'}><path d={shape}/></clipPath>
    </defs>
    <ellipse cx="90" cy="238" rx="60" ry="6" fill="#8aaab9" opacity=".12"/>
    <g className={styles.vesselMotion} data-motion={motion} key={motion}>
      <path d={shape} fill={'url(#'+uid+'glass)'} stroke="#7398ab" strokeWidth="1.7"/>
      <g clipPath={'url(#'+uid+'clip)'}>
        {maxMixed>0&&((vessel.separated||vessel.waterMl===0||vessel.organicMl===0)?<>
          {maxWater>0&&<rect className={styles.liquid+' '+styles.waterLayer+(changing?' '+styles.layerChanging:'')} style={changing?layerStyle(before.water,water,maxWater,bottom):undefined} data-phase="aqueous" x="25" y={bottom-maxWater} width="130" height={maxWater} fill={'url(#'+uid+'water)'}/>}
          {maxOrganic>0&&<rect className={styles.liquid+' '+styles.organicLayer+(changing?' '+styles.layerChanging:'')} style={changing?layerStyle(before.organic,organic,maxOrganic,bottom-water,water-before.water):undefined} data-phase="organic" x="25" y={bottom-water-maxOrganic} width="130" height={maxOrganic} fill={'url(#'+uid+'organic)'}/>}
          {!changing&&<path d={`M25 ${bottom-height}Q90 ${bottom-height+5}155 ${bottom-height}`} fill="none" stroke={organic>0?'#c0a16a':'#73a8b2'} strokeWidth="1"/>}
          {!changing&&water>0&&organic>0&&<path d={`M25 ${bottom-water}H155`} stroke="#829f9c" strokeWidth=".9"/>}
        </>:<rect className={changing?styles.layerChanging:undefined} style={changing?layerStyle(before.height,height,maxMixed,bottom):undefined} x="25" y={bottom-maxMixed} width="130" height={maxMixed} fill="#b6d3d4"/>)}
        {vessel.solidPresent&&<g className={styles.solidBed} fill="#ddd8c8" stroke="#b4ac97" strokeWidth=".7">{Array.from({length:12},(_,i)=><ellipse key={i} cx={funnel?80+(i%4)*7:53+(i%6)*14} cy={bottom-3-Math.floor(i/6)*4} rx="7" ry="3"/>)}</g>}
        {height>0&&<path className={styles.swirl} d={`M51 ${bottom-height*.55}q38-8 78 0m-73 ${Math.min(14,height*.2)}q34 8 68 0`} fill="none" stroke="white" strokeWidth="2"/>}
        {motion==='mix'&&height>0&&<g className={styles.mixingEddies} fill="none" stroke="#f1ffff" strokeWidth="1.4">{[0,1,2].map(n=><ellipse key={n} cx="90" cy={bottom-height*(.3+n*.23)} rx={22+n*5} ry="5" style={{animationDelay:(n*.13)+'s'}}/>)}</g>}
        {motion==='settle'&&height>0&&<rect className={styles.mixedVeil} x="25" y={bottom-height} width="130" height={height} fill="#b6d3d4"/>}
        <path d={funnel?'M59 52q-3 48 17 83':'M47 58v133'} stroke="white" opacity=".85" strokeWidth="4" fill="none" strokeLinecap="round"/>
      </g>
      <path d={shape} fill="none" stroke="#6e93a5" strokeWidth="1.6"/>
      {funnel?<>
        <g className={styles.stopper}><rect x="77" y="24" width="26" height="14" rx="3" fill="#e7f1f5" stroke="#8cabb9"/>
        <path d="M82 13h16v11H82Z" fill="#a9c0cc" stroke="#7494a6"/></g>
        <rect x="78" y="201" width="24" height="10" rx="3" fill="#d4e5ec" stroke="#7398ab"/>
        <path className={styles.stopcock} d="M72 206h36" stroke="#007b80" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="90" cy="206" r="3" fill="#005f68"/>
        <path d="M86 211v19h8v-19" fill="#edf6f8" stroke="#7398ab"/>
      </>:waste?<><rect x="68" y="23" width="44" height="11" rx="3" fill="#7394a5"/><rect x="62" y="113" width="56" height="45" rx="3" fill="white" opacity=".9"/><text x="90" y="143" textAnchor="middle" fill="#546d7c" fontSize="21" fontWeight="650">W</text></>:<>
        <ellipse cx="90" cy={flask?35:42} rx={flask?19:54} ry="4" fill="#f8fcff" stroke="#7e9eaf" strokeWidth="1.4"/>
        {!compact&&<g stroke="#90aab8" strokeWidth=".9">{[100,135,170].map(y=><path key={y} d={'M'+(flask?106:126)+' '+y+'h8'}/>)}</g>}
      </>}
    </g>
    {!compact&&<text x="90" y="247" textAnchor="middle" fontSize="8" fill="#617e90">Dung tích 250 mL</text>}
  </svg>
}
