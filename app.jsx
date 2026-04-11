// NBAEdge — PWA version (no build step, runs via Babel in browser)
// Paste this as app.jsx in your GitHub repo

const { useState, useEffect } = React;

// ─── DESIGN TOKENS ────────────────────────────────────────────
const ios = {
  bg:       "#000000",
  bg1:      "#1C1C1E",
  bg2:      "#2C2C2E",
  bg3:      "#3A3A3C",
  label:    "#FFFFFF",
  label2:   "rgba(235,235,245,0.8)",
  label3:   "rgba(235,235,245,0.6)",
  label4:   "rgba(235,235,245,0.3)",
  sep:      "#38383A",
  amber:    "#FF9F0A",
  green:    "#30D158",
  red:      "#FF453A",
  blue:     "#0A84FF",
  purple:   "#BF5AF2",
  font:     "-apple-system, 'SF Pro Display', system-ui, sans-serif",
  mono:     "'SF Mono', 'Fira Mono', monospace",
};

// ─── DATA ─────────────────────────────────────────────────────
const GAMES = [
  { id:1, away:"WAS", home:"BOS", time:"7:30 PM", spread:"BOS -9",   total:222.5 },
  { id:2, away:"SAC", home:"GSW", time:"10:00 PM", spread:"GSW -2.5", total:228.0 },
  { id:3, away:"CLE", home:"DEN", time:"9:00 PM",  spread:"DEN -5",   total:224.5 },
  { id:4, away:"ORL", home:"MIA", time:"7:00 PM",  spread:"MIA -3",   total:214.5 },
  { id:5, away:"MEM", home:"MIL", time:"8:00 PM",  spread:"MIL -6.5", total:228.5 },
  { id:6, away:"OKC", home:"LAC", time:"10:30 PM", spread:"OKC -4",   total:231.0 },
  { id:7, away:"PHX", home:"POR", time:"10:00 PM", spread:"PHX -8.5", total:226.5 },
];

