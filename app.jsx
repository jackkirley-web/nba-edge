// NBAEdge — Live Version
// Real odds: The Odds API | Real games: BallDontLie | Injuries: ESPN
const { useState, useEffect, useCallback } = React;

const ODDS_API_KEY = "61040feb939ef2fe29c0e8c8fa8eb152";
const BDL_API_KEY  = "f380846e-c775-4ea9-bf81-93a132ad29f8";
const ODDS_BASE = "https://api.the-odds-api.com/v4";
const BDL_BASE  = "https://api.balldontlie.io/v1";
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

const ios = {
  bg:"#000000",bg1:"#1C1C1E",bg2:"#2C2C2E",bg3:"#3A3A3C",
  label:"#FFFFFF",label2:"rgba(235,235,245,0.8)",label3:"rgba(235,235,245,0.6)",label4:"rgba(235,235,245,0.3)",
  sep:"#38383A",amber:"#FF9F0A",green:"#30D158",red:"#FF453A",blue:"#0A84FF",purple:"#BF5AF2",teal:"#5AC8FA",
  font:"-apple-system,'SF Pro Display',system-ui,sans-serif",mono:"'SF Mono','Fira Mono',monospace",
};

const TEAM_MAP = {
  "Atlanta Hawks":"ATL","Boston Celtics":"BOS","Brooklyn Nets":"BKN","Charlotte Hornets":"CHA",
  "Chicago Bulls":"CHI","Cleveland Cavaliers":"CLE","Dallas Mavericks":"DAL","Denver Nuggets":"DEN",
  "Detroit Pistons":"DET","Golden State Warriors":"GSW","Houston Rockets":"HOU","Indiana Pacers":"IND",
  "Los Angeles Clippers":"LAC","Los Angeles Lakers":"LAL","Memphis Grizzlies":"MEM","Miami Heat":"MIA",
  "Milwaukee Bucks":"MIL","Minnesota Timberwolves":"MIN","New Orleans Pelicans":"NOP","New York Knicks":"NYK",
  "Oklahoma City Thunder":"OKC","Orlando Magic":"ORL","Philadelphia 76ers":"PHI","Phoenix Suns":"PHX",
  "Portland Trail Blazers":"POR","Sacramento Kings":"SAC","San Antonio Spurs":"SAS","Toronto Raptors":"TOR",
  "Utah Jazz":"UTA","Washington Wizards":"WAS",
};
const abbrev = n => TEAM_MAP[n] || n?.split(" ").pop()?.slice(0,3).toUpperCase() || "???";

// ─── SCORING ENGINE ───────────────────────────────────────────
function confToProb(s){return s>=80?.67:s>=70?.60:s>=60?.54:s>=55?.51:.47;}

