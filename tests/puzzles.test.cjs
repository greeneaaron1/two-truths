const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// A small DOM stand-in exercises routing and game state without browser dependencies.
function app(saved={},hash=''){
  const nodes=new Map(),storage=new Map(Object.entries(saved));
  function node(selector){
    if(!nodes.has(selector)){
      const classes=new Set();
      nodes.set(selector,{selector,innerHTML:'',textContent:'',value:'',hidden:false,style:{},
        classList:{toggle(c,on){on?classes.add(c):classes.delete(c)},contains:c=>classes.has(c)},
        showModal(){this.open=true},close(){this.open=false},setAttribute(){},addEventListener(){},focus(){context.document.activeElement=this},scrollIntoView(){},
        querySelectorAll(){return []},querySelector:s=>node(s)});
    }
    return nodes.get(selector);
  }
  const context=vm.createContext({document:{querySelector:node},location:{hash},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    window:{matchMedia:()=>({matches:true}),addEventListener(){},scrollTo(){}},
    navigator:{clipboard:{writeText:async text=>{context.copied=text}}}});
  vm.runInContext(fs.readFileSync('dist/puzzles.js','utf8'),context);
  vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);
  return {run:s=>vm.runInContext(s,context),nodes,storage,context};
}

test('every puzzle has nine unique answers and one person per matrix cell',()=>{
  const a=app();
  a.run(`for(const item of puzzles){
    if(item.entries.length!==9)throw Error('Expected nine clues');
    if(new Set(item.entries.map(p=>p.id)).size!==9)throw Error('Duplicate answer');
    for(const field of [0,1,2])for(const nation of [0,1,2]){
      if(item.entries.filter(p=>p.field===field&&p.nation===nation).length!==1)throw Error('Invalid matrix');
    }
    const aliases=new Map();
    for(const entry of item.entries){
      if(!entry.aliases.some(alias=>norm(alias)===norm(entry.name)))throw Error('Name not accepted');
      for(const alias of entry.aliases){
        if(aliases.has(norm(alias))&&aliases.get(norm(alias))!==entry.id)throw Error('Ambiguous alias');
        aliases.set(norm(alias),entry.id);
      }
    }
  }`);
});

for(const id of ['000','001'])for(const first of ['field','nation']){
  test(`puzzle ${id} can finish with ${first} first and share its own number`,async()=>{
    const a=app({},`#puzzle/${id}`);
    a.run(`state.solved=puzzle.map(p=>p.id);state.phase=1;render();`);
    for(const axis of [first,first==='field'?'nation':'field']){
      for(let group=0;group<3;group++){
        a.run(`selected=puzzle.filter(p=>p['${axis}']===${group}).map(p=>p.id);checkGroup();`);
      }
      a.run(`document.querySelector('#next').onclick();`);
    }
    assert.equal(a.run('state.phase'),3);
    assert.equal(a.run('puzzleComplete()'),true);
    assert.match(a.nodes.get('#game').innerHTML,/Both truths found/);
    await a.nodes.get('#share').onclick();
    assert.match(a.context.copied,new RegExp(`Puzzle ${id}`));
    assert.equal(a.run('puzzle.some(p=>copied.includes(p.name))'),false);
    a.run(`location.hash='#archive';route();`);
    assert.match(a.nodes.get('#archive').innerHTML,/View/);
  });
}

test('legacy example progress survives and stays separate from the latest puzzle',()=>{
  const legacy={solved:['newton'],phase:0};
  const a=app({'two-truths-example-v1':JSON.stringify(legacy)});
  assert.equal(a.run('current.id'),'001');
  assert.equal(a.run('state.solved.length'),0);
  a.run(`state.solved=['dench'];save();location.hash='#puzzle/000';route();`);
  assert.equal(a.run('state.solved[0]'),'newton');
  a.run(`location.hash='#puzzle/001';route();`);
  assert.equal(a.run('state.solved[0]'),'dench');
  const reload=app(Object.fromEntries(a.storage),'#puzzle/000');
  assert.equal(reload.run('state.solved[0]'),'newton');
});