const PICKS = {
  safe: {
    key:"safe", label:"Safe Multi", emoji:"🔵",
    accentColor: ios.green, odds:"2.15×", oddsNum:2.15,
    hitProb:24.1, legs:2, subtitle:"Lowest risk · Highest confidence",
    legCards:[
      { game:"WAS @ BOS", selection:"Boston Celtics -4.5", odds:"1.91×", confidence:78, prob:60, tags:[],
        reasoning:"Celtics are 9-1 at home in L10, averaging +12.3 net rating. Wizards rank 28th in defensive rating. Rest edge: BOS had 2 full rest days, WAS played last night. Line moved 0.5pts toward Boston — smart money alignment.",
        factors:[{name:"Statistical Edge",val:22,max:30},{name:"Historical Rate",val:14,max:20},{name:"Matchup Quality",val:12,max:15},{name:"Market Signal",val:10,max:15},{name:"Injury Status",val:9,max:10},{name:"Stability",val:8,max:10}] },
      { game:"CLE @ DEN", selection:"Under 224.5", odds:"1.91×", confidence:74, prob:60, tags:["Pace-Dependent"],
        reasoning:"Both teams rank bottom-10 in pace. Nuggets avg 109.2 pts, Cavs allow 108.8. Model projects 218.4 total. H2H last 5 games averaged 217.6 combined. Dual slow-tempo styles create a structural under.",
        factors:[{name:"Statistical Edge",val:19,max:30},{name:"Historical Rate",val:12,max:20},{name:"Matchup Quality",val:11,max:15},{name:"Market Signal",val:9,max:15},{name:"Injury Status",val:10,max:10},{name:"Stability",val:7,max:10}] },
    ],
    risks:["If Jokic rests unexpectedly, total model shifts ~3 pts","Heavy foul game in BOS/WAS could inflate scoring"],
    alts:[{desc:"Miami Heat ML vs Orlando",conf:71},{desc:"Jayson Tatum Over 27.5 Pts",conf:68}],
  },
  mid: {
    key:"mid", label:"Mid-Risk Multi", emoji:"🟡",
    accentColor: ios.amber, odds:"16.40×", oddsNum:16.40,
    hitProb:3.8, legs:5, subtitle:"Balanced risk · Strong research",
    legCards:[
      { game:"WAS @ BOS", selection:"Boston Celtics -4.5", odds:"1.91×", confidence:78, prob:60, tags:[], reasoning:"See Safe multi — strongest leg on today's slate.", factors:[] },
      { game:"CLE @ DEN", selection:"Under 224.5", odds:"1.91×", confidence:74, prob:60, tags:["Pace-Dependent"], reasoning:"See Safe multi reasoning.", factors:[] },
      { game:"SAC @ GSW", selection:"GSW Moneyline", odds:"2.10×", confidence:63, prob:54, tags:[], reasoning:"Warriors at home (7-3 in L10). Kings on 2nd night of b2b after cross-country flight. Travel fatigue model applies -1.8pt scoring discount to SAC.", factors:[] },
      { game:"OKC @ LAC", selection:"A. Davis Over 14.5 Reb", odds:"1.95×", confidence:67, prob:57, tags:["Blowout Risk"], reasoning:"Davis averaging 16.2 reb in L10. Matched vs team 29th in defensive rebounding. Requires competitive game.", factors:[] },
      { game:"MEM @ MIL", selection:"SGA Over 31.5 Pts", odds:"1.87×", confidence:61, prob:54, tags:["High Variance"], reasoning:"SGA averaging 34.2 in L10 vs weak perimeter defenses. High variance — L10 range: 21 to 48 pts.", factors:[] },
    ],
    risks:["Davis prop requires competitive, non-blowout game","SGA spans 27-pt range in L10 — inherently volatile"],
    alts:[{desc:"Phoenix Suns Total Over 114.5",conf:60}],
  },
  lotto: {
    key:"lotto", label:"Lotto Multi", emoji:"🔴",
    accentColor: ios.red, odds:"94.30×", oddsNum:94.30,
    hitProb:0.7, legs:7, subtitle:"High payout · Calculated longshot",
    legCards:[
      { game:"WAS @ BOS", selection:"Boston Celtics -4.5", odds:"1.91×", confidence:78, prob:60, tags:[], reasoning:"See Safe multi.", factors:[] },
      { game:"CLE @ DEN", selection:"Under 224.5", odds:"1.91×", confidence:74, prob:60, tags:["Pace-Dependent"], reasoning:"See Safe multi.", factors:[] },
      { game:"SAC @ GSW", selection:"GSW Moneyline", odds:"2.10×", confidence:63, prob:54, tags:[], reasoning:"See Mid multi.", factors:[] },
      { game:"OKC @ LAC", selection:"A. Davis Over 14.5 Reb", odds:"1.95×", confidence:67, prob:57, tags:["Blowout Risk"], reasoning:"See Mid multi.", factors:[] },
      { game:"MEM @ MIL", selection:"SGA Over 31.5 Pts", odds:"1.87×", confidence:61, prob:54, tags:["High Variance"], reasoning:"See Mid multi.", factors:[] },
      { game:"WAS @ BOS", selection:"J. Brown Over 23.5 Pts", odds:"1.91×", confidence:58, prob:51, tags:[], reasoning:"Brown averaging 25.1 in L10 vs teams with below-average SG defense rating.", factors:[] },
      { game:"MEM @ MIL", selection:"MIL vs MEM Over 228.5", odds:"1.91×", confidence:57, prob:51, tags:["Pace-Dependent"], reasoning:"Both top-8 pace teams. Grizz rank 3rd in off rating, Bucks 5th.", factors:[] },
    ],
    risks:["All 7 legs must hit simultaneously","Two pace-dependent totals vulnerable to foul-heavy games","Honest: hits <1% of the time mathematically"],
    alts:[],
  },
};

