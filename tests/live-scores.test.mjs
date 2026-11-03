import test from 'node:test';
import assert from 'node:assert/strict';
const {matchesStatus,scoreJSON,scoreboardEvents}=await import('../dist/score-feed.js').catch(()=>import('../score-feed.js'));
test('Live selects in-progress matches, including halftime and competition-level status',()=>{
 for(const event of [{status:{type:{state:'in',name:'STATUS_IN_PROGRESS'}}},{status:{type:{state:'in',name:'STATUS_HALFTIME'}}},{competitions:[{status:{type:{state:'in'}}}]}])assert.equal(matchesStatus(event,'live'),true);
 for(const state of ['pre','post'])assert.equal(matchesStatus({status:{type:{state}}},'live'),false);
 assert.equal(matchesStatus({},'live'),false);
 assert.equal(matchesStatus({status:{type:{state:'post'}}},'post'),true);
 assert.equal(matchesStatus({status:{type:{state:'pre'}}},'pre'),true);
 assert.equal(matchesStatus({},'all'),true);
});
test('score requests recover through the alternate provider host and reject total failure',async()=>{
 const calls=[],data={events:[{id:'1'}]};
 assert.deepEqual(await scoreJSON('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',async url=>{calls.push(url);return {ok:calls.length>1,status:403,json:async()=>data}}),data);
 assert.match(calls[0],/site.web.api/);assert.match(calls[1],/site.api/);
 await assert.rejects(scoreJSON('https://site.api.espn.com/test',async()=>{throw Error('offline')}),/offline/);
});

test('malformed provider IDs cannot inject attributes into match links', () => {
  const board = {events: [{id: '1" onclick="alert(1)'}, null, {id: 42, league: 'wrong'}]};
  assert.deepEqual(scoreboardEvents(board, 'eng.1'), [{id: 42, league: 'eng.1'}]);
});