function scoreGame(game, injuries){
  const hI=injuries[game.homeTeam]||[], aI=injuries[game.awayTeam]||[];
  const hOut=hI.filter(p=>p.status==="Out").length, aOut=aI.filter(p=>p.status==="Out").length;
  const hQues=hI.filter(p=>p.status==="Questionable").length, aQues=aI.filter(p=>p.status==="Questionable").length;

  let sConf=62; // spread
  if(game.homeSpread&&parseFloat(game.homeSpread)<0)sConf+=6;
  sConf-=hOut*5; sConf+=aOut*4; sConf-=hQues*2; sConf-=game.homeB2B?5:0; sConf=Math.min(85,Math.max(45,sConf));

  let tConf=60; // total
  if(hOut+aOut>=2)tConf+=8; if(hQues+aQues>=3)tConf+=4; if(game.homeB2B||game.awayB2B)tConf-=3;
  tConf=Math.min(82,Math.max(45,tConf));

  let mConf=58; // moneyline
  if(game.homeOdds&&game.homeOdds<1.80)mConf+=8; mConf-=hOut*6; mConf+=aOut*5;
  mConf=Math.min(80,Math.max(40,mConf));

  const totSel=(hOut+aOut>=1||hQues+aQues>=2)?"Under":"Over";
  const totLine=game.total||220;
  const spdSel=aOut>hOut+1?`${abbrev(game.homeTeam)} ${game.homeSpread||"-3.5"}`:
               aOut<hOut?`${abbrev(game.awayTeam)} +${Math.abs(parseFloat(game.homeSpread||"-3.5"))}`:
               `${abbrev(game.homeTeam)} ${game.homeSpread||"-3.5"}`;

  const mkFactors=(conf,type)=>[
    {name:"Home Advantage",val:game.isNeutral?5:12,max:15},
    {name:"Injury Adjustment",val:Math.max(0,10-hOut*3+aOut*2),max:10},
    {name:"Rest Advantage",val:game.homeB2B?5:game.awayB2B?12:8,max:12},
    {name:"Market Signal",val:Math.round(conf*0.15),max:15},
    {name:"Lineup Certainty",val:hOut===0&&aOut===0?10:Math.max(3,10-(hOut+aOut)*2),max:10},
  ];

  const mkTags=(extra=[])=>[
    ...(hOut>0||aOut>0?["Injury Impact"]:[]),
    ...(game.homeB2B||game.awayB2B?["B2B"]:[]),
    ...extra,
  ];

  const mkSpreadReason=()=>{
    const p=[];
    p.push(`${abbrev(game.homeTeam)} hosting ${abbrev(game.awayTeam)}`+(game.homeSpread?` as ${game.homeSpread} favourites.`:" at home."));
    if(hOut>0)p.push(`⚠️ ${abbrev(game.homeTeam)} missing: ${hI.filter(x=>x.status==="Out").map(x=>x.name).join(", ")}.`);
    if(aOut>0)p.push(`✅ ${abbrev(game.awayTeam)} missing: ${aI.filter(x=>x.status==="Out").map(x=>x.name).join(", ")} — helps home cover.`);
    if(hQues>0)p.push(`❓ Questionable for home: ${hI.filter(x=>x.status==="Questionable").map(x=>x.name).join(", ")} — monitor pre-game.`);
    if(game.awayB2B)p.push("✅ Away on back-to-back — travel fatigue favours home cover.");
    if(game.homeB2B)p.push("⚠️ Home on back-to-back — fatigue factor applies.");
    if(p.length===1)p.push("No major injury or rest concerns. Standard spread analysis applies.");
    return p.join(" ");
  };

  const mkTotalReason=()=>{
    const p=[];
    p.push(`Total set at ${totLine}. Model leans ${totSel}.`);
    const allOut=[...hI,...aI].filter(x=>x.status==="Out");
    const allQ=[...hI,...aI].filter(x=>x.status==="Questionable");
    if(allOut.length>=2)p.push(`${allOut.length} key players ruled Out — significant scoring suppression expected.`);
    if(allQ.length>=2)p.push(`${allQ.length} players Questionable — lineup uncertainty increases Under value.`);
    if(game.homeB2B||game.awayB2B)p.push("Back-to-back fatigue typically reduces pace by 3-5 pts.");
    if(allOut.length===0&&allQ.length===0)p.push("Full lineups expected — pace and style drive this total.");
    return p.join(" ");
  };

  const mkMLReason=()=>{
    const p=[];
    p.push(`${abbrev(game.homeTeam)} at home`+(game.homeOdds?` at ${game.homeOdds.toFixed(2)}×.`:" "));
    if(hOut>0)p.push(`⚠️ Home missing: ${hI.filter(x=>x.status==="Out").map(x=>x.name).join(", ")}.`);
    if(aOut>0)p.push(`✅ Away missing: ${aI.filter(x=>x.status==="Out").map(x=>x.name).join(", ")} — boosts home ML.`);
    if(game.awayB2B)p.push("Away on b2b — fatigue shifts win prob 4-6% to home.");
    if(hOut===0&&aOut===0)p.push("Clean injury report. Home court is primary edge.");
    return p.join(" ");
  };

  return [
    {game:`${abbrev(game.awayTeam)} @ ${abbrev(game.homeTeam)}`,gameId:game.id,
     selection:spdSel,type:"Spread",odds:game.spreadOdds||1.91,
     confidence:sConf,prob:Math.round(confToProb(sConf)*100),
     tags:mkTags(),reasoning:mkSpreadReason(),factors:mkFactors(sConf,"spread")},
    {game:`${abbrev(game.awayTeam)} @ ${abbrev(game.homeTeam)}`,gameId:game.id,
     selection:`${totSel} ${totLine}`,type:"Total",odds:game.totalOdds||1.91,
     confidence:tConf,prob:Math.round(confToProb(tConf)*100),
     tags:mkTags(),reasoning:mkTotalReason(),factors:mkFactors(tConf,"total")},
    {game:`${abbrev(game.awayTeam)} @ ${abbrev(game.homeTeam)}`,gameId:game.id,
     selection:`${abbrev(game.homeTeam)} ML`,type:"Moneyline",odds:game.homeOdds||1.85,
     confidence:mConf,prob:Math.round(confToProb(mConf)*100),
     tags:hOut>0?["Injury Risk"]:[],reasoning:mkMLReason(),factors:mkFactors(mConf,"ml")},
  ];
}

function buildMultis(allLegs){
  const sorted=[...allLegs].sort((a,b)=>b.confidence-a.confidence);
  const seen=new Set();
  const deduped=sorted.filter(l=>l.confidence>=50&&!seen.has(`${l.gameId}-${l.type}`)&&seen.add(`${l.gameId}-${l.type}`));
  const top=deduped.slice(0,12);
  const safeLegs=deduped.filter(l=>l.confidence>=65).slice(0,2);
  const midLegs=deduped.filter(l=>l.confidence>=57).slice(0,5);
  const lottoLegs=top.slice(0,7);
  const calcO=legs=>legs.reduce((a,l)=>a*l.odds,1);
  const calcP=legs=>legs.reduce((a,l)=>a*(l.prob/100),1)*0.85;
  const mkRisks=legs=>{
    const r=[];
    if(legs.some(l=>l.tags.includes("Injury Impact")||l.tags.includes("Injury Risk")))
      r.push("One or more legs affected by injury reports — verify final lineups at tip-off");
    if(legs.some(l=>l.tags.includes("B2B")))r.push("Back-to-back fatigue in play — rest advantage priced in");
    if(legs.length>=5)r.push(`${legs.length} legs must all hit simultaneously — variance is high by design`);
    r.push("Refresh the app 1 hour before tip-off for the latest injury updates");
    return r;
  };
  const mkAlts=(usedLegs)=>deduped.filter(l=>!usedLegs.includes(l)).slice(0,3)
    .map(l=>({desc:`${l.selection} (${l.game})`,conf:l.confidence}));
  return {
    safe:{key:"safe",label:"Safe Multi",emoji:"🔵",accentColor:ios.green,subtitle:"Lowest risk · Highest confidence",
      legs:safeLegs,odds:safeLegs.length?calcO(safeLegs).toFixed(2)+"×":"N/A",oddsNum:safeLegs.length?calcO(safeLegs):0,
      hitProb:safeLegs.length?+(calcP(safeLegs)*100).toFixed(1):0,risks:mkRisks(safeLegs),alts:mkAlts(safeLegs)},
    mid:{key:"mid",label:"Mid-Risk Multi",emoji:"🟡",accentColor:ios.amber,subtitle:"Balanced risk · Strong research",
      legs:midLegs,odds:midLegs.length?calcO(midLegs).toFixed(2)+"×":"N/A",oddsNum:midLegs.length?calcO(midLegs):0,
      hitProb:midLegs.length?+(calcP(midLegs)*100).toFixed(1):0,risks:mkRisks(midLegs),alts:mkAlts(midLegs)},
    lotto:{key:"lotto",label:"Lotto Multi",emoji:"🔴",accentColor:ios.red,subtitle:"High payout · Calculated longshot",
      legs:lottoLegs,odds:lottoLegs.length?calcO(lottoLegs).toFixed(2)+"×":"N/A",oddsNum:lottoLegs.length?calcO(lottoLegs):0,
      hitProb:lottoLegs.length?+(calcP(lottoLegs)*100).toFixed(1):0,risks:mkRisks(lottoLegs),alts:[]},
  };
}

