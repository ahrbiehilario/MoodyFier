"use strict";

const switches = document.querySelectorAll(".switch");
const toast = document.getElementById("toast");

const bluetoothButton = document.getElementById("bluetoothButton");
const bluetoothOverlay = document.getElementById("bluetoothOverlay");
const bluetoothClose = document.getElementById("bluetoothClose");
const bluetoothOff = document.getElementById("bluetoothOff");
const bluetoothOn = document.getElementById("bluetoothOn");
const turnBluetoothOn = document.getElementById("turnBluetoothOn");
const scanBluetooth = document.getElementById("scanBluetooth");
const deviceList = document.getElementById("deviceList");

const scheduleButton = document.getElementById("scheduleButton");
const scheduleModal = document.getElementById("scheduleModal");
const scheduleClose = document.getElementById("scheduleClose");
const scheduleForm = document.getElementById("scheduleForm");
const scheduleList = document.getElementById("scheduleList");
const scheduleCount = document.getElementById("scheduleCount");

const moodSelect = document.getElementById("moodSelect");
const startTime = document.getElementById("startTime");
const endTime = document.getElementById("endTime");
const editingScheduleId = document.getElementById("editingScheduleId");
const saveScheduleButton = document.getElementById("saveScheduleButton");
const cancelEditButton = document.getElementById("cancelEditButton");

const weekdaysButton = document.getElementById("weekdaysButton");
const everydayButton = document.getElementById("everydayButton");
const clearDaysButton = document.getElementById("clearDaysButton");

const dayCheckboxes = document.querySelectorAll(
    ".day-option input[type='checkbox']"
);

const simpleModal = document.getElementById("simpleModal");
const simpleClose = document.getElementById("simpleClose");
const simpleTitle = document.getElementById("simpleTitle");
const aboutButton = document.getElementById("aboutButton");

const MOOD_STORAGE_KEY = "moodly-moods";
const SCHEDULE_STORAGE_KEY = "moodly-schedules";

let schedules = [];

const moodIcons = {
    Calm: "💜",
    Fresh: "🌿",
    Love: "🌹",
    Serene: "🌊"
};

const dayNames = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat"
};

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

function saveMoodState() {
    const state = {};

    switches.forEach((button) => {
        state[button.dataset.mood] =
            button.getAttribute("aria-checked") === "true";
    });

    try {
        localStorage.setItem(
            MOOD_STORAGE_KEY,
            JSON.stringify(state)
        );
    } catch (error) {
        console.warn("Mood state could not be saved.", error);
    }
}

function loadMoodState() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(MOOD_STORAGE_KEY) || "{}"
        );

        switches.forEach((button) => {
            const mood = button.dataset.mood;

            if (typeof saved[mood] === "boolean") {
                button.setAttribute(
                    "aria-checked",
                    String(saved[mood])
                );
            }
        });
    } catch (error) {
        console.warn(
            "Saved mood data could not be loaded.",
            error
        );
    }
}

function setMood(mood, enabled, save = true) {
    const button = [...switches].find(
        (item) => item.dataset.mood === mood
    );

    if (!button) {
        return;
    }

    button.setAttribute(
        "aria-checked",
        String(enabled)
    );

    if (save) {
        saveMoodState();
    }
}

switches.forEach((button) => {
    button.addEventListener("click", () => {
        const current =
            button.getAttribute("aria-checked") === "true";

        const next = !current;
        const mood = button.dataset.mood;

        button.setAttribute(
            "aria-checked",
            String(next)
        );

        saveMoodState();

        showToast(
            `${mood} ${next ? "enabled" : "disabled"}`
        );
    });
});

function updateBluetoothView() {
    const isOn = bluetoothState.on;

    bluetoothOff.hidden = isOn;
    bluetoothOn.hidden = !isOn;

    if (isOn) {
        renderDevices();
    }
}

function openBluetooth() {
    updateBluetoothView();

    bluetoothOverlay.hidden = false;

    requestAnimationFrame(() => {
        bluetoothClose.focus();
    });
}

function closeBluetooth() {
    bluetoothOverlay.hidden = true;
    bluetoothButton.focus();
}

bluetoothButton.addEventListener(
    "click",
    openBluetooth
);

bluetoothClose.addEventListener(
    "click",
    closeBluetooth
);

