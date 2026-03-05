'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from "react";

/* ═══════════════════════════════════════
   PHYSICS — 1D Isentropic + Normal Shock
═══════════════════════════════════════ */
const G = 1.4;
const aas  = (M: number) => (M<=0)?1e9:(1/M)*Math.pow((2/(G+1))*(1+(G-1)/2*M*M),(G+1)/(2*(G-1)));
const pr   = (M: number) => Math.pow(1+(G-1)/2*M*M,-G/(G-1));
const mSub = (r: number) => { if(r<=1.0001)return 0.9999; let lo=1e-6,hi=1-1e-9; for(let i=0;i<80;i++){const m=(lo+hi)/2;aas(m)>r?lo=m:hi=m;} return(lo+hi)/2; };
const mSup = (r: number) => { if(r<=1.0001)return 1.0001; let lo=1+1e-9,hi=15;   for(let i=0;i<80;i++){const m=(lo+hi)/2;aas(m)>r?hi=m:lo=m;} return(lo+hi)/2; };
const shM2  = (M1: number) => Math.sqrt((M1*M1*(G-1)/2+1)/(G*M1*M1-(G-1)/2));
const shP0r = (M1: number) => {
  const a=Math.pow((G+1)/2*M1*M1/(1+(G-1)/2*M1*M1),G/(G-1));
  const b=Math.pow((G+1)/(2*G*M1*M1-(G-1)),1/(G-1));
  return a*b;
};

interface CPoint { x: number; y: number; }

function interpAx(cpts: CPoint[], N: number) {
  const res: number[]=[];
  for(let i=0;i<N;i++){
    const x=i/(N-1);
    let j=0;
    for(let k=0;k<cpts.length-1;k++){if(x<=cpts[k+1].x){j=k;break;}if(k===cpts.length-2)j=k;}
    const p0=cpts[j],p1=cpts[j+1],dx=p1.x-p0.x;
    if(dx<1e-10){res.push(p1.y);continue;}
    const t=(x-p0.x)/dx,t2=t*t,t3=t2*t;
    const m0=j>0?(cpts[j+1].y-cpts[j-1].y)/(cpts[j+1].x-cpts[j-1].x):(p1.y-p0.y)/dx;
    const m1=j+2<cpts.length?(cpts[j+2].y-cpts[j].y)/(cpts[j+2].x-cpts[j].x):(p1.y-p0.y)/dx;
    res.push(Math.max(0.06,(2*t3-3*t2+1)*p0.y+(t3-2*t2+t)*dx*m0+(-2*t3+3*t2)*p1.y+(t3-t2)*dx*m1));
  }
  return res;
}

function computeFlow(Ax: number[], PbP0: number) {
  const N=Ax.length;
  let iT=0;
  for(let i=1;i<N;i++) if(Ax[i]<Ax[iT]) iT=i;
  const Am=Ax[iT],Ae=Ax[N-1],re=Ae/Am;
  const MeS=mSub(re),MeP=mSup(re);
  const PbC=pr(MeS),PbD=pr(MeP);
  const Mx=new Array(N);
  let regime='sub',shIdx=-1;

  if(PbP0>=PbC){
    const Me=Math.sqrt(Math.max(0,2/(G-1)*(Math.pow(Math.max(PbP0,0.001),-(G-1)/G)-1)));
    const Av=Me<0.001?1e9:Ae/aas(Me);
    for(let i=0;i<N;i++){const r=Ax[i]/Av;Mx[i]=r<=1.0001?0.002:mSub(r);}
  } else if(PbP0<=PbD+5e-4){
    regime='sup';
    for(let i=0;i<N;i++) Mx[i]=i<=iT?mSub(Ax[i]/Am):mSup(Ax[i]/Am);
  } else {
    regime='shock';
    let found=false;
    for(let j=iT+1;j<N;j++){
      const M1=mSup(Ax[j]/Am),M2=shM2(M1),p0r=shP0r(M1),Aa=Ax[j]/aas(M2);
      const rex=Ae/Aa,Mea=rex<=1.0001?0.002:mSub(rex);
      if(p0r*pr(Mea)>=PbP0){
        shIdx=j;
        for(let i=0;i<N;i++){
          if(i<=iT)Mx[i]=mSub(Ax[i]/Am);
          else if(i<j)Mx[i]=mSup(Ax[i]/Am);
          else if(i===j)Mx[i]=M2;
          else Mx[i]=mSub(Ax[i]/Aa);
        }
        found=true;break;
      }
    }
    if(!found){regime='sup';shIdx=N-1;for(let i=0;i<N;i++)Mx[i]=i<=iT?mSub(Ax[i]/Am):mSup(Ax[i]/Am);}
  }
  return{Mx,Px:Mx.map(pr),regime,shIdx,iT,Am,PbC,PbD};
}

