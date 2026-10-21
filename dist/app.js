'use strict';
const puzzle=[
{id:'newton',name:'Isaac Newton',aliases:['newton','isaac newton','sir isaac newton'],subject:'SCIENCE',clue:'Whose laws explain motion, gravity, and that very famous falling apple?',field:0,nation:0},
{id:'prince',name:'Prince',aliases:['prince','prince rogers nelson'],subject:'MUSIC',clue:'Which one-name musician gave us “Purple Rain” and “When Doves Cry”?',field:2,nation:1},
{id:'hugo',name:'Victor Hugo',aliases:['hugo','victor hugo'],subject:'LITERATURE',clue:'Who wrote Les Misérables and The Hunchback of Notre-Dame?',field:1,nation:2},
{id:'pasteur',name:'Louis Pasteur',aliases:['pasteur','louis pasteur'],subject:'SCIENCE',clue:'Which scientist lends his name to the process that makes milk safer to drink?',field:0,nation:2},
{id:'austen',name:'Jane Austen',aliases:['austen','jane austen'],subject:'LITERATURE',clue:'Which novelist introduced us to Elizabeth Bennet and Mr. Darcy?',field:1,nation:0},
{id:'bowie',name:'David Bowie',aliases:['bowie','david bowie'],subject:'MUSIC',clue:'Which musician’s alter ego was the otherworldly Ziggy Stardust?',field:2,nation:0},
{id:'morrison',name:'Toni Morrison',aliases:['morrison','toni morrison'],subject:'LITERATURE',clue:'Who wrote Beloved and became the first Black woman to win the Nobel Prize in Literature?',field:1,nation:1},
{id:'debussy',name:'Claude Debussy',aliases:['debussy','claude debussy'],subject:'MUSIC',clue:'Which composer wrote the piano piece “Clair de lune” in Suite bergamasque?',field:2,nation:2},
{id:'feynman',name:'Richard Feynman',aliases:['feynman','richard feynman','richard p feynman'],subject:'SCIENCE',clue:'Which physicist gives his name to diagrams that track interactions between subatomic particles?',field:0,nation:1}
];
const labels={field:['Scientists','Writers','Musicians'],nation:['British','American','French']};
const KEY='two-truths-example-v1';
const fresh=()=>({solved:[],hints:{},revealed:[],phase:0,axis:null,groups:[],second:[],mistakes:0,clueMistakes:0,nudges:{},nudgeCount:0});
let state=fresh();try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&Array.isArray(saved.solved)&&[0,1,2,3].includes(saved.phase))state={...fresh(),...saved}}catch{}
let selected=[],notice='',order=puzzle.map(p=>p.id),celebrate=null,animateMatrix=false,turning=false,phaseAnimation=null;
const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const truth=axis=>axis==='field'?'Every person is a scientist, writer, or musician.':'Every person is British, American, or French.';