test('archive hides the game and unknown puzzle links show a useful fallback',()=>{
  const a=app({},'#archive');
  assert.equal(a.nodes.get('#archive').hidden,false);
  assert.equal(a.nodes.get('#game').hidden,true);
  assert.match(a.nodes.get('#archive').innerHTML,/Puzzle 000/);
  assert.doesNotMatch(a.nodes.get('#archive').innerHTML,/Judi Dench|Isaac Newton/);
  a.run(`location.hash='#puzzle/999';route();`);
  assert.match(a.nodes.get('#archive').innerHTML,/isn’t available/);
});

test('new puzzles hide clues until Play and remember opening before any answers',async()=>{
  const a=app();
  assert.equal(a.nodes.get('#welcome').hidden,false);
  assert.equal(a.nodes.get('#game').hidden,true);
  assert.equal(a.nodes.get('.steps').hidden,true);
  assert.equal(a.nodes.get('#game').innerHTML,'');
  assert.equal(a.nodes.get('#play-puzzle-label').textContent,"Play today's puzzle");
  await a.nodes.get('#play-puzzle').onclick();
  assert.equal(a.nodes.get('#welcome').hidden,true);
  assert.equal(a.nodes.get('#game').hidden,false);
  assert.equal(a.nodes.get('.steps').hidden,false);
  assert.match(a.nodes.get('#game').innerHTML,/0 \/ 9 solved/);
  const reload=app(Object.fromEntries(a.storage));
  assert.equal(reload.nodes.get('#welcome').hidden,true);
  assert.equal(reload.nodes.get('#game').hidden,false);
  assert.equal(reload.run('state.solved.length'),0);
  reload.run(`location.hash='#archive';route();`);
  assert.match(reload.nodes.get('#archive').innerHTML,/Continue/);
});

test('each unstarted archive puzzle has its own opening and correct button',async()=>{
  const a=app();
  await a.nodes.get('#play-puzzle').onclick();
  a.run(`location.hash='#puzzle/000';route();`);
  assert.equal(a.nodes.get('#welcome').hidden,false);
  assert.equal(a.nodes.get('#game').innerHTML,'');
  assert.equal(a.nodes.get('#play-puzzle-label').textContent,'Play Puzzle 000');
  a.run(`location.hash='#archive';route();`);
  assert.equal(a.nodes.get('#welcome').hidden,true);
  assert.equal(a.nodes.get('#game').hidden,true);
  a.run(`location.hash='#puzzle/000';route();`);
  await a.nodes.get('#play-puzzle').onclick();
  a.run(`location.hash='#puzzle/001';route();`);
  assert.equal(a.nodes.get('#welcome').hidden,true);
  assert.equal(a.run('state.started'),true);
});

test('existing progress, including only hints or wrong guesses, skips the opening',()=>{
  for(const progress of [{solved:['dench']},{hints:{dench:1}},{clueMistakes:1},{phase:1}]){
    const a=app({'two-truths-001-v1':JSON.stringify({solved:[],phase:0,...progress})});
    assert.equal(a.nodes.get('#welcome').hidden,true);
    assert.equal(a.nodes.get('#game').hidden,false);
  }
});

test('welcome preview shows the opening without clearing saved progress',async()=>{
  const progress={started:true,solved:['dench'],hints:{williams:2},phase:1};
  const a=app({'two-truths-001-v1':JSON.stringify(progress)},'#welcome');
  assert.equal(a.nodes.get('#welcome').hidden,false);
  assert.equal(a.nodes.get('#game').hidden,true);
  assert.equal(a.nodes.get('#archive').hidden,true);
  assert.equal(a.run('state.solved[0]'),'dench');
  await a.nodes.get('#play-puzzle').onclick();
  assert.equal(a.nodes.get('#game').hidden,false);
  assert.equal(a.run('state.phase'),1);
  assert.equal(a.run('state.solved[0]'),'dench');
  assert.equal(a.run('state.hints.williams'),2);
});

