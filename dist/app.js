'use strict';
const latest=puzzles[puzzles.length-1];
let current=latest,puzzle=current.entries,labels=current.labels;
const storageKey=id=>id==='000'?'two-truths-example-v1':`two-truths-${id}-v1`;
const errorLimit=4;
const fresh=()=>({started:false,solved:[],drafts:{},hints:{},revealed:[],phase:0,axis:null,groups:[],second:[],mistakes:0,roundMistakes:{1:0,2:0},submissions:{1:[],2:[]},revealedGroups:{1:[],2:[]},clueMistakes:0,nudges:{},nudgeCount:0});
function loadState(id){
  try {
    const saved=JSON.parse(localStorage.getItem(storageKey(id)));
    if(saved&&Array.isArray(saved.solved)&&[0,1,2,3].includes(saved.phase))return {
      ...fresh(),...saved,
      drafts:{...saved.drafts},
      roundMistakes:{1:0,2:0,...saved.roundMistakes},
      submissions:{1:[],2:[],...saved.submissions},
      revealedGroups:{1:[],2:[],...saved.revealedGroups}
    };
  }catch{}
  return fresh();
}
let state=loadState(current.id);
let selected=[],notice='',order=puzzle.map(p=>p.id),celebrate=null,animateMatrix=false,turning=false,phaseAnimation=null;
const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const truth=axis=>current.truths[axis];

