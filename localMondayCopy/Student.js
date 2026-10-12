"use strict";

const STORAGE_KEY = "studyflow.tasks.v1";
const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const taskTitleInput = document.getElementById("task-title");
const taskDescriptionInput = document.getElementById("task-description");
const taskDueDateInput = document.getElementById("task-due-date");
const taskPriorityInput = document.getElementById("task-priority");
const statusFilterButtons = document.querySelectorAll("[data-status]");
const priorityFilter = document.getElementById("priority-filter");
const searchInput = document.getElementById("search-input");
const formHeading = document.getElementById("form-heading");
const formIcon = document.getElementById("form-icon");
const saveTaskButton = document.getElementById("save-task-button");
const saveButtonIcon = document.getElementById("save-button-icon");
const cancelEditButton = document.getElementById("cancel-edit-button");
const storageError = document.getElementById("storage-error");
let tasks = loadTasks();
let activeStatus = "all";
let editingTaskId = null;

function loadTasks() {
  try {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (!storedTasks) return [];

    const parsedTasks = JSON.parse(storedTasks);
    if (!Array.isArray(parsedTasks)) throw new Error("Saved tasks are not a list.");

    return parsedTasks.filter((task) =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.description === "string" &&
      typeof task.completed === "boolean" &&
      ["low", "medium", "high"].includes(task.priority)
    );
  } catch (error) {
    console.error("Unable to load saved tasks.", error);
    storageError.hidden = false;
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    storageError.hidden = true;
    return true;
  } catch (error) {
    console.error("Unable to save tasks.", error);
    storageError.hidden = false;
    return false;
  }
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function getTodayString() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function renderTask(task) {
  const item = createElement("article", `task-item${task.completed ? " is-completed" : ""}`);
  const checkbox = createElement("input", "task-checkbox");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `${task.completed ? "Mark as to do" : "Mark as completed"}: ${task.title}`);
  checkbox.dataset.action = "toggle";
  checkbox.dataset.id = task.id;

  const main = createElement("div", "task-main");
  main.append(createElement("div", "task-title", task.title));
  if (task.description) main.append(createElement("p", "task-description", task.description));

  const meta = createElement("div", "task-meta");
  const priority = createElement("span", `task-badge priority-${task.priority}`, `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`);
  meta.append(priority);
  if (task.dueDate) {
    const due = createElement("span", "task-due", `Due ${formatDate(task.dueDate)}`);
    if (!task.completed && task.dueDate < getTodayString()) due.classList.add("is-overdue");
    meta.append(due);
  }
  main.append(meta);

  const actions = createElement("div", "task-actions");
  const editButton = createElement("button", "task-action", "Edit");
  editButton.type = "button";
  editButton.dataset.action = "edit";
  editButton.dataset.id = task.id;
  editButton.setAttribute("aria-label", `Edit ${task.title}`);

  const deleteButton = createElement("button", "task-action task-action-delete", "Delete");
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.dataset.id = task.id;
  deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
  actions.append(editButton, deleteButton);
  item.append(checkbox, main, actions);
  return item;
}

function renderEmptyState() {
  const emptyState = createElement("div", "empty-state");
  const illustration = createElement("div", "empty-illustration", "✦");
  illustration.setAttribute("aria-hidden", "true");
  const heading = createElement("h3", "", tasks.length ? "No tasks match these filters" : "Your day is a blank page");
  const message = createElement("p", "", tasks.length ? "Try a different filter or search term." : "Add a task to get your study plan started.");
  emptyState.append(illustration, heading, message);
  return emptyState;
}

function render() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const visibleTasks = tasks.filter((task) => {
    const matchesStatus =
      activeStatus === "all" ||
      (activeStatus === "active" && !task.completed) ||
      (activeStatus === "completed" && task.completed);
    const matchesPriority = priorityFilter.value === "all" || task.priority === priorityFilter.value;
    const matchesQuery =
      !query ||
      task.title.toLocaleLowerCase().includes(query) ||
      task.description.toLocaleLowerCase().includes(query);
    return matchesStatus && matchesPriority && matchesQuery;
  });

  taskList.replaceChildren(...visibleTasks.map(renderTask));
  if (visibleTasks.length === 0) taskList.append(renderEmptyState());

  const completedCount = tasks.filter((task) => task.completed).length;
  const remainingCount = tasks.length - completedCount;
  const percentage = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  document.getElementById("total-count").textContent = String(tasks.length);
  document.getElementById("completed-count").textContent = String(completedCount);
  document.getElementById("remaining-count").textContent = String(remainingCount);
  document.getElementById("list-count").textContent = String(visibleTasks.length);
  document.getElementById("progress-percent").textContent = `${percentage}%`;
  document.getElementById("progress-fill").style.width = `${percentage}%`;
  const progressBar = document.getElementById("progress-bar");
  progressBar.setAttribute("aria-valuenow", String(percentage));
  document.getElementById("progress-caption").textContent =
    percentage === 100 && tasks.length > 0
      ? "Look at you go — everything is done!"
      : tasks.length === 0
        ? "A fresh start. Pick your first task."
        : `${remainingCount} ${remainingCount === 1 ? "task" : "tasks"} left to go.`;
}

function resetForm() {
  taskForm.reset();
  taskPriorityInput.value = "medium";
  editingTaskId = null;
  formHeading.textContent = "Add a task";
  formIcon.textContent = "＋";
  saveButtonIcon.textContent = "＋";
  saveTaskButton.lastChild.textContent = " Add task";
  cancelEditButton.hidden = true;
}

function beginEditing(task) {
  editingTaskId = task.id;
  taskTitleInput.value = task.title;
  taskDescriptionInput.value = task.description;
  taskDueDateInput.value = task.dueDate || "";
  taskPriorityInput.value = task.priority;
  formHeading.textContent = "Edit task";
  formIcon.textContent = "✎";
  saveButtonIcon.textContent = "✓";
  saveTaskButton.lastChild.textContent = " Save changes";
  cancelEditButton.hidden = false;
  document.querySelector(".form-panel").scrollIntoView({ behavior: "smooth", block: "center" });
  taskTitleInput.focus({ preventScroll: true });
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title) {
    taskTitleInput.focus();
    return;
  }

  const taskData = {
    title,
    description: taskDescriptionInput.value.trim(),
    dueDate: taskDueDateInput.value,
    priority: taskPriorityInput.value,
  };

  if (editingTaskId) {
    tasks = tasks.map((task) => task.id === editingTaskId ? { ...task, ...taskData } : task);
  } else {
    tasks.unshift({
      id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...taskData,
      completed: false,
      createdAt: new Date().toISOString(),
    });
  }

  saveTasks();
  resetForm();
  render();
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const task = tasks.find((item) => item.id === button.dataset.id);
  if (!task) return;

  if (button.dataset.action === "edit") {
    beginEditing(task);
  } else if (button.dataset.action === "delete") {
    tasks = tasks.filter((item) => item.id !== task.id);
    if (editingTaskId === task.id) resetForm();
    saveTasks();
    render();
  }
});

taskList.addEventListener("change", (event) => {
  const checkbox = event.target;
  if (!(checkbox instanceof HTMLInputElement) || checkbox.dataset.action !== "toggle") return;
  tasks = tasks.map((task) => task.id === checkbox.dataset.id ? { ...task, completed: checkbox.checked } : task);
  saveTasks();
  render();
});

statusFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeStatus = button.dataset.status;
    statusFilterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });
    render();
  });
});

priorityFilter.addEventListener("change", render);
searchInput.addEventListener("input", render);
cancelEditButton.addEventListener("click", resetForm);

document.getElementById("today-date").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

render();
