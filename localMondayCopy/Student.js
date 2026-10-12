"use strict";

const STORAGE_KEY = "studyflow.tasks.v1";
const ACADEMIC_STORAGE_KEY = "studyflow.academics.v1";
const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const taskTitleInput = document.getElementById("task-title");
const taskDescriptionInput = document.getElementById("task-description");
const taskDueDateInput = document.getElementById("task-due-date");
const taskPriorityInput = document.getElementById("task-priority");
const taskCategoryInput = document.getElementById("task-category");
const taskSubjectInput = document.getElementById("task-subject");
const statusFilterButtons = document.querySelectorAll("[data-status]");
const priorityFilter = document.getElementById("priority-filter");
const searchInput = document.getElementById("search-input");
const formHeading = document.getElementById("form-heading");
const formIcon = document.getElementById("form-icon");
const saveTaskButton = document.getElementById("save-task-button");
const saveButtonIcon = document.getElementById("save-button-icon");
const cancelEditButton = document.getElementById("cancel-edit-button");
const storageError = document.getElementById("storage-error");
const subjectForm = document.getElementById("subject-form");
const subjectValidation = document.getElementById("subject-validation");
const testValidation = document.getElementById("test-validation");
const topicForm = document.getElementById("topic-form");
const testForm = document.getElementById("test-form");
const subjectFormHeading = document.getElementById("subject-form-heading");
const subjectFormIcon = document.getElementById("subject-form-icon");
const saveSubjectButton = document.getElementById("save-subject-button");
const cancelSubjectEdit = document.getElementById("cancel-subject-edit");
let editingSubjectId = null;
let academicData = loadAcademicData();
let tasks = loadTasks();
let activeStatus = "all";
let editingTaskId = null;

