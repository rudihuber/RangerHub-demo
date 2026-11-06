import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context=vm.createContext({window:{RangerHub:{}},document:{querySelector:()=>({content:'rhv9'}),addEventListener:()=>{}},v24Persist:()=>{},structuredClone,console});
context.window.addEventListener=()=>{};
vm.runInContext(readFileSync(new URL('../rangerhub-navigation-v33.js',import.meta.url),'utf8'),context);
const RH=context.window.RangerHub,ranger={leader:false,kind:'rangers',role:'Ranger'},leader={leader:true,kind:'leaders',role:'Leiter'},admin={...leader,role:'Admin'},stamm={...leader,role:'Stammleiter'};
const own=x=>JSON.parse(JSON.stringify(x)),configuration=(a,d)=>own(RH.navigationConfigurationV33(a,d));
const access=(view,kind,a=leader,data)=>RH.navigationRouteAllowedV33(view,{kind},a,data);
test('Ranger hierarchy is exactly adventure, participation and reference, with no staff lists',()=>{
 const c=configuration(ranger);assert.deepEqual(c.top,['dashboard','messages']);assert.deepEqual(c.groups.map(g=>g.id),['adventure','stamm','foundations']);assert.deepEqual(c.groups.flatMap(g=>g.items),['knowledge','bible','growth','calendar','participation','wisdom']);assert.deepEqual(c.footer,['logout']);
});
test('Leader cockpit is always a fixed group; secondary groups use accordions',()=>{
 const c=configuration(leader);assert.deepEqual(c.groups.map(g=>g.id),['cockpit','teams','development','ideas']);assert.equal(c.groups[0].accordion,undefined);assert.deepEqual(c.groups[0].items,['meetings','exams','tasks','calendar','participation']);assert.ok(c.groups.slice(1).every(g=>g.accordion));
});
test('Admin and Stammleiter retain both permitted editors, regular leaders do not gain them',()=>{
 for(const a of [admin,stamm])assert.deepEqual(configuration(a).groups.at(-1).items,['knowledge-manage','wisdom-manage']);
 const c=configuration(leader,{rights:{local:true},wisdom:{rights:{local:false}}});assert.deepEqual(c.groups.at(-1).items,['knowledge-manage']);
});
test('Ranger direct staff views are blocked while all ordinary personal views work',()=>{
 for(const view of ['rangers','leaders','meetings','leadermeetings','tasks','nature','activities','recipes','impulses','lastmeeting'])assert.equal(access(view,'map',ranger),false,view);
 for(const view of ['dash','calendar','abs','messages','path'])assert.equal(access(view,'map',ranger),true,view);
 for(const kind of ['map','region','topic','task','own-exams','register-confirm','exam-detail','bible','bible-shelf','bible-book','wisdom','wisdom-group','wisdom-module','growth-ranking','expedition-map'])assert.equal(access('knowledge',kind,ranger),true,kind);
});
test('Editor and examination URL guards reuse exact existing rights',()=>{
 for(const kind of ['manage','edit','wisdom-manage','wisdom-edit','exams','grade-confirm','correct','ranger-audit'])assert.equal(access('knowledge',kind,ranger),false,kind);
 assert.equal(access('knowledge','manage',leader),false);assert.equal(access('knowledge','wisdom-manage',leader),false);assert.equal(access('knowledge','correct',leader),false);assert.equal(access('knowledge','exams',leader),true);
 assert.equal(access('knowledge','manage',leader,{rights:{local:true}}),true);assert.equal(access('knowledge','wisdom-manage',leader,{rights:{local:true},wisdom:{rights:{local:false}}}),false);
});
test('Missing identity and leader personal expedition routes are rejected',()=>{
 assert.equal(access('dash','map',null),false);assert.equal(access('knowledge','expedition-map',leader),false);assert.equal(access('knowledge','expedition-map',admin),false);
});
