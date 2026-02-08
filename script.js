/**
 * WORKOUT TRACKER - CORE LOGIC
 */
let showOnlyPR = false;
let logToDelete = null; 

document.addEventListener('DOMContentLoaded', () => {
    loadInputValues();
    setupStrengthLevelLinks();
    setupInputListeners();
    renderHistory();
    initPlanManager(); 
    renderPROverview();
});

// 1. Laad opgeslagen waarden uit localStorage
function loadInputValues() {
    document.querySelectorAll('input').forEach(input => {
        const key = input.dataset.key;
        if (key) {
            const saved = localStorage.getItem(key);
            if (saved) input.value = saved;
        }
    });
}

// 2. Sla waarden direct op bij typen
function setupInputListeners() {
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            const key = input.dataset.key;
            if (key) localStorage.setItem(key, input.value);
        });
    });
}

// 3. Maak oefeningen klikbaar naar StrengthLevel
function setupStrengthLevelLinks() {
    const exerciseLinks = {
        "Bench Press": "https://strengthlevel.com/strength-standards/dumbbell-bench-press/kg",
        "Pull-Ups": "https://strengthlevel.com/strength-standards/pull-ups/kg",
        "Chest Support Row": "https://strengthlevel.com/strength-standards/chest-supported-dumbbell-row/kg",
        "Dumbbell Pullover": "https://strengthlevel.com/strength-standards/dumbbell-pullover/kg", // Add this line
        "Incline Fly": "https://strengthlevel.com/strength-standards/incline-dumbbell-fly/kg",
        "Lateral Raises": "https://strengthlevel.com/strength-standards/lateral-raise/kg",
        "Overhead Extension": "https://strengthlevel.com/strength-standards/dumbbell-tricep-extension/kg",
        "Incline Bicep Curl": "https://strengthlevel.com/strength-standards/incline-dumbbell-curl/kg",
        "Goblet Squat": "https://strengthlevel.com/strength-standards/goblet-squat/kg",
        "Bulgarian Split Squat": "https://strengthlevel.com/strength-standards/dumbbell-bulgarian-split-squat/kg",
        "Romanian Deadlift": "https://strengthlevel.com/strength-standards/dumbbell-romanian-deadlift/kg",
        "Hamstring Curl": "https://strengthlevel.com/strength-standards/hamstring-curl/kg",
        "Calf Raises": "https://strengthlevel.com/strength-standards/dumbbell-calf-raise/kg",
        "Decline Sit-Up": "https://strengthlevel.com/strength-standards/decline-sit-up/kg",
        "Incline Bench Press": "https://strengthlevel.com/strength-standards/incline-dumbbell-press/kg",
        "Chin-Ups": "https://strengthlevel.com/strength-standards/chin-ups/kg",
        "Close Grip Press": "https://strengthlevel.com/strength-standards/close-grip-dumbbell-bench-press/kg",
        "Rear Delt Fly": "https://strengthlevel.com/strength-standards/rear-delt-fly/kg",
        "Skull Crusher": "https://strengthlevel.com/strength-standards/lying-dumbbell-tricep-extension/kg",
        "Incline Hammer Curl": "https://strengthlevel.com/strength-standards/hammer-curl/kg"
    };

    document.querySelectorAll('table tbody tr td:first-child').forEach(td => {
        const name = td.textContent.trim();
        if (exerciseLinks[name]) {
            td.style.cursor = "pointer";
            td.style.textDecoration = "underline";
            td.addEventListener('click', () => window.open(exerciseLinks[name], '_blank'));
        }
    });
}


