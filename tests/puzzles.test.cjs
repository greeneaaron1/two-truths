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
      nodes.set(selector,{innerHTML:'',textContent:'',hidden:false,style:{},
        classList:{toggle(c,on){on?classes.add(c):classes.delete(c)},contains:c=>classes.has(c)},
        showModal(){this.open=true},close(){this.open=false},setAttribute(){},addEventListener(){},focus(){},scrollIntoView(){},
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
    assert.match(a.nodes.get('#archive').innerHTML,/Completed/);
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

test('restart requires confirmation and only resets the current puzzle',()=>{
  const a=app({'two-truths-example-v1':JSON.stringify({solved:['newton'],phase:0})});
  a.run(`state.solved=puzzle.map(p=>p.id);state.groups=[0,1,2];state.second=[0,1,2];state.axis='field';state.phase=3;render();`);
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
});