const $=s=>document.querySelector(s),game=$('#game');
let openingAnimations=[];
function cancelOpening(){openingAnimations.forEach(animation=>animation.cancel());openingAnimations=[]}
function hasStarted(saved){return saved.started||saved.solved.length>0||saved.phase>0||Object.keys(saved.hints).length>0||Object.values(saved.drafts).some(value=>value.trim())||saved.clueMistakes>0}
async function startPuzzle(){
  const button=$('#play-puzzle');
  if(button.disabled)return;
  button.disabled=true;
  if(!reducedMotion()){
    const outgoing=$('#welcome').animate([{opacity:1},{opacity:0}],{duration:240,fill:'forwards'});
    openingAnimations.push(outgoing);
    try{await outgoing.finished}catch{return}
  }
  state.started=true;
  render();
  $('#puzzle-label').focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});
  say(state.phase===0?'Puzzle ready. Solve the nine clues.':'Puzzle resumed.');
  if(reducedMotion()||state.phase!==0)return;
  const columns=window.matchMedia('(max-width: 370px)').matches?1:window.matchMedia('(max-width: 700px)').matches?2:3;
  const elements=[$('.steps'),game.querySelector('.section-head'),...game.querySelectorAll('.card'),game.querySelector('.bottom-bar')];
  elements.forEach((element,index)=>{
    const delay=index<2?index*80:index===elements.length-1?520:200+Math.floor((index-2)/columns)*120;
    const animation=element.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,delay,easing:'cubic-bezier(.2,.65,.3,1)',fill:'both'});
    openingAnimations.push(animation);
    animation.finished.then(()=>animation.cancel(),()=>{});
  });
}
$('#play-puzzle').onclick=startPuzzle;
function save(){try{localStorage.setItem(storageKey(current.id),JSON.stringify(state))}catch{}}
function say(t){$('#announce').textContent=t}
function norm(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function setNotice(t){notice=t;render();say(t)}
function puzzleComplete(){return state.groups.length===3&&state.second.length===3}
function rememberedFocus(){
  const active=document.activeElement;
  if(!active||!game.contains?.(active))return null;
  const form=active.closest?.('form[data-id]');
  if(form&&active.matches('input'))return {selector:`form[data-id="${form.dataset.id}"] input`,start:active.selectionStart,end:active.selectionEnd};
  for(const key of ['hint','reveal','tile'])if(active.dataset[key])return {selector:`[data-${key}="${active.dataset[key]}"]`};
  return active.id?{selector:'#'+active.id}:null;
}
function restoreFocus(focus){
  if(!focus)return;
  const target=game.querySelector(focus.selector);
  if(!target||target.disabled)return;
  target.focus({preventScroll:true});
  if(focus.start!==undefined)target.setSelectionRange?.(focus.start,focus.end);
}
function render(){const focus=rememberedFocus(),clueScroll=state.phase===0?window.scrollY:null;cancelOpening();$('#welcome').hidden=true;$('.steps').hidden=false;game.hidden=false;turning=false;phaseAnimation?.cancel();phaseAnimation=null;save();for(let i=0;i<3;i++){const b=$('#step'+i);b.classList.toggle('active',i===(state.phase===0?0:state.phase===3?2:1));b.disabled=i===1&&state.solved.length<9||i===2&&!puzzleComplete();b.setAttribute('aria-current',b.classList.contains('active')?'step':'false')}
if(state.phase===0)renderClues();else if(state.phase===3)renderResults();else renderGroups();restoreFocus(focus);if(Number.isFinite(clueScroll))window.scrollTo({top:clueScroll,behavior:'instant'});celebrate=null;animateMatrix=false;}
function puzzleLabel(){return `<span class="puzzle-label" id="puzzle-label" tabindex="-1">Puzzle ${current.id}${current.example?' · Example':''}</span>`}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function focusClue(id){
  const input=game.querySelector(`form[data-id="${id}"] input`);
  if(!input)return;
  input.focus({preventScroll:true});
  input.setSelectionRange?.(input.value.length,input.value.length);
}
function focusAfterClue(id){
  const index=puzzle.findIndex(entry=>entry.id===id);
  const following=[...puzzle.slice(index+1),...puzzle.slice(0,index)];
  const next=following.find(entry=>!state.solved.includes(entry.id));
  if(next)focusClue(next.id);else $('#begin').focus({preventScroll:true});
}
function renderClues(){
  game.innerHTML=`<div class="section-head clue-progress">${puzzleLabel()}<div class="progress"><span class="progress-dots">${puzzle.map(p=>`<i class="${state.solved.includes(p.id)?'on':''} ${celebrate===p.id?'dot-pop':''}"></i>`).join('')}</span>${state.solved.length} / 9 solved</div></div><div class="clue-grid">${puzzle.map((p,i)=>{
    const done=state.solved.includes(p.id),h=state.hints[p.id]||0;
    return `<article class="card ${done?'solved':''} ${celebrate===p.id?'answer-pop':''}"><div class="card-top"><span class="clue-number">${String(i+1).padStart(2,'0')}</span>${done?'<span class="check" aria-label="Solved">✓</span>':''}</div><p class="question">${p.clue}</p><div class="card-response"><div class="answer-entry" ${done?'aria-hidden="true" inert':''}><form ${done?'':`data-id="${p.id}"`}><div class="answerline"><input value="${done?'':escapeHtml(state.drafts[p.id]||'')}" autocomplete="off" spellcheck="false" aria-label="Answer to clue ${i+1}" placeholder="${h?hintText(p,h):'Your answer…'}"><button aria-label="Submit answer to clue ${i+1}">→</button></div><div class="card-feedback" role="status"></div></form><div class="card-tools"><button ${done?'':`data-hint="${p.id}"`}>Letter hint${h?' · '+h:''}</button><button ${done?'':`data-reveal="${p.id}"`}>Reveal</button></div></div><div class="answer-result" ${done?'':'aria-hidden="true"'}><p class="answer-name">${p.name}</p><span class="answer-note">${state.revealed.includes(p.id)?'Revealed':'Correct'}</span></div></div></article>`;
  }).join('')}</div><div class="bottom-bar"><button class="primary" id="begin" ${state.solved.length===9?'':'disabled'}>Find two truths <span>→</span></button></div>`;
  game.querySelectorAll('form[data-id]').forEach(form=>{
    const input=form.querySelector('input'),id=form.dataset.id;
    input.oninput=()=>{state.drafts[id]=input.value;form.querySelector('.card-feedback').textContent='';save()};
    form.onsubmit=event=>{
      event.preventDefault();
      const entry=puzzle.find(p=>p.id===id),value=input.value;
      if(!value.trim())return;
      state.drafts[id]=value;
      if(entry.aliases.some(alias=>norm(alias)===norm(value))){
        state.solved.push(id);delete state.drafts[id];celebrate=id;
        render();focusAfterClue(id);say(entry.name+'. Correct.');
      }else{
        state.clueMistakes++;save();form.querySelector('.card-feedback').textContent='Not quite. Try again.';say('Not quite. Try again.');
      }
    };
  });
  game.querySelectorAll('[data-hint]').forEach(button=>button.onclick=()=>{
    const id=button.dataset.hint;
    state.hints[id]=Math.min((state.hints[id]||0)+1,puzzle.find(p=>p.id===id).name.replace(/ /g,'').length-1);
    render();focusClue(id);say('Letter hint: '+hintText(puzzle.find(p=>p.id===id),state.hints[id]));
  });
  game.querySelectorAll('[data-reveal]').forEach(button=>button.onclick=()=>{
    const id=button.dataset.reveal;
    state.solved.push(id);state.revealed.push(id);delete state.drafts[id];celebrate=id;
    render();focusAfterClue(id);say('Answer revealed: '+puzzle.find(p=>p.id===id).name);
  });
  $('#begin').onclick=()=>{state.phase=1;notice='';selected=[];render();game.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'})};
}
function hintText(p,n){let count=0;return [...p.name].map(c=>c===' '?' ':++count<=n?c:'_').join(' ')}
function currentAxis(){return state.phase===1?state.axis:(state.axis==='field'?'nation':'field')}
function activeGroups(){return state.phase===1?state.groups:state.second}
function errorsRemaining(round=state.phase){return Math.max(0,errorLimit-(state.roundMistakes[round]||0))}
function revealedTruth(round){return state.revealedGroups[round].length>0}
function errorsMarkup(round){
  const remaining=errorsRemaining(round);
  return `<div class="errors-remaining" role="status"><span>Errors remaining:</span><span class="error-dots" aria-hidden="true">${Array.from({length:errorLimit},(_,i)=>`<i class="${i<remaining?'available':'spent'} ${celebrate==='miss'&&i===remaining?'error-pop':''}"></i>`).join('')}</span><span class="sr-only">${remaining} of ${errorLimit}</span></div>`;
}
function updateSelection(){
  game.querySelectorAll('[data-tile]').forEach(button=>{
    const on=selected.includes(button.dataset.tile);
    button.classList.toggle('selected',on);button.classList.toggle('missed',false);
    button.setAttribute('aria-pressed',String(on));
  });
  $('#checkgroup').disabled=selected.length!==3;
  $('#clear').disabled=selected.length===0;
  $('#groupHint').textContent=selected.length===3?'Hint for this trio':'Hint';
  $('.message').textContent=notice;
}
function renderGroups(){
  const round=state.phase,groups=activeGroups(),axis=currentAxis(),complete=groups.length===3;
  const revealed=state.revealedGroups[round],found=groups.length-revealed.length;
  const used=groups.flatMap(group=>puzzle.filter(p=>p[axis]===group).map(p=>p.id));
  const available=order.filter(id=>!used.includes(id));
  const title=complete?`${round===1?'First':'Second'} truth ${revealed.length?'revealed':'found'}.`:'Find three groups of three.';
  game.innerHTML=`<div class="puzzle-context">${puzzleLabel()}</div><div class="section-head"><div>${complete?'':`<span class="round-label">${round===1?'First truth':'Second truth'}</span>`}<h2 id="round-title" tabindex="-1">${title}</h2>${complete?'':`<p class="sub">${round===1?'Each group has its own connection.':'Find three new groups with different connections.'}</p>`}</div><div class="progress">${found} / 3 groups found</div></div>${groups.map((group,i)=>`<div class="solved-group c${i} ${celebrate==='group'&&i===groups.length-1?'group-pop':''}"><div class="solved-group-heading"><strong>${labels[axis][group]}</strong>${revealed.includes(group)?'<span class="reveal-tag">Revealed</span>':''}</div><p>${puzzle.filter(p=>p[axis]===group).map(p=>p.name).join(' · ')}</p></div>`).join('')}${!complete?`<div class="tile-grid">${available.map(id=>{
    const entry=puzzle.find(p=>p.id===id);
    return `<button class="tile ${selected.includes(id)?'selected':''} ${celebrate==='miss'&&selected.includes(id)?'missed':''}" data-tile="${id}" aria-pressed="${selected.includes(id)}">${entry.name}${round===2?`<small>${labels[state.axis][entry[state.axis]]}</small>`:''}</button>`;
  }).join('')}</div><p class="message" role="status">${notice||''}</p>${errorsMarkup(round)}<div class="group-toolbar truth-controls"><button class="secondary" id="shuffle">Shuffle</button><button class="secondary" id="clear" ${selected.length?'':'disabled'}>Deselect All</button><button class="primary" id="checkgroup" ${selected.length===3?'':'disabled'}>Submit</button></div><div class="group-toolbar hint-toolbar"><button class="quiet" id="groupHint">${selected.length===3?'Hint for this trio':'Hint'}</button></div>`:`<div class="round-complete">${revealed.length?errorsMarkup(round):''}<p class="truth-statement">${truth(axis)}</p><button class="primary" id="next">${round===1?'Find the second truth':'See results'} <span>→</span></button></div>`}`;
  game.querySelectorAll('[data-tile]').forEach(button=>button.onclick=()=>{
    const id=button.dataset.tile;
    if(selected.includes(id))selected=selected.filter(value=>value!==id);
    else if(selected.length<3)selected.push(id);
    else{say('Three selected. Deselect a tile to choose another.');return}
    notice='';updateSelection();
  });
  if(!complete){
    $('#checkgroup').onclick=checkGroup;
    $('#clear').onclick=()=>{selected=[];notice='';updateSelection();say('Selection cleared.')};
    $('#shuffle').onclick=()=>{
      for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
      render();say('Tiles shuffled.');
    };
    $('#groupHint').onclick=giveNudge;
  }else $('#next').onclick=()=>{
    if(turning)return;
    if(round===1&&!reducedMotion())transitionToSecondTruth();
    else{state.phase++;selected=[];notice='';animateMatrix=state.phase===3;render();game.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'})}
  };
}
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
setNotice(best===3?'This trio shares a truth. Submit this group.':best===2?'Two of these belong together. Try swapping one person.':'These three need a fresh arrangement. Try swapping two people.');
}else{
state.nudges[key]=Math.min(level+1,3);
const tips=axis?current.tips[axis]:['One truth describes something about their lives. Try a trio you can describe in one phrase.','You could explore what they do, or where they come from.','Try grouping by career or nationality. Either truth can come first.'];
setNotice(tips[Math.min(level,2)]);
}}

function checkGroup(){
  if(selected.length!==3||activeGroups().length===3||errorsRemaining()===0)return;
  const chosen=selected.map(id=>puzzle.find(p=>p.id===id));
  if(new Set(selected).size!==3||chosen.some(entry=>!entry))return;
  const key=String(state.phase),signature=[...selected].sort().join('|');
  if(state.submissions[key].includes(signature)){setNotice('You already tried this group.');return}
  state.submissions[key].push(signature);
  let axis=currentAxis();
  if(!axis)axis=['field','nation'].find(value=>chosen.every(entry=>entry[value]===chosen[0][value]));
  if(axis&&chosen.every(entry=>entry[axis]===chosen[0][axis])){
    if(activeGroups().includes(chosen[0][axis]))return;
    if(state.phase===1&&!state.axis)state.axis=axis;
    activeGroups().push(chosen[0][axis]);selected=[];notice='Group found.';celebrate='group';
    render();say(labels[axis][chosen[0][axis]]+'. Group found.');
    if(activeGroups().length===3)$('#round-title').focus({preventScroll:true});
  }else{
    state.mistakes++;state.roundMistakes[key]++;celebrate='miss';
    if(errorsRemaining()===0){
      if(!state.axis)state.axis='field';
      const missing=[0,1,2].filter(group=>!activeGroups().includes(group));
      state.revealedGroups[key]=missing;activeGroups().push(...missing);selected=[];notice='';
      render();say('No errors remaining. The remaining groups are revealed.');$('#round-title').focus({preventScroll:true});
    }else{
      const axes=currentAxis()?[currentAxis()]:['field','nation'];
      const best=Math.max(...axes.map(value=>Math.max(...[0,1,2].map(group=>chosen.filter(entry=>entry[value]===group).length))));
      setNotice(best===2?'One away…':'Not a group. Try again.');
    }
  }
}
function renderResults(){const allFound=!revealedTruth(1)&&!revealedTruth(2);const hintCount=Object.values(state.hints).reduce((a,b)=>a+b,0);game.innerHTML=`<div class="puzzle-context">${puzzleLabel()}</div><div class="result-intro"><h2>${allFound?'Both truths found.':'Puzzle complete.'}</h2><div class="truth-pair"><p><span>01 · ${revealedTruth(1)?'Revealed':'Found'}</span> ${truth(state.axis)}</p><p><span>02 · ${revealedTruth(2)?'Revealed':'Found'}</span> ${truth(state.axis==='field'?'nation':'field')}</p></div></div><div class="matrix ${animateMatrix?'matrix-reveal':''}" role="table" aria-label="People by profession and nationality"><span></span>${labels.nation.map(n=>`<div class="col-label" role="columnheader">${n}</div>`).join('')}${labels.field.map((f,i)=>`<div class="row-label" role="rowheader">${f}</div>${labels.nation.map((n,j)=>`<div class="matrix-cell row${i}" style="--cell:${i*3+j}" role="cell">${puzzle.find(p=>p.field===i&&p.nation===j).name}</div>`).join('')}`).join('')}</div><div class="result-actions"><button class="primary" id="share">Copy my result <span>↗</span></button><p class="message" id="copyStatus" role="status"></p><button class="quiet" id="restart">Start over</button></div>`;$('#restart').onclick=()=>{$('#restart-label').textContent=`Start Puzzle ${current.id} over?`;$('#restart-dialog').showModal()};$('#share').onclick=async()=>{const text=`Two Truths · Puzzle ${current.id}${current.example?' · Example':''}\n${(state.axis==='field'?'🟩':'🟪').repeat(3)} → ${(state.axis==='field'?'🟪':'🟩').repeat(3)}\n${allFound?'Both truths found!':'Puzzle complete · '+(revealedTruth(1)&&revealedTruth(2)?'Both truths revealed':revealedTruth(1)?'First truth revealed':'Second truth revealed')}\nFirst truth: ${state.axis==='field'?'🟩':'🟪'}\nDiscovery path: ${state.groups.map(g=>state.revealedGroups[1].includes(g)?'○':['●','◆','▲'][g]).join(' ')} / ${state.second.map(g=>state.revealedGroups[2].includes(g)?'○':['●','◆','▲'][g]).join(' ')}\n${9-state.revealed.length}/9 recalled · ${hintCount} letter ${hintCount===1?'hint':'hints'} · ${state.nudgeCount} ${state.nudgeCount===1?'nudge':'nudges'} · ${state.mistakes} grouping misses`;try{await navigator.clipboard.writeText(text);$('#copyStatus').textContent='Result copied.'}catch{$('#copyStatus').textContent=text;$('#copyStatus').style.whiteSpace='pre-line'} };}
$('#how').onclick=()=>{$('.close-help').innerHTML=($('#welcome').hidden?'Continue':'Play')+' <span aria-hidden="true">→</span>';$('#help').showModal()};
let helpBackdropPress=false;
function outsideHelp(event){const rect=$('#help').getBoundingClientRect();return event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom}
$('#help').addEventListener('pointerdown',event=>{helpBackdropPress=event.target===$('#help')&&outsideHelp(event)});
$('#help').addEventListener('click',event=>{if(helpBackdropPress&&event.target===$('#help')&&outsideHelp(event))$('#help').close();helpBackdropPress=false});
$('#help .close').onclick=()=>$('#help').close();$('.close-help').onclick=()=>{const opening=!$('#welcome').hidden;$('#help').close();if(opening)return startPuzzle()};
$('#step0').onclick=()=>{state.phase=0;render()};$('#step1').onclick=()=>{state.phase=state.second.length===3?2:state.groups.length===3?2:1;selected=[];notice='';render()};$('#step2').onclick=()=>{if(!puzzleComplete())return;state.phase=3;selected=[];notice='';render()};
$('#cancel-restart').onclick=()=>$('#restart-dialog').close();
$('#confirm-restart').onclick=()=>{state={...fresh(),started:true};selected=[];notice='';order=puzzle.map(p=>p.id);$('#restart-dialog').close();render();say('Puzzle restarted.');$('#puzzle-label').focus();window.scrollTo({top:0,behavior:'instant'})};
window.addEventListener('hashchange',route);
route();

function renderArchive(missing=false){
  $('#archive').innerHTML=`<div class="archive-intro"><h1 id="archive-title" tabindex="-1">Archive<span class="period">.</span></h1>${missing?'<p class="sub intro-description">That puzzle isn’t available. Choose one below.</p>':''}</div><div class="archive-list">${[...puzzles].reverse().map(item=>{
    const saved=loadState(item.id),started=hasStarted(saved),complete=saved.groups.length===3&&saved.second.length===3;
    return `<a class="archive-card" href="#puzzle/${item.id}"><h2>Puzzle ${item.id}</h2><span class="archive-action">${complete?'View':started?'Continue':'Play'} <span aria-hidden="true">↗</span></span></a>`;
  }).join('')}</div>`;
}
function route(){
  save();cancelOpening();turning=false;phaseAnimation?.cancel();phaseAnimation=null;
  if($('#restart-dialog').open)$('#restart-dialog').close();
  say('');
  $('#play-link').setAttribute('href',`#puzzle/${latest.id}`);
  $('.brand').setAttribute('href',`#puzzle/${latest.id}`);
  const hash=location.hash,match=hash.match(/^#puzzle\/(\d{3})$/),requested=match?puzzles.find(item=>item.id===match[1]):null;
  const preview=hash==='#welcome';
  const archive=hash==='#archive'||(hash!==''&&!requested&&!preview);
  $('.intro').hidden=archive;$('#welcome').hidden=true;$('.steps').hidden=archive;game.hidden=archive;$('#archive').hidden=!archive;
  $('#archive-link').setAttribute('aria-current',archive?'page':'false');
  $('#play-link').setAttribute('aria-current',!archive?'page':'false');
  if(archive){renderArchive(hash!=='#archive');document.title='Archive · Two Truths';$('#archive-title').focus();return}
  current=requested||latest;puzzle=current.entries;labels=current.labels;state=loadState(current.id);
  selected=[];notice='';order=puzzle.map(p=>p.id);celebrate=null;animateMatrix=false;
  document.title=`Puzzle ${current.id} · Two Truths`;
  if(preview||!hasStarted(state)){
    game.hidden=true;game.innerHTML='';$('.steps').hidden=true;$('#welcome').hidden=false;
    $('#play-puzzle-label').textContent=current===latest?"Play today's puzzle":`Play Puzzle ${current.id}`;
    $('#play-puzzle').disabled=false;
    if(hash){$('.intro h1').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'})}
    return;
  }
  render();
  if(hash){$('#puzzle-label').focus();window.scrollTo({top:0,behavior:'instant'})}
}