const HISTORY = [
  {month:"Nov",roi:-8},{month:"Dec",roi:12},{month:"Jan",roi:24},
  {month:"Feb",roi:-3},{month:"Mar",roi:41},{month:"Apr",roi:8},
];

const TAG_STYLE = {
  "Blowout Risk":   {bg:"rgba(255,159,10,0.15)",  color:ios.amber},
  "Pace-Dependent": {bg:"rgba(10,132,255,0.15)",   color:ios.blue},
  "High Variance":  {bg:"rgba(191,90,242,0.15)",   color:ios.purple},
  "Injury Risk":    {bg:"rgba(255,69,58,0.15)",    color:ios.red},
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────
function PillTag({label}) {
  const s = TAG_STYLE[label] || {bg:ios.bg3, color:ios.label3};
  return (
    <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,
      background:s.bg,color:s.color,fontFamily:ios.font}}>
      {label}
    </span>
  );
}

function confColor(c) { return c>=70 ? ios.green : c>=60 ? ios.amber : ios.blue; }

function ConfRing({value, size=52}) {
  const r=(size-6)/2, circ=2*Math.PI*r, fill=(value/100)*circ, col=confColor(value);
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ios.bg3} strokeWidth={4}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col}
          strokeWidth={4} strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center"}}>
        <span style={{fontFamily:ios.font,fontWeight:700,fontSize:14,color:col,lineHeight:1}}>{value}</span>
        <span style={{fontFamily:ios.font,fontSize:8,color:ios.label3,marginTop:1}}>CONF</span>
      </div>
    </div>
  );
}

