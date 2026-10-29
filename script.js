
const STORAGE_KEY = "day40-expense-tracker"

const form = document.getElementById("expenseForm")
const titleInput = document.getElementById("title")
const amountInput = document.getElementById("amount")
const categoryInput = document.getElementById("category")
const dateInput = document.getElementById("date")

const submitButton = document.getElementById("submitButton")
const cancelEditButton = document.getElementById("cancelEditButton")
const formMessage = document.getElementById("formMessage")

const categoryFilter = document.getElementById("categoryFilter")
const startDate = document.getElementById("startDate")
const endDate = document.getElementById("endDate")
const expenseList = document.getElementById("expenseList")

let expenses = loadExpenses()
let editingId = null

const icons = {
  Food: "🍽️",
  Transport: "🚌",
  Shopping: "🛍️",
  Bills: "🧾",
  Education: "📚",
  Health: "💊",
  Other: "📌"
}

// Today's date
function todayString() 
{
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

dateInput.value = todayString()

document.getElementById("currentYear").textContent = new Date().getFullYear()

// Load data from LocalStorage
function loadExpenses() {
  try 
  {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    )

    return Array.isArray(saved) ? saved : []
  } catch (error) {
    return []
  }
}

// Save data to LocalStorage
function saveExpenses() {
  try 
  {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(expenses)
    )
    return true
  } 
  catch (error) 
  {
    showMessage("Could not save data in browser storage.", true)
    return false
  }
}

// Display messages
function showMessage(message, isError = false) 
{
  formMessage.textContent = message
  formMessage.classList.toggle("error", isError)
}