// 4. Workout sessie opslaan
function logWorkoutSesssie(button) {
  const card = button.closest('.workout-card');
  const workoutName = card.querySelector('h2').innerText;
  const rows = card.querySelectorAll('tbody tr');
  let sessionEntries = [];

  rows.forEach(row => {
    const exercise = row.cells[0].innerText;
    const repsInput = row.querySelector('input[data-key*="-reps"]');
    const kgInput   = row.querySelector('input[data-key*="-kg"]');

    // Lees waarden en normaliseer naar getal (leeg → 0)
    const reps = repsInput ? parseInt(repsInput.value, 10) : 0;
    const weight = kgInput && kgInput.value !== '' ? parseFloat(kgInput.value) : 0;

    // ⛔️ Skip als zowel reps als gewicht 0 zijn
    if ((reps || 0) === 0 && (weight || 0) === 0) return;

    // ✅ Log alleen zinvolle entries
    sessionEntries.push({
      exercise: exercise,
      reps: isNaN(reps) ? "?" : String(reps),
      weight: isNaN(weight) ? 0 : weight
    });
  });

  if (sessionEntries.length === 0) return;

  let history = JSON.parse(localStorage.getItem('workout_history')) || [];
  history.push({
    timestamp: new Date().getTime(),
    workoutName: workoutName,
    exercises: sessionEntries
  });
  localStorage.setItem('workout_history', JSON.stringify(history));

  const originalText = button.innerText;
  button.innerText = "Opgeslagen!";
  button.style.backgroundColor = "var(--text-main)";
  button.style.color = "var(--bg-card)";
  setTimeout(() => {
    button.innerText = originalText;
    button.style.backgroundColor = "";
    button.style.color = "";
  }, 1000);

  renderHistory();     
  renderPROverview();  
}


// 5. Records Filter Toggle
function togglePR() {
    showOnlyPR = !showOnlyPR;
    const btn = document.getElementById('pr-button');
    if (btn) {
        btn.classList.toggle('active', showOnlyPR);
        btn.innerHTML = showOnlyPR ? "✕ Record filter uit" : "Show Records 🏆";
    }
    renderHistory();
}

