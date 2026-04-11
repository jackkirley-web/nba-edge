// NBAEdge — Clean redesign. No emoji. Hamburger menu. Professional.
const { useState, useEffect, useCallback } = React;
const API_BASE = "https://nba-edge-api.onrender.com";
const D = {
  bg:"#0A0A0A",bg1:"#141414",bg2:"#1E1E1E",bg3:"#282828",bg4:"#323232",
  t1:"#F5F5F5",t2:"#A0A0A0",t3:"#606060",
  border:"#2A2A2A",border2:"#383838",
  gold:"#C9A84C",goldDim:"rgba(201,168,76,0.12)",
  green:"#4CAF7D",greenDim:"rgba(76,175,125,0.12)",
  red:"#E05252",redDim:"rgba(224,82,82,0.12)",
  blue:"#5B9CF6",blueDim:"rgba(91,156,246,0.12)",
  font:"-apple-system,'SF Pro Text','SF Pro Display',system-ui,sans-serif",
  mono:"'SF Mono','Fira Mono',Menlo,monospace",
};
const cc = c => c>=70?D.green:c>=58?D.gold:D.blue;
const TIERS = {
  safe: {label:"Safe",   accent:D.green, dim:D.greenDim, desc:"Lowest risk · Highest confidence"},
  mid:  {label:"Mid",    accent:D.gold,  dim:D.goldDim,  desc:"Balanced risk · Strong edges"},
  lotto:{label:"Lotto",  accent:D.red,   dim:D.redDim,   desc:"High payout · Calculated longshot"},
};
const STAT_LABELS = {
  pts:"Points",reb:"Rebounds",ast:"Assists","3pm":"3-Pointers",stl:"Steals",blk:"Blocks",
  pra:"Pts+Reb+Ast",pr:"Pts+Reb",pa:"Pts+Ast",ra:"Reb+Ast",dd:"Double Double",td:"Triple Double",
};
async function apiFetch(path,timeout=120000){
  const c=new AbortController();const t=setTimeout(()=>c.abort(),timeout);
  try{const r=await fetch(API_BASE+path,{signal:c.signal});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json();}
  finally{clearTimeout(t);}
}
function Dot({color,size=6}){return<span style={{display:"inline-block",width:size,height:size,borderRadius:"50%",background:color,flexShrink:0}}/>;}
function Pill({label,color=D.t3,bg=D.bg3}){return<span style={{fontSize:10,fontWeight:500,letterSpacing:"0.04em",padding:"2px 7px",borderRadius:4,background:bg,color:color,fontFamily:D.font,textTransform:"uppercase"}}>{label}</span>;}
function ConfBar({value}){const col=cc(value);return<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:3,background:D.bg3,borderRadius:99,overflow:"hidden"}}><div style={{width:value+"%",height:"100%",background:col,borderRadius:99}}/></div><span style={{fontFamily:D.mono,fontSize:11,color:col,minWidth:28,textAlign:"right"}}>{value}</span></div>;}

