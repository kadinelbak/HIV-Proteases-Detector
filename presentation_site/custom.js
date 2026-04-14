// All custom interactivity for the presentation is here. Reveal.js, Tailwind, KaTeX, and Framer Motion are loaded via CDN in index.html.

// --- Progress Stepper & Progress Bar ---
let deck;
window.addEventListener('DOMContentLoaded', () => {
  deck = new Reveal({
    hash: true,
    slideNumber: true,
    transition: 'fade',
    backgroundTransition: 'slide',
    width: 1280,
    height: 720,
    margin: 0.04,
    minScale: 0.2,
    maxScale: 1.5
  });
  deck.initialize();

  deck.on('slidechanged', event => {
    let idx = event.indexh;
    for (let i = 1; i <= 6; ++i) {
      document.getElementById('step-' + i).classList.remove('active');
    }
    document.getElementById('step-' + (idx + 1)).classList.add('active');
    // Progress bar
    const progress = document.getElementById('global-progress');
    progress.style.width = ((idx+1)/6*100) + '%';
  });
  // Set initial step
  document.getElementById('step-1').classList.add('active');
  document.getElementById('global-progress').style.width = '16.6%';

  // --- Bit Grid Demo ---
  function setupBitGrid() {
    const bitGrid = document.getElementById('bit-grid');
    if (!bitGrid) return;
    bitGrid.innerHTML = '';
    let highlight = false;
    for(let i=0;i<1024;i++){
      const cell = document.createElement('div');
      cell.style.width = '4px';cell.style.height = '4px';
      cell.style.background = '#23272f';
      cell.style.borderRadius = '2px';
      bitGrid.appendChild(cell);
    }
    // Add a toggle button if not present
    let toggleBtn = document.getElementById('toggle-feature');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'toggle-feature';
      toggleBtn.textContent = 'Highlight Bits';
      toggleBtn.className = 'px-2 py-1 rounded bg-[#818cf8] text-white text-xs font-bold mt-2';
      bitGrid.parentElement.appendChild(toggleBtn);
    }
    toggleBtn.onclick = () => {
      highlight = !highlight;
      for(let i=0;i<1024;i++){
        const cell = bitGrid.children[i];
        if(highlight && (i%33===0||i%17===0||i%7===0)){
          cell.style.background = '#2dd4bf';
          cell.style.boxShadow = '0 0 6px #2dd4bf';
        } else {
          cell.style.background = '#23272f';
          cell.style.boxShadow = 'none';
        }
      }
      toggleBtn.textContent = highlight ? 'Unhighlight Bits' : 'Highlight Bits';
    };
    // Reset state
    highlight = false;
    toggleBtn.textContent = 'Highlight Bits';
  }

  // --- MLP Visualizer ---
  function setupMLPDemo() {
    const mlpCanvas = document.getElementById('mlp-canvas');
    const fireBtn = document.getElementById('fire-signal');
    if (!mlpCanvas || !fireBtn) return;
    const ctx = mlpCanvas.getContext('2d');
    const layers = [32, 16, 8];
    const nodes = [];
    let pulse = null;
    // Layout nodes
    for(let l=0;l<3;l++){
      nodes[l]=[];
      for(let n=0;n<layers[l];n++){
        nodes[l][n]={
          x: 40+l*120,
          y: 20+((140/(layers[l]-1))*(n)),
        };
      }
    }
    function drawMLP(){
      ctx.clearRect(0,0,340,180);
      // Edges
      ctx.strokeStyle='#818cf888';ctx.lineWidth=1;
      for(let l=0;l<2;l++){
        for(let i=0;i<layers[l];i++){
          for(let j=0;j<layers[l+1];j++){
            ctx.beginPath();ctx.moveTo(nodes[l][i].x,nodes[l][i].y);ctx.lineTo(nodes[l+1][j].x,nodes[l+1][j].y);ctx.stroke();
          }
        }
      }
      // Nodes
      for(let l=0;l<3;l++){
        for(let n=0;n<layers[l];n++){
          ctx.beginPath();ctx.arc(nodes[l][n].x,nodes[l][n].y,6,0,2*Math.PI);
          ctx.fillStyle = '#23272f';ctx.fill();
          ctx.strokeStyle = '#2dd4bf';ctx.lineWidth=2;ctx.stroke();
        }
      }
      // Pulse
      if(pulse){
        ctx.beginPath();ctx.arc(pulse.x,pulse.y,10,0,2*Math.PI);
        ctx.fillStyle = '#2dd4bf';ctx.globalAlpha=0.7;ctx.fill();ctx.globalAlpha=1;
        ctx.font = 'bold 12px Fira Code, monospace';ctx.fillStyle='#fff';ctx.fillText('w·x+b',pulse.x-16,pulse.y-14);
      }
    }
    drawMLP();
    fireBtn.onclick = () => {
      let l=0,n=0;
      pulse={x:nodes[0][0].x,y:nodes[0][0].y};
      function animatePulse(){
        if(l<3){
          let next = nodes[l][n%layers[l]];
          pulse.x = next.x; pulse.y = next.y;
          drawMLP();
          n++;
          if(n>=layers[l]){l++;n=0;}
          setTimeout(animatePulse,60);
        }else{pulse=null;drawMLP();}
      }
      animatePulse();
    };
  }

  // --- Weighted Scale Demo ---
  function setupWeightedScale() {
    const scaleSlider = document.getElementById('scale-slider');
    const left = document.getElementById('scale-left');
    const right = document.getElementById('scale-right');
    const penalty = document.getElementById('scale-penalty');
    if (!scaleSlider || !left || !right || !penalty) return;
    scaleSlider.oninput = e => {
      let val = Number(e.target.value);
      penalty.textContent = val;
      // Move left side down as penalty increases
      left.style.top = (30+val/2)+"px";
      right.style.top = (30-val/10)+"px";
      left.style.boxShadow = val>30?'0 0 16px #2dd4bf,0 0 0 2px #23272f':'0 0 0 2px #23272f';
    };
    // Reset slider and penalty
    scaleSlider.value = 27.48;
    penalty.textContent = 27.48;
    scaleSlider.oninput({target:{value:scaleSlider.value}});
  }

  // --- PR Dashboard ---
  function setupPRDashboard() {
    const thresholdSlider = document.getElementById('threshold-slider');
    const cm00 = document.getElementById('cm-t00');
    const cm01 = document.getElementById('cm-t01');
    const cm10 = document.getElementById('cm-t10');
    const cm11 = document.getElementById('cm-t11');
    const pr = document.getElementById('pr-curve');
    if (!thresholdSlider || !cm00 || !cm01 || !cm10 || !cm11 || !pr) return;
    function updateCM(thresh){
      // Fake numbers for demo
      let tpr = thresh/100, fpr = (100-thresh)/100*0.04;
      let tn = Math.round(40000*(1-fpr)), fp = 40000-tn;
      let tp = Math.round(1000*tpr), fn = 1000-tp;
      cm00.textContent = tn;
      cm01.textContent = fp;
      cm10.textContent = fn;
      cm11.textContent = tp;
    }
    thresholdSlider.oninput = e => {
      let val = Number(e.target.value);
      updateCM(val);
      // Move dot on PR curve
      const ctx = pr.getContext('2d');
      ctx.clearRect(0,0,120,120);
      // Draw PR curve (fake)
      ctx.beginPath();ctx.moveTo(10,110);
      ctx.bezierCurveTo(40,60,80,40,110,20);
      ctx.strokeStyle='#2dd4bf';ctx.lineWidth=3;ctx.stroke();
      // Dot
      let x = 10+val; let y = 110-val*0.9;
      ctx.beginPath();ctx.arc(x,y,7,0,2*Math.PI);
      ctx.fillStyle='#818cf8';ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
    };
    // Reset slider and confusion matrix
    thresholdSlider.value = 50;
    thresholdSlider.oninput({target:{value:thresholdSlider.value}});
  }

  // --- Reveal.js slidechanged event hooks ---
  deck.on('slidechanged', event => {
    const curr = event.currentSlide;
    if (curr && curr.querySelector && curr.querySelector('#bit-grid')) {
      setupBitGrid();
    }
    if (curr && curr.querySelector && curr.querySelector('#mlp-canvas')) {
      setupMLPDemo();
    }
    if (curr && curr.querySelector && curr.querySelector('#scale-slider')) {
      setupWeightedScale();
    }
    if (curr && curr.querySelector && curr.querySelector('#threshold-slider')) {
      setupPRDashboard();
    }
  });
  // Also run on DOMContentLoaded if already on the slide
  if (document.getElementById('bit-grid')) setupBitGrid();
  if (document.getElementById('mlp-canvas')) setupMLPDemo();
  if (document.getElementById('scale-slider')) setupWeightedScale();
  if (document.getElementById('threshold-slider')) setupPRDashboard();
});