bluetoothOverlay.addEventListener(
    "click",
    (event) => {
        if (event.target === bluetoothOverlay) {
            closeBluetooth();
        }
    }
);

const bluetoothState = {
    on: false,
    devices: []
};

function setBluetoothOn() {
    bluetoothState.on = true;
    updateBluetoothView();
    showToast("Bluetooth is ready");
}

function addDevice(device) {
    if (!device || !device.id) {
        return;
    }

    const exists =
        bluetoothState.devices.some(
            (item) => item.id === device.id
        );

    if (!exists) {
        bluetoothState.devices.push({
            id: device.id,
            name: device.name || "Unknown Bluetooth Device"
        });
    }

    renderDevices();
}

function renderDevices() {
    deviceList.innerHTML = "";

    if (bluetoothState.devices.length === 0) {
        const empty = document.createElement("div");
        empty.className = "device-empty";

        const icon = document.createElement("span");
        icon.className = "search-icon";
        icon.textContent = "⌁";

        const title = document.createElement("strong");
        title.textContent = "No devices found";

        const description = document.createElement("small");
        description.textContent =
            "Scan to search for nearby Bluetooth devices.";

        empty.append(
            icon,
            title,
            description
        );

        deviceList.appendChild(empty);

        return;
    }

    bluetoothState.devices.forEach((device) => {
        const card = document.createElement("div");
        card.className = "bluetooth-device";

        const icon = document.createElement("div");
        icon.className = "device-icon";
        icon.textContent = "ᛒ";

        const information = document.createElement("div");
        information.className = "device-info";

        const name = document.createElement("span");
        name.className = "device-name";
        name.textContent = device.name;

        const type = document.createElement("span");
        type.className = "device-type";
        type.textContent = "Nearby Bluetooth device";

        information.append(
            name,
            type
        );

        card.append(
            icon,
            information
        );

        deviceList.appendChild(card);
    });
}

function bluetoothSupported() {
    return "bluetooth" in navigator;
}

async function scanForBluetooth() {
    if (!bluetoothSupported()) {
        bluetoothState.on = false;
        updateBluetoothView();

        showToast(
            "Web Bluetooth is not supported by this browser."
        );

        return;
    }

    if (!window.isSecureContext) {
        showToast(
            "Bluetooth requires HTTPS or localhost."
        );

        return;
    }

    scanBluetooth.disabled = true;
    turnBluetoothOn.disabled = true;
    scanBluetooth.textContent = "Searching...";

    try {
        const device =
            await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: []
            });

        setBluetoothOn();

        addDevice({
            id: device.id,
            name: device.name || "Unknown Device"
        });

        scanBluetooth.textContent = "Scan Again";
    } catch (error) {
        if (
            error &&
            error.name === "NotFoundError"
        ) {
            showToast("No device selected");
        } else if (
            error &&
            error.name === "SecurityError"
        ) {
            showToast("Bluetooth permission was blocked");
        } else {
            showToast("Bluetooth scan was cancelled");
        }

        scanBluetooth.textContent = "Scan for Devices";
    } finally {
        scanBluetooth.disabled = false;
        turnBluetoothOn.disabled = false;
    }
}

turnBluetoothOn.addEventListener(
    "click",
    scanForBluetooth
);

scanBluetooth.addEventListener(
    "click",
    scanForBluetooth
);

function saveSchedules() {
    try {
        localStorage.setItem(
            SCHEDULE_STORAGE_KEY,
            JSON.stringify(schedules)
        );
    } catch (error) {
        console.warn(
            "Schedules could not be saved.",
            error
        );
    }
}

function loadSchedules() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(
                SCHEDULE_STORAGE_KEY
            ) || "[]"
        );

        if (Array.isArray(saved)) {
            schedules = saved;
        }
    } catch (error) {
        schedules = [];

        console.warn(
            "Schedules could not be loaded.",
            error
        );
    }

    renderSchedules();
}

function getSelectedDays() {
    return [...dayCheckboxes]
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => Number(checkbox.value));
}

function setSelectedDays(days) {
    dayCheckboxes.forEach((checkbox) => {
        checkbox.checked = days.includes(
            Number(checkbox.value)
        );
    });
}

