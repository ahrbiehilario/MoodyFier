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
const editingScheduleId = document.getElementById("editingScheduleId");
const saveScheduleButton = document.getElementById("saveScheduleButton");
const cancelEditButton = document.getElementById("cancelEditButton");

const simpleModal = document.getElementById("simpleModal");
const simpleClose = document.getElementById("simpleClose");
const simpleTitle = document.getElementById("simpleTitle");
const aboutButton = document.getElementById("aboutButton");

const MOOD_STORAGE_KEY = "moodly-moods";
const SCHEDULE_STORAGE_KEY = "moodly-timers";

let schedules = [];

const moodIcons = {
    Calm: "💜",
    Fresh: "🌿",
    Love: "🌹",
    Serene: "🌊"
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


/* =========================================================
   BLUETOOTH
   ========================================================= */

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

        const description = document.createElement("span");
        description.textContent =
            bluetoothState.on
                ? "Scan for nearby Bluetooth devices."
                : "Turn Bluetooth on to scan for devices.";

        empty.append(
            icon,
            title,
            description
        );

        deviceList.appendChild(empty);

        return;
    }

    bluetoothState.devices.forEach((device) => {
        const item =
            document.createElement("div");

        item.className =
            "device-item";

        const info =
            document.createElement("div");

        info.className =
            "device-info";

        const icon =
            document.createElement("span");

        icon.className =
            "device-icon";

        icon.textContent =
            "⌁";

        const name =
            document.createElement("strong");

        name.textContent =
            device.name;

        const id =
            document.createElement("small");

        id.textContent =
            device.id;

        info.append(
            icon,
            name,
            id
        );

        const connect =
            document.createElement("button");

        connect.type =
            "button";

        connect.className =
            "device-connect";

        connect.textContent =
            "Connect";

        connect.addEventListener(
            "click",
            () => {
                showToast(
                    `${device.name} connected`
                );
            }
        );

        item.append(
            info,
            connect
        );

        deviceList.appendChild(item);
    });
}

function bluetoothSupported() {
    return (
        typeof navigator !== "undefined" &&
        "bluetooth" in navigator
    );
}

async function scanForBluetooth() {
    if (!bluetoothState.on) {
        showToast(
            "Turn Bluetooth on first"
        );

        return;
    }

    if (!bluetoothSupported()) {
        showToast(
            "Bluetooth scanning is not supported here"
        );

        return;
    }

    try {
        const device =
            await navigator.bluetooth.requestDevice({
                acceptAllDevices: true
            });

        if (device) {
            addDevice({
                id:
                    device.id ||
                    device.name ||
                    Date.now().toString(),

                name:
                    device.name ||
                    "Bluetooth Device"
            });

            showToast(
                "Bluetooth device found"
            );
        }
    } catch (error) {
        if (
            error &&
            error.name !== "NotFoundError"
        ) {
            console.warn(
                "Bluetooth scan failed.",
                error
            );

            showToast(
                "Bluetooth scan cancelled"
            );
        }
    }
}

if (turnBluetoothOn) {
    turnBluetoothOn.addEventListener(
        "click",
        setBluetoothOn
    );
}

if (scanBluetooth) {
    scanBluetooth.addEventListener(
        "click",
        scanForBluetooth
    );
}


/* =========================================================
   TIMER FIELD CREATION
   ========================================================= */

