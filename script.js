// -----------------------------
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// -----------------------------
let salary = 0;               // Зарплата
let fixed = 0;                // Обязательные траты
let savings = 0;              // 15% сбережений
let budgetPerDay = 0;         // Лимит на день
let daysInMonth = 0;          // Кол-во дней в месяце
let startOfMonth = "";        // Дата в формате YYYY-MM-01
let expensesData = {};        // Объект, где ключ = 'YYYY-MM-DD', значение = массив расходов

// -----------------------------
// ФУНКЦИИ
// -----------------------------

// Получаем дату начала месяца (строка "YYYY-MM-01")
function getMonthStart(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  return new Date(y, m, 1);
}

// Возвращаем YYYY-MM-DD
function formatDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Узнаём, сколько дней в текущем месяце
function getDaysInMonth(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1; // 1-12
  return new Date(y, m, 0).getDate(); // последний день прошлого месяца
}

// Сохраняем настройки в localStorage
function saveSettings() {
  const salaryInput = document.getElementById("salary").value;
  const fixedInput = document.getElementById("fixed").value;

  salary = Number(salaryInput) || 0;
  fixed = Number(fixedInput) || 0;
  savings = salary * 0.15;
  daysInMonth = getDaysInMonth();

  const variable = salary - fixed - savings;
  budgetPerDay = Math.floor(variable / daysInMonth);

  // Обнуляем все данные расходов
  expensesData = {};
  localStorage.setItem("expensesData", JSON.stringify(expensesData));

  localStorage.setItem("salary", salary);
  localStorage.setItem("fixed", fixed);
  localStorage.setItem("savings", savings);
  localStorage.setItem("budgetPerDay", budgetPerDay);
  localStorage.setItem("daysInMonth", daysInMonth);

  // Сохраняем дату начала месяца
  startOfMonth = formatDate(getMonthStart());
  localStorage.setItem("startOfMonth", startOfMonth);

  renderApp();
}

// Загружаем настройки из localStorage
function loadSettings() {
  salary = Number(localStorage.getItem("salary")) || 0;
  fixed = Number(localStorage.getItem("fixed")) || 0;
  savings = Number(localStorage.getItem("savings")) || 0;
  budgetPerDay = Number(localStorage.getItem("budgetPerDay")) || 0;
  daysInMonth = Number(localStorage.getItem("daysInMonth")) || getDaysInMonth();
  startOfMonth = localStorage.getItem("startOfMonth") || formatDate(getMonthStart());

  // Загружаем данные расходов
  const savedExpenses = localStorage.getItem("expensesData");
  if (savedExpenses) {
    expensesData = JSON.parse(savedExpenses);
  } else {
    expensesData = {};
  }
}

// Добавить трату на сегодня
function addExpense() {
  const descInput = document.getElementById("desc");
  const amountInput = document.getElementById("amount");

  const desc = descInput.value.trim();
  const amount = Number(amountInput.value);

  if (!desc || !amount) return;

  const todayStr = formatDate(new Date());
  if (!expensesData[todayStr]) {
    expensesData[todayStr] = [];
  }

  expensesData[todayStr].push({ desc, amount });

  // Сохраняем
  localStorage.setItem("expensesData", JSON.stringify(expensesData));

  descInput.value = "";
  amountInput.value = "";

  renderApp(); // обновляем интерфейс
}

// Удалить одну трату
function deleteExpense(dayStr, index) {
  expensesData[dayStr].splice(index, 1);
  localStorage.setItem("expensesData", JSON.stringify(expensesData));
  renderApp();
}