function LoadingScreen({message,progress}){
  const steps=[
    {label:"Today's schedule",done:progress>15},
    {label:"Team & player stats",done:progress>35},
    {label:"Game logs (L15)",done:progress>50},
    {label:"Injury reports",done:progress>62},
    {label:"Live odds",done:progress>75},
    {label:"Building picks",done:progress>90},
  ];
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 32px",gap:28}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:D.font,fontWeight:600,fontSize:22,letterSpacing:"0.15em",color:D.t1,textTransform:"uppercase"}}>NBA<span style={{color:D.gold}}>Edge</span></div>
        <div style={{fontFamily:D.font,fontSize:12,color:D.t3,letterSpacing:"0.1em",marginTop:4,textTransform:"uppercase"}}>Betting Intelligence</div>
      </div>
      <div style={{width:"100%",maxWidth:220}}>
        <div style={{height:1,background:D.bg3,borderRadius:99}}><div style={{height:"100%",background:D.gold,borderRadius:99,width:progress+"%",transition:"width 0.6s ease"}}/></div>
        <div style={{fontFamily:D.font,fontSize:12,color:D.t3,marginTop:10,textAlign:"center",letterSpacing:"0.02em"}}>{message}</div>
      </div>
      <div style={{width:"100%",maxWidth:220}}>
        {steps.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 0",borderBottom:i<5?"0.5px solid "+D.border:"none"}}>
            <div style={{width:14,height:14,borderRadius:"50%",border:"1px solid "+(s.done?D.green:D.border2),background:s.done?D.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.3s"}}>
              {s.done&&<svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" stroke="#0A0A0A" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
            </div>
            <span style={{fontFamily:D.font,fontSize:12,color:s.done?D.t2:D.t3}}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HamburgerMenu({onNavigate,onRefresh,loading,lastUpdated}){
  const [open,setOpen]=useState(false);
  const items=[
    {id:"picks",label:"Today's Picks"},
    {id:"games",label:"Today's Games"},
    {id:"props",label:"Player Props"},
    {id:"streak",label:"Streak Tracker"},
  ];
  return(
    <>
      <button onClick={()=>setOpen(true)} style={{background:"none",border:"none",cursor:"pointer",padding:"8px",display:"flex",flexDirection:"column",gap:5,alignItems:"flex-start"}}>
        {[0,1,2].map(i=><div key={i} style={{width:i===1?16:22,height:1.5,background:D.t1,borderRadius:99}}/>)}
      </button>
      {open&&<div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.7)"}}/>}
      <div style={{position:"fixed",top:0,left:0,bottom:0,width:280,zIndex:101,background:D.bg1,borderRight:"0.5px solid "+D.border,transform:open?"translateX(0)":"translateX(-100%)",transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)",display:"flex",flexDirection:"column"}}>
        <div style={{paddingTop:"env(safe-area-inset-top,44px)",padding:"52px 24px 20px",borderBottom:"0.5px solid "+D.border}}>
          <div style={{fontFamily:D.font,fontWeight:600,fontSize:18,letterSpacing:"0.12em",color:D.t1,textTransform:"uppercase"}}>NBA<span style={{color:D.gold}}>Edge</span></div>
          {lastUpdated&&<div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginTop:4}}>Updated {lastUpdated}</div>}
        </div>
        <div style={{flex:1,padding:"12px 0"}}>
          {items.map(item=>(
            <button key={item.id} onClick={()=>{onNavigate(item.id);setOpen(false);}} style={{width:"100%",background:"none",border:"none",textAlign:"left",padding:"14px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:3,height:14,borderRadius:99,background:D.bg3}}/>
              <span style={{fontFamily:D.font,fontSize:15,color:D.t1,letterSpacing:"0.01em"}}>{item.label}</span>
            </button>
          ))}
          <div style={{margin:"12px 24px",borderTop:"0.5px solid "+D.border}}/>
          <button onClick={()=>{onRefresh();setOpen(false);}} disabled={loading} style={{width:"100%",background:"none",border:"none",textAlign:"left",padding:"14px 24px",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:14,opacity:loading?0.4:1}}>
            <div style={{width:3,height:14,borderRadius:99,background:D.bg3}}/>
            <span style={{fontFamily:D.font,fontSize:15,color:D.t3}}>{loading?"Refreshing...":"Refresh Data"}</span>
          </button>
        </div>
        <div style={{padding:"16px 24px 32px"}}>
          <div style={{fontFamily:D.font,fontSize:11,color:D.t3,lineHeight:1.5}}>
            Refresh 30-60 min before tip-off for confirmed lineups and late injury news.
          </div>
        </div>
      </div>
    </>
  );
}

function LegSheet({leg,onClose}){
  const col=cc(leg.confidence);
  const isProp=leg.type&&leg.type.startsWith("Prop");
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,background:D.bg,display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <div style={{paddingTop:"env(safe-area-inset-top,44px)",padding:"16px 20px 0",flexShrink:0}}>
        <div style={{width:32,height:3,background:D.bg3,borderRadius:99,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div style={{fontFamily:D.font,fontSize:12,color:D.t3}}>{leg.game}</div>
          <button onClick={onClose} style={{background:D.bg2,border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1" y1="1" x2="9" y2="9" stroke={D.t2} strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="1" x2="1" y2="9" stroke={D.t2} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{fontFamily:D.font,fontWeight:600,fontSize:20,color:D.t1,marginBottom:8,lineHeight:1.3}}>{leg.selection}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
          {isProp&&<Pill label="Player Prop" color={D.blue} bg={D.blueDim}/>}
          <Pill label={leg.type||"Market"} color={D.t2} bg={D.bg2}/>
          {(leg.tags||[]).map(t=><Pill key={t} label={t} color={D.t3} bg={D.bg2}/>)}
        </div>
      </div>
      <div style={{padding:"0 20px 60px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div style={{background:D.bg1,borderRadius:10,padding:"14px 16px",border:"0.5px solid "+D.border}}>
            <div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginBottom:6,letterSpacing:"0.04em"}}>CONFIDENCE</div>
            <div style={{fontFamily:D.mono,fontSize:26,color:col}}>{leg.confidence}</div>
            <ConfBar value={leg.confidence}/>
          </div>
          <div style={{background:D.bg1,borderRadius:10,padding:"14px 16px",border:"0.5px solid "+D.border}}>
            <div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginBottom:6,letterSpacing:"0.04em"}}>HIT PROBABILITY</div>
            <div style={{fontFamily:D.mono,fontSize:26,color:col}}>{leg.prob}%</div>
            <div style={{fontFamily:D.font,fontSize:11,color:D.t3}}>estimated</div>
          </div>
        </div>
        {(leg.projected_margin!=null||leg.projected_total!=null)&&(
          <div style={{background:D.bg1,borderRadius:10,padding:16,border:"0.5px solid "+D.border,marginBottom:12}}>
            <div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginBottom:12,letterSpacing:"0.04em"}}>MODEL PROJECTION</div>
            {leg.projected_margin!=null&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontFamily:D.font,fontSize:14,color:D.t2}}>Projected margin</span><span style={{fontFamily:D.mono,fontSize:14,color:D.gold}}>{leg.projected_margin>0?"+":""}{leg.projected_margin}</span></div>}
            {leg.projected_total!=null&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:D.font,fontSize:14,color:D.t2}}>Projected total</span><span style={{fontFamily:D.mono,fontSize:14,color:D.gold}}>{leg.projected_total}</span></div>}
          </div>
        )}
        {leg.reasoning&&(
          <div style={{background:D.bg1,borderRadius:10,padding:16,border:"0.5px solid "+D.border,marginBottom:12}}>
            <div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginBottom:8,letterSpacing:"0.04em"}}>ANALYSIS</div>
            <div style={{fontFamily:D.font,fontSize:13,color:D.t2,lineHeight:1.65}}>{leg.reasoning}</div>
          </div>
        )}
        {(leg.factors||[]).length>0&&(
          <div style={{background:D.bg1,borderRadius:10,padding:16,border:"0.5px solid "+D.border,marginBottom:12}}>
            <div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginBottom:12,letterSpacing:"0.04em"}}>SCORING BREAKDOWN</div>
            {leg.factors.map((f,i)=>(
              <div key={i} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontFamily:D.font,fontSize:13,color:D.t2}}>{f.name}</span>
                  <span style={{fontFamily:D.mono,fontSize:12,color:D.t3}}>{f.val}/{f.max}</span>
                </div>
                <ConfBar value={Math.round((f.val/f.max)*100)}/>
              </div>
            ))}
          </div>
        )}
        <div style={{paddingLeft:12,borderLeft:"2px solid "+D.bg3,fontFamily:D.font,fontSize:12,color:D.t3,lineHeight:1.6}}>Analytical estimates only. Verify lineups at tip-off. Bet responsibly.</div>
      </div>
    </div>
  );
}