// ─── DATA FETCHING ────────────────────────────────────────────
async function fetchGames(){
  const today=new Date().toISOString().split("T")[0];
  const r=await fetch(`${BDL_BASE}/games?dates[]=${today}&per_page=30`,{headers:{Authorization:BDL_API_KEY}});
  const d=await r.json();
  return(d.data||[]).map(g=>({id:g.id,homeTeam:g.home_team?.full_name,awayTeam:g.visitor_team?.full_name,
    homeScore:g.home_team_score,awayScore:g.visitor_team_score,status:g.status,time:g.status==="Final"?"Final":"Today"}));
}

async function fetchOdds(){
  const r=await fetch(`${ODDS_BASE}/sports/basketball_nba/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal`);
  if(!r.ok)throw new Error(`Odds API ${r.status}`);
  return r.json();
}

async function fetchInjuries(){
  try{
    const r=await fetch(`${ESPN_BASE}/injuries`);
    const d=await r.json();
    const inj={};
    (d.injuries||[]).forEach(t=>{
      const name=t.team?.displayName; if(!name)return;
      inj[name]=(t.injuries||[]).map(i=>({name:i.athlete?.displayName||"Unknown",
        status:i.status||"Questionable",detail:i.details?.detail||"",position:i.athlete?.position?.abbreviation||""}));
    });
    return inj;
  }catch(e){console.warn("Injuries:",e);return{};}
}

async function fetchSchedule(){
  try{
    const today=new Date().toISOString().split("T")[0].replace(/-/g,"");
    const r=await fetch(`${ESPN_BASE}/scoreboard?dates=${today}`);
    const d=await r.json();
    const s={};
    (d.events||[]).forEach(ev=>{
      const c=ev.competitions?.[0]; if(!c)return;
      const home=c.competitors?.find(x=>x.homeAway==="home");
      const away=c.competitors?.find(x=>x.homeAway==="away");
      const key=`${away?.team?.displayName} @ ${home?.team?.displayName}`;
      s[key]={time:ev.date?new Date(ev.date).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZoneName:"short"}):"TBD",
        status:c.status?.type?.description||"Scheduled",tv:c.broadcasts?.[0]?.names?.[0]||"",
        homeRecord:home?.records?.[0]?.summary||"",awayRecord:away?.records?.[0]?.summary||""};
    });
    return s;
  }catch(e){console.warn("Schedule:",e);return{};}
}

function mergeOdds(games,oddsData){
  return games.map(game=>{
    const match=oddsData.find(o=>(o.home_team===game.homeTeam||abbrev(o.home_team)===abbrev(game.homeTeam))&&
      (o.away_team===game.awayTeam||abbrev(o.away_team)===abbrev(game.awayTeam)));
    if(!match)return game;
    let homeOdds,awayOdds,homeSpread,spreadOdds,total,totalOdds;
    for(const book of match.bookmakers||[]){
      for(const mkt of book.markets||[]){
        if(mkt.key==="h2h"){const h=mkt.outcomes.find(o=>o.name===match.home_team);const a=mkt.outcomes.find(o=>o.name===match.away_team);homeOdds=h?.price;awayOdds=a?.price;}
        if(mkt.key==="spreads"){const h=mkt.outcomes.find(o=>o.name===match.home_team);homeSpread=h?.point!=null?(h.point>0?`+${h.point}`:`${h.point}`):null;spreadOdds=h?.price;}
        if(mkt.key==="totals"){const o=mkt.outcomes.find(x=>x.name==="Over");total=o?.point;totalOdds=o?.price;}
      }
      if(homeOdds&&homeSpread&&total)break;
    }
    return{...game,homeOdds,awayOdds,homeSpread,spreadOdds,total,totalOdds};
  });
}