/* ════════════════════════════════
   COLOR MAPPING
════════════════════════════════ */
function machCol(M: number){
  const t=Math.min(Math.max(M,0),4);
  if(t<1){
    const u=t;
    return `rgb(${Math.round(15+u*50)},${Math.round(60+u*180)},${Math.round(220-u*70)})`;
  } else if(t<2){
    const u=t-1;
    return `rgb(${Math.round(65+u*190)},${Math.round(240-u*120)},${Math.round(150-u*150)})`;
  } else {
    const u=Math.min((t-2)/2,1);
    return `rgb(255,${Math.round(120-u*120)},0)`;
  }
}

/* ════════════════════════════════
   LEVELS
════════════════════════════════ */
const LVS=[
  {
    id:1,name:"Level 1 -- Subsonic Acceleration",
    obj:"Exit Mach M_exit = 0.45 ~ 0.55",
    ok:(fl: any,N: number)=>fl.regime==='sub'&&fl.Mx[N-1]>=0.45&&fl.Mx[N-1]<=0.55,
    hint:"Converging nozzle (exit < inlet area) + adjust back pressure. In subsonic flow, smaller area = faster velocity.",
    cp:[{x:0,y:0.88},{x:0.25,y:0.78},{x:0.5,y:0.68},{x:0.75,y:0.57},{x:1,y:0.52}],pb:0.88,
  },
  {
    id:2,name:"Level 2 -- Choke the Flow",
    obj:"Achieve choked condition (M_throat = 1)",
    ok:(fl: any)=>fl.regime!=='sub',
    hint:"Lower Pb slider below Pb* or narrow the throat further. Critical pressure ratio = 0.528 (gamma=1.4)",
    cp:[{x:0,y:0.85},{x:0.25,y:0.62},{x:0.5,y:0.37},{x:0.75,y:0.62},{x:1,y:0.78}],pb:0.65,
  },
  {
    id:3,name:"Level 3 -- Supersonic Nozzle Design",
    obj:"Shock-free M_exit = 1.9 ~ 2.1",
    ok:(fl: any,N: number)=>fl.regime==='sup'&&fl.Mx[N-1]>=1.9&&fl.Mx[N-1]<=2.1,
    hint:"C-D nozzle: narrow throat + wide exit. Need A_exit/A_throat ~ 1.69. Lower Pb to design pressure.",
    cp:[{x:0,y:0.85},{x:0.25,y:0.58},{x:0.5,y:0.34},{x:0.75,y:0.58},{x:1,y:0.74}],pb:0.12,
  },
  {
    id:4,name:"Level 4 -- Shock Positioning",
    obj:"Place normal shock at x = 0.65 ~ 0.80",
    ok:(fl: any,N: number)=>fl.regime==='shock'&&fl.shIdx>0&&fl.shIdx/(N-1)>=0.65&&fl.shIdx/(N-1)<=0.80,
    hint:"Design a supersonic C-D nozzle, then set Pb between PbD and Pb* to create an internal shock.",
    cp:[{x:0,y:0.85},{x:0.25,y:0.54},{x:0.5,y:0.29},{x:0.75,y:0.55},{x:1,y:0.82}],pb:0.42,
  },
];

/* ════════════════════════════════
   DIMENSIONS
════════════════════════════════ */
const NX=120, SW=576, SH=176, CY=SH/2, SC=SH*0.44, GH=72;