function ensureTimerFields() {

    let timerHours =
        document.getElementById("timerHours");

    let timerMinutes =
        document.getElementById("timerMinutes");

    let timerSeconds =
        document.getElementById("timerSeconds");


    /*
     * If the newer timer HTML is already being used,
     * keep it.
     *
     * If the old schedule HTML is being used,
     * convert only the schedule input area.
     *
     * The actual schedule modal is NOT modified.
     * This keeps its original background and design.
     */

    if (
        !timerHours ||
        !timerMinutes ||
        !timerSeconds
    ) {

        const oldTimeGrid =
            scheduleForm?.querySelector(
                ".time-grid"
            );

        const oldDaysSection =
            oldTimeGrid?.parentElement
                ?.nextElementSibling;


        if (oldTimeGrid) {

            oldTimeGrid.innerHTML = `

                <div class="form-section">

                    <label
                        class="form-label"
                        for="timerHours"
                    >
                        Hours
                    </label>

                    <input
                        type="number"
                        id="timerHours"
                        class="form-input"
                        min="0"
                        max="99"
                        value="0"
                        inputmode="numeric">

                </div>


                <div class="form-section">

                    <label
                        class="form-label"
                        for="timerMinutes"
                    >
                        Minutes
                    </label>

                    <input
                        type="number"
                        id="timerMinutes"
                        class="form-input"
                        min="0"
                        max="59"
                        value="0"
                        inputmode="numeric">

                </div>


                <div class="form-section">

                    <label
                        class="form-label"
                        for="timerSeconds"
                    >
                        Seconds
                    </label>

                    <input
                        type="number"
                        id="timerSeconds"
                        class="form-input"
                        min="0"
                        max="59"
                        value="0"
                        inputmode="numeric">

                </div>

            `;

            oldTimeGrid.classList.add(
                "timer-duration-grid"
            );

            oldTimeGrid.style.gridTemplateColumns =
                "repeat(3, 1fr)";

            oldTimeGrid.style.gap =
                "12px";
        }


        if (
            oldDaysSection &&
            oldDaysSection !== oldTimeGrid
        ) {

            const label =
                oldDaysSection.querySelector(
                    ".form-label"
                );

            const daysGrid =
                oldDaysSection.querySelector(
                    ".days-grid"
                );

            const dayActions =
                oldDaysSection.querySelector(
                    ".day-actions"
                );


            if (label) {
                label.textContent =
                    "Timer Duration";
            }


            if (daysGrid) {
                daysGrid.remove();
            }


            if (dayActions) {
                dayActions.remove();
            }


            if (
                !oldDaysSection.querySelector(
                    ".timer-hint"
                )
            ) {

                const hint =
                    document.createElement(
                        "div"
                    );

                hint.className =
                    "timer-hint";

                hint.textContent =
                    "The selected mood turns on when the timer starts and turns off when the timer reaches zero.";

                oldDaysSection.appendChild(
                    hint
                );
            }
        }
    }


    timerHours =
        document.getElementById(
            "timerHours"
        );

    timerMinutes =
        document.getElementById(
            "timerMinutes"
        );

    timerSeconds =
        document.getElementById(
            "timerSeconds"
        );


    return {
        timerHours,
        timerMinutes,
        timerSeconds
    };
}

const timerFields =
    ensureTimerFields();

const timerHours =
    timerFields.timerHours;

const timerMinutes =
    timerFields.timerMinutes;

const timerSeconds =
    timerFields.timerSeconds;


/* =========================================================
   TIMER MODAL TEXT
   ========================================================= */

if (scheduleModal) {

    const scheduleTitle =
        scheduleModal.querySelector(
            "#scheduleTitle"
        );

    const scheduleSubtitle =
        scheduleModal.querySelector(
            ".schedule-heading p"
        );

    const savedTitle =
        scheduleModal.querySelector(
            ".saved-header h3"
        );

    const savedSubtitle =
        scheduleModal.querySelector(
            ".saved-header p"
        );


    if (scheduleTitle) {
        scheduleTitle.textContent =
            "Timer";
    }


    if (scheduleSubtitle) {
        scheduleSubtitle.textContent =
            "Set a countdown and let your chosen mood run automatically.";
    }


    if (savedTitle) {
        savedTitle.textContent =
            "Your Timers";
    }


    if (savedSubtitle) {
        savedSubtitle.textContent =
            "Manage your countdown timers.";
    }


    if (
        saveScheduleButton &&
        !editingScheduleId.value
    ) {

        saveScheduleButton.textContent =
            "Start Timer";
    }
}


/* =========================================================
   TIMER STORAGE
   ========================================================= */

function saveSchedules() {

    try {

        localStorage.setItem(
            SCHEDULE_STORAGE_KEY,
            JSON.stringify(schedules)
        );

    } catch (error) {

        console.warn(
            "Timers could not be saved.",
            error
        );
    }
}


/* =========================================================
   LOAD TIMERS
   ========================================================= */