// ─── UI ATOMS ─────────────────────────────────────────────────
const TAG_STYLE={"Injury Impact":{bg:"rgba(255,159,10,0.15)",color:ios.amber},"Injury Risk":{bg:"rgba(255,69,58,0.15)",color:ios.red},"B2B":{bg:"rgba(90,200,250,0.15)",color:ios.teal},"High Variance":{bg:"rgba(191,90,242,0.15)",color:ios.purple}};
function PillTag({label}){const s=TAG_STYLE[label]||{bg:ios.bg3,color:ios.label3};return<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,background:s.bg,color:s.color,fontFamily:ios.font,whiteSpace:"nowrap"}}>{label}</span>;}
function cc(c){return c>=70?ios.green:c>=60?ios.amber:ios.blue;}
function ConfRing({value,size=52}){const r=(size-6)/2,circ=2*Math.PI*r,fill=(value/100)*circ,col=cc(value);return(<div style={{position:"relative",width:size,height:size,flexShrink:0}}><svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ios.bg3} strokeWidth={4}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={4} strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"/></svg><div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:ios.font,fontWeight:700,fontSize:size>44?14:11,color:col,lineHeight:1}}>{value}</span><span style={{fontFamily:ios.font,fontSize:8,color:ios.label3,marginTop:1}}>CONF</span></div></div>);}
function Spinner(){return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:16,padding:40}}><div style={{width:40,height:40,border:`3px solid ${ios.bg3}`,borderTop:`3px solid ${ios.blue}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><span style={{fontFamily:ios.font,fontSize:15,color:ios.label3}}>Loading live data…</span></div>);}
function ErrBanner({msg,onRetry}){return(<div style={{margin:"12px 20px",background:"rgba(255,69,58,0.12)",borderRadius:14,padding:"14px 16px",border:`1px solid ${ios.red}33`}}><div style={{fontFamily:ios.font,fontWeight:600,fontSize:14,color:ios.red,marginBottom:6}}>⚠️ Data Error</div><div style={{fontFamily:ios.font,fontSize:13,color:ios.label3,marginBottom:10}}>{msg}</div><button onClick={onRetry} style={{background:ios.red,border:"none",borderRadius:8,padding:"8px 16px",color:"#fff",fontFamily:ios.font,fontSize:14,fontWeight:600,cursor:"pointer"}}>Retry</button></div>);}

// ─── LEG SHEET ────────────────────────────────────────────────
function LegSheet({leg,onClose}){
  const col=cc(leg.confidence);
  return(<div style={{position:"fixed",inset:0,zIndex:200,background:ios.bg1,display:"flex",flexDirection:"column",overflowY:"auto"}}>
    <div style={{padding:"12px 20px 0",flexShrink:0}}>
      <div style={{width:36,height:4,background:ios.bg3,borderRadius:99,margin:"0 auto 16px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>{leg.game}</span>
        <button onClick={onClose} style={{background:ios.bg3,border:"none",borderRadius:99,width:30,height:30,color:ios.label2,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      <div style={{fontFamily:ios.font,fontWeight:700,fontSize:20,color:ios.label,marginBottom:6}}>{leg.selection}</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        <span style={{background:ios.bg3,borderRadius:99,padding:"4px 12px",fontFamily:ios.font,fontSize:13,color:ios.amber,fontWeight:600}}>{leg.odds?.toFixed(2)}×</span>
        <span style={{background:ios.bg3,borderRadius:99,padding:"4px 12px",fontFamily:ios.font,fontSize:13,color:ios.blue,fontWeight:600}}>{leg.type}</span>
        {(leg.tags||[]).map(t=><PillTag key={t} label={t}/>)}
      </div>
    </div>
    <div style={{padding:"0 20px 60px"}}>
      <div style={{display:"flex",gap:12,marginBottom:16}}>
        <div style={{flex:1,background:ios.bg2,borderRadius:16,padding:16,display:"flex",alignItems:"center",gap:12}}>
          <ConfRing value={leg.confidence} size={56}/>
          <div><div style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>Confidence</div><div style={{fontFamily:ios.font,fontWeight:700,fontSize:22,color:col}}>{leg.confidence}/100</div></div>
        </div>
        <div style={{flex:1,background:ios.bg2,borderRadius:16,padding:16,display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <div style={{fontFamily:ios.font,fontSize:13,color:ios.label3,marginBottom:4}}>Hit Probability</div>
          <div style={{fontFamily:ios.font,fontWeight:700,fontSize:28,color:col}}>{leg.prob}%</div>
          <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>estimated</div>
        </div>
      </div>
      {leg.reasoning&&(<div style={{background:ios.bg2,borderRadius:16,padding:16,marginBottom:14}}><div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,marginBottom:8,letterSpacing:0.3}}>ANALYSIS</div><div style={{fontFamily:ios.font,fontSize:15,color:ios.label2,lineHeight:1.6}}>{leg.reasoning}</div></div>)}
      {(leg.factors||[]).length>0&&(<div style={{background:ios.bg2,borderRadius:16,padding:16,marginBottom:14}}><div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,marginBottom:12,letterSpacing:0.3}}>SCORING BREAKDOWN</div>{leg.factors.map((f,i)=>{const pct=(f.val/f.max)*100,fc=pct>70?ios.green:pct>50?ios.amber:ios.label3;return(<div key={i} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontFamily:ios.font,fontSize:12,color:ios.label2}}>{f.name}</span><span style={{fontFamily:ios.mono,fontSize:12,color:fc}}>{f.val}/{f.max}</span></div><div style={{height:4,background:ios.bg3,borderRadius:99,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:fc,borderRadius:99}}/></div></div>);})}</div>)}
      <div style={{background:"rgba(255,159,10,0.1)",borderRadius:12,padding:"12px 14px",fontFamily:ios.font,fontSize:12,color:ios.label3,lineHeight:1.5}}>⚠️ Analytical estimates only. Always verify final lineups. Bet responsibly.</div>
    </div>
  </div>);
}

// ─── PICK DETAIL ──────────────────────────────────────────────
function PickScreen({pick,onBack}){
  const [sel,setSel]=useState(null);
  const legs=pick.legs||[];
  return(<>
    <div style={{flex:1,overflowY:"auto",background:ios.bg,paddingBottom:100}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",padding:"12px 20px 10px",borderBottom:`0.5px solid ${ios.sep}`}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:ios.blue,fontFamily:ios.font,fontSize:17,cursor:"pointer",padding:0}}>‹ Back</button>
      </div>
      <div style={{padding:"20px 20px 0"}}>
        <div style={{background:`linear-gradient(145deg,${pick.accentColor}20,${ios.bg1})`,border:`1px solid ${pick.accentColor}33`,borderRadius:20,padding:20,marginBottom:20}}>
          <div style={{fontFamily:ios.font,fontSize:13,color:pick.accentColor,fontWeight:600,marginBottom:4}}>{pick.emoji} {pick.label.toUpperCase()}</div>
          <div style={{fontFamily:ios.font,fontWeight:800,fontSize:44,color:ios.label,lineHeight:1}}>{pick.odds}</div>
          <div style={{fontFamily:ios.font,fontSize:14,color:ios.label3,marginTop:4,marginBottom:16}}>combined odds · {legs.length} leg{legs.length!==1?"s":""}</div>
          <div style={{display:"flex",gap:12}}>
            <div style={{flex:1,background:ios.bg1,borderRadius:12,padding:"10px 14px"}}><div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginBottom:2}}>HIT PROBABILITY</div><div style={{fontFamily:ios.font,fontWeight:700,fontSize:22,color:pick.accentColor}}>{pick.hitProb}%</div></div>
            <div style={{flex:1,background:ios.bg1,borderRadius:12,padding:"10px 14px"}}><div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginBottom:2}}>LEGS</div><div style={{fontFamily:ios.font,fontWeight:700,fontSize:22,color:ios.label}}>{legs.length}</div></div>
          </div>
        </div>
        {legs.length===0?(<div style={{background:ios.bg1,borderRadius:16,padding:20,textAlign:"center",fontFamily:ios.font,fontSize:15,color:ios.label3}}>Not enough games with odds data to build this multi today.</div>):(
          <>
            <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,marginBottom:10,letterSpacing:0.3}}>BET LEGS — TAP FOR ANALYSIS</div>
            {legs.map((leg,i)=>{const col=cc(leg.confidence);return(
              <div key={i} onClick={()=>setSel(leg)} style={{background:ios.bg1,borderRadius:16,padding:"14px 16px",marginBottom:10,display:"flex",gap:12,alignItems:"center",cursor:"pointer",border:`0.5px solid ${ios.sep}`}}>
                <ConfRing value={leg.confidence} size={48}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:ios.font,fontSize:12,color:ios.label3,marginBottom:2}}>{leg.game}</div>
                  <div style={{fontFamily:ios.font,fontWeight:600,fontSize:15,color:ios.label,marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{leg.selection}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontFamily:ios.font,fontSize:12,color:ios.amber,fontWeight:600}}>{leg.odds?.toFixed(2)}×</span>
                    <span style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>{leg.type}</span>
                    {(leg.tags||[]).map(t=><PillTag key={t} label={t}/>)}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:ios.font,fontWeight:700,fontSize:18,color:col}}>{leg.prob}%</div>
                  <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>prob</div>
                  <div style={{fontSize:16,color:ios.label3,marginTop:2}}>›</div>
                </div>
              </div>);
            })}
          </>
        )}
        <div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,margin:"20px 0 10px",letterSpacing:0.3}}>KEY RISKS</div>
        <div style={{background:ios.bg1,borderRadius:16,overflow:"hidden",marginBottom:16}}>
          {(pick.risks||[]).map((r,i)=>(
            <div key={i} style={{padding:"12px 16px",borderBottom:i<pick.risks.length-1?`0.5px solid ${ios.sep}`:"none",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:15,flexShrink:0}}>⚠️</span>
              <span style={{fontFamily:ios.font,fontSize:14,color:ios.label2,lineHeight:1.4}}>{r}</span>
            </div>
          ))}
        </div>
        {(pick.alts||[]).length>0&&(<><div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.label3,marginBottom:10,letterSpacing:0.3}}>NEAR-MISS ALTERNATES</div><div style={{background:ios.bg1,borderRadius:16,overflow:"hidden",marginBottom:20}}>{pick.alts.map((a,i)=>(<div key={i} style={{padding:"12px 16px",borderBottom:i<pick.alts.length-1?`0.5px solid ${ios.sep}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontFamily:ios.font,fontSize:13,color:ios.label2,flex:1,marginRight:8}}>{a.desc}</span><span style={{fontFamily:ios.font,fontSize:14,color:cc(a.conf),fontWeight:600,flexShrink:0}}>{a.conf}</span></div>))}</div></>)}
      </div>
    </div>
    {sel&&<LegSheet leg={sel} onClose={()=>setSel(null)}/>}
  </>);
}