// Рассчитываем, сколько осталось на конкретный день
// исходя из того, сколько мы тратили в предыдущие дни
function computeDailyLeftovers() {
  let leftoverPrev = 0; // накопленный остаток из предыдущих дней
  const result = [];

  // Пройдёмся по всем дням месяца
  for (let i = 0; i < daysInMonth; i++) {
    // День i = startOfMonth + i
    const dayObj = new Date(getMonthStart());
    dayObj.setDate(dayObj.getDate() + i);
    const dayStr = formatDate(dayObj);

    // Сколько расходов
    const dayExpenses = expensesData[dayStr] || [];
    const spent = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // У нас на день i: budgetPerDay + leftoverPrev
    const dayBudget = budgetPerDay + leftoverPrev;
    // остаток после расходов
    const leftover = dayBudget - spent;

    // Запоминаем результат
    result.push({
      dateStr: dayStr,
      dayBudget,
      spent,
      leftover
    });

    // leftover переходим на следующий день
    leftoverPrev = leftover;
  }
  return result;
}

// Рендерим весь интерфейс
function renderApp() {
  loadSettings(); // подгрузим новые настройки

  // Проверим, есть ли salary, и показывать ли mainSection
  if (salary > 0) {
    document.getElementById("settingsSection").style.display = "none";
    document.getElementById("mainSection").style.display = "block";
  } else {
    document.getElementById("settingsSection").style.display = "block";
    document.getElementById("mainSection").style.display = "none";
    return;
  }

  // Заполним поля настроек (чтобы можно было изменить)
  document.getElementById("salary").value = salary;
  document.getElementById("fixed").value = fixed;

  // Инфа о сегодняшнем дне
  const todayStr = formatDate(new Date());
  document.getElementById("todayDate").innerText = todayStr;
  document.getElementById("dailyBudget").innerText = budgetPerDay;

  // Считаем всю таблицу
  const dailyData = computeDailyLeftovers();

  // Находим сегодняшнюю строку
  const todayData = dailyData.find(d => d.dateStr === todayStr) || { dayBudget: 0, leftover: 0 };
  document.getElementById("remainingToday").innerText = todayData.leftover >= 0
    ? todayData.leftover
    : `-${Math.abs(todayData.leftover)}`;

  // Отобразим расходы за сегодня
  const expensesList = document.getElementById("expensesList");
  expensesList.innerHTML = "";
  const todayExpenses = expensesData[todayStr] || [];
  todayExpenses.forEach((exp, idx) => {
    const li = document.createElement("li");
    li.innerText = `${exp.desc} — ${exp.amount} ₽`;
    // Кнопка удаления
    const delBtn = document.createElement("button");
    delBtn.textContent = "X";
    delBtn.style.backgroundColor = "#f44336";
    delBtn.style.marginLeft = "10px";
    delBtn.onclick = () => deleteExpense(todayStr, idx);

    li.appendChild(delBtn);
    expensesList.appendChild(li);
  });

  // Заполним таблицу всех дней
  const tbody = document.getElementById("monthTableBody");
  tbody.innerHTML = "";
  dailyData.forEach(d => {
    const tr = document.createElement("tr");

    const tdDate = document.createElement("td");
    tdDate.innerText = d.dateStr;

    const tdBudget = document.createElement("td");
    tdBudget.innerText = d.dayBudget;

    const tdSpent = document.createElement("td");
    tdSpent.innerText = d.spent;

    const tdLeft = document.createElement("td");
    tdLeft.innerText = d.leftover;

    tr.appendChild(tdDate);
    tr.appendChild(tdBudget);
    tr.appendChild(tdSpent);
    tr.appendChild(tdLeft);
    tbody.appendChild(tr);
  });
}

// Сбросить все данные
function resetAll() {
  if (confirm("Точно удалить все данные?")) {
    localStorage.clear();
    window.location.reload();
  }
}

// -----------------------------
// ОБРАБОТЧИКИ
// -----------------------------
window.onload = () => {
  loadSettings();
  renderApp();

  // Кнопка "Сохранить и пересчитать"
  document.getElementById("saveBtn").onclick = saveSettings;

  // Кнопка "Добавить трату"
  document.getElementById("addBtn").onclick = addExpense;

  // Кнопка "Изменить настройки"
  document.getElementById("toggleSettingsBtn").onclick = () => {
    document.getElementById("settingsSection").style.display = "block";
    document.getElementById("mainSection").style.display = "none";
  };

  // Кнопка "Сбросить все данные"
  document.getElementById("resetBtn").onclick = resetAll;
};
