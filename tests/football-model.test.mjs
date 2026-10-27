import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const {positionGroup,buildTies,statisticalXI,tableGroups}=await import(existsSync(new URL('../dist/football-model.js',import.meta.url))?'../dist/football-model.js':'../football-model.js');

test('football positions distinguish midfielders and forwards from defenders',()=>{
 for(const abbreviation of ['D','CD-L','LB','RB','WB'])assert.equal(positionGroup({abbreviation}),'D');
 for(const abbreviation of ['M','CM','AM-L','RM'])assert.equal(positionGroup({abbreviation}),'M');
 for(const abbreviation of ['F','CF-L','RW','LF'])assert.equal(positionGroup({abbreviation}),'F');
 assert.equal(positionGroup({name:'Forward'}),'F');
 assert.equal(positionGroup({name:'Midfielder'}),'M');
 assert.equal(positionGroup({abbreviation:'SUB'}),null);
});
const team=id=>({id,displayName:'Club '+id});
const game=(id,slug,teams,extra={})=>({id,date:'2026-04-'+(id==='1'?'01':'08')+'T19:00Z',season:{slug},competitions:[{status:{type:{completed:true,state:'post'}},competitors:teams.map(([id,score,winner],i)=>({id,team:team(id),score,winner,homeAway:i?'away':'home'})),...extra}]});
test('two-leg ties use the series winner, not the first-leg winner',()=>{
 const a=game('1','quarterfinals',[['A','2',true],['B','0',false]],{leg:{value:1}});
 const b=game('2','quarterfinals',[['B','3',true],['A','0',false]],{leg:{value:2},series:{completed:true,competitors:[{id:'A',aggregateScore:2,winner:false},{id:'B',aggregateScore:3,winner:true}]}});
 const ties=buildTies([a,b]);assert.equal(ties.length,1);assert.equal(ties[0].winner,'B');assert.equal(ties[0].aggregate.B,3);assert.equal(ties[0].games.length,2);
 assert.equal(buildTies([a])[0].winner,null);
});
test('league fixtures are never misrepresented as knockout ties',()=>{
 assert.equal(buildTies([game('1','2026-27-english-premier-league',[['A','1',true],['B','0',false]])]).length,0);
 assert.equal(buildTies([game('1','semifinals',[['A','1',true],['B','0',false]])])[0].round.label,'Semi-finals');
});
test('standings retain nested conference and group tables',()=>{
 const data={children:[{name:'East',standings:{entries:[{team:team('A')}]}},{name:'West',children:[{name:'Group 1',standings:{entries:[{team:team('B')}]}}]}]};
 assert.deepEqual(tableGroups(data).map(g=>g.name),['East','Group 1']);
});
test('weekly XI uses recorded appearances and leaves uncovered positions empty',()=>{
 const stats=(goals,assists)=>[{name:'appearances',value:1},{name:'totalGoals',value:goals},{name:'goalAssists',value:assists}];
 const d={header:{competitions:[{status:{type:{completed:true}},competitors:[{id:'A',score:'2'},{id:'B',score:'0'}]}]},rosters:[{team:team('A'),roster:[{starter:true,athlete:{id:'1',displayName:'Forward'},position:{abbreviation:'F'},stats:stats(2,1)},{starter:false,athlete:{id:'2',displayName:'Unused bench player'},position:{abbreviation:'G'},stats:[]}]}]};
 const xi=statisticalXI([d]);assert.equal(xi.candidates,1);assert.equal(xi.rows[0].players[0].points,11);assert.equal(xi.rows[3].players.length,0);assert.equal(xi.complete,false);assert.equal(xi.covered,1);
});