// ─── LEG SHEET (bottom sheet modal) ───────────────────────────
function LegSheet({leg, onClose}) {
  const col = confColor(leg.confidence);
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:ios.bg1,
      display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <div style={{padding:"12px 20px 0",flexShrink:0}}>
        <div style={{width:36,height:4,background:ios.bg3,borderRadius:99,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <span style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>{leg.game}</span>
          <button onClick={onClose} style={{background:ios.bg3,border:"none",borderRadius:99,
            width:28,height:28,color:ios.label2,fontSize:16,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{fontFamily:ios.font,fontWeight:700,fontSize:20,color:ios.label,marginBottom:8}}>
          {leg.selection}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          <span style={{background:ios.bg3,borderRadius:99,padding:"4px 12px",
            fontFamily:ios.font,fontSize:13,color:ios.amber,fontWeight:600}}>{leg.odds}</span>
          {leg.tags.map(t=><PillTag key={t} label={t}/>)}
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
            <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>estimated</div>
          </div>
        </div>

        {leg.reasoning && (
          <div style={{background:ios.bg2,borderRadius:16,padding:16,marginBottom:14}}>
            <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
              marginBottom:8,letterSpacing:0.3}}>ANALYSIS</div>
            <div style={{fontFamily:ios.font,fontSize:15,color:ios.label2,lineHeight:1.55}}>
              {leg.reasoning}
            </div>
          </div>
        )}

        {leg.factors.length > 0 && (
          <div style={{background:ios.bg2,borderRadius:16,padding:16,marginBottom:14}}>
            <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
              marginBottom:12,letterSpacing:0.3}}>SCORING BREAKDOWN</div>
            {leg.factors.map((f,i)=>{
              const pct=(f.val/f.max)*100;
              const fc=pct>70?ios.green:pct>50?ios.amber:ios.label3;
              return (
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
          ⚠️ Confidence scores are analytical estimates, not guarantees.
        </div>
      </div>
    </div>
  );
}

// ─── PICK DETAIL ──────────────────────────────────────────────
function PickScreen({pick, onBack}) {
  const [selectedLeg, setSelectedLeg] = useState(null);
  return (
    <>
      <div style={{flex:1,overflowY:"auto",background:ios.bg,paddingBottom:100}}>
        <div style={{position:"sticky",top:0,zIndex:10,
          background:"rgba(0,0,0,0.8)",backdropFilter:"blur(20px)",
          WebkitBackdropFilter:"blur(20px)",
          padding:"12px 20px 10px",borderBottom:`0.5px solid ${ios.sep}`}}>
          <button onClick={onBack} style={{background:"none",border:"none",
            color:ios.blue,fontFamily:ios.font,fontSize:17,cursor:"pointer",padding:0}}>
            ‹ Back
          </button>
        </div>

        <div style={{padding:"20px 20px 0"}}>
          <div style={{background:`linear-gradient(145deg, ${pick.accentColor}20, ${ios.bg1})`,
            border:`1px solid ${pick.accentColor}33`,borderRadius:20,padding:20,marginBottom:20}}>
            <div style={{fontFamily:ios.font,fontSize:13,color:pick.accentColor,
              fontWeight:600,marginBottom:4}}>{pick.emoji} {pick.label.toUpperCase()}</div>
            <div style={{fontFamily:ios.font,fontWeight:800,fontSize:44,color:ios.label,lineHeight:1}}>
              {pick.odds}
            </div>
            <div style={{fontFamily:ios.font,fontSize:14,color:ios.label3,marginTop:4,marginBottom:16}}>
              combined odds · {pick.legs} legs
            </div>
            <div style={{display:"flex",gap:12}}>
              <div style={{flex:1,background:ios.bg1,borderRadius:12,padding:"10px 14px"}}>
                <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginBottom:2}}>HIT PROBABILITY</div>
                <div style={{fontFamily:ios.font,fontWeight:700,fontSize:22,color:pick.accentColor}}>
                  {pick.hitProb}%
                </div>
              </div>
              <div style={{flex:1,background:ios.bg1,borderRadius:12,padding:"10px 14px"}}>
                <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginBottom:2}}>LEGS</div>
                <div style={{fontFamily:ios.font,fontWeight:700,fontSize:22,color:ios.label}}>{pick.legs}</div>
              </div>
            </div>
          </div>

          <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
            marginBottom:10,letterSpacing:0.3}}>BET LEGS — TAP FOR ANALYSIS</div>

          {pick.legCards.map((leg,i)=>{
            const col=confColor(leg.confidence);
            return (
              <div key={i} onClick={()=>setSelectedLeg(leg)}
                style={{background:ios.bg1,borderRadius:16,padding:"14px 16px",
                  marginBottom:10,display:"flex",gap:12,alignItems:"center",
                  cursor:"pointer",border:`0.5px solid ${ios.sep}`}}>
                <ConfRing value={leg.confidence} size={48}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:ios.font,fontSize:12,color:ios.label3,marginBottom:2}}>{leg.game}</div>
                  <div style={{fontFamily:ios.font,fontWeight:600,fontSize:15,color:ios.label,
                    marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {leg.selection}
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    <span style={{fontFamily:ios.font,fontSize:12,color:ios.amber,fontWeight:600}}>{leg.odds}</span>
                    {leg.tags.map(t=><PillTag key={t} label={t}/>)}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:ios.font,fontWeight:700,fontSize:18,color:col}}>{leg.prob}%</div>
                  <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>prob</div>
                  <div style={{fontFamily:ios.font,fontSize:16,color:ios.label3,marginTop:2}}>›</div>
                </div>
              </div>
            );
          })}

          <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
            margin:"20px 0 10px",letterSpacing:0.3}}>KEY RISKS</div>
          <div style={{background:ios.bg1,borderRadius:16,overflow:"hidden",marginBottom:20}}>
            {pick.risks.map((r,i)=>(
              <div key={i} style={{padding:"12px 16px",
                borderBottom:i<pick.risks.length-1?`0.5px solid ${ios.sep}`:"none",
                display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:15}}>⚠️</span>
                <span style={{fontFamily:ios.font,fontSize:14,color:ios.label2,lineHeight:1.4}}>{r}</span>
              </div>
            ))}
          </div>

          {pick.alts.length>0 && (
            <>
              <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,
                marginBottom:10,letterSpacing:0.3}}>NEAR-MISS ALTERNATES</div>
              <div style={{background:ios.bg1,borderRadius:16,overflow:"hidden",marginBottom:20}}>
                {pick.alts.map((a,i)=>(
                  <div key={i} style={{padding:"12px 16px",
                    borderBottom:i<pick.alts.length-1?`0.5px solid ${ios.sep}`:"none",
                    display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontFamily:ios.font,fontSize:14,color:ios.label2}}>{a.desc}</span>
                    <span style={{fontFamily:ios.font,fontSize:14,color:confColor(a.conf),fontWeight:600}}>{a.conf}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {selectedLeg && <LegSheet leg={selectedLeg} onClose={()=>setSelectedLeg(null)}/>}
    </>
  );
}

// ─── PICKS TAB ────────────────────────────────────────────────
function PicksTab() {
  const [detail, setDetail] = useState(null);
  if (detail) return <PickScreen pick={PICKS[detail]} onBack={()=>setDetail(null)}/>;
  const today = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  return (
    <div style={{flex:1,overflowY:"auto",paddingBottom:100}}>
      <div style={{padding:"16px 20px 8px"}}>
        <div style={{fontFamily:ios.font,fontWeight:800,fontSize:34,color:ios.label,letterSpacing:-0.5}}>
          Today's Picks
        </div>
        <div style={{fontFamily:ios.font,fontSize:15,color:ios.label3,marginTop:2}}>{today}</div>
      </div>
      <div style={{margin:"8px 20px 16px",background:ios.bg1,borderRadius:14,
        padding:"12px 16px",display:"flex",gap:10,border:`0.5px solid ${ios.sep}`}}>
        <span style={{fontSize:18}}>📊</span>
        <div style={{fontFamily:ios.font,fontSize:13,color:ios.label3,lineHeight:1.5}}>
          <strong style={{color:ios.label2}}>7 games analyzed</strong> · L5/L10/L15 rolling stats ·
          Pace-adjusted projections · Injury + rest context
        </div>
      </div>
      <div style={{padding:"0 20px"}}>
        {Object.values(PICKS).map(pick=>(
          <div key={pick.key} onClick={()=>setDetail(pick.key)}
            style={{background:ios.bg1,borderRadius:20,marginBottom:14,
              overflow:"hidden",border:`0.5px solid ${ios.sep}`,cursor:"pointer"}}>
            <div style={{background:`linear-gradient(135deg,${pick.accentColor}18,transparent)`,
              borderBottom:`0.5px solid ${pick.accentColor}33`,
              padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontFamily:ios.font,fontWeight:700,fontSize:18,color:ios.label,marginBottom:3}}>
                  {pick.emoji} {pick.label}
                </div>
                <div style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>{pick.subtitle}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:ios.font,fontWeight:800,fontSize:26,color:pick.accentColor,lineHeight:1}}>
                  {pick.odds}
                </div>
                <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginTop:2}}>combined odds</div>
              </div>
            </div>
            <div style={{display:"flex",padding:"12px 18px"}}>
              <div style={{flex:1,textAlign:"center",borderRight:`0.5px solid ${ios.sep}`}}>
                <div style={{fontFamily:ios.font,fontWeight:700,fontSize:20,color:pick.accentColor}}>
                  {pick.hitProb}%
                </div>
                <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>hit probability</div>
              </div>
              <div style={{flex:1,textAlign:"center",borderRight:`0.5px solid ${ios.sep}`}}>
                <div style={{fontFamily:ios.font,fontWeight:700,fontSize:20,color:ios.label}}>{pick.legs}</div>
                <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>legs</div>
              </div>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontFamily:ios.font,fontWeight:700,fontSize:20,color:ios.label}}>
                  {pick.legCards.filter(l=>l.confidence>=70).length}
                </div>
                <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>high-conf</div>
              </div>
            </div>
            <div style={{padding:"0 18px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:6}}>
                {pick.legCards.slice(0,5).map((l,i)=>(
                  <div key={i} style={{width:8,height:8,borderRadius:"50%",background:confColor(l.confidence),opacity:0.8}}/>
                ))}
              </div>
              <span style={{fontFamily:ios.font,fontSize:17,color:ios.label3}}>›</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:"0 20px 8px",background:ios.bg1,borderRadius:12,margin:"0 20px",
        padding:"10px 14px",fontFamily:ios.font,fontSize:12,color:ios.label3,lineHeight:1.5}}>
        ⚠️ Analytical estimates only. Not guaranteed outcomes. Bet responsibly.
      </div>
    </div>
  );
}

