let budgetPerDay = 0;
let remainingToday = 0;
let today = new Date().toISOString().slice(0, 10);

function saveSettings() {
  const salary = Number(document.getElementById("salary").value);
  const fixed = Number(document.getElementById("fixed").value);
  const savings = salary * 0.15;
  const days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const variable = salary - fixed - savings;
  budgetPerDay = Math.floor(variable / days);
  remainingToday = budgetPerDay;

  localStorage.setItem("dailyBudget", budgetPerDay);
  localStorage.setItem("remaining", remainingToday);
  localStorage.setItem("expenses", JSON.stringify([]));
  localStorage.setItem("date", today);

  document.getElementById("settings").style.display = "none";
  document.getElementById("main").style.display = "block";

  updateUI();
}

function addExpense() {
  const desc = document.getElementById("desc").value;
  const amount = Number(document.getElementById("amount").value);
  if (!desc || !amount) return;

  let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
  expenses.push({ desc, amount });
  localStorage.setItem("expenses", JSON.stringify(expenses));

  remainingToday -= amount;
  localStorage.setItem("remaining", remainingToday);

  updateUI();
}

function updateUI() {
  document.getElementById("dailyBudget").innerText = localStorage.getItem("dailyBudget") || 0;
  document.getElementById("remaining").innerText = localStorage.getItem("remaining") || 0;

  const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
  const list = document.getElementById("expenses");
  list.innerHTML = "";
  expenses.forEach(exp => {
    const li = document.createElement("li");
    li.innerText = `${exp.desc} — ${exp.amount} ₽`;
    list.appendChild(li);
  });
}

window.onload = () => {
  const savedDate = localStorage.getItem("date");
  if (savedDate === today) {
    document.getElementById("settings").style.display = "none";
    document.getElementById("main").style.display = "block";
    updateUI();
  }
};