// ─── PICKS TAB ────────────────────────────────────────────────
function PicksTab({picks,loading,error,onRetry,lastUpdated}){
  const [detail,setDetail]=useState(null);
  if(detail&&picks?.[detail])return<PickScreen pick={picks[detail]} onBack={()=>setDetail(null)}/>;
  const today=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:100}}>
      <div style={{padding:"16px 20px 6px",display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div><div style={{fontFamily:ios.font,fontWeight:800,fontSize:34,color:ios.label,letterSpacing:-0.5}}>Today's Picks</div><div style={{fontFamily:ios.font,fontSize:15,color:ios.label3,marginTop:2}}>{today}</div></div>
        {lastUpdated&&<div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,textAlign:"right",paddingBottom:4}}>Updated<br/>{lastUpdated}</div>}
      </div>
      {error&&<ErrBanner msg={error} onRetry={onRetry}/>}
      {loading&&<Spinner/>}
      {!loading&&!error&&picks&&(<>
        <div style={{margin:"8px 20px 16px",background:ios.bg1,borderRadius:14,padding:"12px 16px",display:"flex",gap:10,border:`0.5px solid ${ios.sep}`}}>
          <span style={{fontSize:18}}>📡</span>
          <div style={{fontFamily:ios.font,fontSize:13,color:ios.label3,lineHeight:1.5}}><strong style={{color:ios.label2}}>Live data active</strong> · Real bookmaker odds · ESPN injury reports · Auto-refreshes every 30 min</div>
        </div>
        <div style={{padding:"0 20px"}}>
          {Object.values(picks).map(pick=>(
            <div key={pick.key} onClick={()=>pick.legs?.length&&setDetail(pick.key)}
              style={{background:ios.bg1,borderRadius:20,marginBottom:14,overflow:"hidden",border:`0.5px solid ${ios.sep}`,cursor:pick.legs?.length?"pointer":"default",opacity:pick.legs?.length?1:0.5}}>
              <div style={{background:`linear-gradient(135deg,${pick.accentColor}18,transparent)`,borderBottom:`0.5px solid ${pick.accentColor}33`,padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div><div style={{fontFamily:ios.font,fontWeight:700,fontSize:18,color:ios.label,marginBottom:3}}>{pick.emoji} {pick.label}</div><div style={{fontFamily:ios.font,fontSize:13,color:ios.label3}}>{pick.subtitle}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontFamily:ios.font,fontWeight:800,fontSize:26,color:pick.accentColor,lineHeight:1}}>{pick.odds}</div><div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginTop:2}}>combined odds</div></div>
              </div>
              <div style={{display:"flex",padding:"12px 18px"}}>
                <div style={{flex:1,textAlign:"center",borderRight:`0.5px solid ${ios.sep}`}}><div style={{fontFamily:ios.font,fontWeight:700,fontSize:20,color:pick.accentColor}}>{pick.hitProb}%</div><div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>hit probability</div></div>
                <div style={{flex:1,textAlign:"center",borderRight:`0.5px solid ${ios.sep}`}}><div style={{fontFamily:ios.font,fontWeight:700,fontSize:20,color:ios.label}}>{pick.legs?.length||0}</div><div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>legs</div></div>
                <div style={{flex:1,textAlign:"center"}}><div style={{fontFamily:ios.font,fontWeight:700,fontSize:20,color:ios.label}}>{(pick.legs||[]).filter(l=>l.confidence>=70).length}</div><div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>high-conf</div></div>
              </div>
              {(pick.legs||[]).length>0&&(<div style={{padding:"0 18px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",gap:5}}>{(pick.legs||[]).slice(0,6).map((l,i)=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:cc(l.confidence),opacity:0.85}}/>)}</div><span style={{fontSize:17,color:ios.label3}}>›</span></div>)}
            </div>
          ))}
        </div>
        <div style={{margin:"0 20px 20px",background:ios.bg1,borderRadius:12,padding:"10px 14px",fontFamily:ios.font,fontSize:12,color:ios.label3,lineHeight:1.5,border:`0.5px solid ${ios.sep}`}}>
          ⚠️ Analytical estimates only. Verify lineups at tip-off. Bet responsibly.
        </div>
      </>)}
    </div>
  );
}