/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
export function MachArchitect(){
  const [lIdx,setLIdx]=useState(0);
  const lv=LVS[lIdx];
  const [cpts,setCpts]=useState<CPoint[]>(()=>lv.cp.map(p=>({...p})));
  const [pb,setPb]=useState(lv.pb);
  const [drag,setDrag]=useState<number|null>(null);
  const [done,setDone]=useState(false);
  const [hint,setHint]=useState(false);
  const [flash,setFlash]=useState(false);
  const svgRef=useRef<SVGSVGElement>(null);

  const Ax  =useMemo(()=>interpAx(cpts,NX),[cpts]);
  const fl  =useMemo(()=>computeFlow(Ax,pb),[Ax,pb]);
  const clrd=useMemo(()=>lv.ok(fl,NX),[lv,fl]);

  useEffect(()=>{
    if(clrd&&!done){setDone(true);setFlash(true);setTimeout(()=>setFlash(false),1800);}
  },[clrd,done]);

  const load=useCallback((i: number)=>{
    const l=LVS[i];setLIdx(i);setCpts(l.cp.map(p=>({...p})));
    setPb(l.pb);setDone(false);setHint(false);setFlash(false);
  },[]);

  const onMD=useCallback((e: React.MouseEvent,i: number)=>{e.preventDefault();e.stopPropagation();setDrag(i);},[]);
  const onMM=useCallback((e: React.MouseEvent)=>{
    if(drag===null)return;
    const rect=svgRef.current?.getBoundingClientRect();
    if(!rect)return;
    const halfH=(CY-(e.clientY-rect.top))/SC;
    setCpts(prev=>{const n=[...prev];n[drag]={...n[drag],y:Math.max(0.07,Math.min(0.97,halfH))};return n;});
  },[drag]);
  const onMU=useCallback(()=>setDrag(null),[]);

  const pts=useMemo(()=>Ax.map((a,i)=>({x:i/(NX-1)*SW,yU:CY-a*SC,yL:CY+a*SC})),[Ax]);

  const uPath=useMemo(()=>pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)},${p.yU.toFixed(1)}`).join(' '),[pts]);
  const lPath=useMemo(()=>pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)},${p.yL.toFixed(1)}`).join(' '),[pts]);
  const uFill=useMemo(()=>
    `M0,0 L${SW},0 L${SW},${pts[NX-1].yU.toFixed(1)} `+
    [...pts].reverse().slice(1).map(p=>`L${p.x.toFixed(1)},${p.yU.toFixed(1)}`).join(' ')+' Z'
  ,[pts]);
  const lFill=useMemo(()=>
    `M0,${SH} L${SW},${SH} L${SW},${pts[NX-1].yL.toFixed(1)} `+
    [...pts].reverse().slice(1).map(p=>`L${p.x.toFixed(1)},${p.yL.toFixed(1)}`).join(' ')+' Z'
  ,[pts]);

  const Mexit   =fl.Mx[NX-1];
  const Mthroat =fl.Mx[fl.iT];
  const AeAs    =(Ax[NX-1]/fl.Am).toFixed(3);
  const xSh     =fl.shIdx>0&&fl.shIdx<NX?(fl.shIdx/(NX-1)).toFixed(3):null;

  const regCol  =fl.regime==='sub'?'#00c8ef':fl.regime==='sup'?'#ff6020':'#ffe000';
  const regLabel=fl.regime==='sub'?'SUBSONIC':fl.regime==='sup'?'SUPERSONIC':'SHOCK INSIDE';

  const btnStyle=(active: boolean)=>({
    background:active?'#00c8ef18':'transparent',
    border:`1px solid ${active?'#00c8ef':'#0c1e2c'}`,
    color:active?'#00c8ef':'#2a4a5a',
    padding:'3px 10px',cursor:'pointer',fontFamily:'inherit',fontSize:'11px',letterSpacing:'1px',
    borderRadius:'2px',
  });

  return(
    <div style={{background:'#040b12',color:'#98b8c8',fontFamily:'"Courier New",monospace',padding:'12px 16px',userSelect:'none',fontSize:'12px',boxSizing:'border-box',borderRadius:'8px'}}>

      {/* HEADER */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px',borderBottom:'1px solid #0a1a24',paddingBottom:'8px',flexWrap:'wrap',gap:'8px'}}>
        <div>
          <span style={{color:'#00c8ef',fontSize:'17px',letterSpacing:'4px',fontWeight:'bold',textShadow:'0 0 25px #00c8ef55'}}>MACH ARCHITECT</span>
          <span style={{color:'#102030',marginLeft:'10px',fontSize:'10px',letterSpacing:'2px'}}>1D COMPRESSIBLE FLOW PUZZLE</span>
        </div>
        <div style={{display:'flex',gap:'5px',alignItems:'center',flexWrap:'wrap'}}>
          {LVS.map((l,i)=><button key={i} style={btnStyle(i===lIdx)} onClick={()=>load(i)}>LV{i+1}</button>)}
          <button style={{...btnStyle(false),color:'#305060'}} onClick={()=>load(lIdx)}>RESET</button>
        </div>
      </div>

      {/* LEVEL BAR */}
      <div style={{background:'#030a10',border:'1px solid #0c1e2c',borderRadius:'3px',padding:'8px 14px',marginBottom:'7px',display:'flex',justifyContent:'space-between',alignItems:'center',
        boxShadow:flash?'0 0 20px #00c8ef44 inset':'none',transition:'box-shadow 0.5s',flexWrap:'wrap',gap:'8px'}}>
        <div>
          <div style={{color:'#00c8ef',marginBottom:'2px',letterSpacing:'1px',fontSize:'13px'}}>{lv.name}</div>
          <div style={{color:'#2a4a5a',fontSize:'11px'}}>Objective: {lv.obj}</div>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <button style={btnStyle(hint)} onClick={()=>setHint(h=>!h)}>HINT</button>
          <div style={{padding:'4px 14px',border:`1px solid ${clrd?'#00c8ef':'#0c1e2c'}`,background:clrd?'#00c8ef14':'transparent',
            color:clrd?'#00c8ef':'#183040',fontSize:'11px',borderRadius:'2px',transition:'all 0.4s',letterSpacing:'1px',
            textShadow:clrd?'0 0 10px #00c8ef88':'none'}}>
            {clrd?'CLEARED':'IN PROGRESS'}
          </div>
        </div>
      </div>

      {hint&&<div style={{background:'#071507',border:'1px solid #143020',color:'#60a860',padding:'7px 14px',marginBottom:'7px',fontSize:'11px',borderRadius:'3px',lineHeight:'1.6'}}>
        {lv.hint}
      </div>}

      {/* NOZZLE SVG */}
      <div style={{background:'#020608',border:'1px solid #0a1e2c',borderRadius:'3px',marginBottom:'6px',overflow:'hidden'}}>
        <div style={{padding:'4px 12px',background:'#040c14',borderBottom:'1px solid #0a1e2c',fontSize:'10px',color:'#102030',letterSpacing:'2px'}}>
          NOZZLE CROSS SECTION — DRAG CONTROL POINTS
        </div>
        <svg ref={svgRef} viewBox={`0 0 ${SW} ${SH}`} style={{display:'block',width:'100%',height:'auto',cursor:drag!==null?'ns-resize':'default'}}
          onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}>
          <rect width={SW} height={SH} fill="#010406"/>

          {[0.25,0.5,0.75].map(x=>(
            <line key={x} x1={x*SW} y1={0} x2={x*SW} y2={SH} stroke="#050e16" strokeWidth="1"/>
          ))}

          {pts.slice(0,-1).map((p,i)=>{
            const M=(fl.Mx[i]+fl.Mx[i+1])/2;
            const np=pts[i+1];
            return <polygon key={i} points={`${p.x},${p.yU} ${np.x},${np.yU} ${np.x},${np.yL} ${p.x},${p.yL}`} fill={machCol(M)}/>;
          })}

          {fl.shIdx>0&&fl.shIdx<NX&&(()=>{
            const sx=pts[fl.shIdx].x;
            const sy0=pts[fl.shIdx].yU,sy1=pts[fl.shIdx].yL;
            return <g>
              <line x1={sx} y1={sy0} x2={sx} y2={sy1} stroke="#ffe000" strokeWidth="4" opacity="0.9"/>
              <line x1={sx} y1={sy0} x2={sx} y2={sy1} stroke="#fff" strokeWidth="1.2" opacity="0.35"/>
            </g>;
          })()}

          <line x1={pts[fl.iT].x} y1={pts[fl.iT].yU} x2={pts[fl.iT].x} y2={pts[fl.iT].yL}
            stroke="#00ff88" strokeWidth="1" strokeDasharray="4,3" opacity="0.5"/>
          <text x={pts[fl.iT].x+3} y={pts[fl.iT].yU-4} fill="#00ff88" fontSize="8" opacity="0.6">A*</text>

          <path d={uFill} fill="#040c16"/>
          <path d={lFill} fill="#040c16"/>
          <path d={uPath} fill="none" stroke="#1a6898" strokeWidth="2"/>
          <path d={lPath} fill="none" stroke="#1a6898" strokeWidth="2"/>

          {cpts.map((p,i)=>(
            <g key={i}>
              <circle cx={p.x*SW} cy={CY+p.y*SC} r={5}
                fill="#1a6898" stroke="#246898" strokeWidth="1" opacity="0.6" pointerEvents="none"/>
              <circle cx={p.x*SW} cy={CY-p.y*SC} r={drag===i?10:7}
                fill={drag===i?'#00c8ef33':'#00c8ef14'}
                stroke={drag===i?'#00c8ef':'#00a8cf'}
                strokeWidth={drag===i?2:1.5}
                style={{cursor:'ns-resize'}}
                onMouseDown={e=>onMD(e,i)}/>
            </g>
          ))}

          <text x={6} y={14} fill="#0e2030" fontSize="9" letterSpacing="1">P0 IN</text>
          <text x={SW-34} y={14} fill="#0e2030" fontSize="9" letterSpacing="1">EXIT</text>
        </svg>
      </div>

      {/* GRAPHS + CONTROLS */}
      <div style={{display:'flex',gap:'6px',marginBottom:'6px',flexWrap:'wrap'}}>

        {/* M(x) */}
        <div style={{flex:'1 1 180px',background:'#020608',border:'1px solid #0a1e2c',borderRadius:'3px',overflow:'hidden'}}>
          <div style={{padding:'3px 12px',background:'#040c14',borderBottom:'1px solid #0a1e2c',fontSize:'10px',color:'#102030',letterSpacing:'2px'}}>MACH NUMBER M(x)</div>
          <svg width="100%" height={GH} viewBox={`0 0 ${SW} ${GH}`} preserveAspectRatio="none" style={{display:'block'}}>
            <rect width={SW} height={GH} fill="#010406"/>
            {[0.5,1,1.5,2,2.5,3].map(m=>{
              const y=GH*(1-m/3.5);
              if(y<2||y>GH-2)return null;
              return <g key={m}><line x1={0} y1={y} x2={SW} y2={y} stroke="#060f18" strokeWidth="1"/><text x={3} y={y-2} fill="#0e2030" fontSize="8">{m}</text></g>;
            })}
            <line x1={0} y1={GH*(1-1/3.5)} x2={SW} y2={GH*(1-1/3.5)} stroke="#00ff4428" strokeWidth="1" strokeDasharray="5,4"/>
            <text x={SW-26} y={GH*(1-1/3.5)-2} fill="#00ff4488" fontSize="8">M=1</text>
            {lv.id===1&&<rect x={SW-20} y={GH*(1-0.55/3.5)} width={20} height={GH*(0.10/3.5)} fill="#00c8ef18" stroke="#00c8ef44" strokeWidth="1"/>}
            {lv.id===3&&<rect x={SW-20} y={GH*(1-2.1/3.5)} width={20} height={GH*(0.20/3.5)} fill="#00c8ef18" stroke="#00c8ef44" strokeWidth="1"/>}
            {lv.id===4&&<rect x={0.65*SW} y={0} width={0.15*SW} height={GH} fill="#ffe00008" stroke="#ffe00028" strokeWidth="1"/>}
            <polyline points={fl.Mx.map((m: number,i: number)=>`${i/(NX-1)*SW},${GH*(1-Math.min(m,3.5)/3.5)}`).join(' ')} fill="none" stroke="#00c8ef" strokeWidth="1.8"/>
            {fl.shIdx>0&&fl.shIdx<NX&&<line x1={fl.shIdx/(NX-1)*SW} y1={0} x2={fl.shIdx/(NX-1)*SW} y2={GH} stroke="#ffe000" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.65"/>}
          </svg>
        </div>

        {/* P/P0(x) */}
        <div style={{flex:'1 1 180px',background:'#020608',border:'1px solid #0a1e2c',borderRadius:'3px',overflow:'hidden'}}>
          <div style={{padding:'3px 12px',background:'#040c14',borderBottom:'1px solid #0a1e2c',fontSize:'10px',color:'#102030',letterSpacing:'2px'}}>PRESSURE P/P0(x)</div>
          <svg width="100%" height={GH} viewBox={`0 0 ${SW} ${GH}`} preserveAspectRatio="none" style={{display:'block'}}>
            <rect width={SW} height={GH} fill="#010406"/>
            {[0.25,0.5,0.75,1.0].map(pv=>{
              const y=GH-4-pv*(GH-8);
              return <g key={pv}><line x1={0} y1={y} x2={SW} y2={y} stroke="#060f18" strokeWidth="1"/><text x={3} y={y-2} fill="#0e2030" fontSize="8">{pv}</text></g>;
            })}
            <polyline points={fl.Px.map((pv: number,i: number)=>`${i/(NX-1)*SW},${GH-4-pv*(GH-8)}`).join(' ')} fill="none" stroke="#ff7832" strokeWidth="1.8"/>
            <line x1={0} y1={GH-4-pb*(GH-8)} x2={SW} y2={GH-4-pb*(GH-8)} stroke="#ff783255" strokeWidth="1" strokeDasharray="5,4"/>
            <text x={SW-80} y={GH-4-pb*(GH-8)-3} fill="#ff7832aa" fontSize="8">Pb/P0={pb.toFixed(3)}</text>
            {fl.shIdx>0&&fl.shIdx<NX&&<line x1={fl.shIdx/(NX-1)*SW} y1={0} x2={fl.shIdx/(NX-1)*SW} y2={GH} stroke="#ffe000" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.65"/>}
          </svg>
        </div>

        {/* CONTROLS */}
        <div style={{width:'174px',flexShrink:0,background:'#020608',border:'1px solid #0a1e2c',borderRadius:'3px',padding:'10px 12px'}}>
          <div style={{fontSize:'10px',color:'#102030',letterSpacing:'2px',marginBottom:'10px'}}>BOUNDARY CONDITIONS</div>

          <div style={{marginBottom:'12px'}}>
            <div style={{fontSize:'10px',color:'#305060',marginBottom:'4px'}}>
              Pb/P0 = <span style={{color:'#ff7832',fontWeight:'bold'}}>{pb.toFixed(3)}</span>
            </div>
            <input type="range" min="0.04" max="0.999" step="0.002" value={pb}
              onChange={e=>setPb(+e.target.value)}
              style={{width:'100%',accentColor:'#ff7832',cursor:'pointer'}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'9px',color:'#0e2030',marginTop:'2px'}}>
              <span>0.04</span>
              <span style={{color:'#ff783266'}}>Pb*={fl.PbC.toFixed(3)}</span>
              <span>1.0</span>
            </div>
          </div>

          <div style={{padding:'6px 8px',borderRadius:'2px',marginBottom:'10px',
            background:fl.regime==='sub'?'#001428':fl.regime==='sup'?'#180600':'#181000',
            border:`1px solid ${fl.regime==='sub'?'#002848':fl.regime==='sup'?'#481200':'#483000'}`}}>
            <div style={{fontSize:'9px',color:'#0e2030',marginBottom:'1px',letterSpacing:'1px'}}>FLOW REGIME</div>
            <div style={{fontSize:'12px',fontWeight:'bold',letterSpacing:'1px',color:regCol,textShadow:`0 0 8px ${regCol}66`}}>
              {regLabel}
            </div>
          </div>

          <div style={{fontSize:'10px',lineHeight:'2.0',color:'#1a3040'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span>M_exit</span><span style={{color:'#98b8c8'}}>{Mexit.toFixed(4)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span>M_throat</span><span style={{color:'#98b8c8'}}>{Mthroat.toFixed(4)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span>A_e/A*</span><span style={{color:'#98b8c8'}}>{AeAs}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span>Pb_design</span><span style={{color:'#ff7832'}}>{fl.PbD.toFixed(4)}</span>
            </div>
            {xSh&&<div style={{display:'flex',justifyContent:'space-between'}}>
              <span>x_shock</span><span style={{color:'#ffe000'}}>{xSh}</span>
            </div>}
          </div>
        </div>
      </div>

      {/* LEGEND */}
      <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'9px',color:'#0e2030',paddingTop:'2px',flexWrap:'wrap'}}>
        <span style={{color:'#1a3040',letterSpacing:'1px'}}>MACH COLOR MAP</span>
        <svg width="180" height="10" style={{flexShrink:0}}>
          {Array.from({length:180},(_,i)=>(
            <rect key={i} x={i} y={0} width={1} height={10} fill={machCol(i/180*4)}/>
          ))}
        </svg>
        <span>M=0</span>
        <span style={{marginLeft:'42px'}}>M=1</span>
        <span style={{marginLeft:'42px'}}>M=2</span>
        <span style={{marginLeft:'30px'}}>M=4</span>
        <span style={{marginLeft:'14px',color:'#ffe000'}}>-- SHOCK</span>
        <span style={{color:'#00ff88',marginLeft:'6px'}}>-- THROAT</span>
      </div>
    </div>
  );
}
