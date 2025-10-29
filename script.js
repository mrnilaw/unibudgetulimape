/* UniBudget ULIMA PRO (versión corregida y funcional) */

const STORAGE_KEY = "unibudget_ulima_pro_v1";
const BUDGET_KEY = "unibudget_ulima_budget_v1";
const NAME_KEY = "unibudget_ulima_name_v1";
const DEFAULT_RATE = 0.27;

/* Estado */
let txs = [];
let chart = null;
let budget = Number(localStorage.getItem(BUDGET_KEY)) || 0;

/* Elementos */
const el = {
  txList: document.getElementById("txList"),
  totalIncome: document.getElementById("totalIncome"),
  totalExpense: document.getElementById("totalExpense"),
  balance: document.getElementById("balance"),
  txCount: document.getElementById("txCount"),
  pieCanvas: document.getElementById("pieChart"),
  budgetFill: document.getElementById("budgetFill"),
  budgetMeta: document.getElementById("budgetMeta"),
  convResult: document.getElementById("convResult"),
};

/* Inicializar */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("date").value = today();
  document.getElementById("from").value = monthStart();
  document.getElementById("to").value = today();
  document.getElementById("studentName").value = localStorage.getItem(NAME_KEY) || "";

  load();
  render();
  renderChart();
  updateBudgetUI();

  // eventos
  document.getElementById("txForm").addEventListener("submit", onSubmit);
  document.getElementById("btnClear").addEventListener("click", resetForm);
  document.getElementById("setBudget").addEventListener("click", setBudgetFromInput);
  document.getElementById("convBtn").addEventListener("click", handleConvert);
  document.getElementById("resetData").addEventListener("click", resetAll);
  document.getElementById("studentName").addEventListener("change", e => {
    localStorage.setItem(NAME_KEY, e.target.value || "");
  });
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
});

/* === FUNCIONES === */

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthStart() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    txs = raw ? JSON.parse(raw) : [];
  } catch (e) {
    txs = [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
}

/* Guardar transacción */
function onSubmit(e) {
  e.preventDefault();

  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const note = document.getElementById("note").value || "";

  if (!date || isNaN(amount) || amount <= 0) {
    alert("Por favor, ingresa una fecha y un monto válido.");
    return;
  }

  const newTx = {
    id: Date.now(),
    date,
    category,
    type,
    amount,
    note,
  };

  txs.unshift(newTx);
  save();
  render();
  renderChart();
  updateBudgetUI();
  e.target.reset();
  document.getElementById("date").value = today();
}

/* Mostrar transacciones */
function render() {
  el.txList.innerHTML = "";

  if (txs.length === 0) {
    el.txList.innerHTML = "<li class='small-muted'>Sin transacciones registradas.</li>";
  }

  let income = 0,
    expense = 0;

  txs.forEach(tx => {
    if (tx.type === "ingreso") income += tx.amount;
    else expense += tx.amount;

    const li = document.createElement("li");
    li.className = "tx-item";
    li.innerHTML = `
      <div class="tx-left">
        <div class="icon-circle">${tx.type === "ingreso" ? "💰" : "💸"}</div>
        <div>
          <div><b>${tx.category}</b> — ${tx.note || ""}</div>
          <div class="tx-meta">${tx.date}</div>
        </div>
      </div>
      <div class="tx-amount ${tx.type === "ingreso" ? "income" : "expense"}">
        ${tx.type === "ingreso" ? "+" : "-"}S/ ${tx.amount.toFixed(2)}
      </div>
    `;
    el.txList.appendChild(li);
  });

  const balance = income - expense;

  el.totalIncome.textContent = `S/ ${income.toFixed(2)}`;
  el.totalExpense.textContent = `S/ ${expense.toFixed(2)}`;
  el.balance.textContent = `S/ ${balance.toFixed(2)}`;
  el.txCount.textContent = `${txs.length} registro${txs.length !== 1 ? "s" : ""}`;
}

/* Gráfico */
function renderChart() {
  if (!el.pieCanvas) return;
  if (chart) chart.destroy();

  const categories = {};
  txs.forEach(tx => {
    if (tx.type === "gasto") {
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
    }
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);

  if (labels.length === 0) return;

  chart = new Chart(el.pieCanvas, {
    type: "pie",
    data: {
      labels,
      datasets: [{ data }],
    },
  });
}

/* Presupuesto mensual */
function setBudgetFromInput() {
  const val = parseFloat(document.getElementById("budgetInput").value);
  if (isNaN(val) || val <= 0) {
    alert("Ingresa un presupuesto válido.");
    return;
  }
  budget = val;
  localStorage.setItem(BUDGET_KEY, budget);
  updateBudgetUI();
}

function updateBudgetUI() {
  if (!budget) {
    el.budgetMeta.textContent = "Sin presupuesto definido.";
    el.budgetFill.style.width = "0%";
    return;
  }

  const totalExpenses = txs
    .filter(tx => tx.type === "gasto")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const percent = Math.min((totalExpenses / budget) * 100, 100);

  el.budgetFill.style.width = `${percent}%`;
  el.budgetMeta.textContent = `Gasto: S/ ${totalExpenses.toFixed(2)} / S/ ${budget}`;
}

/* Conversor PEN/USD */
function handleConvert() {
  const val = parseFloat(document.getElementById("convValue").value);
  const dir = document.getElementById("convDir").value;
  if (isNaN(val) || val <= 0) {
    el.convResult.textContent = "Ingrese un monto válido.";
    return;
  }

  const res = dir === "PENtoUSD" ? val * DEFAULT_RATE : val / DEFAULT_RATE;
  const moneda = dir === "PENtoUSD" ? "USD" : "PEN";
  el.convResult.textContent = `≈ ${res.toFixed(2)} ${moneda}`;
}

/* Reset total */
function resetForm() {
  document.getElementById("txForm").reset();
  document.getElementById("date").value = today();
}

function resetAll() {
  if (confirm("¿Seguro que deseas borrar todos los datos?")) {
    localStorage.clear();
    txs = [];
    budget = 0;
    render();
    updateBudgetUI();
  }
}

/* Tema */
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const mode = document.body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("theme", mode);
}

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
}