function loadSchedules() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    SCHEDULE_STORAGE_KEY
                ) || "[]"
            );


        if (Array.isArray(saved)) {

            schedules =
                saved.map((timer) => {

                    const durationMs =
                        Number(
                            timer.durationMs
                        ) || 0;


                    let remainingMs =
                        Number(
                            timer.remainingMs
                        );


                    if (
                        !Number.isFinite(
                            remainingMs
                        )
                    ) {

                        remainingMs =
                            durationMs;
                    }


                    let running =
                        Boolean(
                            timer.running
                        );


                    if (
                        running &&
                        timer.endAt
                    ) {

                        remainingMs =
                            Math.max(
                                0,
                                Number(
                                    timer.endAt
                                ) -
                                Date.now()
                            );


                        if (
                            remainingMs <= 0
                        ) {

                            running =
                                false;
                        }
                    }


                    return {

                        id:
                            timer.id ||
                            Date.now()
                                .toString() +
                            Math.random()
                                .toString(16)
                                .slice(2),

                        mood:
                            timer.mood ||
                            "Calm",

                        durationMs,

                        remainingMs,

                        endAt:
                            running
                                ? Date.now() +
                                  remainingMs
                                : null,

                        running
                    };

                });
        }

    } catch (error) {

        schedules = [];

        console.warn(
            "Timers could not be loaded.",
            error
        );
    }


    saveSchedules();

    renderSchedules();
}


/* =========================================================
   GET TIMER DURATION
   ========================================================= */

function getDurationMs() {

    const hours =
        Math.max(
            0,
            parseInt(
                timerHours?.value || "0",
                10
            ) || 0
        );


    const minutes =
        Math.max(
            0,
            parseInt(
                timerMinutes?.value || "0",
                10
            ) || 0
        );


    const seconds =
        Math.max(
            0,
            parseInt(
                timerSeconds?.value || "0",
                10
            ) || 0
        );


    return (
        hours * 3600000 +
        minutes * 60000 +
        seconds * 1000
    );
}


/* =========================================================
   SET TIMER INPUTS
   ========================================================= */

function setDurationInputs(
    milliseconds
) {

    const totalSeconds =
        Math.max(
            0,
            Math.floor(
                milliseconds / 1000
            )
        );


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    const seconds =
        totalSeconds % 60;


    if (timerHours) {
        timerHours.value =
            String(hours);
    }


    if (timerMinutes) {
        timerMinutes.value =
            String(minutes);
    }


    if (timerSeconds) {
        timerSeconds.value =
            String(seconds);
    }
}


/* =========================================================
   RESET TIMER FORM
   ========================================================= */

function resetScheduleForm() {

    scheduleForm.reset();

    editingScheduleId.value =
        "";

    moodSelect.value =
        "Calm";

    setDurationInputs(0);

    saveScheduleButton.textContent =
        "Start Timer";

    cancelEditButton.style.display =
        "none";
}


/* =========================================================
   FORMAT TIMER
   ========================================================= */

function formatDuration(
    milliseconds
) {

    let totalSeconds =
        Math.max(
            0,
            Math.ceil(
                milliseconds / 1000
            )
        );


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    totalSeconds %=
        3600;


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    return (

        String(hours)
            .padStart(2, "0") +

        ":" +

        String(minutes)
            .padStart(2, "0") +

        ":" +

        String(seconds)
            .padStart(2, "0")
    );
}


/* =========================================================
   FORMAT HUMAN TIMER
   ========================================================= */

function formatDurationLabel(
    milliseconds
) {

    let totalSeconds =
        Math.max(
            0,
            Math.floor(
                milliseconds / 1000
            )
        );


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    totalSeconds %=
        3600;


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    const parts = [];


    if (hours > 0) {

        parts.push(
            `${hours} ${
                hours === 1
                    ? "hour"
                    : "hours"
            }`
        );
    }


    if (minutes > 0) {

        parts.push(
            `${minutes} ${
                minutes === 1
                    ? "minute"
                    : "minutes"
            }`
        );
    }


    if (seconds > 0) {

        parts.push(
            `${seconds} ${
                seconds === 1
                    ? "second"
                    : "seconds"
            }`
        );
    }


    return parts.length
        ? parts.join(" ")
        : "0 seconds";
}


/* =========================================================
   GET REMAINING TIMER
   ========================================================= */

