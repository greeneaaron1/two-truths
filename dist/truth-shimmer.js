'use strict';

// Finish the current sweep on pointer leave; only repeat while still hovered.
(() => {
  const word = document.querySelector('.truth-accent');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hover = window.matchMedia('(hover: hover)');
  let hovered = false;
  let active = null;

  function sweep(delay = 0) {
    if (active || motion.matches) return;
    const animation = word.animate([
      { backgroundPosition: '100% center', offset: 0 },
      { backgroundPosition: '0% center', offset: .5 },
      { backgroundPosition: '0% center', offset: 1 }
    ], { duration: 2600, delay, easing: 'ease-in-out' });
    active = animation;
    animation.finished.then(() => {
      if (active !== animation) return;
      active = null;
      if (hovered) sweep();
    }, () => {
      if (active === animation) active = null;
    });
  }

  word.addEventListener('pointerenter', () => {
    if (!hover.matches) return;
    hovered = true;
    sweep();
  });
  word.addEventListener('pointerleave', () => { hovered = false; });
  word.addEventListener('pointercancel', () => { hovered = false; });
  motion.addEventListener('change', () => {
    active?.cancel();
    active = null;
    if (hovered) sweep();
  });
  sweep(200);
})();