test('restart requires confirmation and only resets the current puzzle',()=>{
  const a=app({'two-truths-example-v1':JSON.stringify({solved:['newton'],phase:0})});
  a.run(`state.solved=puzzle.map(p=>p.id);state.groups=[0,1,2];state.second=[0,1,2];state.axis='field';state.phase=3;state.roundMistakes={1:4,2:2};state.revealedGroups[1]=[1,2];state.submissions[1]=['dench|farah|lee'];state.drafts={dench:'old draft'};render();`);
  a.nodes.get('#restart').onclick();
  assert.equal(a.nodes.get('#restart-dialog').open,true);
  a.nodes.get('#cancel-restart').onclick();
  assert.equal(a.run('state.solved.length'),9);
  a.nodes.get('#restart').onclick();
  a.nodes.get('#confirm-restart').onclick();
  assert.equal(a.run('state.solved.length'),0);
  assert.equal(a.run('state.phase'),0);
  assert.equal(a.run(`loadState('000').solved[0]`),'newton');
  assert.equal(a.run(`loadState('001').solved.length`),0);
  assert.equal(a.run('errorsRemaining(1)'),4);
  assert.equal(a.run('errorsRemaining(2)'),4);
  assert.equal(a.run('state.revealedGroups[1].length'),0);
  assert.equal(a.run('state.submissions[1].length'),0);
  assert.equal(a.run('Object.keys(state.drafts).length'),0);
});

function readyTruths(){
  const a=app({},'#puzzle/001');
  a.run('state.solved=puzzle.map(entry=>entry.id);state.phase=1;render();');
  return a;
}
function submitIndices(a,indices){a.run(`selected=${JSON.stringify(indices)}.map(index=>puzzle[index].id);checkGroup();`)}

test('truth controls require three tiles, clear selections, and shuffle without consuming errors',()=>{
  const a=readyTruths();
  assert.match(a.nodes.get('#game').innerHTML,/Errors remaining:/);
  assert.match(a.nodes.get('#game').innerHTML,/Deselect All/);
  assert.match(a.nodes.get('#game').innerHTML,/>Submit</);
  submitIndices(a,[0,1]);
  assert.equal(a.run('errorsRemaining()'),4);
  a.nodes.get('#shuffle').onclick();
  assert.equal(a.run('new Set(order).size'),9);
  assert.equal(a.run('selected.length'),2);
  assert.equal(a.run('errorsRemaining()'),4);
  a.nodes.get('#clear').onclick();
  assert.equal(a.run('selected.length'),0);
  assert.equal(a.nodes.get('#checkgroup').disabled,true);
});

test('repeating a wrong trio in another order does not use another error, including after reload',()=>{
  const a=readyTruths();
  submitIndices(a,[0,1,2]);
  assert.equal(a.run('errorsRemaining()'),3);
  submitIndices(a,[2,0,1]);
  assert.equal(a.run('errorsRemaining()'),3);
  assert.equal(a.run('state.mistakes'),1);
  assert.match(a.nodes.get('#game').innerHTML,/already tried/);
  const reloaded=app(Object.fromEntries(a.storage),'#puzzle/001');
  submitIndices(reloaded,[1,2,0]);
  assert.equal(reloaded.run('errorsRemaining()'),3);
  assert.equal(reloaded.run('state.mistakes'),1);
});

test('four errors reveal only the unfound groups and keep the chosen first truth',()=>{
  const a=readyTruths();
  a.run("selected=puzzle.filter(entry=>entry.nation===1).map(entry=>entry.id);checkGroup();");
  assert.equal(a.run('state.axis'),'nation');
  for(const trio of [[0,2,3],[0,2,5],[0,3,5],[2,3,8]])submitIndices(a,trio);
  assert.equal(a.run('errorsRemaining()'),0);
  assert.equal(a.run('state.axis'),'nation');
  assert.equal(a.run('state.groups.length'),3);
  assert.equal(a.run('state.revealedGroups[1].length'),2);
  assert.equal(a.run('state.revealedGroups[1].includes(1)'),false);
  assert.match(a.nodes.get('#game').innerHTML,/First truth revealed/);
  assert.match(a.nodes.get('#game').innerHTML,/1 \/ 3 groups found/);
  assert.doesNotMatch(a.nodes.get('#game').innerHTML,/Find three groups of three/);
  const before=a.run('state.mistakes');
  submitIndices(a,[0,2,3]);
  assert.equal(a.run('state.mistakes'),before);
  a.nodes.get('#next').onclick();
  assert.equal(a.run('state.phase'),2);
  assert.equal(a.run('errorsRemaining()'),4);
});