function resetScheduleForm() {
    scheduleForm.reset();

    editingScheduleId.value = "";

    moodSelect.value = "Calm";

    setSelectedDays([]);

    saveScheduleButton.textContent =
        "Add Schedule";

    cancelEditButton.style.display =
        "none";
}

function formatTime(time) {
    if (!time) {
        return "";
    }

    const [hours, minutes] = time.split(":");

    const date = new Date();

    date.setHours(
        Number(hours),
        Number(minutes),
        0,
        0
    );

    return date.toLocaleTimeString(
        [],
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

function formatDays(days) {
    const sortedDays = [...days].sort(
        (a, b) => a - b
    );

    if (sortedDays.length === 7) {
        return "Every day";
    }

    if (
        sortedDays.length === 5 &&
        [1, 2, 3, 4, 5].every(
            (day) => sortedDays.includes(day)
        )
    ) {
        return "Weekdays";
    }

    if (
        sortedDays.length === 2 &&
        sortedDays.includes(0) &&
        sortedDays.includes(6)
    ) {
        return "Weekends";
    }

    return sortedDays
        .map((day) => dayNames[day])
        .join(" • ");
}

function isScheduleActive(
    schedule,
    date = new Date()
) {
    if (!schedule.enabled) {
        return false;
    }

    const day = date.getDay();

    if (!schedule.days.includes(day)) {
        return false;
    }

    const currentMinutes =
        date.getHours() * 60 +
        date.getMinutes();

    const [startHour, startMinute] =
        schedule.startTime
            .split(":")
            .map(Number);

    const [endHour, endMinute] =
        schedule.endTime
            .split(":")
            .map(Number);

    const startMinutes =
        startHour * 60 +
        startMinute;

    const endMinutes =
        endHour * 60 +
        endMinute;

    if (startMinutes === endMinutes) {
        return false;
    }

    if (startMinutes < endMinutes) {
        return (
            currentMinutes >= startMinutes &&
            currentMinutes < endMinutes
        );
    }

    return (
        currentMinutes >= startMinutes ||
        currentMinutes < endMinutes
    );
}

function scheduleControlsMood(
    schedule,
    date = new Date()
) {
    if (!schedule.enabled) {
        return false;
    }

    const day = date.getDay();

    return schedule.days.includes(day);
}

function validateSchedule() {
    const days = getSelectedDays();

    if (days.length === 0) {
        showToast(
            "Please choose at least one day."
        );

        return false;
    }

    if (!startTime.value || !endTime.value) {
        showToast(
            "Please choose an ON and OFF time."
        );

        return false;
    }

    if (startTime.value === endTime.value) {
        showToast(
            "ON and OFF times cannot be the same."
        );

        return false;
    }

    return true;
}

function addSchedule(event) {
    event.preventDefault();

    if (!validateSchedule()) {
        return;
    }

    const scheduleData = {
        mood: moodSelect.value,
        startTime: startTime.value,
        endTime: endTime.value,
        days: getSelectedDays(),
        enabled: true
    };

    const editingId =
        editingScheduleId.value;

    if (editingId) {
        const index =
            schedules.findIndex(
                (schedule) =>
                    schedule.id === editingId
            );

        if (index !== -1) {
            schedules[index] = {
                ...schedules[index],
                ...scheduleData
            };

            showToast(
                "Schedule updated!"
            );
        }
    } else {
        schedules.push({
            id:
                Date.now().toString() +
                Math.random()
                    .toString(16)
                    .slice(2),
            ...scheduleData
        });

        showToast(
            "Schedule added!"
        );
    }

    saveSchedules();
    renderSchedules();
    resetScheduleForm();
    checkSchedules();
}

function editSchedule(id) {
    const schedule =
        schedules.find(
            (item) => item.id === id
        );

    if (!schedule) {
        return;
    }

    moodSelect.value = schedule.mood;
    startTime.value = schedule.startTime;
    endTime.value = schedule.endTime;

    setSelectedDays(schedule.days);

    editingScheduleId.value =
        schedule.id;

    saveScheduleButton.textContent =
        "Update Schedule";

    cancelEditButton.style.display =
        "block";

    scheduleForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function deleteSchedule(id) {
    const schedule =
        schedules.find(
            (item) => item.id === id
        );

    if (!schedule) {
        return;
    }

    schedules =
        schedules.filter(
            (item) => item.id !== id
        );

    saveSchedules();
    renderSchedules();
    checkSchedules();

    showToast(
        `${schedule.mood} schedule deleted`
    );

    if (
        editingScheduleId.value === id
    ) {
        resetScheduleForm();
    }
}

function toggleSchedule(id) {
    const schedule =
        schedules.find(
            (item) => item.id === id
        );

    if (!schedule) {
        return;
    }

    schedule.enabled =
        !schedule.enabled;

    saveSchedules();
    renderSchedules();
    checkSchedules();

    showToast(
        `${schedule.mood} schedule ${
            schedule.enabled
                ? "enabled"
                : "disabled"
        }`
    );
}

function renderSchedules() {
    scheduleList.innerHTML = "";

    scheduleCount.textContent =
        `${schedules.length} ${
            schedules.length === 1
                ? "schedule"
                : "schedules"
        }`;

    if (schedules.length === 0) {
        const empty =
            document.createElement("div");

        empty.className =
            "no-schedules";

        empty.innerHTML = `
            <span class="empty-icon">◷</span>
            <strong>No schedules yet</strong>
            <span>Add a schedule above to automate your moods.</span>
        `;

        scheduleList.appendChild(empty);

        return;
    }

    schedules.forEach((schedule) => {
        const card =
            document.createElement("article");

        card.className =
            "schedule-card";

        if (!schedule.enabled) {
            card.classList.add(
                "disabled"
            );
        }

        if (
            isScheduleActive(schedule)
        ) {
            card.classList.add(
                "active-now"
            );
        }

        const top =
            document.createElement("div");

        top.className =
            "schedule-top";

        const icon =
            document.createElement("div");

        icon.className =
            "schedule-mood-icon";

        icon.textContent =
            moodIcons[schedule.mood] ||
            "✨";

        const info =
            document.createElement("div");

        info.className =
            "schedule-info";

        const moodName =
            document.createElement("div");

        moodName.className =
            "schedule-mood-name";

        moodName.textContent =
            schedule.mood;

        const time =
            document.createElement("div");

        time.className =
            "schedule-time";

        time.textContent =
            `${formatTime(
                schedule.startTime
            )} → ${formatTime(
                schedule.endTime
            )}`;

        const days =
            document.createElement("div");

        days.className =
            "schedule-days";

        days.textContent =
            formatDays(
                schedule.days
            );

        info.append(
            moodName,
            time,
            days
        );

        const actions =
            document.createElement("div");

        actions.className =
            "schedule-actions";

        const edit =
            document.createElement("button");

        edit.className =
            "schedule-action";

        edit.type = "button";
        edit.textContent = "✎";
        edit.title = "Edit schedule";

        edit.setAttribute(
            "aria-label",
            `Edit ${schedule.mood} schedule`
        );

        edit.addEventListener(
            "click",
            () => editSchedule(
                schedule.id
            )
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "schedule-action delete";

        deleteButton.type = "button";
        deleteButton.textContent = "×";
        deleteButton.title = "Delete schedule";

        deleteButton.setAttribute(
            "aria-label",
            `Delete ${schedule.mood} schedule`
        );

        deleteButton.addEventListener(
            "click",
            () => deleteSchedule(
                schedule.id
            )
        );

        actions.append(
            edit,
            deleteButton
        );

        top.append(
            icon,
            info,
            actions
        );

        const status =
            document.createElement("div");

        status.className =
            "schedule-status";

        const activeLabel =
            document.createElement("div");

        activeLabel.className =
            "active-label";

        if (
            isScheduleActive(schedule)
        ) {
            activeLabel.innerHTML =
                "<span></span> Running now";
        } else if (
            schedule.enabled
        ) {
            activeLabel.innerHTML =
                "<span></span> Scheduled";
        } else {
            activeLabel.textContent =
                "Disabled";
        }

        const toggle =
            document.createElement("button");

        toggle.type = "button";

        toggle.className =
            "schedule-toggle";

        if (schedule.enabled) {
            toggle.classList.add(
                "enabled"
            );
        }

        toggle.setAttribute(
            "aria-label",
            schedule.enabled
                ? "Disable schedule"
                : "Enable schedule"
        );

        toggle.addEventListener(
            "click",
            () => toggleSchedule(
                schedule.id
            )
        );

        status.append(
            activeLabel,
            toggle
        );

        card.append(
            top,
            status
        );

        scheduleList.appendChild(card);
    });
}

function checkSchedules() {
    const currentDate = new Date();

    const moodsWithActiveSchedules =
        new Set();

    schedules.forEach((schedule) => {
        if (
            isScheduleActive(
                schedule,
                currentDate
            )
        ) {
            moodsWithActiveSchedules.add(
                schedule.mood
            );
        }
    });

    const moodsControlledToday =
        new Set();

    schedules.forEach((schedule) => {
        if (
            scheduleControlsMood(
                schedule,
                currentDate
            )
        ) {
            moodsControlledToday.add(
                schedule.mood
            );
        }
    });

    switches.forEach((button) => {
        const mood =
            button.dataset.mood;

        if (
            moodsControlledToday.has(mood)
        ) {
            const shouldBeOn =
                moodsWithActiveSchedules.has(
                    mood
                );

            button.setAttribute(
                "aria-checked",
                String(shouldBeOn)
            );
        }
    });

    renderSchedules();
}

function openSchedule() {
    scheduleModal.hidden = false;

    requestAnimationFrame(() => {
        scheduleClose.focus();
    });
}

function closeSchedule() {
    scheduleModal.hidden = true;

    resetScheduleForm();

    scheduleButton.focus();
}

scheduleButton.addEventListener(
    "click",
    openSchedule
);

scheduleClose.addEventListener(
    "click",
    closeSchedule
);

scheduleModal.addEventListener(
    "click",
    (event) => {
        if (
            event.target === scheduleModal
        ) {
            closeSchedule();
        }
    }
);

scheduleForm.addEventListener(
    "submit",
    addSchedule
);

cancelEditButton.addEventListener(
    "click",
    resetScheduleForm
);

weekdaysButton.addEventListener(
    "click",
    () => {
        setSelectedDays([
            1,
            2,
            3,
            4,
            5
        ]);
    }
);

everydayButton.addEventListener(
    "click",
    () => {
        setSelectedDays([
            0,
            1,
            2,
            3,
            4,
            5,
            6
        ]);
    }
);

clearDaysButton.addEventListener(
    "click",
    () => {
        setSelectedDays([]);
    }
);

function openTimePicker(input) {
    if (
        input &&
        typeof input.showPicker === "function"
    ) {
        try {
            input.showPicker();
        } catch (error) {
            input.focus();
        }
    } else if (input) {
        input.focus();
    }
}

startTime.addEventListener(
    "click",
    () => {
        openTimePicker(startTime);
    }
);

endTime.addEventListener(
    "click",
    () => {
        openTimePicker(endTime);
    }
);

startTime.addEventListener(
    "mousedown",
    () => {
        openTimePicker(startTime);
    }
);

endTime.addEventListener(
    "mousedown",
    () => {
        openTimePicker(endTime);
    }
);

aboutButton.addEventListener(
    "click",
    () => {
        simpleTitle.textContent =
            "About Us";

        const aboutSections =
            simpleModal.querySelectorAll(
                ".about-section"
            );

        aboutSections.forEach(
            (section) => {
                section.style.display = "";
            }
        );

        const subtitle =
            simpleModal.querySelector(
                ".about-subtitle"
            );

        subtitle.textContent =
            "Who we are and what inspires us.";

        simpleModal.hidden = false;

        requestAnimationFrame(() => {
            simpleClose.focus();
        });
    }
);

function closeSimpleModal() {
    simpleModal.hidden = true;
}

simpleClose.addEventListener(
    "click",
    closeSimpleModal
);

simpleModal.addEventListener(
    "click",
    (event) => {
        if (
            event.target === simpleModal
        ) {
            closeSimpleModal();
        }
    }
);

document.addEventListener(
    "keydown",
    (event) => {
        if (event.key !== "Escape") {
            return;
        }

        if (
            !bluetoothOverlay.hidden
        ) {
            closeBluetooth();
        }

        if (
            !scheduleModal.hidden
        ) {
            closeSchedule();
        }

        if (
            !simpleModal.hidden
        ) {
            closeSimpleModal();
        }
    }
);

loadMoodState();
loadSchedules();
renderDevices();
checkSchedules();

setInterval(
    checkSchedules,
    1000
);