// ─── SLATE TAB ────────────────────────────────────────────────
function SlateTab() {
  return (
    <div style={{flex:1,overflowY:"auto",paddingBottom:100}}>
      <div style={{padding:"16px 20px 8px"}}>
        <div style={{fontFamily:ios.font,fontWeight:800,fontSize:34,color:ios.label,letterSpacing:-0.5}}>Tonight's Slate</div>
        <div style={{fontFamily:ios.font,fontSize:15,color:ios.label3,marginTop:2}}>{GAMES.length} NBA games</div>
      </div>
      <div style={{padding:"8px 20px"}}>
        {GAMES.map((g,i)=>(
          <div key={i} style={{background:ios.bg1,borderRadius:16,marginBottom:10,
            padding:"14px 16px",display:"flex",alignItems:"center",
            justifyContent:"space-between",border:`0.5px solid ${ios.sep}`}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>{g.away}</span>
                <span style={{fontFamily:ios.font,fontSize:11,color:ios.label4}}>@</span>
                <span style={{fontFamily:ios.font,fontWeight:700,fontSize:16,color:ios.label}}>{g.home}</span>
              </div>
              <span style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>{g.time} ET</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <div style={{background:ios.bg2,borderRadius:8,padding:"6px 10px",textAlign:"center"}}>
                <div style={{fontFamily:ios.mono,fontSize:12,color:ios.blue,fontWeight:600}}>{g.spread}</div>
                <div style={{fontFamily:ios.font,fontSize:10,color:ios.label3}}>spread</div>
              </div>
              <div style={{background:ios.bg2,borderRadius:8,padding:"6px 10px",textAlign:"center"}}>
                <div style={{fontFamily:ios.mono,fontSize:12,color:ios.purple,fontWeight:600}}>{g.total}</div>
                <div style={{fontFamily:ios.font,fontSize:10,color:ios.label3}}>total</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HISTORY TAB ──────────────────────────────────────────────
function HistoryTab() {
  const maxRoi = Math.max(...HISTORY.map(d=>Math.abs(d.roi)));
  const stats = [
    {label:"Safe Hit Rate",  val:"27.3%", sub:"1 in 3.7",  color:ios.green},
    {label:"Mid Hit Rate",   val:"6.1%",  sub:"1 in 16",   color:ios.amber},
    {label:"Lotto Hit Rate", val:"0.8%",  sub:"1 in 125",  color:ios.red},
    {label:"Overall ROI",    val:"+12.4%",sub:"per unit",   color:ios.blue},
  ];
  const markets = [
    {type:"Moneyline",rate:61.0,total:41},
    {type:"Spread",   rate:59.8,total:87},
    {type:"Total",    rate:59.4,total:64},
    {type:"Pts Prop", rate:55.1,total:118},
    {type:"Reb Prop", rate:51.8,total:56},
    {type:"Ast Prop", rate:50.0,total:44},
    {type:"3PM Prop", rate:47.4,total:38},
  ];
  return (
    <div style={{flex:1,overflowY:"auto",paddingBottom:100}}>
      <div style={{padding:"16px 20px 8px"}}>
        <div style={{fontFamily:ios.font,fontWeight:800,fontSize:34,color:ios.label,letterSpacing:-0.5}}>Performance</div>
        <div style={{fontFamily:ios.font,fontSize:15,color:ios.label3,marginTop:2}}>2024–25 Season</div>
      </div>
      <div style={{padding:"8px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {stats.map((s,i)=>(
            <div key={i} style={{background:ios.bg1,borderRadius:16,padding:"14px 16px",
              border:`0.5px solid ${ios.sep}`,borderTop:`2px solid ${s.color}`}}>
              <div style={{fontFamily:ios.font,fontWeight:800,fontSize:26,color:s.color,lineHeight:1}}>{s.val}</div>
              <div style={{fontFamily:ios.font,fontSize:12,color:ios.label3,marginTop:4}}>{s.label}</div>
              <div style={{fontFamily:ios.font,fontSize:11,color:ios.label4,marginTop:2}}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{background:ios.bg1,borderRadius:16,padding:"16px",marginBottom:16,border:`0.5px solid ${ios.sep}`}}>
          <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,marginBottom:14,letterSpacing:0.3}}>
            MONTHLY ROI
          </div>
          <div style={{display:"flex",gap:6,alignItems:"flex-end",height:80}}>
            {HISTORY.map((d,i)=>{
              const h=Math.abs(d.roi)/maxRoi*70;
              const isPos=d.roi>=0;
              return (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <span style={{fontFamily:ios.mono,fontSize:10,color:isPos?ios.green:ios.red}}>
                    {d.roi>0?"+":""}{d.roi}
                  </span>
                  <div style={{width:"100%",height:Math.max(h,4),borderRadius:"4px 4px 0 0",
                    background:isPos?ios.green:ios.red,opacity:0.85}}/>
                  <span style={{fontFamily:ios.font,fontSize:10,color:ios.label3}}>{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{background:ios.bg1,borderRadius:16,padding:"16px",border:`0.5px solid ${ios.sep}`}}>
          <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,marginBottom:14,letterSpacing:0.3}}>
            HIT RATE BY MARKET
          </div>
          {markets.map((row,i)=>{
            const col=row.rate>=58?ios.green:row.rate>=53?ios.amber:ios.red;
            return (
              <div key={i} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontFamily:ios.font,fontSize:14,color:ios.label2}}>{row.type}</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontFamily:ios.font,fontSize:12,color:ios.label3}}>{row.total} legs</span>
                    <span style={{fontFamily:ios.mono,fontWeight:700,fontSize:14,color:col,minWidth:42,textAlign:"right"}}>
                      {row.rate}%
                    </span>
                  </div>
                </div>
                <div style={{height:4,background:ios.bg3,borderRadius:99,overflow:"hidden"}}>
                  <div style={{width:`${(row.rate/70)*100}%`,height:"100%",background:col,borderRadius:99}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState("picks");
  const tabs = [
    {id:"picks",   icon:"⚡", label:"Picks"},
    {id:"slate",   icon:"🏀", label:"Slate"},
    {id:"history", icon:"📈", label:"History"},
  ];

  // Safe area for iPhone notch / home indicator
  const safeTop = "env(safe-area-inset-top, 44px)";
  const safeBottom = "env(safe-area-inset-bottom, 34px)";

  return (
    <div style={{width:"100%",height:"100%",background:ios.bg,
      display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>

      {/* Safe area top spacer */}
      <div style={{paddingTop:safeTop,flexShrink:0}}/>

      {/* Screen content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
        {tab==="picks"   && <PicksTab/>}
        {tab==="slate"   && <SlateTab/>}
        {tab==="history" && <HistoryTab/>}
      </div>

      {/* Tab bar */}
      <div style={{
        background:"rgba(28,28,30,0.92)",
        backdropFilter:"blur(20px)",
        WebkitBackdropFilter:"blur(20px)",
        borderTop:`0.5px solid ${ios.sep}`,
        display:"flex",
        paddingTop:8,
        flexShrink:0,
      }}>
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
        {/* Home indicator spacer */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,
          paddingBottom:safeBottom}}/>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
