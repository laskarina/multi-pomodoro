let schedule = [];
let currentIndex = 0;
let timer;
let remainingTime = 0;
let running = false;
let paused = false;

const circle = document.querySelector('.progress-ring__circle');
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

function setProgress(percent) {
    const offset = circumference - percent * circumference;
    circle.style.strokeDashoffset = offset;
}

function showSettings() {
    document.getElementById("timerScreen").style.display = "none";
    document.getElementById("settingsScreen").style.display = "flex";
    generateNameInputs();
    loadSettings();

    document.getElementById("numPeople").addEventListener("input", generateNameInputs);
}

function saveAndBack() {
    saveSettings();
    document.getElementById("settingsScreen").style.display = "none";
    document.getElementById("timerScreen").style.display = "flex";
}

function generateNameInputs() {
    const num = document.getElementById("numPeople").value;
    const form = document.getElementById("nameForm");
    form.innerHTML = "";
    for (let i = 0; i < num; i++) {
        form.innerHTML += `<label>${i + 1}名前: <input type="text" id="name${i}" value="Person${i + 1}"></label>`;
    }
}

function saveSettings() {
    const num = document.getElementById("numPeople").value;
    const settings = {
        numPeople: num,
        names: [],
        workTime: document.getElementById("workTime").value,
        frequency: document.getElementById("frequency").value,
        breakTime: document.getElementById("breakTime").value,
    };
    for (let i = 0; i < num; i++) {
        settings.names.push(document.getElementById(`name${i}`)?.value || `Person${i + 1}`);
    }
    localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem("pomodoroSettings");
    if (!saved) return;
    const settings = JSON.parse(saved);
    document.getElementById("numPeople").value = settings.numPeople;
    document.getElementById("workTime").value = settings.workTime;
    document.getElementById("frequency").value = settings.frequency;
    document.getElementById("breakTime").value = settings.breakTime;
    generateNameInputs();
    for (let i = 0; i < settings.numPeople; i++) {
        document.getElementById(`name${i}`).value = settings.names[i] || `Person${i + 1}`;
    }
}

function buildSchedule() {
    schedule = [];
    const num = document.getElementById("numPeople").value;
    const workTime = parseInt(document.getElementById("workTime").value) * 60;
    const frequency = parseInt(document.getElementById("frequency").value);
    const breakTime = parseInt(document.getElementById("breakTime").value) * 60;

    let names = [];
    for (let i = 0; i < num; i++) {
        const el = document.getElementById(`name${i}`);
        names.push(el ? el.value : `Person${i + 1}`);
    }

    for (let round = 0; round < frequency; round++) {
        schedule.push({ label: `${names[round % names.length]} 作業`, time: workTime, isBreak: false });
    }
    schedule.push({ label: `休憩`, time: breakTime, isBreak: true });

    renderSchedule();
    document.getElementById("schedule").style.display = "block";
}

function renderSchedule() {
    const div = document.getElementById("schedule");
    div.innerHTML = "<h3>1サイクルのスケジュール</h3><ol>";
    schedule.forEach((task, idx) => {
        div.innerHTML += `<li id="task${idx}">${task.label} (${Math.floor(task.time / 60)}分)</li>`;
    });
    div.innerHTML += "</ol>";
}

function startTimer() {
    if (running && !paused) return;
    saveSettings();
    if (!running) {
        buildSchedule();
        currentIndex = 0;
    }
    running = true;
    paused = false;
    startTask();
}

function pauseTimer() {
    if (!running) return;
    paused = true;
    clearInterval(timer);
    document.getElementById("currentTask").textContent += " (一時停止中)";
}

function stopTimer() {
    running = false;
    paused = false;
    clearInterval(timer);
    document.getElementById("currentTask").textContent = "停止中";
    document.getElementById("timerDisplay").textContent = "00:00";
    document.querySelectorAll("#schedule li").forEach(li => li.classList.remove("active"));
    setProgress(0);
    document.body.classList.remove("break");
    document.getElementById("schedule").style.display = "none";
}

function startTask() {
    if (!running || paused) return;
    if (currentIndex >= schedule.length) currentIndex = 0;
    const task = schedule[currentIndex];
    if (remainingTime === 0) remainingTime = task.time;

    document.getElementById("currentTask").textContent = `現在: ${task.label}`;
    highlightTask(currentIndex);
    if (task.isBreak) document.body.classList.add("break");
    else document.body.classList.remove("break");

    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        if (!running || paused) {
            clearInterval(timer);
            return;
        }
        if (remainingTime <= 0) {
            clearInterval(timer);
            currentIndex++;
            remainingTime = 0;
            startTask();
        } else {
            remainingTime--;
            updateDisplay();
        }
    }, 1000);
}

function updateDisplay() {
    const minutes = String(Math.floor(remainingTime / 60)).padStart(2, '0');
    const seconds = String(remainingTime % 60).padStart(2, '0');
    document.getElementById("timerDisplay").textContent = `${minutes}:${seconds}`;
    const task = schedule[currentIndex];
    const percent = remainingTime / task.time;
    setProgress(percent);
}

function highlightTask(index) {
    document.querySelectorAll("#schedule li").forEach(li => li.classList.remove("active"));
    const currentLi = document.getElementById(`task${index}`);
    if (currentLi) currentLi.classList.add("active");
}

window.onload = loadSettings;