function id() {
  return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function shiftDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function makeDemoAcademicData() {
  return {
    subjects: [
      { id: "subject-cs201", name: "Data Structures", code: "CS201", faculty: "Dr. Ananya Sharma", syllabus: 68, theoryAttended: 18, theoryHeld: 20, labAttended: 7, labHeld: 8 },
      { id: "subject-ph102", name: "Engineering Physics", code: "PH102", faculty: "Prof. R. Mehta", syllabus: 54, theoryAttended: 16, theoryHeld: 20, labAttended: 6, labHeld: 8 },
      { id: "subject-ma101", name: "Engineering Mathematics", code: "MA101", faculty: "Dr. Kavita Rao", syllabus: 76, theoryAttended: 19, theoryHeld: 21, labAttended: 0, labHeld: 0 },
    ],
    topics: [
      { id: "topic-demo-1", subjectId: "subject-cs201", type: "theory", topic: "Linked lists and traversal", date: shiftDate(-1) },
      { id: "topic-demo-2", subjectId: "subject-ph102", type: "lab", topic: "Measuring wavelength with a diffraction grating", date: shiftDate(-2) },
      { id: "topic-demo-3", subjectId: "subject-ma101", type: "theory", topic: "Applications of partial derivatives", date: shiftDate(-3) },
    ],
    tests: [
      { id: "test-demo-1", subjectId: "subject-cs201", name: "Unit 2 quiz", score: 42, total: 50, date: shiftDate(-2) },
      { id: "test-demo-2", subjectId: "subject-ph102", name: "Wave optics test", score: 36, total: 40, date: shiftDate(-4) },
      { id: "test-demo-3", subjectId: "subject-ma101", name: "Calculus assessment", score: 27, total: 30, date: shiftDate(-6) },
    ],
  };
}

function loadAcademicData() {
  try {
    const storedData = localStorage.getItem(ACADEMIC_STORAGE_KEY);
    if (!storedData) return makeDemoAcademicData();
    const parsedData = JSON.parse(storedData);
    if (!parsedData || !Array.isArray(parsedData.subjects) || !Array.isArray(parsedData.topics) || !Array.isArray(parsedData.tests)) {
      throw new Error("Saved academic data has an invalid format.");
    }
    return parsedData;
  } catch (error) {
    console.error("Unable to load academic records.", error);
    storageError.hidden = false;
    return makeDemoAcademicData();
  }
}

function saveAcademicData() {
  try {
    localStorage.setItem(ACADEMIC_STORAGE_KEY, JSON.stringify(academicData));
    storageError.hidden = true;
    return true;
  } catch (error) {
    console.error("Unable to save academic records.", error);
    storageError.hidden = false;
    return false;
  }
}

function loadTasks() {
  try {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (!storedTasks) return [
      { id: "task-demo-1", title: "Finish linked list exercises", description: "Complete questions 4–8 from the practice sheet.", dueDate: shiftDate(1), priority: "high", category: "assignment", subjectId: "subject-cs201", completed: false, createdAt: new Date().toISOString() },
      { id: "task-demo-2", title: "Review wave optics notes", description: "Revise diffraction and interference before the quiz.", dueDate: shiftDate(2), priority: "medium", category: "daily", subjectId: "subject-ph102", completed: false, createdAt: new Date().toISOString() },
      { id: "task-demo-3", title: "Submit calculus problem set", description: "Upload the solved tutorial sheet.", dueDate: shiftDate(3), priority: "high", category: "assignment", subjectId: "subject-ma101", completed: false, createdAt: new Date().toISOString() },
    ];

    const parsedTasks = JSON.parse(storedTasks);
    if (!Array.isArray(parsedTasks)) throw new Error("Saved tasks are not a list.");

    return parsedTasks.filter((task) =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.description === "string" &&
      typeof task.completed === "boolean" &&
      ["low", "medium", "high"].includes(task.priority)
    ).map((task) => ({ ...task, category: task.category === "assignment" ? "assignment" : "daily", subjectId: typeof task.subjectId === "string" ? task.subjectId : "" }));
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
  const category = createElement("span", "task-badge task-category", task.category === "assignment" ? "Assignment" : "Daily task");
  meta.append(category);
  const subject = academicData.subjects.find((item) => item.id === task.subjectId);
  if (subject) meta.append(createElement("span", "task-badge task-subject", subject.code));
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
    const subject = academicData.subjects.find((item) => item.id === task.subjectId);
    const matchesQuery =
      !query ||
      task.title.toLocaleLowerCase().includes(query) ||
      task.description.toLocaleLowerCase().includes(query) ||
      (subject && `${subject.name} ${subject.code}`.toLocaleLowerCase().includes(query));
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
  document.getElementById("pending-work").textContent = String(remainingCount);
}

function percentage(attended, held) {
  return held > 0 ? Math.round((attended / held) * 100) : null;
}

function formatPercent(value) {
  return value === null ? "—" : `${Math.round(value)}%`;
}

function renderSubject(subject) {
  const card = createElement("article", "subject-card");
  const header = createElement("div", "subject-card-header");
  const titleGroup = createElement("div", "subject-title-group");
  titleGroup.append(createElement("span", "subject-code", subject.code));
  titleGroup.append(createElement("h3", "subject-name", subject.name));
  titleGroup.append(createElement("p", "subject-faculty", subject.faculty));
  const actions = createElement("div", "subject-actions");
  const editButton = createElement("button", "task-action", "Edit");
  editButton.type = "button";
  editButton.dataset.academicAction = "edit-subject";
  editButton.dataset.id = subject.id;
  editButton.setAttribute("aria-label", `Edit ${subject.name}`);
  const deleteButton = createElement("button", "task-action task-action-delete", "Delete");
  deleteButton.type = "button";
  deleteButton.dataset.academicAction = "delete-subject";
  deleteButton.dataset.id = subject.id;
  deleteButton.setAttribute("aria-label", `Delete ${subject.name}`);
  actions.append(editButton, deleteButton);
  header.append(titleGroup, actions);

  const syllabusHeading = createElement("div", "metric-heading");
  syllabusHeading.append(createElement("span", "", "Syllabus"));
  syllabusHeading.append(createElement("strong", "", `${subject.syllabus}%`));
  const syllabusTrack = createElement("div", "subject-progress-track");
  syllabusTrack.setAttribute("role", "progressbar");
  syllabusTrack.setAttribute("aria-label", `${subject.name} syllabus completion`);
  syllabusTrack.setAttribute("aria-valuemin", "0");
  syllabusTrack.setAttribute("aria-valuemax", "100");
  syllabusTrack.setAttribute("aria-valuenow", String(subject.syllabus));
  const syllabusFill = createElement("span");
  syllabusFill.style.width = `${subject.syllabus}%`;
  syllabusTrack.append(syllabusFill);

  const attendanceHeading = createElement("p", "subject-subheading", "Attendance");
  const attendanceGrid = createElement("div", "attendance-grid");
  const theory = percentage(subject.theoryAttended, subject.theoryHeld);
  const lab = percentage(subject.labAttended, subject.labHeld);
  const attendanceEntries = [
    ["Theory", theory, `${subject.theoryAttended}/${subject.theoryHeld} classes`],
    ["Labs", lab, `${subject.labAttended}/${subject.labHeld} sessions`],
  ];
  attendanceEntries.forEach(([label, value, detail]) => {
    const entry = createElement("div", "attendance-entry");
    const line = createElement("div", "attendance-line");
    line.append(createElement("span", "", label), createElement("strong", "", formatPercent(value)));
    entry.append(line, createElement("p", "attendance-detail", detail));
    attendanceGrid.append(entry);
  });

  const tests = academicData.tests.filter((test) => test.subjectId === subject.id);
  const average = tests.length ? tests.reduce((sum, test) => sum + test.score / test.total * 100, 0) / tests.length : null;
  const performance = createElement("div", "subject-performance");
  performance.append(createElement("span", "", "Test average"));
  performance.append(createElement("strong", "", formatPercent(average)));
  const recentTests = tests.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
  const testSummary = recentTests.length
    ? recentTests.map((test) => `${test.name}: ${test.score}/${test.total}`).join(" · ")
    : "No test marks recorded yet";
  card.append(header, syllabusHeading, syllabusTrack, attendanceHeading, attendanceGrid, performance, createElement("p", "subject-test-summary", testSummary));
  return card;
}

function setSubjectOptions(select, includeEmpty) {
  const selectedValue = select.value;
  select.replaceChildren();
  if (includeEmpty) select.append(new Option("No subject", ""));
  if (academicData.subjects.length === 0 && !includeEmpty) {
    const option = new Option("Add a subject first", "");
    option.disabled = true;
    option.selected = true;
    select.append(option);
    select.disabled = true;
    return;
  }
  select.disabled = false;
  academicData.subjects.forEach((subject) => select.append(new Option(`${subject.code} · ${subject.name}`, subject.id)));
  if (selectedValue && academicData.subjects.some((subject) => subject.id === selectedValue)) select.value = selectedValue;
}

function renderActivityList(container, entries, type) {
  container.replaceChildren();
  if (entries.length === 0) {
    container.append(createElement("p", "activity-empty", type === "topic" ? "No class or lab topics logged yet." : "No test marks added yet."));
    return;
  }
  entries.forEach((entry) => {
    const subject = academicData.subjects.find((item) => item.id === entry.subjectId);
    const row = createElement("div", "activity-row");
    const details = createElement("div", "activity-row-main");
    if (type === "topic") {
      details.append(createElement("strong", "", entry.topic));
      details.append(createElement("p", "", `${subject ? subject.code : "Subject"} · ${entry.type === "lab" ? "Lab" : "Class"} · ${formatDate(entry.date)}`));
    } else {
      const scorePercent = Math.round(entry.score / entry.total * 100);
      details.append(createElement("strong", "", entry.name));
      details.append(createElement("p", "", `${subject ? subject.code : "Subject"} · ${formatDate(entry.date)}`));
      row.append(details, createElement("span", "test-score-badge", `${entry.score}/${entry.total} · ${scorePercent}%`));
    }
    const deleteButton = createElement("button", "activity-delete", "×");
    deleteButton.type = "button";
    deleteButton.dataset.academicAction = type === "topic" ? "delete-topic" : "delete-test";
    deleteButton.dataset.id = entry.id;
    deleteButton.setAttribute("aria-label", `Remove ${type === "topic" ? entry.topic : entry.name}`);
    if (type === "topic") row.append(details);
    row.append(deleteButton);
    container.append(row);
  });
}

function renderAcademic() {
  const subjectList = document.getElementById("subject-list");
  subjectList.replaceChildren(...academicData.subjects.map(renderSubject));
  if (!academicData.subjects.length) {
    const empty = createElement("div", "empty-state subject-empty");
    empty.append(createElement("div", "empty-illustration", "▤"));
    empty.append(createElement("h3", "", "Start with a subject"));
    empty.append(createElement("p", "", "Add your subjects to track attendance and syllabus progress."));
    subjectList.append(empty);
  }

  setSubjectOptions(taskSubjectInput, true);
  setSubjectOptions(document.getElementById("topic-subject"), false);
  setSubjectOptions(document.getElementById("test-subject"), false);

  const theorySessions = academicData.subjects.reduce((sum, subject) => sum + subject.theoryAttended, 0);
  const labSessions = academicData.subjects.reduce((sum, subject) => sum + subject.labAttended, 0);
  const totalSessions = academicData.subjects.reduce((sum, subject) => sum + subject.theoryHeld + subject.labHeld, 0);
  const attendance = totalSessions ? (theorySessions + labSessions) / totalSessions * 100 : null;
  const syllabus = academicData.subjects.length
    ? academicData.subjects.reduce((sum, subject) => sum + Number(subject.syllabus), 0) / academicData.subjects.length
    : null;
  const marks = academicData.tests.length
    ? academicData.tests.reduce((sum, test) => sum + test.score / test.total * 100, 0) / academicData.tests.length
    : null;
  document.getElementById("subject-count").textContent = String(academicData.subjects.length);
  document.getElementById("attendance-average").textContent = formatPercent(attendance);
  document.getElementById("syllabus-average").textContent = formatPercent(syllabus);
  document.getElementById("marks-average").textContent = formatPercent(marks);

  const topics = academicData.topics.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const tests = academicData.tests.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  renderActivityList(document.getElementById("topic-list"), topics, "topic");
  renderActivityList(document.getElementById("test-list"), tests, "test");
}

function resetForm() {
  taskForm.reset();
  taskPriorityInput.value = "medium";
  taskCategoryInput.value = "daily";
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
  taskCategoryInput.value = task.category || "daily";
  taskSubjectInput.value = task.subjectId || "";
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
    category: taskCategoryInput.value,
    subjectId: taskSubjectInput.value,
  };

  if (editingTaskId) {
    tasks = tasks.map((task) => task.id === editingTaskId ? { ...task, ...taskData } : task);
  } else {
    tasks.unshift({
      id: id(),
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

function resetSubjectForm() {
  subjectForm.reset();
  subjectForm.elements.syllabus.value = "0";
  subjectForm.elements.theoryAttended.value = "0";
  subjectForm.elements.theoryHeld.value = "0";
  subjectForm.elements.labAttended.value = "0";
  subjectForm.elements.labHeld.value = "0";
  editingSubjectId = null;
  subjectFormHeading.textContent = "Add a subject";
  subjectFormIcon.textContent = "＋";
  saveSubjectButton.textContent = "＋ Add subject";
  cancelSubjectEdit.hidden = true;
  subjectValidation.hidden = true;
}

function beginSubjectEditing(subject) {
  editingSubjectId = subject.id;
  subjectForm.elements.name.value = subject.name;
  subjectForm.elements.code.value = subject.code;
  subjectForm.elements.faculty.value = subject.faculty;
  subjectForm.elements.syllabus.value = String(subject.syllabus);
  subjectForm.elements.theoryAttended.value = String(subject.theoryAttended);
  subjectForm.elements.theoryHeld.value = String(subject.theoryHeld);
  subjectForm.elements.labAttended.value = String(subject.labAttended);
  subjectForm.elements.labHeld.value = String(subject.labHeld);
  subjectFormHeading.textContent = "Edit subject";
  subjectFormIcon.textContent = "✎";
  saveSubjectButton.textContent = "✓ Save changes";
  cancelSubjectEdit.hidden = false;
  document.getElementById("subject-name").scrollIntoView({ behavior: "smooth", block: "center" });
  document.getElementById("subject-name").focus({ preventScroll: true });
}

subjectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(subjectForm);
  const theoryAttended = Number(form.get("theoryAttended"));
  const theoryHeld = Number(form.get("theoryHeld"));
  const labAttended = Number(form.get("labAttended"));
  const labHeld = Number(form.get("labHeld"));
  const code = String(form.get("code")).trim().toUpperCase();
  const duplicateCode = academicData.subjects.some((subject) =>
    subject.code.toLocaleLowerCase() === code.toLocaleLowerCase() && subject.id !== editingSubjectId
  );
  if (theoryAttended > theoryHeld || labAttended > labHeld) {
    subjectValidation.textContent = "Classes or labs attended cannot be greater than the number held.";
    subjectValidation.hidden = false;
    return;
  }
  if (duplicateCode) {
    subjectValidation.textContent = "A subject with this code already exists.";
    subjectValidation.hidden = false;
    return;
  }
  const subjectData = {
    name: String(form.get("name")).trim(),
    code,
    faculty: String(form.get("faculty")).trim(),
    syllabus: Number(form.get("syllabus")),
    theoryAttended,
    theoryHeld,
    labAttended,
    labHeld,
  };
  if (editingSubjectId) {
    academicData.subjects = academicData.subjects.map((subject) => subject.id === editingSubjectId ? { ...subject, ...subjectData } : subject);
  } else {
    academicData.subjects.push({ id: id(), ...subjectData });
  }
  saveAcademicData();
  resetSubjectForm();
  renderAcademic();
  render();
});

cancelSubjectEdit.addEventListener("click", resetSubjectForm);

topicForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(topicForm);
  academicData.topics.unshift({
    id: id(),
    subjectId: String(form.get("subjectId")),
    type: String(form.get("type")),
    topic: String(form.get("topic")).trim(),
    date: String(form.get("date")),
  });
  saveAcademicData();
  topicForm.elements.topic.value = "";
  renderAcademic();
});

testForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(testForm);
  const score = Number(form.get("score"));
  const total = Number(form.get("total"));
  if (score > total) {
    testValidation.textContent = "Marks scored cannot be greater than the total marks.";
    testValidation.hidden = false;
    return;
  }
  academicData.tests.unshift({
    id: id(),
    subjectId: String(form.get("subjectId")),
    name: String(form.get("name")).trim(),
    score,
    total,
    date: String(form.get("date")),
  });
  saveAcademicData();
  testForm.reset();
  testValidation.hidden = true;
  renderAcademic();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-academic-action]");
  if (!button) return;
  const { academicAction, id: recordId } = button.dataset;
  if (academicAction === "edit-subject") {
    const subject = academicData.subjects.find((item) => item.id === recordId);
    if (subject) beginSubjectEditing(subject);
    return;
  }
  if (academicAction === "delete-subject") {
    const subject = academicData.subjects.find((item) => item.id === recordId);
    if (!subject || !window.confirm(`Delete ${subject.name} and its topic and test records? Tasks linked to it will be kept without a subject.`)) return;
    academicData.subjects = academicData.subjects.filter((item) => item.id !== recordId);
    academicData.topics = academicData.topics.filter((item) => item.subjectId !== recordId);
    academicData.tests = academicData.tests.filter((item) => item.subjectId !== recordId);
    tasks = tasks.map((task) => task.subjectId === recordId ? { ...task, subjectId: "" } : task);
    if (editingSubjectId === recordId) resetSubjectForm();
    saveAcademicData();
    saveTasks();
    renderAcademic();
    render();
  } else if (academicAction === "delete-topic") {
    academicData.topics = academicData.topics.filter((item) => item.id !== recordId);
    saveAcademicData();
    renderAcademic();
  } else if (academicAction === "delete-test") {
    academicData.tests = academicData.tests.filter((item) => item.id !== recordId);
    saveAcademicData();
    renderAcademic();
  }
});

document.getElementById("topic-date").value = getTodayString();
document.getElementById("test-date").value = getTodayString();

document.getElementById("today-date").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

renderAcademic();
render();