// ─── SLATE TAB ────────────────────────────────────────────────
function SlateTab({games,injuries,schedule,loading,error,onRetry}){
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:100}}>
      <div style={{padding:"16px 20px 8px"}}><div style={{fontFamily:ios.font,fontWeight:800,fontSize:34,color:ios.label,letterSpacing:-0.5}}>Tonight's Slate</div><div style={{fontFamily:ios.font,fontSize:15,color:ios.label3,marginTop:2}}>{games.length} NBA game{games.length!==1?"s":""} · Live odds</div></div>
      {error&&<ErrBanner msg={error} onRetry={onRetry}/>}
      {loading&&<Spinner/>}
      {!loading&&(
        <div style={{padding:"8px 20px"}}>
          {games.length===0&&<div style={{background:ios.bg1,borderRadius:16,padding:24,textAlign:"center",fontFamily:ios.font,fontSize:15,color:ios.label3}}>No NBA games today. Check back tomorrow!</div>}
          {games.map((g,i)=>{
            const hI=(injuries[g.homeTeam]||[]).filter(p=>p.status==="Out"||p.status==="Questionable");
            const aI=(injuries[g.awayTeam]||[]).filter(p=>p.status==="Out"||p.status==="Questionable");
            const sched=schedule[`${g.awayTeam} @ ${g.homeTeam}`]||{};
            return(
              <div key={i} style={{background:ios.bg1,borderRadius:16,marginBottom:12,overflow:"hidden",border:`0.5px solid ${ios.sep}`}}>
                <div style={{padding:"14px 16px",borderBottom:`0.5px solid ${ios.sep}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontFamily:ios.font,fontSize:14,color:ios.label3}}>{abbrev(g.awayTeam)}</span><span style={{color:ios.label4,fontSize:11}}>@</span><span style={{fontFamily:ios.font,fontWeight:700,fontSize:18,color:ios.label}}>{abbrev(g.homeTeam)}</span></div><div style={{fontFamily:ios.font,fontSize:12,color:ios.label3}}>{sched.time||g.time||"TBD"}{sched.tv?` · ${sched.tv}`:""}</div></div>
                    {g.status==="Final"&&<div style={{textAlign:"right"}}><div style={{fontFamily:ios.mono,fontWeight:700,fontSize:18,color:ios.label}}>{g.awayScore}–{g.homeScore}</div><div style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>Final</div></div>}
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {g.homeSpread&&<div style={{background:ios.bg2,borderRadius:8,padding:"5px 10px"}}><div style={{fontFamily:ios.mono,fontSize:12,color:ios.blue,fontWeight:600}}>{abbrev(g.homeTeam)} {g.homeSpread}</div><div style={{fontFamily:ios.font,fontSize:10,color:ios.label3}}>spread</div></div>}
                    {g.total&&<div style={{background:ios.bg2,borderRadius:8,padding:"5px 10px"}}><div style={{fontFamily:ios.mono,fontSize:12,color:ios.purple,fontWeight:600}}>O/U {g.total}</div><div style={{fontFamily:ios.font,fontSize:10,color:ios.label3}}>total</div></div>}
                    {g.homeOdds&&<div style={{background:ios.bg2,borderRadius:8,padding:"5px 10px"}}><div style={{fontFamily:ios.mono,fontSize:12,color:ios.green,fontWeight:600}}>{g.homeOdds?.toFixed(2)}×</div><div style={{fontFamily:ios.font,fontSize:10,color:ios.label3}}>home ML</div></div>}
                    {!g.homeSpread&&!g.total&&<span style={{fontFamily:ios.font,fontSize:12,color:ios.label3,padding:"5px 0"}}>Odds not yet posted</span>}
                  </div>
                </div>
                {(hI.length>0||aI.length>0)?(
                  <div style={{padding:"10px 16px"}}>
                    <div style={{fontFamily:ios.font,fontSize:11,color:ios.label3,marginBottom:6,letterSpacing:0.3}}>INJURY REPORT</div>
                    {[...hI.map(p=>({...p,team:abbrev(g.homeTeam)})),...aI.map(p=>({...p,team:abbrev(g.awayTeam)}))].map((p,j)=>(
                      <div key={j} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <span style={{fontFamily:ios.font,fontSize:11,color:ios.label3,background:ios.bg3,padding:"1px 6px",borderRadius:4}}>{p.team}</span>
                          <span style={{fontFamily:ios.font,fontSize:13,color:ios.label2}}>{p.name}</span>
                          {p.position&&<span style={{fontFamily:ios.font,fontSize:11,color:ios.label3}}>{p.position}</span>}
                        </div>
                        <span style={{fontFamily:ios.font,fontSize:12,fontWeight:600,color:p.status==="Out"?ios.red:p.status==="Questionable"?ios.amber:ios.green}}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{padding:"8px 16px",fontFamily:ios.font,fontSize:12,color:ios.green}}>✅ No injury concerns reported</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── INJURIES TAB ─────────────────────────────────────────────
function InjuriesTab({injuries,loading,error,onRetry}){
  const all=Object.entries(injuries).filter(([,v])=>v.length>0);
  const out=all.flatMap(([t,v])=>v.filter(p=>p.status==="Out").map(p=>({...p,team:t})));
  const ques=all.flatMap(([t,v])=>v.filter(p=>p.status==="Questionable").map(p=>({...p,team:t})));
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:100}}>
      <div style={{padding:"16px 20px 8px"}}><div style={{fontFamily:ios.font,fontWeight:800,fontSize:34,color:ios.label,letterSpacing:-0.5}}>Injury Report</div><div style={{fontFamily:ios.font,fontSize:15,color:ios.label3,marginTop:2}}>Live from ESPN · Auto-refreshes</div></div>
      {error&&<ErrBanner msg={error} onRetry={onRetry}/>}
      {loading&&<Spinner/>}
      {!loading&&(
        <div style={{padding:"8px 20px"}}>
          <div style={{display:"flex",gap:10,marginBottom:16}}>
            {[{label:"Out",val:out.length,color:ios.red},{label:"Questionable",val:ques.length,color:ios.amber},{label:"Teams",val:all.length,color:ios.green}].map((s,i)=>(
              <div key={i} style={{background:ios.bg1,borderRadius:12,padding:"10px 16px",flex:1,textAlign:"center",border:`0.5px solid ${ios.sep}`,borderTop:`2px solid ${s.color}`}}>
                <div style={{fontFamily:ios.font,fontWeight:700,fontSize:24,color:s.color}}>{s.val}</div>
                <div style={{fontFamily:ios.font,fontSize:12,color:ios.label3}}>{s.label}</div>
              </div>
            ))}
          </div>
          {out.length>0&&(<><div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.red,marginBottom:8,letterSpacing:0.3}}>● OUT</div><div style={{background:ios.bg1,borderRadius:16,overflow:"hidden",marginBottom:16,border:`0.5px solid ${ios.sep}`}}>{out.map((p,i)=>(<div key={i} style={{padding:"12px 16px",borderBottom:i<out.length-1?`0.5px solid ${ios.sep}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontFamily:ios.font,fontWeight:600,fontSize:15,color:ios.label}}>{p.name}</div><div style={{fontFamily:ios.font,fontSize:12,color:ios.label3,marginTop:2}}>{abbrev(p.team)}{p.position?` · ${p.position}`:""}{p.detail?` · ${p.detail}`:""}</div></div><span style={{fontFamily:ios.font,fontSize:13,fontWeight:700,color:ios.red}}>OUT</span></div>))}</div></>)}
          {ques.length>0&&(<><div style={{fontFamily:ios.font,fontWeight:600,fontSize:13,color:ios.amber,marginBottom:8,letterSpacing:0.3}}>● QUESTIONABLE</div><div style={{background:ios.bg1,borderRadius:16,overflow:"hidden",marginBottom:16,border:`0.5px solid ${ios.sep}`}}>{ques.map((p,i)=>(<div key={i} style={{padding:"12px 16px",borderBottom:i<ques.length-1?`0.5px solid ${ios.sep}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontFamily:ios.font,fontWeight:600,fontSize:15,color:ios.label}}>{p.name}</div><div style={{fontFamily:ios.font,fontSize:12,color:ios.label3,marginTop:2}}>{abbrev(p.team)}{p.position?` · ${p.position}`:""}{p.detail?` · ${p.detail}`:""}</div></div><span style={{fontFamily:ios.font,fontSize:13,fontWeight:700,color:ios.amber}}>QUES</span></div>))}</div></>)}
          {out.length===0&&ques.length===0&&(<div style={{background:ios.bg1,borderRadius:16,padding:24,textAlign:"center",border:`0.5px solid ${ios.sep}`}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{fontFamily:ios.font,fontSize:16,color:ios.green,fontWeight:600,marginBottom:4}}>Clean Injury Report</div><div style={{fontFamily:ios.font,fontSize:14,color:ios.label3}}>No significant injuries for tonight's games</div></div>)}
        </div>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────
function App(){
  const [tab,setTab]=useState("picks");
  const [games,setGames]=useState([]);
  const [injuries,setInjuries]=useState({});
  const [schedule,setSchedule]=useState({});
  const [picks,setPicks]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [lastUpdated,setLastUpdated]=useState(null);

  const loadAll=useCallback(async()=>{
    setLoading(true);setError(null);
    try{
      const [gR,oR,iR,sR]=await Promise.allSettled([fetchGames(),fetchOdds(),fetchInjuries(),fetchSchedule()]);
      const gD=gR.status==="fulfilled"?gR.value:[];
      const oD=oR.status==="fulfilled"?oR.value:[];
      const iD=iR.status==="fulfilled"?iR.value:{};
      const sD=sR.status==="fulfilled"?sR.value:{};
      if(gR.status==="rejected"&&oR.status==="rejected")throw new Error("Could not reach NBA data. Check your connection.");
      let merged=gD.length>0?mergeOdds(gD,oD):oD.map(o=>{
        let hO,aO,hS,sO,tot,tO;
        for(const b of o.bookmakers||[]){for(const m of b.markets||[]){if(m.key==="h2h"){const h=m.outcomes.find(x=>x.name===o.home_team);const a=m.outcomes.find(x=>x.name===o.away_team);hO=h?.price;aO=a?.price;}if(m.key==="spreads"){const h=m.outcomes.find(x=>x.name===o.home_team);hS=h?.point!=null?(h.point>0?`+${h.point}`:`${h.point}`):null;sO=h?.price;}if(m.key==="totals"){const ov=m.outcomes.find(x=>x.name==="Over");tot=ov?.point;tO=ov?.price;}}if(hO&&hS&&tot)break;}
        return{id:o.id,homeTeam:o.home_team,awayTeam:o.away_team,status:"scheduled",homeOdds:hO,awayOdds:aO,homeSpread:hS,spreadOdds:sO,total:tot,totalOdds:tO};
      });
      setGames(merged);setInjuries(iD);setSchedule(sD);
      const legs=merged.filter(g=>g.homeOdds||g.homeSpread||g.total).flatMap(g=>scoreGame(g,iD));
      setPicks(buildMultis(legs));
      setLastUpdated(new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}));
    }catch(e){console.error(e);setError(e.message||"Failed to load data");}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{loadAll();const t=setInterval(loadAll,30*60*1000);return()=>clearInterval(t);},[loadAll]);

  const tabs=[{id:"picks",icon:"⚡",label:"Picks"},{id:"slate",icon:"🏀",label:"Slate"},{id:"injuries",icon:"🩹",label:"Injuries"}];

  return(
    <div style={{width:"100%",height:"100%",background:ios.bg,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      <div style={{paddingTop:"env(safe-area-inset-top,44px)",flexShrink:0}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
        {tab==="picks"    &&<PicksTab picks={picks} loading={loading} error={error} onRetry={loadAll} lastUpdated={lastUpdated}/>}
        {tab==="slate"    &&<SlateTab games={games} injuries={injuries} schedule={schedule} loading={loading} error={error} onRetry={loadAll}/>}
        {tab==="injuries" &&<InjuriesTab injuries={injuries} loading={loading} error={error} onRetry={loadAll}/>}
      </div>
      <div style={{background:"rgba(28,28,30,0.94)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`0.5px solid ${ios.sep}`,display:"flex",paddingTop:8,flexShrink:0,paddingBottom:"env(safe-area-inset-bottom,20px)"}}>
        {tabs.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"6px 0"}}><span style={{fontSize:22,lineHeight:1,filter:tab===t.id?"none":"grayscale(1) opacity(0.4)"}}>{t.icon}</span><span style={{fontFamily:ios.font,fontSize:10,fontWeight:500,color:tab===t.id?ios.blue:ios.label3}}>{t.label}</span></button>))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
