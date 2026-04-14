// HIV Presentation  custom.js
// All interactivity: Reveal.js init, stepper, tabs, per-slide demos

'use strict';

window.addEventListener('DOMContentLoaded', function () {

  //  Reveal.js Init 
  var deck = new Reveal({
    hash: true,
    slideNumber: false,
    transition: 'fade',
    backgroundTransition: 'slide',
    width: 1280,
    height: 720,
    margin: 0.04,
    minScale: 0.2,
    maxScale: 1.5
  });

  deck.initialize().then(function () {
    var idx = deck.getIndices().h;
    updateStepper(idx);
    setupTabs();
    setupInteractivesForSlide(idx);
  });

  deck.on('slidechanged', function (event) {
    updateStepper(event.indexh);
    setupTabs();
    setupInteractivesForSlide(event.indexh);
  });

  //  Stepper & Progress Bar 
  function updateStepper(idx) {
    var steps = document.querySelectorAll('.step');
    steps.forEach(function (el, i) {
      el.classList.toggle('active', i === idx);
    });
    var bar = document.getElementById('global-progress');
    if (bar ; steps.length) {
      bar.style.width = ((idx + 1) / steps.length * 100) + '%';
    }
  }

  //  Tab Cards 
  // Buttons: data-tab="panelId"  |  Panels: data-panel="panelId"
  // Uses inline display style  avoids Tailwind/Reveal CSS conflicts
  function setupTabs() {
    document.querySelectorAll('.card').forEach(function (card) {
      var tabs = card.querySelectorAll('.tab-btn');
      tabs.forEach(function (tab) {
        if (tab._tabReady) return;
        tab._tabReady = true;
        tab.addEventListener('click', function (e) {
          e.stopPropagation();
          tabs.forEach(function (t) { t.classList.remove('tab-active'); });
          tab.classList.add('tab-active');
          var target = tab.getAttribute('data-tab');
          card.querySelectorAll('.tab-panel').forEach(function (panel) {
            panel.style.display = (panel.getAttribute('data-panel') === target) ? '' : 'none';
          });
        });
      });
    });
  }

  //  Route Interactives by Slide Index 
  function setupInteractivesForSlide(idx) {
    if (idx === 0) setupCostCounter();
    if (idx === 1) setupBitGrid();
    if (idx === 2) setupRandomGuesser();
    if (idx === 3) setupMLPDemo();
    if (idx === 4) setupWeightedScale();
  }

  //  Slide 0: Cost Savings Counter 
  function setupCostCounter() {
    var counter = document.getElementById('cost-counter');
    if (!counter) return;
    var start = 2000000, end = 12000, duration = 1800, startTime = null;
    function animate(ts) {
      if (!startTime) startTime = ts;
      var p = Math.min((ts - startTime) / duration, 1);
      counter.textContent = '$' + Math.floor(start - (start - end) * p).toLocaleString();
      if (p < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  //  Slide 1: SMILES Bit-Grid 
  function setupBitGrid() {
    var grid = document.getElementById('bit-grid');
    if (!grid || grid._ready) return;
    grid._ready = true;
    grid.innerHTML = '';
    for (var i = 0; i < 1024; i++) {
      var cell = document.createElement('div');
      cell.style.cssText = 'width:4px;height:4px;background:#23272f;border-radius:2px;';
      cell.dataset.bit = i;
      grid.appendChild(cell);
    }
    var smiles = document.getElementById('smiles-string');
    if (!smiles) return;
    smiles.querySelectorAll('[data-bit]').forEach(function (span) {
      span.style.cursor = 'pointer';
      span.style.padding = '0 2px';
      span.style.borderRadius = '3px';
      span.style.transition = 'background 0.15s';
      span.addEventListener('mouseenter', function () {
        span.style.background = '#818cf844';
        var bit = Number(span.dataset.bit);
        Array.from(grid.children).forEach(function (c, i) {
          c.style.background = (i === bit) ? '#2dd4bf' : '#23272f';
          c.style.boxShadow  = (i === bit) ? '0 0 6px #2dd4bf' : 'none';
        });
      });
      span.addEventListener('mouseleave', function () {
        span.style.background = '';
        Array.from(grid.children).forEach(function (c) {
          c.style.background = '#23272f';
          c.style.boxShadow  = 'none';
        });
      });
    });
  }

  //  Slide 2: Random Guesser 
  function setupRandomGuesser() {
    var btn    = document.getElementById('random-guesser-btn');
    var result = document.getElementById('random-guesser-result');
    if (!btn || !result) return;
    result.style.display = 'none';
    btn.onclick = function () {
      result.textContent = 'Accuracy: 96.5%  but finds 0 actives!';
      result.style.display = '';
    };
  }

  //  Slide 3: MLP Backprop Visualizer 
  function setupMLPDemo() {
    var canvas  = document.getElementById('mlp-canvas');
    var fireBtn = document.getElementById('fire-signal');
    var backBtn = document.getElementById('fire-back');
    if (!canvas || !fireBtn || !backBtn) return;

    var ctx    = canvas.getContext('2d');
    var layers = [6, 6, 3];
    var nodes  = [];
    var fwdPulse = null, bwdPulse = null;

    for (var l = 0; l < 3; l++) {
      nodes[l] = [];
      for (var n = 0; n < layers[l]; n++) {
        nodes[l][n] = {
          x: 50 + l * 120,
          y: 20 + (140 / (layers[l] - 1)) * n
        };
      }
    }

    function draw() {
      ctx.clearRect(0, 0, 340, 180);
      ctx.strokeStyle = '#818cf855'; ctx.lineWidth = 1;
      for (var l = 0; l < 2; l++) {
        for (var i = 0; i < layers[l]; i++) {
          for (var j = 0; j < layers[l + 1]; j++) {
            ctx.beginPath();
            ctx.moveTo(nodes[l][i].x, nodes[l][i].y);
            ctx.lineTo(nodes[l + 1][j].x, nodes[l + 1][j].y);
            ctx.stroke();
          }
        }
      }
      for (var l = 0; l < 3; l++) {
        for (var n = 0; n < layers[l]; n++) {
          ctx.beginPath();
          ctx.arc(nodes[l][n].x, nodes[l][n].y, 6, 0, 2 * Math.PI);
          ctx.fillStyle = '#18181b'; ctx.fill();
          ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 2; ctx.stroke();
        }
      }
      if (fwdPulse) {
        ctx.beginPath(); ctx.arc(fwdPulse.x, fwdPulse.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = '#2dd4bf55'; ctx.fill();
        ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace';
        ctx.fillText('w\xB7x', fwdPulse.x - 8, fwdPulse.y - 13);
      }
      if (bwdPulse) {
        ctx.beginPath(); ctx.arc(bwdPulse.x, bwdPulse.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef444455'; ctx.fill();
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace';
        ctx.fillText('\u2202L', bwdPulse.x - 6, bwdPulse.y - 13);
      }
    }
    draw();

    function runPulse(layerStart, dir, setter) {
      var l = layerStart, n = 0;
      function step() {
        if (l >= 0 ; l < 3) {
          var nd = nodes[l][n % layers[l]];
          setter({ x: nd.x, y: nd.y });
          draw(); n++;
          if (n >= layers[l]) { l += dir; n = 0; }
          setTimeout(step, 55);
        } else { setter(null); draw(); }
      }
      step();
    }

    fireBtn.onclick = function () {
      bwdPulse = null;
      runPulse(0, 1, function (v) { fwdPulse = v; });
    };
    backBtn.onclick = function () {
      fwdPulse = null;
      runPulse(2, -1, function (v) { bwdPulse = v; });
    };
  }

  //  Slide 4: Weighted Scale 
  function setupWeightedScale() {
    var slider  = document.getElementById('scale-slider');
    var penalty = document.getElementById('scale-penalty');
    var svg     = document.getElementById('scale-svg');
    if (!slider || !penalty || !svg) return;

    function drawScale(w) {
      var tilt = (w - 20) * 1.8;
      svg.innerHTML = [
        '<line x1="110" y1="62" x2="50"  y2="' + (62 + tilt) + '" stroke="#818cf8" stroke-width="2.5"/>',
        '<line x1="110" y1="62" x2="170" y2="' + (62 - tilt) + '" stroke="#818cf8" stroke-width="2.5"/>',
        '<rect x="100" y="56" width="20" height="10" rx="4" fill="#818cf8"/>',
        '<polygon points="105,66 115,92 95,92" fill="#23272f" stroke="#818cf8" stroke-width="2"/>',
        '<ellipse cx="50"  cy="' + (72 + tilt) + '" rx="26" ry="12" fill="#818cf8" fill-opacity="0.75"/>',
        '<text x="50"  y="' + (77 + tilt) + '" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">Inactive</text>',
        '<text x="50"  y="' + (60 + tilt) + '" text-anchor="middle" fill="#c4b5fd" font-size="9">40 k</text>',
        '<ellipse cx="170" cy="' + (72 - tilt) + '" rx="26" ry="12" fill="#2dd4bf" fill-opacity="0.85"/>',
        '<text x="170" y="' + (77 - tilt) + '" text-anchor="middle" fill="#18181b" font-size="11" font-weight="bold">Active</text>',
        '<text x="170" y="' + (60 - tilt) + '" text-anchor="middle" fill="#18181b" font-size="9">w=' + w + '</text>'
      ].join('');
    }

    slider.oninput = function () {
      var v = Number(slider.value);
      penalty.textContent = v;
      drawScale(v);
    };
    slider.value = 27;
    penalty.textContent = 27;
    drawScale(27);
  }

}); // end DOMContentLoaded