// Format Indian currency
function money(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

// Format date
function formatDate(value) 
{
  const [year, month, day] = value.split("-")
  return `${day}/${month}/${year}`
}

// Generate unique ID
function createId() {
  if (window.crypto && window.crypto.randomUUID) 
    {
       return window.crypto.randomUUID()
    }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Filter and sort expenses
function getFilteredExpenses() 
{
  return expenses
    .filter(item =>
      categoryFilter.value === "all" || item.category === categoryFilter.value
    )
    .filter(item =>
      !startDate.value || item.date >= startDate.value
    )
    .filter(item =>
      !endDate.value || item.date <= endDate.value
    )
    .sort((a, b) =>
      b.date.localeCompare(a.date) ||
      b.createdAt - a.createdAt
    )
}

// Render dashboard and transactions
function renderExpenses() 
{
  const list = getFilteredExpenses()

  const total = list.reduce(
    (sum, item) => sum + Number(item.amount), 0
  )

  const largest = list.reduce((max, item) =>
    !max || Number(item.amount) > Number(max.amount)
      ? item
      : max,
    null
  )

  const categories = new Set(
    list.map(item => item.category)
  )

  document.getElementById("totalAmount").textContent = money(total)
  document.getElementById("expenseCount").textContent = `${list.length} ${
      list.length === 1 ? "transaction" : "transactions"
    }`

  document.getElementById("largestAmount").textContent = largest ? money(Number(largest.amount)) : money(0)
  document.getElementById("largestLabel").textContent = largest ? largest.title : "No expenses yet"
  document.getElementById("categoryCount").textContent = categories.size
  document.getElementById("visibleCount").textContent = `${list.length} shown`

  expenseList.innerHTML = ""

  if (list.length === 0) 
{
    const empty = document.createElement("div")
    empty.className = "empty-state"

    const symbol = document.createElement("div")
    symbol.className = "empty-symbol"
    symbol.textContent = "＋"

    const heading = document.createElement("h3")
    heading.textContent = expenses.length
      ? "No matching transactions"
      : "No transactions yet"

    const note = document.createElement("p")
    note.textContent = expenses.length
      ? "Try changing or clearing your filters."
      : "Add your first expense to see it here."

    empty.append(symbol, heading, note)
    expenseList.append(empty)
    return
  }

  list.forEach(item => {
    const row = document.createElement("article")
    row.className = "expense-item"

    // Category icon
    const icon = document.createElement("div")
    icon.className = "category-icon"
    icon.textContent = icons[item.category] || "📌"
    icon.setAttribute("aria-hidden", "true")

    // Expense information
    const main = document.createElement("div")
    main.className = "expense-main"

    const info = document.createElement("div")
    info.className = "expense-info"

    const title = document.createElement("p")
    title.className = "expense-title"
    title.textContent = item.title

    const meta = document.createElement("p")
    meta.className = "expense-meta"
    meta.textContent = `${item.category} · ${formatDate(item.date)}`

    info.append(title, meta)
    main.append(icon, info)

    // Amount and buttons
    const right = document.createElement("div")
    right.className = "expense-right"

    const amount = document.createElement("div")
    amount.className = "expense-amount"
    amount.textContent = money(Number(item.amount))

    const actions = document.createElement("div")
    actions.className = "item-actions"

    const editButton = document.createElement("button")
    editButton.type = "button"
    editButton.className = "small-button"
    editButton.textContent = "Edit"
    editButton.addEventListener("click", () => {
      startEditing(item.id);
    })

    const deleteButton = document.createElement("button")
    deleteButton.type = "button"
    deleteButton.className = "small-button delete"
    deleteButton.textContent = "Delete"
    deleteButton.addEventListener("click", () => {
      deleteExpense(item.id)
    });

    actions.append(editButton, deleteButton)
    right.append(amount, actions)
    row.append(main, right)

    expenseList.append(row)
  })
}

// Add or update an expense
form.addEventListener("submit", event => {
  event.preventDefault()

  const title = titleInput.value.trim()
  const amount = Number(amountInput.value)
  const category = categoryInput.value
  const date = dateInput.value

  if (!title) 
{
    showMessage("Please enter an expense name.", true)
    titleInput.focus()
    return
}

  if (!Number.isFinite(amount) || amount <= 0) 
{
    showMessage("Amount must be greater than zero.", true)
    amountInput.focus()
    return
}

  if (!date) 
{
    showMessage("Please select a date.", true)
    dateInput.focus()
    return
}

  if (startDate.value && endDate.value && startDate.value > endDate.value) 
{
    showMessage(
      "The From date cannot be after the To date.",
      true
    )
    return
  }

  if (editingId !== null) 
{
    expenses = expenses.map(item =>
      item.id === editingId
        ? { ...item, title, amount, category, date }
        : item
    )

    showMessage("Expense updated successfully.")
  } 
  else 
{
    expenses.push({
      id: createId(),
      title,
      amount,
      category,
      date,
      createdAt: Date.now()
    })
    showMessage("Expense saved successfully.")
  }

  saveExpenses()
  resetForm()
  renderExpenses()
})

// Edit expense
function startEditing(id) 
{
  const item = expenses.find(expense => expense.id === id)

  if (!item) return;
  editingId = id

  titleInput.value = item.title
  amountInput.value = item.amount
  categoryInput.value = item.category
  dateInput.value = item.date

  document.getElementById("formHeading").textContent = "Edit expense"

  submitButton.textContent = "Save Changes"
  cancelEditButton.classList.remove("hidden")

  showMessage("Edit the details and save your changes.")

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  })

  titleInput.focus()
}

// Delete expense
function deleteExpense(id) 
{
  const item = expenses.find(expense => expense.id === id)
  if (!item) return;

  const confirmed = window.confirm(
    `Delete "${item.title}"?`
  )

  if (!confirmed) return;

  expenses = expenses.filter(expense => expense.id !== id)

  if (editingId === id) {
    resetForm();
  }

  saveExpenses()
  renderExpenses()
  showMessage("Expense deleted.")
}

// Reset form
function resetForm() {
  editingId = null
  form.reset()

  dateInput.value = todayString()

  document.getElementById("formHeading").textContent = "Add an expense"

  submitButton.textContent = "Save Expense"
  cancelEditButton.classList.add("hidden")
}

// Cancel edit
cancelEditButton.addEventListener("click", () => {
  resetForm()
  showMessage("Edit cancelled.")
})

// Apply filters
[categoryFilter, startDate, endDate].forEach(control => {
  control.addEventListener("input", renderExpenses)
  control.addEventListener("change", renderExpenses)
})

// Clear filters
document.getElementById("clearFiltersButton")
  .addEventListener("click", () => {
    categoryFilter.value = "all"
    startDate.value = ""
    endDate.value = ""
    renderExpenses()
  })

// Initial dashboard render
renderExpenses()