// 6. Historie Renderen
function renderHistory() {
    const container = document.getElementById('history-content');
    if (!container) return;

    const history = JSON.parse(localStorage.getItem('workout_history')) || [];
    updateExerciseDropdown(history);

    if (history.length === 0) {
        container.innerHTML = '<p style="padding:40px; opacity:0.5; text-align:center;">Nog geen historie beschikbaar.</p>';
        return;
    }

    const exFilter = document.getElementById('filter-exercise')?.value || 'all';
    const monthFilter = document.getElementById('filter-month')?.value || 'all';
    const yearFilter = document.getElementById('filter-year')?.value || 'all';

    let filtered = history.filter(session => {
        const d = new Date(session.timestamp);
        const matchesMonth = monthFilter === 'all' || d.getMonth().toString() === monthFilter;
        const matchesYear = yearFilter === 'all' || d.getFullYear().toString() === yearFilter;
        return matchesMonth && matchesYear;
    });

    filtered.sort((a, b) => b.timestamp - a.timestamp);

    container.innerHTML = filtered.map(session => {
        const relevantExercises = session.exercises.filter(ex => {
            const matchesEx = (exFilter === 'all' || ex.exercise === exFilter);
            if (showOnlyPR) {
                return matchesEx && isPersonalRecord(ex.exercise, ex.weight, history, session.timestamp);
            }
            return matchesEx;
        });

        if (relevantExercises.length === 0) return '';

        // 1. Formatteer de datum (bijv. Tue 4 Feb)
        const d = new Date(session.timestamp);
        const displayDate = d.toLocaleDateString('en-GB', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        });

        // 2. De return statement van de map functie (vervangen vanaf de span met displayDate)
        return `
        <div class="history-entry">
            <div class="history-header">
                <span class="history-workout-title">
                    ${session.workoutName}
                </span>
                
                <div class="history-date-tag">
                    <span>${displayDate}</span>
                </div>
                
                <button class="delete-log-btn" onclick="deleteSingleLog(${session.timestamp})">
                    ✕
                </button>
            </div>
            
            <div class="history-exercises-list">
                ${relevantExercises.map(ex => {
                    // In je renderHistory functie, bij de oefeningen-loop:
                    const isPR = isPersonalRecord(ex.exercise, ex.weight, history, session.timestamp);

                    return `
                    <div class="exercise-row ${isPR ? 'is-pr' : ''}">
                        <span class="exercise-name">${ex.exercise}</span>
                        <div class="exercise-stats">
                            <span class="exercise-reps">${ex.reps}</span>
                            <span class="exercise-weight">
                                <strong>${ex.weight}</strong>
                                <span class="unit">kg</span>
                            </span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
</div>`;
    }).join('');
}

// 7. MODAL LOGICA
// Voor één enkele log
function deleteSingleLog(timestamp) {
    logToDelete = timestamp;
    
    const modalTitle = document.querySelector('#deleteModal h3');
    const modalText = document.querySelector('#deleteModal p');
    const confirmBtn = document.querySelector('#deleteModal .confirm-btn');

    if (modalTitle) modalTitle.innerText = "Log verwijderen";
    if (modalText) modalText.innerText = "Wil je deze specifieke training verwijderen?";
    if (confirmBtn) confirmBtn.innerText = "Wissen";

    openDeleteModal();
}

// Voor alle logs tegelijk
function setupClearAll() {
    logToDelete = 'all';
    
    const modalTitle = document.querySelector('#deleteModal h3');
    const modalText = document.querySelector('#deleteModal p');
    const confirmBtn = document.querySelector('#deleteModal .confirm-btn');

    if (modalTitle) modalTitle.innerText = "Alle logs wissen";
    if (modalText) modalText.innerText = "Alle training worden definitief gewist.";
    if (confirmBtn) confirmBtn.innerText = "Wissen";

    openDeleteModal();
}

function openDeleteModal() { 
    document.getElementById('deleteModal').style.display = 'flex'; 
}

function closeDeleteModal() { 
    document.getElementById('deleteModal').style.display = 'none'; 
    logToDelete = null; 
}

function confirmDeletion() {
    let history = JSON.parse(localStorage.getItem('workout_history')) || [];
    
    if (logToDelete === 'all') {
        localStorage.removeItem('workout_history');
        location.reload(); // Herlaad alles voor een schone lei
    } else if (logToDelete !== null) {
        // Filter de specifieke log eruit
        history = history.filter(session => session.timestamp !== logToDelete);
        localStorage.setItem('workout_history', JSON.stringify(history));
        
        closeDeleteModal(); // Sluit de modal
        renderHistory();    // Update de lijst op je scherm
    }
}

// 8. HELPERS
function isPersonalRecord(exercise, weight, history, currentTS) {
    const prevBest = history
        .filter(s => s.timestamp < currentTS)
        .flatMap(s => s.exercises)
        .filter(ex => ex.exercise === exercise)
        .reduce((max, ex) => Math.max(max, parseFloat(ex.weight)), 0);
    
    const currentWeight = parseFloat(weight);
    return currentWeight > prevBest && prevBest > 0;
}

function updateExerciseDropdown(history) {
    const dropdown = document.getElementById('filter-exercise');
    if (!dropdown || dropdown.options.length > 1) return;
    const exercises = [...new Set(history.flatMap(s => s.exercises.map(ex => ex.exercise)))].sort();
    let html = '<option value="all">Alle Oefeningen</option>';
    exercises.forEach(ex => html += `<option value="${ex}">${ex}</option>`);
    dropdown.innerHTML = html;
}

window.onclick = function(event) {
    const modal = document.getElementById('deleteModal');
    if (event.target == modal) closeDeleteModal();
}


/** =========================
 * PLAN MANAGER (TEMPLATES)
 ========================= **/
const PLANS_KEY = 'workout_plans_v1';

function getAllInputs() {
  return Array.from(document.querySelectorAll('input[data-key]'));
}
function getPlans() {
  return JSON.parse(localStorage.getItem(PLANS_KEY)) || [];
}
function setPlans(plans) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}
function refreshPlanDropdown() {
  const sel = document.getElementById('plan-select');
  if (!sel) return;
  const plans = getPlans();
  sel.innerHTML = plans.length === 0
    ? '<option value="">(geen schema’s)</option>'
    : plans.map(p => `<option value="${encodeURIComponent(p.name)}">${p.name}</option>`).join('');
}
function initPlanManager() {
  refreshPlanDropdown();
}


/** =========================
 * PR OVERVIEW
 ========================= **/
function computePRs() {
  const history = JSON.parse(localStorage.getItem('workout_history')) || [];
  const best = new Map(); // exercise -> {weight, reps, timestamp, workoutName}

  history.forEach(s => {
    (s.exercises || []).forEach(ex => {
      const w = parseFloat(ex.weight);
      if (isNaN(w) || w <= 0) return; // skip lege/body/invalid
      const cur = best.get(ex.exercise);
      // Bij gelijke weight: pak de meest recente
      if (!cur || w > cur.weight || (w === cur.weight && s.timestamp > cur.timestamp)) {
        best.set(ex.exercise, {
          weight: w,
          reps: ex.reps || '?',
          timestamp: s.timestamp,
          workoutName: s.workoutName || ''
        });
      }
    });
  });

  // Sorteer alfabetisch op oefening
  return Array.from(best.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));
}

function renderPROverview() {
  const container = document.getElementById('pr-overview');
  if (!container) return;

  const data = computePRs();
  if (data.length === 0) {
    container.innerHTML = '<p style="opacity:0.6">Nog geen PR’s beschikbaar.</p>';
    return;
  }

  const rows = data.map(([exercise, info]) => {
    const d = new Date(info.timestamp);
    const dateStr = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
    return `
      <tr>
        <td>${exercise}</td>
        <td><strong>${info.weight}</strong> kg</td>
        <td>${info.reps}</td>
        <td>${dateStr}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Oefening</th>
            <th>Beste gewicht</th>
            <th>Reps</th>
            <th>Datum</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}


function saveCurrentPlan() {
  const nameInput = document.getElementById('plan-name');
  const name = (nameInput?.value || '').trim();
  if (!name) {
    alert('Geef het schema een naam.');
    return;
  }
  // verzamel alle inputwaarden
  const map = {};
  getAllInputs().forEach(inp => {
    const key = inp.dataset.key;
    if (key) map[key] = inp.value;
  });

  const plans = getPlans();
  const idx = plans.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
  const plan = { name, schema: map, updatedAt: Date.now() };

  if (idx >= 0) {
    // overschrijf
    plans[idx] = plan;
  } else {
    plans.push(plan);
  }
  setPlans(plans);
  refreshPlanDropdown();

  // mini-feedback zoals je save-knop
  nameInput.value = name; // laat naam staan
  const btn = document.querySelector('#plan-manager .modern-btn');
  if (btn) {
    const orig = btn.innerText;
    btn.innerText = 'Opgeslagen!';
    btn.style.backgroundColor = "var(--text-main)";
    btn.style.color = "var(--bg-card)";
    setTimeout(() => {
      btn.innerText = orig;
      btn.style.backgroundColor = "";
      btn.style.color = "";
    }, 900);
  }
}

function applyPlanSchema(schema) {
  // zet velden en sla ze ook in localStorage op (zodat jouw loadInputValues gedrag consistent blijft)
  getAllInputs().forEach(inp => {
    const key = inp.dataset.key;
    if (!key) return;
    if (schema.hasOwnProperty(key)) {
      inp.value = schema[key];
      localStorage.setItem(key, schema[key]); // sluit aan op jouw storage patroon
    }
  });
}

function loadSelectedPlan() {
  const sel = document.getElementById('plan-select');
  if (!sel || !sel.value) return;
  const name = decodeURIComponent(sel.value);
  const plans = getPlans();
  const plan = plans.find(p => p.name === name);
  if (!plan) return;
  applyPlanSchema(plan.schema);

  // mini-feedback
  const btns = document.querySelectorAll('#plan-manager .modern-btn');
  const loadBtn = btns[1];
  if (loadBtn) {
    const orig = loadBtn.innerText;
    loadBtn.innerText = 'Geladen!';
    loadBtn.style.backgroundColor = "var(--text-main)";
    loadBtn.style.color = "var(--bg-card)";
    setTimeout(() => {
      loadBtn.innerText = orig;
      loadBtn.style.backgroundColor = "";
      loadBtn.style.color = "";
    }, 900);
  }
}

function deleteSelectedPlan() {
  const sel = document.getElementById('plan-select');
  if (!sel || !sel.value) return;
  const name = decodeURIComponent(sel.value);
  let plans = getPlans().filter(p => p.name !== name);
  setPlans(plans);
  refreshPlanDropdown();
}
