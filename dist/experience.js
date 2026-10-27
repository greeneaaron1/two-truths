'use strict';

// The same nine pieces form two arrangements, just like the puzzle itself.
(() => {
  document.querySelector('.skip-link').addEventListener('click', () => {
    const main = document.querySelector('main');
    main.focus();
    main.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  const sculpture = document.querySelector('#perspective');
  const counter = document.querySelector('.sculpture-count');
  const welcome = document.querySelector('#welcome');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let shifted = false;
  let hovered = false;
  let timer;

  function shift() {
    shifted = !shifted;
    sculpture.classList.toggle('shifted', shifted);
    counter.textContent = shifted ? '02 / 02' : '01 / 02';
  }
  function schedule() {
    clearInterval(timer);
    if (!motion.matches && !document.hidden && !welcome.hidden && !hovered && document.activeElement !== sculpture) {
      timer = setInterval(shift, 5200);
    }
  }
  sculpture.addEventListener('click', () => { shift(); schedule(); });
  sculpture.addEventListener('pointerenter', () => { hovered = true; clearInterval(timer); });
  sculpture.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  sculpture.addEventListener('focus', () => clearInterval(timer));
  sculpture.addEventListener('blur', schedule);
  motion.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);
  new MutationObserver(schedule).observe(welcome, { attributes: true, attributeFilter: ['hidden'] });
  schedule();
})();
