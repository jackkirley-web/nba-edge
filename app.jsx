// NBAEdge v4 — Full props analysis
const { useState, useEffect, useCallback, useRef } = React;

const API_BASE = "https://nba-edge-api.onrender.com";

const ios = {
  bg:"#000000",bg1:"#1C1C1E",bg2:"#2C2C2E",bg3:"#3A3A3C",
  label:"#FFFFFF",label2:"rgba(235,235,245,0.8)",label3:"rgba(235,235,245,0.6)",label4:"rgba(235,235,245,0.3)",
  sep:"#38383A",amber:"#FF9F0A",green:"#30D158",red:"#FF453A",blue:"#0A84FF",
  purple:"#BF5AF2",teal:"#5AC8FA",
  font:"-apple-system,'SF Pro Display',system-ui,sans-serif",
  mono:"'SF Mono','Fira Mono',monospace",
};

async function apiFetch(path, timeout=120000){
  const c=new AbortController();
  const t=setTimeout(()=>c.abort(),timeout);
  try{
    const r=await fetch(`${API_BASE}${path}`,{signal:c.signal});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }finally{clearTimeout(t);}
}

const TAG_STYLE={
  "Injury Risk":{bg:"rgba(255,69,58,0.15)",color:ios.red},
  "Injury Impact":{bg:"rgba(255,159,10,0.15)",color:ios.amber},
  "B2B":{bg:"rgba(90,200,250,0.15)",color:ios.teal},
  "Minutes Risk":{bg:"rgba(255,69,58,0.15)",color:ios.red},
  "Weak Defense":{bg:"rgba(48,209,88,0.15)",color:ios.green},
  "Tough Defense":{bg:"rgba(255,69,58,0.15)",color:ios.red},
  "High Variance":{bg:"rgba(191,90,242,0.15)",color:ios.purple},
  "High Pace":{bg:"rgba(10,132,255,0.15)",color:ios.blue},
};

const STAT_ICONS={
  pts:"🏀",reb:"💪",ast:"🎯","3pm":"🎳",stl:"🤚",blk:"🚫",
  pra:"⚡",pr:"💥",pa:"🔥",ra:"🤝",dd:"🔥",td:"🌟",
};

const cc=c=>c>=70?ios.green:c>=60?ios.amber:ios.blue;

function PillTag({label}){
  const s=TAG_STYLE[label]||{bg:ios.bg3,color:ios.label3};
  return<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,
    background:s.bg,color:s.color,fontFamily:ios.font,whiteSpace:"nowrap"}}>{label}</span>;
}

function ConfRing({value,size=52}){
  const r=(size-6)/2,circ=2*Math.PI*r,fill=(value/100)*circ,col=cc(value);
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ios.bg3} strokeWidth={4}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col}
          strokeWidth={4} strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center"}}>
        <span style={{fontFamily:ios.font,fontWeight:700,fontSize:size>44?14:11,color:col,lineHeight:1}}>{value}</span>
        <span style={{fontFamily:ios.font,fontSize:8,color:ios.label3,marginTop:1}}>CONF</span>
      </div>
    </div>
  );
}