test('both failed truths finish honestly and sharing does not claim a win',async()=>{
  const a=readyTruths();
  for(const trio of [[0,1,2],[0,1,3],[0,1,5],[0,2,4]])submitIndices(a,trio);
  assert.equal(a.run('state.revealedGroups[1].length'),3);
  a.nodes.get('#next').onclick();
  assert.equal(a.run('errorsRemaining()'),4);
  for(const trio of [[0,1,2],[0,1,5],[1,2,4],[2,3,4]])submitIndices(a,trio);
  assert.equal(a.run('state.revealedGroups[2].length'),3);
  assert.equal(a.run('state.mistakes'),8);
  a.nodes.get('#next').onclick();
  assert.equal(a.run('state.phase'),3);
  assert.match(a.nodes.get('#game').innerHTML,/Puzzle complete/);
  assert.doesNotMatch(a.nodes.get('#game').innerHTML,/Both truths found/);
  await a.nodes.get('#share').onclick();
  assert.match(a.context.copied,/Both truths revealed/);
  assert.match(a.context.copied,/○ ○ ○ \/ ○ ○ ○/);
  assert.equal(a.run('puzzle.some(entry=>copied.includes(entry.name))'),false);
});

test('legacy mistakes do not exhaust the new error allowance or alter completed progress',()=>{
  const old={started:true,solved:['dench'],phase:1,mistakes:15,axis:'nation',groups:[1],second:[]};
  const a=app({'two-truths-001-v1':JSON.stringify(old)},'#puzzle/001');
  assert.equal(a.run('errorsRemaining()'),4);
  assert.equal(a.run('state.groups[0]'),1);
  assert.equal(a.run('state.mistakes'),15);
});

test('drafts survive navigation and reload, stay per-puzzle, and are escaped in input attributes',()=>{
  const draft='"><img src=x onerror=alert(1)>';
  const a=app({'two-truths-001-v1':JSON.stringify({started:true,solved:[],phase:0,drafts:{dench:draft}})},'#puzzle/001');
  assert.match(a.nodes.get('#game').innerHTML,/value="&quot;&gt;&lt;img/);
  assert.doesNotMatch(a.nodes.get('#game').innerHTML,/<img src=x/);
  a.run("location.hash='#archive';route();location.hash='#puzzle/000';route();");
  assert.equal(a.run('Object.keys(state.drafts).length'),0);
  const reloaded=app(Object.fromEntries(a.storage),'#puzzle/001');
  assert.equal(reloaded.run('state.drafts.dench'),draft);
});

test('clue focus proceeds from the answered card rather than the earliest empty card',()=>{
  const a=app();
  a.run('focusAfterClue(puzzle[5].id)');
  assert.equal(a.context.document.activeElement.selector,'form[data-id="lee"] input');
});

test('Play in instructions starts the opening puzzle and Continue only dismisses during play',async()=>{
  const a=app();
  a.nodes.get('#how').onclick();
  assert.match(a.nodes.get('.close-help').innerHTML,/Play/);
  await a.nodes.get('.close-help').onclick();
  assert.equal(a.nodes.get('#help').open,false);
  assert.equal(a.nodes.get('#game').hidden,false);
  assert.equal(a.run('state.started'),true);
  a.nodes.get('#how').onclick();
  assert.match(a.nodes.get('.close-help').innerHTML,/Continue/);
  await a.nodes.get('.close-help').onclick();
  assert.equal(a.run('state.phase'),0);
  assert.equal(a.nodes.get('#help').open,false);
});


test('a found truth and a revealed truth remain distinct in results and share text',async()=>{
  const a=readyTruths();
  for(let group=0;group<3;group++)a.run(`selected=puzzle.filter(entry=>entry.nation===${group}).map(entry=>entry.id);checkGroup();`);
  assert.equal(a.run('errorsRemaining()'),4);
  a.nodes.get('#next').onclick();
  for(const trio of [[0,1,2],[0,1,3],[0,1,5],[0,2,4]])submitIndices(a,trio);
  a.nodes.get('#next').onclick();
  assert.match(a.nodes.get('#game').innerHTML,/01 · Found/);
  assert.match(a.nodes.get('#game').innerHTML,/02 · Revealed/);
  await a.nodes.get('#share').onclick();
  assert.match(a.context.copied,/Second truth revealed/);
  assert.doesNotMatch(a.context.copied,/Both truths found/);
});
