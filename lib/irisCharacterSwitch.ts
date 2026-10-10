import {freshStats,rankStatsCandidates,score,statKeys,type GameStats,type StatsCharacter} from './irisStats';

function rankSwitchCandidates(characters:StatsCharacter[],game:GameStats) {
  // Only switch suggestions tolerate one stale value. Login and DB data retain
  // their existing rules. Apply this equally to rivals, including exact matches.
  return rankStatsCandidates(characters,game).map(candidate=>{
    const distances=statKeys.flatMap(key=>{
      const saved=score(candidate.character.stats[key]),live=game.stats[key];
      return saved!==null&&saved>0&&live!==null&&live>0
        ?[Math.abs(saved-live)/Math.max(saved,live)]:[];
    }).sort((a,b)=>a-b).slice(0,3);
    const tolerantScore=distances.length===3&&distances.every(distance=>distance<=.2)
      ?1-distances.reduce((sum,distance)=>sum+distance,0)/3:0;
    return {...candidate,score:Math.max(candidate.score,tolerantScore)};
  }).sort((a,b)=>b.score-a.score);
}

// A suggestion is not an identity: no writes or automatic selection occur here.
export function createCharacterSwitchTracker(selectedId:string,previous:GameStats|null=null,now=Date.now()) {
  // A fresh account-local observation survives a selected-watch remount, but
  // never counts toward the two new observations required to offer a switch.
  let baseline=previous&&freshStats(previous,now)&&statKeys.filter(key=>(previous.stats[key]??0)>0).length>=2?previous:null;
  let lastObserved=baseline?Date.parse(baseline.observedAt):-Infinity,pendingId:string|null=null,count=0;
  let dismissedId:string|null=null,candidate:StatsCharacter|null=null;
  const invalidate=()=>{pendingId=null;count=0;candidate=null;return null;};
  return {
    invalidate,
    unconfirmedCandidate(){return count===1?pendingId:null;},
    dismiss(){dismissedId=pendingId;invalidate();},
    observe(characters:StatsCharacter[],game:GameStats,now=Date.now()):StatsCharacter|null {
      if(!freshStats(game,now)||statKeys.filter(key=>(game.stats[key]??0)>0).length<2)return invalidate();
      const observed=Date.parse(game.observedAt);
      if(observed<=lastObserved)return candidate;
      lastObserved=observed;
      if(!baseline){baseline=game;return invalidate();}
      const ranked=rankSwitchCandidates(characters,game),best=ranked[0];
      if(!best||best.compared<2||best.score<.8||(ranked[1]&&best.score-ranked[1].score<.08))return invalidate();
      if(statKeys.filter(key=>(score(best.character.stats[key])??0)>0&&(game.stats[key]??0)>0).length<2)return invalidate();
      if(best.character.id===selectedId){baseline=game;dismissedId=null;return invalidate();}
      // A single changing equipment statistic must not create a switch recommendation.
      const changed=game.job!==baseline.job||statKeys.filter(key=>{
        const previous=baseline!.stats[key],value=game.stats[key];
        return previous!==null&&value!==null&&Math.abs(previous-value)/Math.max(previous,value,1)>=.1;
      }).length>=2;
      if(!changed||best.character.id===dismissedId)return invalidate();
      count=best.character.id===pendingId?count+1:1;pendingId=best.character.id;
      candidate=count>=2?best.character:null;
      return candidate;
    },
  };
}