function getTimerRemaining(
    timer
) {

    if (!timer.running) {

        return Math.max(
            0,
            Number(
                timer.remainingMs
            ) || 0
        );
    }


    return Math.max(
        0,
        Number(
            timer.endAt
        ) -
        Date.now()
    );
}


/* =========================================================
   VALIDATE TIMER
   ========================================================= */

function validateSchedule() {

    if (
        getDurationMs() <= 0
    ) {

        showToast(
            "Please set a timer longer than 0 seconds."
        );

        return false;
    }


    return true;
}


/* =========================================================
   ADD / UPDATE TIMER
   ========================================================= */

function addSchedule(
    event
) {

    event.preventDefault();


    if (!validateSchedule()) {
        return;
    }


    const durationMs =
        getDurationMs();


    const mood =
        moodSelect.value;


    const editingId =
        editingScheduleId.value;


    if (editingId) {

        const index =
            schedules.findIndex(
                (schedule) =>
                    schedule.id ===
                    editingId
            );


        if (index !== -1) {

            const oldMood =
                schedules[index].mood;


            setMood(
                oldMood,
                false,
                false
            );


            schedules[index] = {

                ...schedules[index],

                mood,

                durationMs,

                remainingMs:
                    durationMs,

                endAt:
                    Date.now() +
                    durationMs,

                running:
                    true
            };


            setMood(
                mood,
                true,
                true
            );


            showToast(
                "Timer updated!"
            );
        }

    } else {

        schedules.push({

            id:
                Date.now()
                    .toString() +
                Math.random()
                    .toString(16)
                    .slice(2),

            mood,

            durationMs,

            remainingMs:
                durationMs,

            endAt:
                Date.now() +
                durationMs,

            running:
                true
        });


        setMood(
            mood,
            true,
            true
        );


        showToast(
            "Timer started!"
        );
    }


    saveSchedules();

    renderSchedules();

    resetScheduleForm();
}


/* =========================================================
   EDIT TIMER
   ========================================================= */

function editSchedule(
    id
) {

    const timer =
        schedules.find(
            (item) =>
                item.id === id
        );


    if (!timer) {
        return;
    }


    if (timer.running) {

        timer.remainingMs =
            Math.max(
                0,
                timer.endAt -
                Date.now()
            );


        timer.running =
            false;

        timer.endAt =
            null;


        setMood(
            timer.mood,
            false,
            false
        );


        saveSchedules();
    }


    moodSelect.value =
        timer.mood;


    setDurationInputs(
        timer.remainingMs
    );


    editingScheduleId.value =
        timer.id;


    saveScheduleButton.textContent =
        "Update Timer";


    cancelEditButton.style.display =
        "block";


    scheduleForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    renderSchedules();
}


/* =========================================================
   DELETE TIMER
   ========================================================= */

function deleteSchedule(
    id
) {

    const timer =
        schedules.find(
            (item) =>
                item.id === id
        );


    if (!timer) {
        return;
    }


    if (timer.running) {

        setMood(
            timer.mood,
            false,
            false
        );
    }


    schedules =
        schedules.filter(
            (item) =>
                item.id !== id
        );


    saveSchedules();

    renderSchedules();


    showToast(
        `${timer.mood} timer deleted`
    );


    if (
        editingScheduleId.value === id
    ) {

        resetScheduleForm();
    }
}


/* =========================================================
   PAUSE / RESUME TIMER
   ========================================================= */

function toggleSchedule(
    id
) {

    const timer =
        schedules.find(
            (item) =>
                item.id === id
        );


    if (!timer) {
        return;
    }


    if (timer.running) {

        timer.remainingMs =
            Math.max(
                0,
                timer.endAt -
                Date.now()
            );


        timer.running =
            false;

        timer.endAt =
            null;


        setMood(
            timer.mood,
            false,
            false
        );


        showToast(
            "Timer paused"
        );

    } else {

        if (
            timer.remainingMs <= 0
        ) {

            showToast(
                "Timer finished. Press Reset to use it again."
            );

            return;
        }


        timer.running =
            true;


        timer.endAt =
            Date.now() +
            timer.remainingMs;


        setMood(
            timer.mood,
            true,
            false
        );


        showToast(
            "Timer resumed"
        );
    }


    saveSchedules();

    renderSchedules();
}


