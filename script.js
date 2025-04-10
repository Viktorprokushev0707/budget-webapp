// -----------------------------
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// -----------------------------
let salary = 0;               // Зарплата
let fixed = 0;                // Обязательные траты
let savings = 0;              // 15% сбережений
let currency = "₽";            // Валюта
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

  currency = document.getElementById("currency").value;
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
  localStorage.setItem("currency", currency);
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
  currency = localStorage.getItem("currency") || "₽";
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

// Обработчик изменения даты
function onDateChanged(event) {
  const selectedDate = event.target.value;
  renderExpensesForDate(selectedDate);
}

// Добавить трату за выбранный день
function addExpenseForDate(dateStr) {
  const descInput = document.getElementById("descInput");
  const amountInput = document.getElementById("amountInput");

  const desc = descInput.value.trim();
  const amount = Number(amountInput.value);

  if (!desc || !amount) return;

  if (!expensesData[dateStr]) {
    expensesData[dateStr] = [];
  }

  expensesData[dateStr].push({ desc, amount });

  // Сохраняем
  localStorage.setItem("expensesData", JSON.stringify(expensesData));

  descInput.value = "";
  amountInput.value = "";

  renderExpensesForDate(dateStr);
}

// Показать расходы за выбранный день
function renderExpensesForDate(dateStr) {
  const expensesList = document.getElementById("expensesList");
  const noExpensesMessage = document.getElementById("noExpensesMessage");
  expensesList.innerHTML = ""; // Очищаем список

  const expensesForDay = expensesData[dateStr] || [];
  if (expensesForDay.length > 0) {
    expensesForDay.forEach((exp, index) => {
      const li = document.createElement("li");
      li.innerHTML = `${exp.desc} — ${exp.amount} ${currency} <button onclick="deleteExpense('${dateStr}', ${index})">Удалить</button>`;
      expensesList.appendChild(li);
    });
    noExpensesMessage.style.display = "none";
  } else {
    noExpensesMessage.style.display = "block";
  }
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
  document.getElementById("currency").value = currency;

  // Устанавливаем текущую дату в элементе выбора даты
  const datePicker = document.getElementById("datePicker");
  datePicker.value = formatDate(new Date());
  datePicker.onchange = onDateChanged;

  // Отображаем расходы за текущий день
  renderExpensesForDate(datePicker.value);
  document.getElementById("dailyBudget").innerText = budgetPerDay;
  document.getElementById("currencySymbol").innerText = currency;
  document.getElementById("monthTable").style.display = "none";
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

  // Вешаем обработчик на кнопку добавления расхода
  document.getElementById("addBtn").onclick = () => {
    const selectedDate = document.getElementById("datePicker").value;
    addExpenseForDate(selectedDate);
  };

  // Кнопка "Сохранить и пересчитать"
  document.getElementById("saveBtn").onclick = saveSettings;

  // Кнопка "Изменить настройки"
  document.getElementById("toggleSettingsBtn").onclick = () => {
    document.getElementById("settingsSection").style.display = "block";
    document.getElementById("mainSection").style.display = "none";
    document.getElementById("monthTable").style.display = "none";
  };

  // Кнопка "Сбросить все данные"
  document.getElementById("resetBtn").onclick = resetAll;
};