function PickDetail({pick,onBack}){
  const [selLeg,setSelLeg]=useState(null);
  const tier=TIERS[pick.key]||TIERS.safe;
  const legs=pick.legs||[];
  return(
    <>
      <div style={{flex:1,overflowY:"auto",paddingBottom:40}}>
        <div style={{padding:"12px 20px",borderBottom:"0.5px solid "+D.border,display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6,padding:0}}>
            <svg width="8" height="12" viewBox="0 0 8 12"><polyline points="7,1 1,6 7,11" stroke={D.t2} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontFamily:D.font,fontSize:14,color:D.t2}}>Back</span>
          </button>
        </div>
        <div style={{padding:"24px 20px 0"}}>
          <div style={{background:D.bg1,borderRadius:14,border:"0.5px solid "+D.border,borderTop:"2px solid "+tier.accent,padding:20,marginBottom:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <div style={{fontFamily:D.font,fontSize:11,color:tier.accent,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{tier.label} Multi</div>
                <div style={{fontFamily:D.mono,fontSize:38,color:D.t1,lineHeight:1}}>{pick.odds}</div>
                <div style={{fontFamily:D.font,fontSize:12,color:D.t3,marginTop:4}}>combined odds</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:D.mono,fontSize:28,color:tier.accent}}>{pick.hitProb}%</div>
                <div style={{fontFamily:D.font,fontSize:12,color:D.t3}}>hit probability</div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,paddingTop:14,borderTop:"0.5px solid "+D.border}}>
              {[{label:"legs",val:legs.length},{label:"high-conf",val:legs.filter(l=>l.confidence>=70).length},{label:"props",val:legs.filter(l=>l.type&&l.type.startsWith("Prop")).length}].map((s,i)=>(
                <div key={i} style={{flex:1,textAlign:"center",borderRight:i<2?"0.5px solid "+D.border:"none"}}>
                  <div style={{fontFamily:D.mono,fontSize:18,color:D.t1}}>{s.val}</div>
                  <div style={{fontFamily:D.font,fontSize:11,color:D.t3}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{fontFamily:D.font,fontSize:11,color:D.t3,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Bet Legs</div>
          {legs.length===0?(
            <div style={{background:D.bg1,borderRadius:12,padding:20,textAlign:"center",fontFamily:D.font,fontSize:14,color:D.t3,border:"0.5px solid "+D.border}}>Odds not yet posted. Check back closer to tip-off.</div>
          ):legs.map((leg,i)=>{
            const col=cc(leg.confidence);
            const isProp=leg.type&&leg.type.startsWith("Prop");
            return(
              <div key={i} onClick={()=>setSelLeg(leg)} style={{background:isProp?D.blueDim:D.bg1,borderRadius:12,padding:"14px 16px",marginBottom:8,border:"0.5px solid "+(isProp?D.blue+"33":D.border),cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontFamily:D.font,fontSize:12,color:D.t3}}>{leg.game}{isProp&&<span style={{marginLeft:8,fontSize:10,color:D.blue,letterSpacing:"0.04em"}}>PROP</span>}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:D.mono,fontSize:12,color:col}}>{leg.confidence}</span><Dot color={col} size={5}/></div>
                </div>
                <div style={{fontFamily:D.font,fontWeight:500,fontSize:15,color:D.t1,marginBottom:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{leg.selection}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontFamily:D.mono,fontSize:12,color:D.gold}}>{leg.odds!=null?leg.odds.toFixed(2)+"×":"1.91×"}</span>
                    {(leg.tags||[]).slice(0,2).map(t=><Pill key={t} label={t} color={D.t3} bg={D.bg3}/>)}
                  </div>
                  <span style={{fontFamily:D.font,fontSize:13,color:D.t3}}>{leg.prob}%</span>
                </div>
              </div>
            );
          })}
          {(pick.risks||[]).length>0&&(
            <>
              <div style={{fontFamily:D.font,fontSize:11,color:D.t3,letterSpacing:"0.08em",textTransform:"uppercase",margin:"20px 0 10px"}}>Key Risks</div>
              <div style={{background:D.bg1,borderRadius:12,border:"0.5px solid "+D.border,overflow:"hidden"}}>
                {pick.risks.map((r,i)=>(
                  <div key={i} style={{padding:"12px 16px",borderBottom:i<pick.risks.length-1?"0.5px solid "+D.border:"none",display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{width:2,height:2,borderRadius:"50%",background:D.gold,marginTop:6,flexShrink:0}}/>
                    <span style={{fontFamily:D.font,fontSize:13,color:D.t2,lineHeight:1.5}}>{r}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {(pick.alts||[]).length>0&&(
            <>
              <div style={{fontFamily:D.font,fontSize:11,color:D.t3,letterSpacing:"0.08em",textTransform:"uppercase",margin:"20px 0 10px"}}>Near-Miss Alternates</div>
              <div style={{background:D.bg1,borderRadius:12,border:"0.5px solid "+D.border,overflow:"hidden"}}>
                {pick.alts.map((a,i)=>(
                  <div key={i} style={{padding:"12px 16px",borderBottom:i<pick.alts.length-1?"0.5px solid "+D.border:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontFamily:D.font,fontSize:13,color:D.t2,flex:1,marginRight:12}}>{a.desc}</span>
                    <span style={{fontFamily:D.mono,fontSize:13,color:cc(a.conf)}}>{a.conf}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <div style={{marginTop:20,paddingLeft:12,borderLeft:"2px solid "+D.bg3,fontFamily:D.font,fontSize:12,color:D.t3,lineHeight:1.6}}>Analytical estimates only. Prop lines are model estimates. Verify with your bookmaker. Bet responsibly.</div>
        </div>
      </div>
      {selLeg&&<LegSheet leg={selLeg} onClose={()=>setSelLeg(null)}/>}
    </>
  );
}

function PicksScreen({picks,loading,loadingMsg,loadingProgress,error,onRetry,lastUpdated,legsScored,propsScored,gamesAnalyzed}){
  const [detail,setDetail]=useState(null);
  if(detail&&picks?.[detail])return<PickDetail pick={picks[detail]} onBack={()=>setDetail(null)}/>;
  const today=new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"});
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:40}}>
      <div style={{padding:"4px 20px 20px"}}>
        <div style={{fontFamily:D.font,fontSize:13,color:D.t3,marginBottom:2}}>{today}</div>
        <div style={{fontFamily:D.font,fontWeight:500,fontSize:26,color:D.t1,letterSpacing:"-0.02em"}}>Today's Picks</div>
      </div>
      {loading&&<LoadingScreen message={loadingMsg} progress={loadingProgress}/>}
      {error&&!loading&&(
        <div style={{padding:"0 20px"}}>
          <div style={{background:D.redDim,borderRadius:10,padding:16,border:"0.5px solid "+D.red+"33"}}>
            <div style={{fontFamily:D.font,fontSize:13,color:D.red,marginBottom:8}}>Connection error</div>
            <div style={{fontFamily:D.font,fontSize:13,color:D.t3,marginBottom:12}}>{error}</div>
            <button onClick={onRetry} style={{background:D.red,border:"none",borderRadius:8,padding:"8px 16px",color:D.t1,fontFamily:D.font,fontSize:13,cursor:"pointer"}}>Retry</button>
          </div>
        </div>
      )}
      {!loading&&!error&&picks&&(
        <>
          <div style={{margin:"0 20px 24px",background:D.bg1,borderRadius:10,border:"0.5px solid "+D.border,display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
            {[{label:"Games",value:gamesAnalyzed},{label:"Props",value:propsScored},{label:"Legs",value:legsScored}].map((s,i)=>(
              <div key={i} style={{padding:"12px 0",textAlign:"center",borderRight:i<2?"0.5px solid "+D.border:"none"}}>
                <div style={{fontFamily:D.mono,fontSize:20,color:D.t1}}>{s.value}</div>
                <div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{padding:"0 20px"}}>
            {Object.entries(TIERS).map(([key,tier])=>{
              const pick=picks[key];
              if(!pick)return null;
              const hasLegs=pick.legs&&pick.legs.length>0;
              return(
                <div key={key} onClick={()=>hasLegs&&setDetail(key)} style={{background:D.bg1,borderRadius:14,border:"0.5px solid "+D.border,borderTop:"2px solid "+tier.accent,marginBottom:14,overflow:"hidden",cursor:hasLegs?"pointer":"default",opacity:hasLegs?1:0.45}}>
                  <div style={{padding:"16px 18px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontFamily:D.font,fontSize:11,color:tier.accent,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{tier.label}</div>
                        <div style={{fontFamily:D.mono,fontSize:32,color:D.t1,lineHeight:1}}>{pick.odds||"N/A"}</div>
                        <div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginTop:3}}>{tier.desc}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:D.mono,fontSize:24,color:tier.accent}}>{pick.hitProb||0}%</div>
                        <div style={{fontFamily:D.font,fontSize:11,color:D.t3}}>hit prob</div>
                      </div>
                    </div>
                    {hasLegs&&(
                      <>
                        <div style={{margin:"14px 0",height:"0.5px",background:D.border}}/>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{display:"flex",gap:5}}>
                            {(pick.legs||[]).slice(0,7).map((l,i)=><Dot key={i} color={l.type&&l.type.startsWith("Prop")?D.blue:cc(l.confidence)} size={6}/>)}
                            {(pick.legs||[]).length>7&&<span style={{fontFamily:D.mono,fontSize:10,color:D.t3}}>+{(pick.legs||[]).length-7}</span>}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontFamily:D.font,fontSize:11,color:D.t3}}>{(pick.legs||[]).length} legs</span>
                            <svg width="6" height="10" viewBox="0 0 6 10"><polyline points="1,1 5,5 1,9" stroke={D.t3} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{margin:"8px 20px 0",paddingLeft:10,borderLeft:"2px solid "+D.bg3,fontFamily:D.font,fontSize:12,color:D.t3,lineHeight:1.6}}>Model estimates only. Always verify lineups before betting. Bet responsibly.</div>
        </>
      )}
    </div>
  );
}

function GamesScreen({games,loading}){
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:40}}>
      <div style={{padding:"4px 20px 20px"}}>
        <div style={{fontFamily:D.font,fontSize:13,color:D.t3,marginBottom:2}}>NBA Schedule</div>
        <div style={{fontFamily:D.font,fontWeight:500,fontSize:26,color:D.t1,letterSpacing:"-0.02em"}}>Today's Games</div>
      </div>
      {loading&&<LoadingScreen message="Loading games..." progress={40}/>}
      {!loading&&(
        <div style={{padding:"0 20px"}}>
          {games.length===0&&<div style={{background:D.bg1,borderRadius:12,padding:24,textAlign:"center",fontFamily:D.font,fontSize:14,color:D.t3,border:"0.5px solid "+D.border}}>No games found for today.</div>}
          {games.map((g,i)=>{
            const hI=(g.home_injuries||[]).filter(p=>p.status==="Out"||p.status==="Questionable");
            const aI=(g.away_injuries||[]).filter(p=>p.status==="Out"||p.status==="Questionable");
            return(
              <div key={i} style={{background:D.bg1,borderRadius:12,border:"0.5px solid "+D.border,marginBottom:10,overflow:"hidden"}}>
                <div style={{padding:"14px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontFamily:D.mono,fontSize:15,color:D.t2}}>{g.away_team_abbrev}</span>
                      <span style={{fontFamily:D.font,fontSize:12,color:D.t3}}>at</span>
                      <span style={{fontFamily:D.mono,fontSize:17,color:D.t1,fontWeight:500}}>{g.home_team_abbrev}</span>
                    </div>
                    <span style={{fontFamily:D.font,fontSize:12,color:D.t3}}>{g.game_time||g.status||"TBD"}</span>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {g.spread_line!=null&&<div style={{background:D.bg2,borderRadius:6,padding:"5px 10px",border:"0.5px solid "+D.border}}><div style={{fontFamily:D.mono,fontSize:12,color:D.blue}}>{g.home_team_abbrev} {g.spread_line>0?"+":""}{g.spread_line}</div><div style={{fontFamily:D.font,fontSize:10,color:D.t3}}>spread</div></div>}
                    {g.total_line!=null&&<div style={{background:D.bg2,borderRadius:6,padding:"5px 10px",border:"0.5px solid "+D.border}}><div style={{fontFamily:D.mono,fontSize:12,color:D.gold}}>O/U {g.total_line}</div><div style={{fontFamily:D.font,fontSize:10,color:D.t3}}>total</div></div>}
                    {g.home_odds!=null&&<div style={{background:D.bg2,borderRadius:6,padding:"5px 10px",border:"0.5px solid "+D.border}}><div style={{fontFamily:D.mono,fontSize:12,color:D.green}}>{g.home_odds.toFixed(2)}×</div><div style={{fontFamily:D.font,fontSize:10,color:D.t3}}>home ML</div></div>}
                    {g.spread_line==null&&g.total_line==null&&<span style={{fontFamily:D.font,fontSize:12,color:D.t3,padding:"5px 0"}}>Odds not yet posted</span>}
                  </div>
                </div>
                {(hI.length>0||aI.length>0)&&(
                  <div style={{padding:"10px 16px",borderTop:"0.5px solid "+D.border}}>
                    <div style={{fontFamily:D.font,fontSize:10,color:D.t3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6}}>Injury Report</div>
                    {[...hI.map(p=>({...p,team:g.home_team_abbrev})),...aI.map(p=>({...p,team:g.away_team_abbrev}))].map((p,j)=>(
                      <div key={j} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <span style={{fontFamily:D.mono,fontSize:10,color:D.t3,background:D.bg2,padding:"1px 5px",borderRadius:3}}>{p.team}</span>
                          <span style={{fontFamily:D.font,fontSize:13,color:D.t2}}>{p.name}</span>
                        </div>
                        <span style={{fontFamily:D.font,fontSize:12,fontWeight:500,color:p.status==="Out"?D.red:p.status==="Questionable"?D.gold:D.green}}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PropsScreen({props,loading}){
  const [filterGame,setFilterGame]=useState("all");
  const [filterStat,setFilterStat]=useState("all");
  const [showBench,setShowBench]=useState(true);
  const [selProp,setSelProp]=useState(null);
  const gameList=[...new Set(props.map(p=>p.game))];
  const filtered=props.filter(p=>{
    if(filterGame!=="all"&&p.game!==filterGame)return false;
    if(filterStat!=="all"&&p.stat!==filterStat)return false;
    if(!showBench&&p.is_bench)return false;
    return true;
  });
  const statOpts=["all","pts","reb","ast","3pm","stl","blk","pra","pr","pa","dd","td"];

  if(selProp){
    return(
      <div style={{flex:1,overflowY:"auto",paddingBottom:40}}>
        <div style={{padding:"12px 20px",borderBottom:"0.5px solid "+D.border}}>
          <button onClick={()=>setSelProp(null)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6,padding:0}}>
            <svg width="8" height="12" viewBox="0 0 8 12"><polyline points="7,1 1,6 7,11" stroke={D.t2} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontFamily:D.font,fontSize:14,color:D.t2}}>Props</span>
          </button>
        </div>
        <div style={{padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <div style={{fontFamily:D.font,fontWeight:500,fontSize:20,color:D.t1}}>{selProp.player}</div>
            {selProp.is_bench&&<span style={{fontFamily:D.mono,fontSize:9,color:D.blue,letterSpacing:"0.06em",textTransform:"uppercase"}}>bench</span>}
          </div>
          <div style={{fontFamily:D.font,fontSize:14,color:D.gold,marginBottom:16}}>{selProp.direction} {selProp.est_line} {selProp.stat_label}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
            {[{label:"Confidence",val:selProp.confidence+"/100",color:cc(selProp.confidence)},{label:"Hit Prob",val:selProp.prob+"%",color:cc(selProp.confidence)},{label:"Edge",val:selProp.edge!=null?(selProp.edge>0?"+":"")+selProp.edge+" pts":"—",color:selProp.edge>0?D.green:D.red}].map((s,i)=>(
              <div key={i} style={{background:D.bg1,borderRadius:10,padding:12,textAlign:"center",border:"0.5px solid "+D.border}}>
                <div style={{fontFamily:D.mono,fontSize:18,color:s.color}}>{s.val}</div>
                <div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
          {selProp.est_line!=null&&(
            <div style={{background:D.bg1,borderRadius:10,padding:16,border:"0.5px solid "+D.border,marginBottom:12}}>
              <div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginBottom:14,letterSpacing:"0.06em",textTransform:"uppercase"}}>Model vs Estimated Line</div>
              <div style={{display:"flex",justifyContent:"space-around",marginBottom:14}}>
                <div style={{textAlign:"center"}}><div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginBottom:4}}>Our Model</div><div style={{fontFamily:D.mono,fontSize:30,color:D.gold}}>{selProp.projection}</div></div>
                <div style={{fontFamily:D.font,fontSize:16,color:D.t3,alignSelf:"center"}}>vs</div>
                <div style={{textAlign:"center"}}><div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginBottom:4}}>Est. Line</div><div style={{fontFamily:D.mono,fontSize:30,color:D.t1}}>{selProp.est_line}</div></div>
              </div>
              <div style={{height:"0.5px",background:D.border,margin:"0 0 10px"}}/>
              {[{label:"L5 Average",val:selProp.l5_avg},{label:"L10 Average",val:selProp.l10_avg},{label:"Usage Rate",val:selProp.usage_rate+"%"},{label:"Projected Minutes",val:selProp.projected_mins+" min"}].filter(r=>r.val!=null).map((row,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<3?"0.5px solid "+D.border:"none"}}>
                  <span style={{fontFamily:D.font,fontSize:13,color:D.t3}}>{row.label}</span>
                  <span style={{fontFamily:D.mono,fontSize:13,color:D.t2}}>{row.val}</span>
                </div>
              ))}
            </div>
          )}
          {selProp.reasoning&&(
            <div style={{background:D.bg1,borderRadius:10,padding:16,border:"0.5px solid "+D.border,marginBottom:12}}>
              <div style={{fontFamily:D.font,fontSize:11,color:D.t3,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase"}}>Analysis</div>
              <div style={{fontFamily:D.font,fontSize:13,color:D.t2,lineHeight:1.65}}>{selProp.reasoning}</div>
            </div>
          )}
          <div style={{paddingLeft:12,borderLeft:"2px solid "+D.bg3,fontFamily:D.font,fontSize:12,color:D.t3,lineHeight:1.6}}>Lines are model estimates. Verify with your bookmaker before placing bets.</div>
        </div>
      </div>
    );
  }

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"4px 20px 16px",flexShrink:0}}>
        <div style={{fontFamily:D.font,fontSize:13,color:D.t3,marginBottom:2}}>Model projections</div>
        <div style={{fontFamily:D.font,fontWeight:500,fontSize:26,color:D.t1,letterSpacing:"-0.02em"}}>Player Props</div>
      </div>
      {loading&&<LoadingScreen message="Projecting props..." progress={70}/>}
      {!loading&&(
        <>
          <div style={{overflowX:"auto",padding:"0 20px 10px",flexShrink:0,scrollbarWidth:"none"}}>
            <div style={{display:"flex",gap:8,minWidth:"max-content"}}>
              {["all",...gameList].map(g=>(
                <button key={g} onClick={()=>setFilterGame(g)} style={{padding:"7px 14px",borderRadius:6,border:"0.5px solid "+(filterGame===g?D.gold:D.border),background:filterGame===g?D.goldDim:D.bg1,color:filterGame===g?D.gold:D.t3,fontFamily:D.font,fontSize:12,cursor:"pointer"}}>
                  {g==="all"?"All Games":g}
                </button>
              ))}
            </div>
          </div>
          <div style={{overflowX:"auto",padding:"0 20px 10px",flexShrink:0,scrollbarWidth:"none"}}>
            <div style={{display:"flex",gap:6,minWidth:"max-content"}}>
              {statOpts.map(s=>(
                <button key={s} onClick={()=>setFilterStat(s)} style={{padding:"5px 12px",borderRadius:6,border:"0.5px solid "+(filterStat===s?D.blue:D.border),background:filterStat===s?D.blueDim:"transparent",color:filterStat===s?D.blue:D.t3,fontFamily:D.font,fontSize:11,cursor:"pointer"}}>
                  {s==="all"?"All":STAT_LABELS[s]||s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div style={{padding:"0 20px 10px",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8}}>
            <span style={{fontFamily:D.font,fontSize:12,color:D.t3}}>Show bench</span>
            <div onClick={()=>setShowBench(s=>!s)} style={{width:36,height:20,borderRadius:99,cursor:"pointer",background:showBench?D.blue:D.bg3,position:"relative",transition:"background 0.2s"}}>
              <div style={{position:"absolute",top:3,left:showBench?19:3,width:14,height:14,borderRadius:"50%",background:D.t1,transition:"left 0.2s"}}/>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"0 20px",paddingBottom:40}}>
            {filtered.length===0&&<div style={{background:D.bg1,borderRadius:12,padding:24,textAlign:"center",fontFamily:D.font,fontSize:14,color:D.t3,border:"0.5px solid "+D.border}}>{props.length===0?"No props generated yet.":"No props match your filters."}</div>}
            {filtered.map((prop,i)=>{
              const col=cc(prop.confidence);
              const isOver=prop.direction==="Over"||prop.direction==="Yes";
              return(
                <div key={i} onClick={()=>setSelProp(prop)} style={{background:D.bg1,borderRadius:10,padding:"14px 16px",marginBottom:8,cursor:"pointer",border:"0.5px solid "+D.border}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontFamily:D.font,fontWeight:500,fontSize:15,color:D.t1}}>{prop.player}</span>
                      {prop.is_bench&&<span style={{fontFamily:D.mono,fontSize:9,color:D.blue,letterSpacing:"0.06em",textTransform:"uppercase"}}>bench</span>}
                    </div>
                    <span style={{fontFamily:D.font,fontSize:11,color:D.t3}}>{prop.game}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span style={{fontFamily:D.font,fontSize:14,color:isOver?D.green:D.red}}>{prop.direction}</span>
                    {prop.est_line!=null&&<span style={{fontFamily:D.mono,fontSize:15,color:D.t1}}>{prop.est_line}</span>}
                    <span style={{fontFamily:D.font,fontSize:13,color:D.t3}}>{prop.stat_label}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    {prop.est_line!=null&&<span style={{fontFamily:D.mono,fontSize:12,color:D.t3}}>Model: <span style={{color:D.gold}}>{prop.projection}</span>{" "}<span style={{color:prop.edge>0?D.green:D.red}}>({prop.edge>0?"+":""}{prop.edge})</span></span>}
                    <ConfBar value={prop.confidence}/>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StreakScreen(){
  const [win,setWin]=useState(10);
  const streaks=[
    {player:"S. Gilgeous-Alexander",stat:"25+ Points",hits:10,team:"OKC"},
    {player:"N. Jokic",stat:"20+ Points",hits:10,team:"DEN"},
    {player:"N. Jokic",stat:"10+ Rebounds",hits:10,team:"DEN"},
    {player:"G. Antetokounmpo",stat:"25+ Points",hits:9,team:"MIL"},
    {player:"L. James",stat:"4+ Assists",hits:10,team:"LAL"},
    {player:"D. Sabonis",stat:"10+ Rebounds",hits:10,team:"SAC"},
    {player:"D. Lillard",stat:"3+ Threes",hits:9,team:"MIL"},
    {player:"T. Young",stat:"7+ Assists",hits:8,team:"ATL"},
  ];
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:40}}>
      <div style={{padding:"4px 20px 16px"}}>
        <div style={{fontFamily:D.font,fontSize:13,color:D.t3,marginBottom:2}}>Consistency streaks</div>
        <div style={{fontFamily:D.font,fontWeight:500,fontSize:26,color:D.t1,letterSpacing:"-0.02em"}}>Streak Tracker</div>
      </div>
      <div style={{padding:"0 20px 16px",display:"flex",gap:8}}>
        {[5,10,15].map(w=>(
          <button key={w} onClick={()=>setWin(w)} style={{padding:"7px 18px",borderRadius:6,border:"0.5px solid "+(win===w?D.gold:D.border),background:win===w?D.goldDim:"transparent",color:win===w?D.gold:D.t3,fontFamily:D.font,fontSize:13,cursor:"pointer"}}>
            L{w}
          </button>
        ))}
      </div>
      <div style={{padding:"0 20px"}}>
        <div style={{background:D.goldDim,borderRadius:10,padding:"10px 14px",border:"0.5px solid "+D.gold+"33",marginBottom:16}}>
          <div style={{fontFamily:D.font,fontSize:12,color:D.gold,marginBottom:2}}>Live streak data coming soon</div>
          <div style={{fontFamily:D.font,fontSize:12,color:D.t3}}>Will pull from NBA.com historical game logs. Sample data shown.</div>
        </div>
        <div style={{background:D.bg1,borderRadius:12,border:"0.5px solid "+D.border,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto",padding:"10px 16px",borderBottom:"0.5px solid "+D.border}}>
            <span style={{fontFamily:D.font,fontSize:11,color:D.t3,letterSpacing:"0.06em"}}>PLAYER / THRESHOLD</span>
            <span style={{fontFamily:D.font,fontSize:11,color:D.t3,letterSpacing:"0.06em"}}>L{win} HIT RATE</span>
          </div>
          {streaks.map((s,i)=>{
            const isPerf=s.hits>=win;
            const rate=Math.round((s.hits/win)*100);
            return(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",borderBottom:i<streaks.length-1?"0.5px solid "+D.border:"none",background:isPerf?D.greenDim:"transparent"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <span style={{fontFamily:D.font,fontSize:14,color:D.t1}}>{s.player}</span>
                    <span style={{fontFamily:D.mono,fontSize:9,color:D.t3,letterSpacing:"0.04em"}}>{s.team}</span>
                  </div>
                  <span style={{fontFamily:D.font,fontSize:12,color:D.t3}}>{s.stat}</span>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:D.mono,fontSize:16,color:isPerf?D.green:rate>=80?D.gold:D.t2}}>{s.hits}/{win}</div>
                  <div style={{fontFamily:D.font,fontSize:11,color:D.t3}}>{rate}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function App(){
  const [screen,setScreen]=useState("picks");
  const [picks,setPicks]=useState(null);
  const [games,setGames]=useState([]);
  const [props,setProps]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [lastUpdated,setLastUpdated]=useState(null);
  const [legsScored,setLegsScored]=useState(0);
  const [propsScored,setPropsScored]=useState(0);
  const [gamesAnalyzed,setGamesAnalyzed]=useState(0);
  const [loadingMsg,setLoadingMsg]=useState("Connecting...");
  const [loadingProgress,setLoadingProgress]=useState(8);

  const loadAll=useCallback(async(force=false)=>{
    setLoading(true);setError(null);
    setLoadingMsg("Connecting to server...");setLoadingProgress(8);
    const steps=[[16,"Fetching today's schedule..."],[30,"NBA.com team stats..."],[44,"Player game logs (L15)..."],[57,"Injury reports..."],[70,"Live bookmaker odds..."],[82,"Running props engine..."],[93,"Building multis..."]];
    let si=0;
    const ticker=setInterval(()=>{if(si<steps.length){setLoadingProgress(steps[si][0]);setLoadingMsg(steps[si][1]);si++;}},17000);
    try{
      const data=await apiFetch(force?"/api/picks?refresh=true":"/api/picks");
      clearInterval(ticker);
      setLoadingProgress(100);setLoadingMsg("Done");
      setPicks(data.picks);setLastUpdated(data.last_updated);
      setLegsScored(data.legs_scored||0);setPropsScored(data.props_scored||0);setGamesAnalyzed(data.games_analyzed||0);
      apiFetch("/api/slate").then(d=>setGames(d.games||[])).catch(()=>{});
      apiFetch("/api/props").then(d=>setProps(d.props||[])).catch(()=>{});
    }catch(e){
      clearInterval(ticker);
      setError(e.name==="AbortError"?"Request timed out — try again in 30 seconds.":"Could not reach analysis server: "+e.message);
    }finally{setLoading(false);}
  },[]);

  useEffect(()=>{loadAll(false);},[loadAll]);

  return(
    <div style={{width:"100%",height:"100%",background:D.bg,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{paddingTop:"env(safe-area-inset-top,44px)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px",borderBottom:"0.5px solid "+D.border,position:"relative"}}>
          <HamburgerMenu onNavigate={setScreen} onRefresh={()=>loadAll(true)} loading={loading} lastUpdated={lastUpdated}/>
          <div style={{fontFamily:D.font,fontWeight:600,fontSize:15,letterSpacing:"0.1em",color:D.t1,textTransform:"uppercase",position:"absolute",left:"50%",transform:"translateX(-50%)"}}>
            NBA<span style={{color:D.gold}}>Edge</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {loading?(
              <><div style={{width:6,height:6,borderRadius:"50%",background:D.gold,animation:"pulse 1.2s ease-in-out infinite"}}/><style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}"}</style></>
            ):(
              <div style={{width:6,height:6,borderRadius:"50%",background:D.green}}/>
            )}
          </div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
        {screen==="picks"&&<PicksScreen picks={picks} loading={loading} loadingMsg={loadingMsg} loadingProgress={loadingProgress} error={error} onRetry={()=>loadAll(false)} lastUpdated={lastUpdated} legsScored={legsScored} propsScored={propsScored} gamesAnalyzed={gamesAnalyzed}/>}
        {screen==="games"&&<GamesScreen games={games} loading={loading}/>}
        {screen==="props"&&<PropsScreen props={props} loading={loading}/>}
        {screen==="streak"&&<StreakScreen/>}
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