function LoadingScreen({message,progress}){
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:40,gap:24}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
        <div style={{fontSize:48}}>🏀</div>
        <div style={{fontFamily:ios.font,fontWeight:800,fontSize:28,color:ios.label,letterSpacing:-0.5}}>
          NBA<span style={{color:ios.amber}}>EDGE</span>
        </div>
      </div>
      <div style={{width:"100%",maxWidth:280}}>
        <div style={{height:3,background:ios.bg3,borderRadius:99,overflow:"hidden"}}>
          <div style={{height:"100%",background:ios.amber,borderRadius:99,
            width:`${progress}%`,transition:"width 0.5s ease"}}/>
        </div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:ios.font,fontSize:15,color:ios.label2,marginBottom:6}}>{message}</div>
        <div style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>
          Analysing today's NBA slate…
        </div>
      </div>
      <div style={{background:ios.bg1,borderRadius:14,padding:"12px 16px",
        width:"100%",maxWidth:280,border:`0.5px solid ${ios.sep}`}}>
        {[{icon:"📊",label:"NBA.com official stats"},{icon:"👤",label:"Player game logs (L15)"},
          {icon:"🩹",label:"ESPN injury reports"},{icon:"💰",label:"Live bookmaker odds"},
          {icon:"🧠",label:"Props scoring engine"}].map((item,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 0",
            borderBottom:i<4?`0.5px solid ${ios.sep}`:"none"}}>
            <span style={{fontSize:16}}>{item.icon}</span>
            <span style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrBanner({msg,onRetry}){
  return(
    <div style={{margin:"12px 20px",background:"rgba(255,69,58,0.12)",borderRadius:14,
      padding:"14px 16px",border:`1px solid ${ios.red}33`}}>
      <div style={{fontFamily:ios.font,fontWeight:600,fontSize:14,color:ios.red,marginBottom:6}}>
        ⚠️ Connection Error</div>
      <div style={{fontFamily:ios.font,fontSize:13,color:ios.label3,marginBottom:10}}>{msg}</div>
      <button onClick={onRetry} style={{background:ios.red,border:"none",borderRadius:8,
        padding:"8px 16px",color:"#fff",fontFamily:ios.font,fontSize:14,fontWeight:600,cursor:"pointer"}}>
        Try Again</button>
    </div>
  );
}

// ─── PROP DETAIL SHEET ────────────────────────────────────────
function PropSheet({prop,onClose}){
  const col=cc(prop.confidence);
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,background:ios.bg1,
      display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <div style={{padding:"12px 20px 0",flexShrink:0}}>
        <div style={{width:36,height:4,background:ios.bg3,borderRadius:99,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <span style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>{prop.game}</span>
          <button onClick={onClose} style={{background:ios.bg3,border:"none",borderRadius:99,
            width:30,height:30,color:ios.label2,fontSize:16,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{fontFamily:ios.font,fontWeight:700,fontSize:22,color:ios.label,marginBottom:4}}>
          {prop.player}
        </div>
        <div style={{fontFamily:ios.font,fontSize:15,color:ios.amber,marginBottom:8}}>
          {STAT_ICONS[prop.stat]} {prop.direction} {prop.est_line} {prop.stat_label}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          <span style={{background:ios.bg3,borderRadius:99,padding:"4px 12px",
            fontFamily:ios.font,fontSize:13,color:ios.blue,fontWeight:600}}>
            {prop.position} · {prop.team}
          </span>
          {prop.injury_status!=="Available"&&(
            <span style={{background:"rgba(255,69,58,0.2)",borderRadius:99,padding:"4px 12px",
              fontFamily:ios.font,fontSize:13,color:ios.red,fontWeight:600}}>
              {prop.injury_status}
            </span>
          )}
          {(prop.tags||[]).map(t=><PillTag key={t} label={t}/>)}
        </div>
      </div>

      <div style={{padding:"0 20px 60px"}}>
        {/* Key numbers */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {[
            {label:"Confidence",val:`${prop.confidence}/100`,color:col},
            {label:"Hit Prob",val:`${prop.prob}%`,color:col},
            {label:"Edge",val:prop.edge!=null?`${prop.edge>0?"+":""}${prop.edge} pts`:"N/A",
              color:prop.edge>0?ios.green:ios.red},
          ].map((s,i)=>(
            <div key={i} style={{background:ios.bg2,borderRadius:12,padding:"10px 12px",textAlign:"center"}}>
              <div style={{fontFamily:ios.font,fontWeight:700,fontSize:18,color:s.color}}>{s.val}</div>
              <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Projection vs line */}
        {prop.est_line!=null&&(
          <div style={{background:ios.bg2,borderRadius:16,padding:16,marginBottom:14}}>
            <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
              marginBottom:12,letterSpacing:0.3}}>MODEL vs BOOK</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginBottom:4}}>OUR PROJECTION</div>
                <div style={{fontFamily:ios.font,fontWeight:800,fontSize:28,color:ios.amber}}>{prop.projection}</div>
              </div>
              <div style={{fontFamily:ios.font,fontSize:24,color:ios.label3}}>vs</div>
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginBottom:4}}>EST. BOOK LINE</div>
                <div style={{fontFamily:ios.font,fontWeight:800,fontSize:28,color:ios.label}}>{prop.est_line}</div>
              </div>
            </div>
            <div style={{height:1,background:ios.sep,marginBottom:10}}/>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>L5 Average</span>
              <span style={{fontFamily:ios.mono,fontSize:13,color:ios.label2}}>{prop.l5_avg}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              <span style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>L10 Average</span>
              <span style={{fontFamily:ios.mono,fontSize:13,color:ios.label2}}>{prop.l10_avg}</span>
            </div>
          </div>
        )}

        {/* Player context */}
        <div style={{background:ios.bg2,borderRadius:16,padding:16,marginBottom:14}}>
          <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
            marginBottom:12,letterSpacing:0.3}}>PLAYER CONTEXT</div>
          {[
            {label:"Usage Rate",val:`${prop.usage_rate}%`},
            {label:"Projected Minutes",val:`${prop.projected_mins} min`},
            {label:"Season Avg Minutes",val:`${prop.season_mins} min`},
            {label:"Injury Status",val:prop.injury_status,
              color:prop.injury_status==="Out"?ios.red:prop.injury_status==="Questionable"?ios.amber:ios.green},
          ].map((row,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"6px 0",borderBottom:i<3?`0.5px solid ${ios.sep}`:"none"}}>
              <span style={{fontFamily:ios.font,fontSize:14,color:ios.label2}}>{row.label}</span>
              <span style={{fontFamily:ios.mono,fontSize:14,color:row.color||ios.label,fontWeight:600}}>
                {row.val}
              </span>
            </div>
          ))}
        </div>

        {/* Reasoning */}
        {prop.reasoning&&(
          <div style={{background:ios.bg2,borderRadius:16,padding:16,marginBottom:14}}>
            <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
              marginBottom:8,letterSpacing:0.3}}>ANALYSIS</div>
            <div style={{fontFamily:ios.font,fontSize:14,color:ios.label2,lineHeight:1.6}}>
              {prop.reasoning}
            </div>
          </div>
        )}

        <div style={{background:"rgba(255,159,10,0.1)",borderRadius:12,padding:"12px 14px",
          fontFamily:ios.font,fontSize:12,color:ios.label3,lineHeight:1.5}}>
          ⚠️ Lines are model estimates — verify actual bookmaker lines before betting.
          Always confirm player availability at tip-off.
        </div>
      </div>
    </div>
  );
}