const $=s=>document.querySelector(s),game=$('#game');
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function say(t){$('#announce').textContent=t}
function norm(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function setNotice(t){notice=t;render();say(t)}
function puzzleComplete(){return state.groups.length===3&&state.second.length===3}
function render(){turning=false;phaseAnimation?.cancel();phaseAnimation=null;save();for(let i=0;i<3;i++){const b=$('#step'+i);b.classList.toggle('active',i===(state.phase===0?0:state.phase===3?2:1));b.disabled=i===1&&state.solved.length<9||i===2&&!puzzleComplete();b.setAttribute('aria-current',b.classList.contains('active')?'step':'false')}
if(state.phase===0)renderClues();else if(state.phase===3)renderResults();else renderGroups();celebrate=null;animateMatrix=false;}
function renderClues(){game.innerHTML=`<div class="section-head clue-progress"><div class="progress"><span class="progress-dots">${puzzle.map(p=>`<i class="${state.solved.includes(p.id)?'on':''} ${celebrate===p.id?'dot-pop':''}"></i>`).join('')}</span>${state.solved.length} / 9 solved</div></div><div class="clue-grid">${puzzle.map((p,i)=>{const done=state.solved.includes(p.id),h=state.hints[p.id]||0;return `<article class="card ${done?'solved':''} ${celebrate===p.id?'answer-pop':''}"><div class="card-top"><span class="clue-number">${String(i+1).padStart(2,'0')}</span>${done?'<span class="check" aria-label="Solved">✓</span>':''}</div><p class="question">${p.clue}</p>${done?`<p class="answer-name">${p.name}</p><span class="answer-note">${state.revealed.includes(p.id)?'Revealed':'Correct'}</span>`:`<form data-id="${p.id}"><div class="answerline"><input autocomplete="off" spellcheck="false" aria-label="Answer to clue ${i+1}" placeholder="${h?hintText(p,h):'Your answer…'}"><button aria-label="Submit answer to clue ${i+1}">↗</button></div><div class="card-feedback" role="status"></div></form><div class="card-tools"><button data-hint="${p.id}">Letter hint${h?' · '+h:''}</button><button data-reveal="${p.id}">Reveal</button></div>`}</article>`}).join('')}</div><div class="bottom-bar"><button class="primary" id="begin" ${state.solved.length===9?'':'disabled'}>Find the truths <span>↗</span></button></div>`;
game.querySelectorAll('form').forEach(f=>f.onsubmit=e=>{e.preventDefault();const p=puzzle.find(p=>p.id===f.dataset.id),value=f.querySelector('input').value;if(!value.trim())return; if(p.aliases.some(a=>norm(a)===norm(value))){state.solved.push(p.id);celebrate=p.id;say(p.name+'. Correct.');render();const next=game.querySelector('input');if(next)next.focus()}else{state.clueMistakes++;save();f.querySelector('.card-feedback').textContent='Not quite. Try again.';say('Not quite. Try again.')}});
game.querySelectorAll('[data-hint]').forEach(b=>b.onclick=()=>{const id=b.dataset.hint;state.hints[id]=Math.min((state.hints[id]||0)+1,puzzle.find(p=>p.id===id).name.replace(/ /g,'').length-1);render();const f=game.querySelector(`[data-id="${id}"] input`);f.focus();say('Letter hint: '+f.placeholder)});
game.querySelectorAll('[data-reveal]').forEach(b=>b.onclick=()=>{state.solved.push(b.dataset.reveal);state.revealed.push(b.dataset.reveal);celebrate=b.dataset.reveal;render();say('Answer revealed: '+puzzle.find(p=>p.id===b.dataset.reveal).name)});
$('#begin').onclick=()=>{state.phase=1;notice='';selected=[];render();game.scrollIntoView({behavior:'smooth',block:'start'})};}
function hintText(p,n){let count=0;return [...p.name].map(c=>c===' '?' ':++count<=n?c:'_').join(' ')}
function currentAxis(){return state.phase===1?state.axis:(state.axis==='field'?'nation':'field')}
function activeGroups(){return state.phase===1?state.groups:state.second}
function renderGroups(){const round=state.phase,groups=activeGroups(),axis=currentAxis(),used=groups.flatMap(g=>puzzle.filter(p=>p[axis]===g).map(p=>p.id)),available=order.filter(id=>!used.includes(id));game.innerHTML=`<div class="section-head"><div><span class="round-label">${round===1?'First truth':'Second truth'}</span><h2>Find three groups of three.</h2><p class="sub">${round===1?'Each group has its own connection.':'Find three new groups, with a different connection for each.'}</p></div><div class="progress">${groups.length} / 3 groups found</div></div>${groups.map((g,i)=>`<div class="solved-group c${i} ${celebrate==='group'&&i===groups.length-1?'group-pop':''}"><strong>${labels[axis][g]}</strong><p>${puzzle.filter(p=>p[axis]===g).map(p=>p.name).join(' · ')}</p></div>`).join('')}${groups.length<3?`<div class="tile-grid">${available.map(id=>{const p=puzzle.find(p=>p.id===id);return `<button class="tile ${selected.includes(id)?'selected':''}" data-tile="${id}" aria-pressed="${selected.includes(id)}">${p.name}${round===2?`<small>${labels[state.axis][p[state.axis]]}</small>`:''}</button>`}).join('')}</div><p class="message" role="status">${notice||''}</p><div class="group-toolbar"><button class="secondary" id="shuffle">Shuffle ↺</button><button class="secondary" id="clear" ${selected.length?'':'disabled'}>Deselect</button><button class="primary" id="checkgroup" ${selected.length===3?'':'disabled'}>Check group${selected.length?' · '+selected.length+'/3':''}</button></div><div class="group-toolbar"><button class="quiet" id="groupHint">${selected.length===3?'Hint for this trio':'Hint'}</button></div>`:`<div class="round-complete"><h2>${round===1?'First truth found.':'Second truth found.'}</h2><p class="truth-statement">${truth(axis)}</p><button class="primary" id="next" style="margin-top:22px">${round===1?'Find the second truth':'See results'} <span>↗</span></button></div>`}`;
game.querySelectorAll('[data-tile]').forEach(b=>b.onclick=()=>{const id=b.dataset.tile;if(selected.includes(id))selected=selected.filter(x=>x!==id);else if(selected.length<3)selected.push(id);else{say('Three selected. Deselect a tile to choose another.');return}notice='';render();game.querySelector(`[data-tile="${id}"]`)?.focus()});
if($('#checkgroup'))$('#checkgroup').onclick=checkGroup;if($('#clear'))$('#clear').onclick=()=>{selected=[];notice='';render()};if($('#shuffle'))$('#shuffle').onclick=()=>{for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}render()};if($('#groupHint'))$('#groupHint').onclick=giveNudge;if($('#next'))$('#next').onclick=()=>{if(turning)return;if(round===1&&!reducedMotion()){transitionToSecondTruth()}else{state.phase++;selected=[];notice='';animateMatrix=state.phase===3;render();game.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'})}};}
async function transitionToSecondTruth(){
turning=true;
$('#next').disabled=true;
say('Find the second truth.');
game.scrollIntoView({behavior:'smooth',block:'start'});
const outgoing=game.animate([
  {opacity:1,transform:'translateY(0)'},
  {opacity:0,transform:'translateY(-6px)'}
],{duration:420,easing:'cubic-bezier(.4,0,.6,1)',fill:'forwards'});
phaseAnimation=outgoing;
try{await outgoing.finished}catch{return}
if(!turning)return;
state.phase=2;selected=[];notice='';render();
const incoming=game.animate([
  {opacity:0,transform:'translateY(8px)'},
  {opacity:1,transform:'translateY(0)'}
],{duration:560,easing:'cubic-bezier(.2,.65,.3,1)',fill:'both'});
phaseAnimation=incoming;
try{await incoming.finished}catch{return}
if(phaseAnimation===incoming){incoming.cancel();phaseAnimation=null}
}
function giveNudge(){
const axis=currentAxis(),key=String(state.phase),level=state.nudges[key]||0;
state.nudgeCount++;
if(selected.length===3){
const chosen=selected.map(id=>puzzle.find(p=>p.id===id));
const axes=axis?[axis]:['field','nation'];
const best=Math.max(...axes.map(a=>Math.max(...[0,1,2].map(g=>chosen.filter(p=>p[a]===g).length))));
setNotice(best===3?'This trio shares a truth. Check your group.':best===2?'Two of these belong together. Try swapping one person.':'These three need a fresh arrangement. Try swapping two people.');
}else{
state.nudges[key]=Math.min(level+1,3);
const tips=axis==='field'?['Look at what these people devoted their lives to.','Their work falls into three different callings.','Think scientists, writers, and musicians.']:axis==='nation'?['Look beyond what these people did.','Think about the countries these people come from.','Think British, American, and French.']:['One truth describes something about their lives. Try a trio you can describe in one phrase.','You could explore what they did, or where they came from.','Try grouping by calling or nationality. Either truth can come first.'];
setNotice(tips[Math.min(level,2)]);
}}

function checkGroup(){if(selected.length!==3)return;const chosen=selected.map(id=>puzzle.find(p=>p.id===id));let axis=currentAxis();if(!axis)axis=['field','nation'].find(a=>chosen.every(p=>p[a]===chosen[0][a]));if(axis&&chosen.every(p=>p[axis]===chosen[0][axis])){if(state.phase===1&&!state.axis)state.axis=axis;activeGroups().push(chosen[0][axis]);selected=[];notice='Group found.';celebrate='group';say(labels[axis][chosen[0][axis]]+'. Group found.');render()}else{state.mistakes++;setNotice('Not this trio. Try a different connection.' );}}
function renderResults(){const hintCount=Object.values(state.hints).reduce((a,b)=>a+b,0);game.innerHTML=`<div class="result-intro"><h2>Both truths found.</h2><div class="truth-pair"><p><span>01</span> ${truth(state.axis)}</p><p><span>02</span> ${truth(state.axis==='field'?'nation':'field')}</p></div></div><div class="matrix ${animateMatrix?'matrix-reveal':''}" role="table" aria-label="People by profession and nationality"><span></span>${labels.nation.map(n=>`<div class="col-label" role="columnheader">${n}</div>`).join('')}${labels.field.map((f,i)=>`<div class="row-label" role="rowheader">${f}</div>${labels.nation.map((n,j)=>`<div class="matrix-cell row${i}" style="--cell:${i*3+j}" role="cell">${puzzle.find(p=>p.field===i&&p.nation===j).name}</div>`).join('')}`).join('')}</div><div class="result-actions"><button class="primary" id="share">Copy my result <span>↗</span></button><p class="message" id="copyStatus" role="status"></p></div>`;$('#share').onclick=async()=>{const text=`Two Truths · Puzzle 001\n${(state.axis==='field'?'🟩':'🟪').repeat(3)} → ${(state.axis==='field'?'🟪':'🟩').repeat(3)}\nBoth truths found!\nFirst truth: ${state.axis==='field'?'🟩':'🟪'}\nDiscovery path: ${state.groups.map(g=>['●','◆','▲'][g]).join(' ')} / ${state.second.map(g=>['●','◆','▲'][g]).join(' ')}\n${9-state.revealed.length}/9 recalled · ${hintCount} letter ${hintCount===1?'hint':'hints'} · ${state.nudgeCount} ${state.nudgeCount===1?'nudge':'nudges'} · ${state.mistakes} grouping misses`;try{await navigator.clipboard.writeText(text);$('#copyStatus').textContent='Result copied.'}catch{$('#copyStatus').textContent=text;$('#copyStatus').style.whiteSpace='pre-line'} };}
$('#how').onclick=()=>$('#help').showModal();
let helpBackdropPress=false;
function outsideHelp(event){const rect=$('#help').getBoundingClientRect();return event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom}
$('#help').addEventListener('pointerdown',event=>{helpBackdropPress=event.target===$('#help')&&outsideHelp(event)});
$('#help').addEventListener('click',event=>{if(helpBackdropPress&&event.target===$('#help')&&outsideHelp(event))$('#help').close();helpBackdropPress=false});
$('#help .close').onclick=()=>$('#help').close();$('.close-help').onclick=()=>$('#help').close();
$('#step0').onclick=()=>{state.phase=0;render()};$('#step1').onclick=()=>{state.phase=state.second.length===3?2:state.groups.length===3?2:1;selected=[];notice='';render()};$('#step2').onclick=()=>{if(!puzzleComplete())return;state.phase=3;selected=[];notice='';render()};render();
