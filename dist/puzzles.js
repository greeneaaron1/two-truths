'use strict';
const exampleEntries=[
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
const exampleLabels={field:['Scientists','Writers','Musicians'],nation:['British','American','French']};

const puzzles=[
  {
    id:'000', example:true, entries:exampleEntries, labels:exampleLabels,
    truths:{field:'Every person is a scientist, writer, or musician.',nation:'Every person is British, American, or French.'},
    tips:{field:['Look at what these people devoted their lives to.','Their work falls into three different callings.','Think scientists, writers, and musicians.'],nation:['Look beyond what these people did.','Think about the countries these people come from.','Think British, American, and French.']}
  },
  {
    id:'001', example:false,
    labels:{field:['Actors','Athletes','Directors'],nation:['British','American','Australian']},
    truths:{field:'These people are known as actors, athletes, or directors.',nation:'Every person is British, American, or Australian.'},
    tips:{field:['Think about how these people became famous.','Some perform on screen, some compete, and some work behind the camera.','Think actors, athletes, and directors.'],nation:['Look beyond their careers.','Think about the countries they are associated with.','Think British, American, and Australian.']},
    entries:[
      {id:'dench',name:'Judi Dench',aliases:['dench','judi dench','dame judi dench'],clue:'Who played M, James Bond’s boss, in GoldenEye and Skyfall?',field:0,nation:0},
      {id:'serena',name:'Serena Williams',aliases:['serena','serena williams'],clue:'Which Williams sister won 23 Grand Slam singles titles, including seven at Wimbledon?',field:1,nation:1},
      {id:'luhrmann',name:'Baz Luhrmann',aliases:['luhrmann','baz luhrmann'],clue:'Who directed the dazzling musicals Strictly Ballroom and Moulin Rouge!?',field:2,nation:2},
      {id:'farah',name:'Mo Farah',aliases:['farah','mo farah','mohamed farah','sir mo farah'],clue:'Which runner did the “Mobot” after winning the 5,000m and 10,000m at London 2012?',field:1,nation:0},
      {id:'washington',name:'Denzel Washington',aliases:['washington','denzel','denzel washington'],clue:'Who won acting Oscars for Glory and Training Day?',field:0,nation:1},
      {id:'freeman',name:'Cathy Freeman',aliases:['freeman','cathy freeman','catherine freeman'],clue:'Who lit the Olympic cauldron at Sydney 2000, then won the women’s 400m?',field:1,nation:2},
      {id:'lee',name:'Spike Lee',aliases:['spike lee','shelton jackson lee'],clue:'Who directed Do the Right Thing and BlacKkKlansman?',field:2,nation:1},
      {id:'blanchett',name:'Cate Blanchett',aliases:['blanchett','cate blanchett','catherine blanchett'],clue:'Who played the elf queen Galadriel in The Lord of the Rings films?',field:0,nation:2},
      {id:'loach',name:'Ken Loach',aliases:['loach','ken loach','kenneth loach'],clue:'Who directed Kes and I, Daniel Blake, films about ordinary lives and social injustice?',field:2,nation:0}
    ]
  }
];
