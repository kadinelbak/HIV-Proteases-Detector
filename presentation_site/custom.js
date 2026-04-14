// HIV Presentation  custom.js
// All interactivity: Reveal.js init, stepper, tabs, per-slide demos

'use strict';

console.log('[HIV] custom.js loaded — DOMContentLoaded listener registered');
console.log('[HIV] typeof Reveal =', typeof Reveal);

window.addEventListener('DOMContentLoaded', function () {
  console.log('[HIV] DOMContentLoaded fired');
  console.log('[HIV] typeof Reveal at DOM ready =', typeof Reveal);

  if (typeof Reveal === 'undefined') {
    console.error('[HIV] FATAL: Reveal is not defined — CDN script may have failed to load. Check Network tab in DevTools.');
    return;
  }

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
    console.log('[HIV] Reveal initialized OK — starting slide index =', idx);
    updateStepper(idx);
    setupTabs();
    setupInteractivesForSlide(idx);
    setBokehSlide(idx);
  }).catch(function(err) {
    console.error('[HIV] Reveal.initialize() failed:', err);
  });

  deck.on('slidechanged', function (event) {
    console.log('[HIV] slidechanged → indexh =', event.indexh);
    updateStepper(event.indexh);
    setupTabs();
    setupInteractivesForSlide(event.indexh);
    setBokehSlide(event.indexh);
  });

  //  Stepper & Progress Bar 
  function updateStepper(idx) {
    var steps = document.querySelectorAll('.step');
    console.log('[HIV] updateStepper(', idx, ') — steps found:', steps.length);
    steps.forEach(function (el, i) {
      el.classList.toggle('active', i === idx);
    });
    var bar = document.getElementById('global-progress');
    console.log('[HIV] progress bar element:', bar ? 'found' : 'NOT FOUND');
    if (bar && steps.length) {
      bar.style.width = ((idx + 1) / steps.length * 100) + '%';
    }
  }

  //  Tab Cards 
  // Buttons: data-tab="panelId"  |  Panels: data-panel="panelId"
  // Uses inline display style  avoids Tailwind/Reveal CSS conflicts
  function setupTabs() {
    var cards = document.querySelectorAll('.card');
    console.log('[HIV] setupTabs() — .card elements found:', cards.length);
    cards.forEach(function (card, ci) {
      var tabs = card.querySelectorAll('.tab-btn');
      console.log('[HIV]   card[' + ci + '] has', tabs.length, 'tab buttons');
      tabs.forEach(function (tab) {
        if (tab._tabReady) return;
        tab._tabReady = true;
        console.log('[HIV]   binding click to tab data-tab="' + tab.getAttribute('data-tab') + '"');
        tab.addEventListener('click', function (e) {
          e.stopPropagation();
          tabs.forEach(function (t) { t.classList.remove('tab-active'); });
          tab.classList.add('tab-active');
          var target = tab.getAttribute('data-tab');
          console.log('[HIV] tab clicked → target panel =', target);
          card.querySelectorAll('.tab-panel').forEach(function (panel) {
            var panelId = panel.getAttribute('data-panel');
            var visible = panelId === target;
            panel.style.display = visible ? '' : 'none';
            console.log('[HIV]   panel[' + panelId + '] display =', visible ? 'visible' : 'hidden');
          });
          // Re-trigger interactives when switching to their interactive panel
          if (target === 'int1') setupCostCounter();
          if (target === 'int4') setupMLPDemo();
          if (target === 'int5') setupWeightedScale();
          // Chart.js slides don't use tabs but guard anyway
          if (target === 'int6') setupROCChart();
          if (target === 'int7') setupPRChart();
          if (target === 'int8') setupAPChart();
        });
      });
    });
  }

  //  Route Interactives by Slide Index 
  function setupInteractivesForSlide(idx) {
    console.log('[HIV] setupInteractivesForSlide(', idx, ')');
    if (idx === 0) setupCostCounter();
    if (idx === 1) setupBitGrid();
    if (idx === 2) setupRandomGuesser();
    if (idx === 3) setupMLPDemo();
    if (idx === 4) setupWeightedScale();
    if (idx === 5) setupROCChart();
    if (idx === 6) setupPRChart();
    if (idx === 7) setupAPChart();
  }

  // ─── Shared ROC/PR curve data (sampled to match actual model output) ─────────
  // ~20 representative points hand-digitised from the actual figures
  var ROC_CURVE = [
    {thr:0.00, fpr:1.00, tpr:1.00},{thr:0.05, fpr:0.72, tpr:0.97},
    {thr:0.10, fpr:0.45, tpr:0.88},{thr:0.15, fpr:0.30, tpr:0.82},
    {thr:0.20, fpr:0.22, tpr:0.79},{thr:0.25, fpr:0.16, tpr:0.74},
    {thr:0.30, fpr:0.10, tpr:0.68},{thr:0.35, fpr:0.07, tpr:0.62},
    {thr:0.40, fpr:0.05, tpr:0.56},{thr:0.45, fpr:0.04, tpr:0.50},
    {thr:0.50, fpr:0.03, tpr:0.44},{thr:0.55, fpr:0.02, tpr:0.38},
    {thr:0.60, fpr:0.01, tpr:0.30},{thr:0.70, fpr:0.01, tpr:0.20},
    {thr:0.80, fpr:0.00, tpr:0.12},{thr:0.90, fpr:0.00, tpr:0.05},
    {thr:1.00, fpr:0.00, tpr:0.00}
  ];
  var PR_CURVE = [
    {thr:0.00, rec:1.00, prec:0.035},{thr:0.05, rec:0.97, prec:0.065},
    {thr:0.10, rec:0.88, prec:0.13},{thr:0.15, rec:0.82, prec:0.22},
    {thr:0.20, rec:0.79, prec:0.30},{thr:0.25, rec:0.74, prec:0.38},
    {thr:0.30, rec:0.68, prec:0.47},{thr:0.35, rec:0.62, prec:0.55},
    {thr:0.40, rec:0.56, prec:0.62},{thr:0.45, rec:0.50, prec:0.68},
    {thr:0.50, rec:0.44, prec:0.73},{thr:0.55, rec:0.38, prec:0.76},
    {thr:0.60, rec:0.30, prec:0.80},{thr:0.70, rec:0.20, prec:0.84},
    {thr:0.80, rec:0.12, prec:0.88},{thr:0.90, rec:0.05, prec:0.92},
    {thr:1.00, rec:0.00, prec:1.00}
  ];
  var N_ACTIVES   = 411;  // 3.5% of ~11,742 test set
  var N_INACTIVES = 11331;

  function interpCurve(curve, thr, xKey, yKey) {
    for (var i = 0; i < curve.length - 1; i++) {
      if (thr >= curve[i].thr && thr <= curve[i+1].thr) {
        var t = (thr - curve[i].thr) / (curve[i+1].thr - curve[i].thr);
        return {
          x: curve[i][xKey] + t * (curve[i+1][xKey] - curve[i][xKey]),
          y: curve[i][yKey] + t * (curve[i+1][yKey] - curve[i][yKey])
        };
      }
    }
    return { x: curve[curve.length-1][xKey], y: curve[curve.length-1][yKey] };
  }

  var _rocChart = null;
  function setupROCChart() {
    var canvas = document.getElementById('roc-chart');
    if (!canvas) return;
    if (_rocChart) { _rocChart.destroy(); _rocChart = null; }
    var ctx = canvas.getContext('2d');
    var fprPts = ROC_CURVE.map(function(p){ return p.fpr; });
    var tprPts = ROC_CURVE.map(function(p){ return p.tpr; });
    var ptData = fprPts.map(function(f,i){ return {x:f, y:tprPts[i]}; });

    _rocChart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'ROC Curve', data: ptData, showLine: true, borderColor: '#2dd4bf',
            backgroundColor: 'rgba(45,212,191,0.08)', borderWidth: 2, pointRadius: 0, fill: true, tension: 0.3 },
          { label: 'Random', data: [{x:0,y:0},{x:1,y:1}], showLine: true,
            borderColor: '#444', borderDash: [4,4], borderWidth: 1.5, pointRadius: 0, fill: false },
          { label: 'Threshold', data: [{x:0.10, y:0.68}], pointRadius: 7,
            pointBackgroundColor: '#f59e0b', backgroundColor: '#f59e0b', borderColor: '#fff', borderWidth: 2 }
        ]
      },
      options: {
        responsive: true, animation: false,
        scales: {
          x: { min:0, max:1, title:{ display:true, text:'False Positive Rate', color:'#9ca3af' },
               ticks:{ color:'#9ca3af' }, grid:{ color:'rgba(255,255,255,0.06)' } },
          y: { min:0, max:1, title:{ display:true, text:'True Positive Rate', color:'#9ca3af' },
               ticks:{ color:'#9ca3af' }, grid:{ color:'rgba(255,255,255,0.06)' } }
        },
        plugins: { legend:{ labels:{ color:'#e5e7eb', boxWidth:12 } }, tooltip:{ enabled:false } },
        backgroundColor: 'transparent'
      }
    });

    function updateROC(val) {
      var thr = val / 100;
      document.getElementById('roc-thresh-label').textContent = thr.toFixed(2);
      var pt = interpCurve(ROC_CURVE, thr, 'fpr', 'tpr');
      _rocChart.data.datasets[2].data = [{x: pt.x, y: pt.y}];
      _rocChart.update('none');
      document.getElementById('roc-tpr').textContent = (pt.y * 100).toFixed(1) + '%';
      document.getElementById('roc-fpr').textContent = (pt.x * 100).toFixed(1) + '%';
      document.getElementById('roc-tp').textContent  = Math.round(pt.y * N_ACTIVES);
      document.getElementById('roc-fp').textContent  = Math.round(pt.x * N_INACTIVES);
    }

    var slider = document.getElementById('roc-slider');
    if (slider) { slider.oninput = function(){ updateROC(Number(this.value)); }; updateROC(30); }
  }

  var _prChart = null;
  function setupPRChart() {
    var canvas = document.getElementById('pr-chart');
    if (!canvas) return;
    if (_prChart) { _prChart.destroy(); _prChart = null; }
    var ctx = canvas.getContext('2d');
    var recPts  = PR_CURVE.map(function(p){ return p.rec; });
    var precPts = PR_CURVE.map(function(p){ return p.prec; });
    var ptData  = recPts.map(function(r,i){ return {x:r, y:precPts[i]}; });

    _prChart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'PR Curve', data: ptData, showLine: true, borderColor: '#818cf8',
            backgroundColor: 'rgba(129,140,248,0.08)', borderWidth: 2, pointRadius: 0, fill: true, tension: 0.3 },
          { label: 'Random (0.035)', data: [{x:0,y:0.035},{x:1,y:0.035}], showLine: true,
            borderColor: '#444', borderDash: [4,4], borderWidth: 1.5, pointRadius: 0, fill: false },
          { label: 'Threshold', data: [{x:0.68, y:0.47}], pointRadius: 7,
            pointBackgroundColor: '#f59e0b', backgroundColor: '#f59e0b', borderColor: '#fff', borderWidth: 2 }
        ]
      },
      options: {
        responsive: true, animation: false,
        scales: {
          x: { min:0, max:1, title:{ display:true, text:'Recall', color:'#9ca3af' },
               ticks:{ color:'#9ca3af' }, grid:{ color:'rgba(255,255,255,0.06)' } },
          y: { min:0, max:1, title:{ display:true, text:'Precision', color:'#9ca3af' },
               ticks:{ color:'#9ca3af' }, grid:{ color:'rgba(255,255,255,0.06)' } }
        },
        plugins: { legend:{ labels:{ color:'#e5e7eb', boxWidth:12 } }, tooltip:{ enabled:false } },
        backgroundColor: 'transparent'
      }
    });

    function updatePR(val) {
      var thr = val / 100;
      document.getElementById('pr-thresh-label').textContent = thr.toFixed(2);
      var pt = interpCurve(PR_CURVE, thr, 'rec', 'prec');
      _prChart.data.datasets[2].data = [{x: pt.x, y: pt.y}];
      _prChart.update('none');
      document.getElementById('pr-recall').textContent    = (pt.x * 100).toFixed(1) + '%';
      document.getElementById('pr-precision').textContent = (pt.y * 100).toFixed(1) + '%';
      var f1 = (pt.x + pt.y > 0) ? (2 * pt.x * pt.y / (pt.x + pt.y)) : 0;
      document.getElementById('pr-f1').textContent = f1.toFixed(3);
    }

    var slider = document.getElementById('pr-slider');
    if (slider) { slider.oninput = function(){ updatePR(Number(this.value)); }; updatePR(30); }
  }

  var _apChart = null;
  var AP_DATA = [
    { label: 'Baseline',         ap: 0.330, desc: 'Standard MLP with 1024-bit Morgan fingerprints (radius 2). The starting point — no additional tuning.' },
    { label: 'Bigger FP (2048)', ap: 0.371, desc: 'Doubled fingerprint size to 2048 bits. More molecular detail captured, best AP overall (+12.4% vs baseline).' },
    { label: 'Radius 3 (2048)',  ap: 0.368, desc: 'Radius 3 + 2048 bits: wider atom neighbourhood. Marginal drop vs radius-2 at same size, suggesting radius 2 is optimal.' },
    { label: 'Lower LR',         ap: 0.358, desc: 'Smaller learning rate + longer training. Improves over baseline but less than feature engineering; diminishing returns.' }
  ];

  function setupAPChart() {
    var canvas = document.getElementById('ap-chart');
    if (!canvas) return;
    if (_apChart) { _apChart.destroy(); _apChart = null; }
    var ctx = canvas.getContext('2d');
    var bestIdx = 1;
    var colors = AP_DATA.map(function(_,i){ return i === bestIdx ? '#2dd4bf' : 'rgba(129,140,248,0.7)'; });

    _apChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: AP_DATA.map(function(d){ return d.label; }),
        datasets: [{
          label: 'Test AP',
          data: AP_DATA.map(function(d){ return d.ap; }),
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1, borderRadius: 6
        }]
      },
      options: {
        responsive: true, animation: { duration: 500 },
        scales: {
          y: { min:0.28, max:0.40, title:{ display:true, text:'Average Precision', color:'#9ca3af' },
               ticks:{ color:'#9ca3af' }, grid:{ color:'rgba(255,255,255,0.06)' } },
          x: { ticks:{ color:'#e5e7eb', maxRotation:0 }, grid:{ display:false } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        onClick: function(evt, elements) {
          if (!elements.length) return;
          var i = elements[0].index;
          var d = AP_DATA[i];
          var detail = document.getElementById('ap-detail');
          if (!detail) return;
          detail.innerHTML =
            '<div class="text-[#2dd4bf] font-bold mb-1">' + d.label + ' &mdash; AP = ' + d.ap.toFixed(3) + '</div>' +
            '<p class="text-gray-300 text-sm">' + d.desc + '</p>';
          var newColors = AP_DATA.map(function(_,j){ return j===i ? '#f59e0b' : (j===bestIdx ? '#2dd4bf' : 'rgba(129,140,248,0.5)'); });
          _apChart.data.datasets[0].backgroundColor = newColors;
          _apChart.data.datasets[0].borderColor = newColors;
          _apChart.update();
        }
      }
    });
  }

  //  Slide 0: Cost Savings Counter 
  function setupCostCounter() {
    var counter = document.getElementById('cost-counter');
    console.log('[HIV] setupCostCounter — #cost-counter:', counter ? 'found' : 'NOT FOUND (element may be on hidden slide)');
    if (!counter) return;
    counter.textContent = '$2,000,000'; // reset before re-animating
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
    console.log('[HIV] setupBitGrid — #bit-grid:', grid ? 'found' : 'NOT FOUND');
    if (!grid || grid._ready) { if (grid && grid._ready) console.log('[HIV] setupBitGrid — already initialized, skipping'); return; }
    grid._ready = true;
    grid.innerHTML = '';
    for (var i = 0; i < 1024; i++) {
      var cell = document.createElement('div');
      cell.style.cssText = 'width:4px;height:4px;background:#23272f;border-radius:2px;';
      cell.dataset.bit = i;
      grid.appendChild(cell);
    }
    var smiles = document.getElementById('smiles-string');
    console.log('[HIV] setupBitGrid — #smiles-string:', smiles ? 'found' : 'NOT FOUND');
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
    console.log('[HIV] setupRandomGuesser — #random-guesser-btn:', btn ? 'found' : 'NOT FOUND');
    console.log('[HIV] setupRandomGuesser — #random-guesser-result:', result ? 'found' : 'NOT FOUND');
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
    console.log('[HIV] setupMLPDemo — #mlp-canvas:', canvas ? 'found' : 'NOT FOUND');
    console.log('[HIV] setupMLPDemo — #fire-signal:', fireBtn ? 'found' : 'NOT FOUND');
    console.log('[HIV] setupMLPDemo — #fire-back:', backBtn ? 'found' : 'NOT FOUND');
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
        if (l >= 0 && l < 3) {
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
    console.log('[HIV] setupWeightedScale — #scale-slider:', slider ? 'found' : 'NOT FOUND');
    console.log('[HIV] setupWeightedScale — #scale-penalty:', penalty ? 'found' : 'NOT FOUND');
    console.log('[HIV] setupWeightedScale — #scale-svg:', svg ? 'found' : 'NOT FOUND');
    if (!slider || !penalty || !svg) return;

    function drawScale(w) {
      // tilt: positive = Inactive (left) sinks. Balanced at w=27. Inactive sinks when penalty is too low.
      var tilt = Math.min(34, Math.max(-24, (27 - w) * 1.2));
      // pivotX: at w=1 (no penalty) fulcrum is near centre (x≈100); at w=27 it shifts right to x=110 (balanced).
      var pivotX = Math.round(100 + (w / 27) * 10);
      svg.innerHTML = [
        '<line x1="' + pivotX + '" y1="62" x2="50"  y2="' + (62 + tilt) + '" stroke="#818cf8" stroke-width="2.5"/>',
        '<line x1="' + pivotX + '" y1="62" x2="170" y2="' + (62 - tilt) + '" stroke="#818cf8" stroke-width="2.5"/>',
        '<rect x="' + (pivotX - 10) + '" y="56" width="20" height="10" rx="4" fill="#818cf8"/>',
        '<polygon points="' + pivotX + ',66 ' + (pivotX + 14) + ',94 ' + (pivotX - 14) + ',94" fill="#23272f" stroke="#818cf8" stroke-width="2"/>',
        '<line x1="' + (pivotX - 20) + '" y1="94" x2="' + (pivotX + 20) + '" y2="94" stroke="#818cf8" stroke-width="3"/>',
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

  // ─── Bokeh Background ───────────────────────────────────────────────────────
  // Palette per slide index: [hue1, hue2] (HSL)
  var BOKEH_PALETTES = [
    [186, 230],  // 0  Vision      teal / indigo
    [186, 260],  // 1  Bridge      teal / violet
    [22,  340],  // 2  Challenge   amber / rose
    [260, 290],  // 3  Brain       indigo / purple
    [270, 186],  // 4  Build       purple / teal
    [186, 140],  // 5  ROC         teal / green
    [140, 186],  // 6  PR          green / teal
    [200, 260],  // 7  AP          blue  / violet
    [230, 186],  // 8  Future      indigo / teal
  ];
  var bokehCanvas = document.getElementById('bokeh-bg');
  var bokehCtx    = bokehCanvas ? bokehCanvas.getContext('2d') : null;
  var bokehParticles = [];
  var bokehPalette = BOKEH_PALETTES[0].slice();
  var bokehTargetPalette = BOKEH_PALETTES[0].slice();
  var bokehRafId = null;

  function initBokeh() {
    if (!bokehCtx) return;
    bokehCanvas.width  = window.innerWidth;
    bokehCanvas.height = window.innerHeight;
    bokehParticles = [];
    for (var i = 0; i < 28; i++) {
      bokehParticles.push({
        x:    Math.random() * bokehCanvas.width,
        y:    Math.random() * bokehCanvas.height,
        r:    18 + Math.random() * 52,
        vx:   (Math.random() - 0.5) * 0.22,
        vy:   (Math.random() - 0.5) * 0.18,
        hue:  bokehPalette[Math.random() < 0.5 ? 0 : 1],
        alpha: 0.04 + Math.random() * 0.07,
      });
    }
  }

  function setBokehSlide(idx) {
    var p = BOKEH_PALETTES[idx] || BOKEH_PALETTES[0];
    bokehTargetPalette = p.slice();
  }

  function animateBokeh() {
    if (!bokehCtx) return;
    var W = bokehCanvas.width, H = bokehCanvas.height;
    bokehCtx.clearRect(0, 0, W, H);
    // Lerp palette toward target
    bokehPalette[0] += (bokehTargetPalette[0] - bokehPalette[0]) * 0.012;
    bokehPalette[1] += (bokehTargetPalette[1] - bokehPalette[1]) * 0.012;
    bokehParticles.forEach(function (p) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -p.r) p.x = W + p.r;
      if (p.x > W + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = H + p.r;
      if (p.y > H + p.r) p.y = -p.r;
      // slowly shift hue toward palette
      var target = bokehPalette[Math.round(Math.random()) < 0.5 ? 0 : 1];
      p.hue += (target - p.hue) * 0.003;
      var g = bokehCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0,   'hsla(' + p.hue + ',70%,62%,' + p.alpha + ')');
      g.addColorStop(1,   'hsla(' + p.hue + ',70%,62%,0)');
      bokehCtx.beginPath();
      bokehCtx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
      bokehCtx.fillStyle = g;
      bokehCtx.fill();
    });
    bokehRafId = requestAnimationFrame(animateBokeh);
  }

  window.addEventListener('resize', function () {
    if (!bokehCtx) return;
    bokehCanvas.width  = window.innerWidth;
    bokehCanvas.height = window.innerHeight;
  });

  initBokeh();
  animateBokeh();
  // ─────────────────────────────────────────────────────────────────────────────

}); // end DOMContentLoaded