// ─── PROPS TAB ────────────────────────────────────────────────
function PropsTab({props,loading,error,onRetry,gamesAnalyzed}){
  const [selectedProp,setSelectedProp]=useState(null);
  const [filterStat,setFilterStat]=useState("all");
  const [filterGame,setFilterGame]=useState("all");
  const [minConf,setMinConf]=useState(55);

  const statFilters=[
    {key:"all",label:"All"},
    {key:"pts",label:"Pts"},
    {key:"reb",label:"Reb"},
    {key:"ast",label:"Ast"},
    {key:"3pm",label:"3PM"},
    {key:"stl",label:"Stl"},
    {key:"blk",label:"Blk"},
    {key:"pra",label:"PRA"},
    {key:"pr",label:"P+R"},
    {key:"pa",label:"P+A"},
    {key:"dd",label:"DD"},
    {key:"td",label:"TD"},
  ];

  const games=[...new Set(props.map(p=>p.game))];

  const filtered=props.filter(p=>{
    if(filterStat!=="all"&&p.stat!==filterStat)return false;
    if(filterGame!=="all"&&p.game!==filterGame)return false;
    if(p.confidence<minConf)return false;
    return true;
  });

  if(selectedProp)return<PropSheet prop={selectedProp} onClose={()=>setSelectedProp(null)}/>;

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"16px 20px 8px",flexShrink:0}}>
        <div style={{fontFamily:ios.font,fontWeight:800,fontSize:34,color:ios.label,letterSpacing:-0.5}}>
          Player Props</div>
        <div style={{fontFamily:ios.font,fontSize:15,color:ios.label3,marginTop:2}}>
          {filtered.length} props · Model vs estimated line
        </div>
      </div>

      {error&&<ErrBanner msg={error} onRetry={onRetry}/>}
      {loading&&<LoadingScreen message="Projecting player props…" progress={70}/>}

      {!loading&&(
        <>
          {/* Stat filter pills */}
          <div style={{overflowX:"auto",padding:"0 20px 8px",flexShrink:0,
            display:"flex",gap:8,scrollbarWidth:"none"}}>
            {statFilters.map(f=>(
              <button key={f.key} onClick={()=>setFilterStat(f.key)}
                style={{flexShrink:0,padding:"6px 14px",borderRadius:99,border:"none",
                  background:filterStat===f.key?ios.blue:`${ios.bg2}`,
                  color:filterStat===f.key?"#fff":ios.label3,
                  fontFamily:ios.font,fontSize:13,fontWeight:600,cursor:"pointer"}}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Game filter */}
          {games.length>1&&(
            <div style={{overflowX:"auto",padding:"0 20px 8px",flexShrink:0,
              display:"flex",gap:8,scrollbarWidth:"none"}}>
              <button onClick={()=>setFilterGame("all")}
                style={{flexShrink:0,padding:"5px 12px",borderRadius:99,border:"none",
                  background:filterGame==="all"?ios.amber:`${ios.bg2}`,
                  color:filterGame==="all"?"#000":ios.label3,
                  fontFamily:ios.font,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                All Games
              </button>
              {games.map(g=>(
                <button key={g} onClick={()=>setFilterGame(g)}
                  style={{flexShrink:0,padding:"5px 12px",borderRadius:99,border:"none",
                    background:filterGame===g?ios.amber:`${ios.bg2}`,
                    color:filterGame===g?"#000":ios.label3,
                    fontFamily:ios.font,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Props list */}
          <div style={{flex:1,overflowY:"auto",padding:"4px 20px",paddingBottom:100}}>
            {filtered.length===0&&(
              <div style={{background:ios.bg1,borderRadius:16,padding:24,textAlign:"center",
                fontFamily:ios.font,fontSize:15,color:ios.label3}}>
                {props.length===0
                  ? "No props generated yet — check back once today's games are loaded."
                  : "No props match your current filters."}
              </div>
            )}

            {filtered.map((prop,i)=>{
              const col=cc(prop.confidence);
              const isOver=prop.direction==="Over"||prop.direction==="Yes";
              return(
                <div key={i} onClick={()=>setSelectedProp(prop)}
                  style={{background:ios.bg1,borderRadius:16,padding:"14px 16px",
                    marginBottom:10,cursor:"pointer",border:`0.5px solid ${ios.sep}`}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <ConfRing value={prop.confidence} size={46}/>
                    <div style={{flex:1,minWidth:0}}>
                      {/* Player + game */}
                      <div style={{display:"flex",justifyContent:"space-between",
                        alignItems:"flex-start",marginBottom:3}}>
                        <div>
                          <span style={{fontFamily:ios.font,fontWeight:700,fontSize:16,color:ios.label}}>
                            {prop.player}
                          </span>
                          <span style={{fontFamily:ios.font,fontSize:12,color:ios.label3,marginLeft:6}}>
                            {prop.position} · {prop.team}
                          </span>
                        </div>
                        <span style={{fontFamily:ios.font,fontSize:12,color:ios.label3,flexShrink:0}}>
                          {prop.game}
                        </span>
                      </div>

                      {/* Prop line */}
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <span style={{fontSize:16}}>{STAT_ICONS[prop.stat]||"📊"}</span>
                        <span style={{fontFamily:ios.font,fontWeight:600,fontSize:15,
                          color:isOver?ios.green:ios.red}}>
                          {prop.direction}
                        </span>
                        {prop.est_line!=null&&(
                          <span style={{fontFamily:ios.mono,fontSize:15,color:ios.label,fontWeight:700}}>
                            {prop.est_line}
                          </span>
                        )}
                        <span style={{fontFamily:ios.font,fontSize:14,color:ios.label3}}>
                          {prop.stat_label}
                        </span>
                      </div>

                      {/* Projection vs line bar */}
                      {prop.est_line!=null&&(
                        <div style={{marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                            <span style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>
                              Model: <strong style={{color:ios.amber}}>{prop.projection}</strong>
                            </span>
                            <span style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>
                              Line: <strong style={{color:ios.label}}>{prop.est_line}</strong>
                            </span>
                            <span style={{fontFamily:ios.font,fontSize:11,
                              color:prop.edge>0?ios.green:ios.red}}>
                              {prop.edge>0?"+":""}{prop.edge} edge
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Tags + prob */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                          {(prop.tags||[]).slice(0,2).map(t=><PillTag key={t} label={t}/>)}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                          <span style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>
                            {prop.prob}% prob
                          </span>
                          <span style={{fontSize:14,color:ios.label3}}>›</span>
                        </div>
                      </div>
                    </div>
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

// ─── LEG / PICK SCREENS (same as v3) ─────────────────────────
function LegSheet({leg,onClose}){
  const col=cc(leg.confidence);
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,background:ios.bg1,
      display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <div style={{padding:"12px 20px 0",flexShrink:0}}>
        <div style={{width:36,height:4,background:ios.bg3,borderRadius:99,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <span style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>{leg.game}</span>
          <button onClick={onClose} style={{background:ios.bg3,border:"none",borderRadius:99,
            width:30,height:30,color:ios.label2,fontSize:16,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{fontFamily:ios.font,fontWeight:700,fontSize:20,color:ios.label,marginBottom:6}}>
          {leg.selection}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          <span style={{background:ios.bg3,borderRadius:99,padding:"4px 12px",
            fontFamily:ios.font,fontSize:13,color:ios.amber,fontWeight:600}}>
            {leg.odds?.toFixed(2)}×</span>
          <span style={{background:ios.bg3,borderRadius:99,padding:"4px 12px",
            fontFamily:ios.font,fontSize:13,color:ios.blue,fontWeight:600}}>{leg.type}</span>
          {(leg.tags||[]).map(t=><PillTag key={t} label={t}/>)}
        </div>
      </div>
      <div style={{padding:"0 20px 60px"}}>
        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <div style={{flex:1,background:ios.bg2,borderRadius:16,padding:16,
            display:"flex",alignItems:"center",gap:12}}>
            <ConfRing value={leg.confidence} size={56}/>
            <div>
              <div style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>Confidence</div>
              <div style={{fontFamily:ios.font,fontWeight:700,fontSize:22,color:col}}>{leg.confidence}/100</div>
            </div>
          </div>
          <div style={{flex:1,background:ios.bg2,borderRadius:16,padding:16,
            display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <div style={{fontFamily:ios.font,fontSize:13,color:ios.label3,marginBottom:4}}>Hit Probability</div>
            <div style={{fontFamily:ios.font,fontWeight:700,fontSize:28,color:col}}>{leg.prob}%</div>
          </div>
        </div>
        {(leg.projected_margin!=null||leg.projected_total!=null)&&(
          <div style={{background:ios.bg2,borderRadius:16,padding:16,marginBottom:14}}>
            <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
              marginBottom:10,letterSpacing:0.3}}>MODEL PROJECTION</div>
            {leg.projected_margin!=null&&(
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontFamily:ios.font,fontSize:14,color:ios.label2}}>Projected margin</span>
                <span style={{fontFamily:ios.mono,fontWeight:700,fontSize:14,color:ios.amber}}>
                  {leg.projected_margin>0?"+":""}{leg.projected_margin}</span>
              </div>
            )}
            {leg.projected_total!=null&&(
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontFamily:ios.font,fontSize:14,color:ios.label2}}>Projected total</span>
                <span style={{fontFamily:ios.mono,fontWeight:700,fontSize:14,color:ios.amber}}>
                  {leg.projected_total}</span>
              </div>
            )}
          </div>
        )}
        {leg.reasoning&&(
          <div style={{background:ios.bg2,borderRadius:16,padding:16,marginBottom:14}}>
            <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
              marginBottom:8,letterSpacing:0.3}}>ANALYSIS</div>
            <div style={{fontFamily:ios.font,fontSize:14,color:ios.label2,lineHeight:1.6}}>
              {leg.reasoning}</div>
          </div>
        )}
        {(leg.factors||[]).length>0&&(
          <div style={{background:ios.bg2,borderRadius:16,padding:16,marginBottom:14}}>
            <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
              marginBottom:12,letterSpacing:0.3}}>SCORING BREAKDOWN</div>
            {leg.factors.map((f,i)=>{
              const pct=(f.val/f.max)*100,fc=pct>70?ios.green:pct>50?ios.amber:ios.label3;
              return(
                <div key={i} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontFamily:ios.font,fontSize:12,color:ios.label2}}>{f.name}</span>
                    <span style={{fontFamily:ios.mono,fontSize:12,color:fc}}>{f.val}/{f.max}</span>
                  </div>
                  <div style={{height:4,background:ios.bg3,borderRadius:99,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:fc,borderRadius:99}}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{background:"rgba(255,159,10,0.1)",borderRadius:12,padding:"12px 14px",
          fontFamily:ios.font,fontSize:12,color:ios.label3,lineHeight:1.5}}>
          ⚠️ Analytical estimates only. Verify lineups. Bet responsibly.</div>
      </div>
    </div>
  );
}

function PickScreen({pick,onBack}){
  const [sel,setSel]=useState(null);
  const legs=pick.legs||[];
  return(
    <>
      <div style={{flex:1,overflowY:"auto",background:ios.bg,paddingBottom:100}}>
        <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(0,0,0,0.85)",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
          padding:"12px 20px 10px",borderBottom:`0.5px solid ${ios.sep}`}}>
          <button onClick={onBack} style={{background:"none",border:"none",
            color:ios.blue,fontFamily:ios.font,fontSize:17,cursor:"pointer",padding:0}}>‹ Back</button>
        </div>
        <div style={{padding:"20px 20px 0"}}>
          <div style={{background:`linear-gradient(145deg,${pick.accentColor}20,${ios.bg1})`,
            border:`1px solid ${pick.accentColor}33`,borderRadius:20,padding:20,marginBottom:20}}>
            <div style={{fontFamily:ios.font,fontSize:13,color:pick.accentColor,
              fontWeight:600,marginBottom:4}}>{pick.emoji} {pick.label.toUpperCase()}</div>
            <div style={{fontFamily:ios.font,fontWeight:800,fontSize:44,
              color:ios.label,lineHeight:1}}>{pick.odds}</div>
            <div style={{fontFamily:ios.font,fontSize:14,color:ios.label3,
              marginTop:4,marginBottom:16}}>
              combined odds · {legs.length} leg{legs.length!==1?"s":""}</div>
            <div style={{display:"flex",gap:12}}>
              <div style={{flex:1,background:ios.bg1,borderRadius:12,padding:"10px 14px"}}>
                <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginBottom:2}}>
                  HIT PROBABILITY</div>
                <div style={{fontFamily:ios.font,fontWeight:700,fontSize:22,
                  color:pick.accentColor}}>{pick.hitProb}%</div>
              </div>
              <div style={{flex:1,background:ios.bg1,borderRadius:12,padding:"10px 14px"}}>
                <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginBottom:2}}>LEGS</div>
                <div style={{fontFamily:ios.font,fontWeight:700,fontSize:22,color:ios.label}}>
                  {legs.length}</div>
              </div>
            </div>
          </div>

          {legs.length===0?(
            <div style={{background:ios.bg1,borderRadius:16,padding:24,textAlign:"center",
              fontFamily:ios.font,fontSize:15,color:ios.label3}}>
              Odds not yet posted. Check back closer to tip-off.</div>
          ):(
            <>
              <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
                marginBottom:10,letterSpacing:0.3}}>BET LEGS — TAP FOR FULL ANALYSIS</div>
              {legs.map((leg,i)=>{
                const col=cc(leg.confidence);
                const isProp=leg.type?.startsWith("Prop");
                return(
                  <div key={i} onClick={()=>setSel(leg)}
                    style={{background:isProp?`${ios.purple}12`:ios.bg1,
                      borderRadius:16,padding:"14px 16px",marginBottom:10,
                      display:"flex",gap:12,alignItems:"center",cursor:"pointer",
                      border:`0.5px solid ${isProp?ios.purple:ios.sep}`}}>
                    <ConfRing value={leg.confidence} size={48}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:ios.font,fontSize:12,color:ios.label3,marginBottom:2}}>
                        {leg.game}{isProp?" · PROP":""}
                      </div>
                      <div style={{fontFamily:ios.font,fontWeight:600,fontSize:15,color:ios.label,
                        marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {leg.selection}</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{fontFamily:ios.font,fontSize:12,color:ios.amber,fontWeight:600}}>
                          {leg.odds?.toFixed(2)}×</span>
                        <span style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>{leg.type}</span>
                        {(leg.tags||[]).map(t=><PillTag key={t} label={t}/>)}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontFamily:ios.font,fontWeight:700,fontSize:18,color:col}}>
                        {leg.prob}%</div>
                      <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>prob</div>
                      <div style={{fontSize:16,color:ios.label3,marginTop:2}}>›</div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
            margin:"20px 0 10px",letterSpacing:0.3}}>KEY RISKS</div>
          <div style={{background:ios.bg1,borderRadius:16,overflow:"hidden",marginBottom:16}}>
            {(pick.risks||["No major risks identified"]).map((r,i,arr)=>(
              <div key={i} style={{padding:"12px 16px",
                borderBottom:i<arr.length-1?`0.5px solid ${ios.sep}`:"none",
                display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:15,flexShrink:0}}>⚠️</span>
                <span style={{fontFamily:ios.font,fontSize:14,color:ios.label2,lineHeight:1.4}}>{r}</span>
              </div>
            ))}
          </div>

          {(pick.alts||[]).length>0&&(
            <>
              <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
                marginBottom:10,letterSpacing:0.3}}>NEAR-MISS ALTERNATES</div>
              <div style={{background:ios.bg1,borderRadius:16,overflow:"hidden",marginBottom:20}}>
                {pick.alts.map((a,i)=>(
                  <div key={i} style={{padding:"12px 16px",
                    borderBottom:i<pick.alts.length-1?`0.5px solid ${ios.sep}`:"none",
                    display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontFamily:ios.font,fontSize:13,color:ios.label2,
                      flex:1,marginRight:8}}>{a.desc}</span>
                    <span style={{fontFamily:ios.font,fontSize:14,
                      color:cc(a.conf),fontWeight:600,flexShrink:0}}>{a.conf}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {sel&&<LegSheet leg={sel} onClose={()=>setSel(null)}/>}
    </>
  );
}

function PicksTab({picks,loading,loadingMsg,loadingProgress,error,onRetry,lastUpdated,legsScored,propsScored,gamesAnalyzed}){
  const [detail,setDetail]=useState(null);
  if(detail&&picks?.[detail])return<PickScreen pick={picks[detail]} onBack={()=>setDetail(null)}/>;
  const today=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:100}}>
      <div style={{padding:"16px 20px 6px",display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>
          <div style={{fontFamily:ios.font,fontWeight:800,fontSize:34,color:ios.label,letterSpacing:-0.5}}>
            Today's Picks</div>
          <div style={{fontFamily:ios.font,fontSize:15,color:ios.label3,marginTop:2}}>{today}</div>
        </div>
        {lastUpdated&&<div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,
          textAlign:"right",paddingBottom:4}}>Updated<br/>{lastUpdated}</div>}
      </div>
      {loading&&<LoadingScreen message={loadingMsg} progress={loadingProgress}/>}
      {error&&!loading&&<ErrBanner msg={error} onRetry={onRetry}/>}
      {!loading&&!error&&picks&&(
        <>
          <div style={{margin:"8px 20px 16px",background:ios.bg1,borderRadius:14,
            padding:"12px 16px",display:"flex",gap:10,border:`0.5px solid ${ios.sep}`}}>
            <span style={{fontSize:18}}>📡</span>
            <div style={{fontFamily:ios.font,fontSize:13,color:ios.label3,lineHeight:1.5}}>
              <strong style={{color:ios.label2}}>Live analysis complete</strong> ·{" "}
              {gamesAnalyzed} games · {legsScored} game legs · {propsScored} player props scored
            </div>
          </div>
          <div style={{padding:"0 20px"}}>
            {Object.values(picks).map(pick=>(
              <div key={pick.key} onClick={()=>pick.legs?.length&&setDetail(pick.key)}
                style={{background:ios.bg1,borderRadius:20,marginBottom:14,overflow:"hidden",
                  border:`0.5px solid ${ios.sep}`,cursor:pick.legs?.length?"pointer":"default",
                  opacity:pick.legs?.length?1:0.5}}>
                <div style={{background:`linear-gradient(135deg,${pick.accentColor}18,transparent)`,
                  borderBottom:`0.5px solid ${pick.accentColor}33`,padding:"16px 18px",
                  display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontFamily:ios.font,fontWeight:700,fontSize:18,
                      color:ios.label,marginBottom:3}}>{pick.emoji} {pick.label}</div>
                    <div style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>{pick.subtitle}</div>
                    {(pick.legs||[]).some(l=>l.type?.startsWith("Prop"))&&(
                      <div style={{marginTop:4}}>
                        <span style={{fontFamily:ios.font,fontSize:11,color:ios.purple,
                          background:"rgba(191,90,242,0.15)",padding:"2px 8px",borderRadius:99}}>
                          Includes player props
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:ios.font,fontWeight:800,fontSize:26,
                      color:pick.accentColor,lineHeight:1}}>{pick.odds}</div>
                    <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginTop:2}}>
                      combined odds</div>
                  </div>
                </div>
                <div style={{display:"flex",padding:"12px 18px"}}>
                  {[
                    {label:"hit probability",val:`${pick.hitProb}%`,color:pick.accentColor},
                    {label:"legs",val:pick.legs?.length||0,color:ios.label},
                    {label:"high-conf",val:(pick.legs||[]).filter(l=>l.confidence>=70).length,color:ios.label},
                  ].map((s,i)=>(
                    <div key={i} style={{flex:1,textAlign:"center",
                      borderRight:i<2?`0.5px solid ${ios.sep}`:"none"}}>
                      <div style={{fontFamily:ios.font,fontWeight:700,fontSize:20,color:s.color}}>{s.val}</div>
                      <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {(pick.legs||[]).length>0&&(
                  <div style={{padding:"0 18px 14px",display:"flex",
                    justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:5}}>
                      {(pick.legs||[]).slice(0,6).map((l,i)=>(
                        <div key={i} style={{width:8,height:8,borderRadius:"50%",
                          background:l.type?.startsWith("Prop")?ios.purple:cc(l.confidence),
                          opacity:0.85}}/>
                      ))}
                    </div>
                    <span style={{fontSize:17,color:ios.label3}}>›</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{margin:"0 20px 20px",background:ios.bg1,borderRadius:12,
            padding:"10px 14px",fontFamily:ios.font,fontSize:12,color:ios.label3,
            lineHeight:1.5,border:`0.5px solid ${ios.sep}`}}>
            ⚠️ Analytical estimates only. Prop lines are model estimates — verify with bookmaker.
            Always confirm lineup at tip-off. Bet responsibly.
          </div>
        </>
      )}
    </div>
  );
}

function SlateTab({games,loading,error,onRetry}){
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:100}}>
      <div style={{padding:"16px 20px 8px"}}>
        <div style={{fontFamily:ios.font,fontWeight:800,fontSize:34,color:ios.label,letterSpacing:-0.5}}>
          Tonight's Slate</div>
        <div style={{fontFamily:ios.font,fontSize:15,color:ios.label3,marginTop:2}}>
          {games.length} game{games.length!==1?"s":""} · Live odds</div>
      </div>
      {error&&<ErrBanner msg={error} onRetry={onRetry}/>}
      {loading&&<LoadingScreen message="Fetching games…" progress={40}/>}
      {!loading&&(
        <div style={{padding:"8px 20px"}}>
          {games.length===0&&(
            <div style={{background:ios.bg1,borderRadius:16,padding:24,textAlign:"center",
              fontFamily:ios.font,fontSize:15,color:ios.label3}}>
              No NBA games today. Check back tomorrow!</div>
          )}
          {games.map((g,i)=>{
            const hI=(g.home_injuries||[]).filter(p=>p.status==="Out"||p.status==="Questionable");
            const aI=(g.away_injuries||[]).filter(p=>p.status==="Out"||p.status==="Questionable");
            return(
              <div key={i} style={{background:ios.bg1,borderRadius:16,marginBottom:12,
                overflow:"hidden",border:`0.5px solid ${ios.sep}`}}>
                <div style={{padding:"14px 16px",borderBottom:`0.5px solid ${ios.sep}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",
                    alignItems:"center",marginBottom:8}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                        <span style={{fontFamily:ios.font,fontSize:14,color:ios.label3}}>
                          {g.away_team_abbrev}</span>
                        <span style={{color:ios.label4,fontSize:11}}>@</span>
                        <span style={{fontFamily:ios.font,fontWeight:700,fontSize:18,color:ios.label}}>
                          {g.home_team_abbrev}</span>
                      </div>
                      <div style={{fontFamily:ios.font,fontSize:12,color:ios.label3}}>
                        {g.game_time||g.status||"Today"}</div>
                    </div>
                    {g.status==="Final"&&(
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:ios.mono,fontWeight:700,fontSize:18,color:ios.label}}>
                          {g.away_score}–{g.home_score}</div>
                        <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>Final</div>
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {g.spread_line!=null&&(
                      <div style={{background:ios.bg2,borderRadius:8,padding:"5px 10px"}}>
                        <div style={{fontFamily:ios.mono,fontSize:12,color:ios.blue,fontWeight:600}}>
                          {g.home_team_abbrev} {g.spread_line>0?"+":""}{g.spread_line}</div>
                        <div style={{fontFamily:ios.font,fontSize:10,color:ios.label3}}>spread</div>
                      </div>
                    )}
                    {g.total_line!=null&&(
                      <div style={{background:ios.bg2,borderRadius:8,padding:"5px 10px"}}>
                        <div style={{fontFamily:ios.mono,fontSize:12,color:ios.purple,fontWeight:600}}>
                          O/U {g.total_line}</div>
                        <div style={{fontFamily:ios.font,fontSize:10,color:ios.label3}}>total</div>
                      </div>
                    )}
                    {g.home_odds!=null&&(
                      <div style={{background:ios.bg2,borderRadius:8,padding:"5px 10px"}}>
                        <div style={{fontFamily:ios.mono,fontSize:12,color:ios.green,fontWeight:600}}>
                          {g.home_odds?.toFixed(2)}×</div>
                        <div style={{fontFamily:ios.font,fontSize:10,color:ios.label3}}>home ML</div>
                      </div>
                    )}
                    {g.spread_line==null&&g.total_line==null&&(
                      <span style={{fontFamily:ios.font,fontSize:12,color:ios.label3,padding:"5px 0"}}>
                        Odds not yet posted</span>
                    )}
                  </div>
                </div>
                {(hI.length>0||aI.length>0)?(
                  <div style={{padding:"10px 16px"}}>
                    <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,
                      marginBottom:6,letterSpacing:0.3}}>INJURY REPORT</div>
                    {[...hI.map(p=>({...p,team:g.home_team_abbrev})),
                      ...aI.map(p=>({...p,team:g.away_team_abbrev}))].map((p,j)=>(
                      <div key={j} style={{display:"flex",justifyContent:"space-between",
                        alignItems:"center",marginBottom:4}}>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <span style={{fontFamily:ios.font,fontSize:11,color:ios.label3,
                            background:ios.bg3,padding:"1px 6px",borderRadius:4}}>{p.team}</span>
                          <span style={{fontFamily:ios.font,fontSize:13,color:ios.label2}}>{p.name}</span>
                        </div>
                        <span style={{fontFamily:ios.font,fontSize:12,fontWeight:600,
                          color:p.status==="Out"?ios.red:p.status==="Questionable"?ios.amber:ios.green}}>
                          {p.status}</span>
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{padding:"8px 16px",fontFamily:ios.font,fontSize:12,color:ios.green}}>
                    ✅ No injury concerns</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────
function App(){
  const [tab,setTab]=useState("picks");
  const [picks,setPicks]=useState(null);
  const [games,setGames]=useState([]);
  const [props,setProps]=useState([]);
  const [injuries,setInjuries]=useState({});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [lastUpdated,setLastUpdated]=useState(null);
  const [legsScored,setLegsScored]=useState(0);
  const [propsScored,setPropsScored]=useState(0);
  const [gamesAnalyzed,setGamesAnalyzed]=useState(0);
  const [loadingMsg,setLoadingMsg]=useState("Connecting to server…");
  const [loadingProgress,setLoadingProgress]=useState(10);

  const loadAll=useCallback(async()=>{
    setLoading(true);setError(null);
    setLoadingMsg("Connecting to server…");setLoadingProgress(10);
    const steps=[
      [20,"Fetching NBA.com stats…"],[35,"Loading player game logs…"],
      [50,"Fetching injury reports…"],[65,"Getting live odds…"],
      [78,"Running props engine…"],[90,"Building your multis…"],
    ];
    let si=0;
    const ticker=setInterval(()=>{
      if(si<steps.length){const[p,m]=steps[si++];setLoadingProgress(p);setLoadingMsg(m);}
    },15000);
    try{
      const data=await apiFetch("/api/picks");
      clearInterval(ticker);
      setLoadingProgress(100);setLoadingMsg("Done!");
      setPicks(data.picks);
      setLastUpdated(data.last_updated);
      setLegsScored(data.legs_scored||0);
      setPropsScored(data.props_scored||0);
      setGamesAnalyzed(data.games_analyzed||0);
      apiFetch("/api/slate").then(d=>setGames(d.games||[])).catch(()=>{});
      apiFetch("/api/props").then(d=>setProps(d.props||[])).catch(()=>{});
      apiFetch("/api/injuries").then(d=>setInjuries(d.injuries||{})).catch(()=>{});
    }catch(e){
      clearInterval(ticker);
      setError(e.name==="AbortError"
        ?"Request timed out — server may be starting up. Try again in 30 seconds."
        :`Could not reach analysis server: ${e.message}`);
    }finally{setLoading(false);}
  },[]);

  useEffect(()=>{
    loadAll();
    const i=setInterval(loadAll,30*60*1000);
    return()=>clearInterval(i);
  },[loadAll]);

  const tabs=[
    {id:"picks",icon:"⚡",label:"Picks"},
    {id:"props",icon:"👤",label:"Props"},
    {id:"slate",icon:"🏀",label:"Slate"},
  ];

  return(
    <div style={{width:"100%",height:"100%",background:ios.bg,display:"flex",
      flexDirection:"column",overflow:"hidden",position:"relative"}}>
      <div style={{paddingTop:"env(safe-area-inset-top,44px)",flexShrink:0}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
        {tab==="picks"&&<PicksTab picks={picks} loading={loading} loadingMsg={loadingMsg}
          loadingProgress={loadingProgress} error={error} onRetry={loadAll}
          lastUpdated={lastUpdated} legsScored={legsScored} propsScored={propsScored}
          gamesAnalyzed={gamesAnalyzed}/>}
        {tab==="props"&&<PropsTab props={props} loading={loading} error={error}
          onRetry={loadAll} gamesAnalyzed={gamesAnalyzed}/>}
        {tab==="slate"&&<SlateTab games={games} loading={loading} error={error} onRetry={loadAll}/>}
      </div>
      <div style={{background:"rgba(28,28,30,0.94)",backdropFilter:"blur(20px)",
        WebkitBackdropFilter:"blur(20px)",borderTop:`0.5px solid ${ios.sep}`,
        display:"flex",paddingTop:8,flexShrink:0,
        paddingBottom:"env(safe-area-inset-bottom,20px)"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
              gap:3,background:"none",border:"none",cursor:"pointer",padding:"6px 0"}}>
            <span style={{fontSize:22,lineHeight:1,
              filter:tab===t.id?"none":"grayscale(1) opacity(0.4)"}}>{t.icon}</span>
            <span style={{fontFamily:ios.font,fontSize:10,fontWeight:500,
              color:tab===t.id?ios.blue:ios.label3}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
