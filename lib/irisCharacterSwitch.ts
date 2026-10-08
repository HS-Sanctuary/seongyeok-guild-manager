import {freshStats,rankStatsCandidates,score,statKeys,type GameStats,type StatsCharacter} from './irisStats';

// A suggestion is not an identity: no writes or automatic selection occur here.
export function createCharacterSwitchTracker(selectedId:string) {
  let baseline:GameStats|null=null,lastObserved=-Infinity,pendingId:string|null=null,count=0;
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
      const ranked=rankStatsCandidates(characters,game),best=ranked[0];
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