/* =========================================================
   RESET TIMER
   ========================================================= */

function resetTimer(
    id
) {

    const timer =
        schedules.find(
            (item) =>
                item.id === id
        );


    if (!timer) {
        return;
    }


    setMood(
        timer.mood,
        false,
        false
    );


    timer.remainingMs =
        timer.durationMs;


    timer.endAt =
        null;


    timer.running =
        false;


    saveSchedules();

    renderSchedules();


    showToast(
        "Timer reset"
    );
}


/* =========================================================
   RENDER TIMERS
   ========================================================= */

function renderSchedules() {

    scheduleList.innerHTML =
        "";


    scheduleCount.textContent =
        `${schedules.length} ${
            schedules.length === 1
                ? "timer"
                : "timers"
        }`;


    if (
        schedules.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "no-schedules";


        empty.innerHTML = `

            <span class="empty-icon">
                ◷
            </span>

            <strong>
                No timers yet
            </strong>

            <span>
                Add a timer above to automate your moods.
            </span>

        `;


        scheduleList.appendChild(
            empty
        );


        return;
    }


    schedules.forEach(
        (timer) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "schedule-card";


            if (!timer.running) {

                card.classList.add(
                    "disabled"
                );
            }


            if (
                timer.running &&
                getTimerRemaining(
                    timer
                ) > 0
            ) {

                card.classList.add(
                    "active-now"
                );
            }


            const top =
                document.createElement(
                    "div"
                );


            top.className =
                "schedule-top";


            const icon =
                document.createElement(
                    "div"
                );


            icon.className =
                "schedule-mood-icon";


            icon.textContent =
                moodIcons[
                    timer.mood
                ] || "✨";


            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "schedule-info";


            const moodName =
                document.createElement(
                    "div"
                );


            moodName.className =
                "schedule-mood-name";


            moodName.textContent =
                timer.mood;


            const time =
                document.createElement(
                    "div"
                );


            time.className =
                "schedule-time";


            time.textContent =
                formatDuration(
                    getTimerRemaining(
                        timer
                    )
                );


            const days =
                document.createElement(
                    "div"
                );


            days.className =
                "schedule-days";


            days.textContent =
                timer.running
                    ? "Running"
                    : timer.remainingMs <= 0
                        ? "Finished"
                        : "Paused";


            info.append(
                moodName,
                time,
                days
            );


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "schedule-actions";


            const edit =
                document.createElement(
                    "button"
                );


            edit.className =
                "schedule-action";


            edit.type =
                "button";


            edit.textContent =
                "✎";


            edit.title =
                "Edit timer";


            edit.setAttribute(
                "aria-label",
                `Edit ${timer.mood} timer`
            );


            edit.addEventListener(
                "click",
                () =>
                    editSchedule(
                        timer.id
                    )
            );


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.className =
                "schedule-action delete";


            deleteButton.type =
                "button";


            deleteButton.textContent =
                "×";


            deleteButton.title =
                "Delete timer";


            deleteButton.setAttribute(
                "aria-label",
                `Delete ${timer.mood} timer`
            );


            deleteButton.addEventListener(
                "click",
                () =>
                    deleteSchedule(
                        timer.id
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
                document.createElement(
                    "div"
                );


            status.className =
                "schedule-status";


            const activeLabel =
                document.createElement(
                    "div"
                );


            activeLabel.className =
                "active-label";


            if (
                timer.running &&
                getTimerRemaining(
                    timer
                ) > 0
            ) {

                activeLabel.innerHTML =
                    "<span></span> Running";

            } else if (
                timer.remainingMs <= 0
            ) {

                activeLabel.textContent =
                    "Finished";

            } else {

                activeLabel.textContent =
                    "Paused";
            }


            const toggle =
                document.createElement(
                    "button"
                );


            toggle.type =
                "button";


            toggle.className =
                "schedule-toggle";


            if (timer.running) {

                toggle.classList.add(
                    "enabled"
                );
            }


            toggle.setAttribute(
                "aria-label",
                timer.running
                    ? "Pause timer"
                    : "Resume timer"
            );


            toggle.addEventListener(
                "click",
                () =>
                    toggleSchedule(
                        timer.id
                    )
            );


            const reset =
                document.createElement(
                    "button"
                );


            reset.type =
                "button";


            reset.className =
                "schedule-action";


            reset.textContent =
                "↻";


            reset.title =
                "Reset timer";


            reset.setAttribute(
                "aria-label",
                "Reset timer"
            );


            reset.addEventListener(
                "click",
                () =>
                    resetTimer(
                        timer.id
                    )
            );


            status.append(
                activeLabel,
                toggle,
                reset
            );


            card.append(
                top,
                status
            );


            scheduleList.appendChild(
                card
            );

        }
    );
}


/* =========================================================
   CHECK TIMERS
   ========================================================= */

function checkSchedules() {

    let changed =
        false;


    schedules.forEach(
        (timer) => {

            if (!timer.running) {
                return;
            }


            const remaining =
                timer.endAt -
                Date.now();


            if (
                remaining <= 0
            ) {

                timer.remainingMs =
                    0;


                timer.endAt =
                    null;


                timer.running =
                    false;


                setMood(
                    timer.mood,
                    false,
                    false
                );


                showToast(
                    `${timer.mood} timer finished`
                );


                changed =
                    true;

            } else {

                timer.remainingMs =
                    remaining;


                /*
                 * Keep the selected mood ON
                 * while the timer is running.
                 */

                setMood(
                    timer.mood,
                    true,
                    false
                );


                changed =
                    true;
            }

        }
    );


    if (changed) {

        saveSchedules();
    }


    renderSchedules();
}


/* =========================================================
   OPEN SCHEDULE
   ========================================================= */

function openSchedule() {

    /*
     * IMPORTANT:
     * We only use the original hidden property.
     * No "active" class is added.
     *
     * This keeps the original schedule modal
     * background completely intact.
     */

    scheduleModal.hidden =
        false;


    requestAnimationFrame(
        () => {
            scheduleClose.focus();
        }
    );
}


/* =========================================================
   CLOSE SCHEDULE
   ========================================================= */

function closeSchedule() {

    scheduleModal.hidden =
        true;


    resetScheduleForm();


    scheduleButton.focus();
}


/* =========================================================
   SCHEDULE BUTTON
   ========================================================= */

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
            event.target ===
            scheduleModal
        ) {

            closeSchedule();
        }
    }
);


/* =========================================================
   TIMER FORM
   ========================================================= */

scheduleForm.addEventListener(
    "submit",
    addSchedule
);


cancelEditButton.addEventListener(
    "click",
    resetScheduleForm
);


/* =========================================================
   TIMER INPUT VALIDATION
   ========================================================= */

function normalizeTimerInput(
    input,
    max
) {

    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        () => {

            let value =
                parseInt(
                    input.value,
                    10
                );


            if (
                !Number.isFinite(
                    value
                )
            ) {

                value =
                    0;
            }


            value =
                Math.max(
                    0,
                    Math.min(
                        max,
                        value
                    )
                );


            input.value =
                String(value);
        }
    );
}


normalizeTimerInput(
    timerHours,
    99
);


normalizeTimerInput(
    timerMinutes,
    59
);


normalizeTimerInput(
    timerSeconds,
    59
);


/* =========================================================
   ABOUT US
   ========================================================= */

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

                section.style.display =
                    "";
            }
        );


        const subtitle =
            simpleModal.querySelector(
                ".about-subtitle"
            );


        subtitle.textContent =
            "Who we are and what inspires us.";


        simpleModal.hidden =
            false;


        requestAnimationFrame(
            () => {

                simpleClose.focus();
            }
        );
    }
);


function closeSimpleModal() {

    simpleModal.hidden =
        true;
}


simpleClose.addEventListener(
    "click",
    closeSimpleModal
);


simpleModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            simpleModal
        ) {

            closeSimpleModal();
        }
    }
);


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key !==
            "Escape"
        ) {

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


/* =========================================================
   INITIALIZE
   ========================================================= */

loadMoodState();

loadSchedules();

renderDevices();

checkSchedules();


/* =========================================================
   TIMER CHECK
   ========================================================= */

setInterval(
    checkSchedules,
    1000
);