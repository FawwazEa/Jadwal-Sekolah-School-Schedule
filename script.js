const scheduleData = {
    // 0 = Minggu (Ahad) -> 6 = Sabtu
    0: [ // Ahad
        "Fiqih", "Fiqih", "Qur'an Hadits", "Qur'an Hadits",
        "Tahfidz", "Tahfidz", "Biologi", "Biologi"
    ],
    1: [ // Senin
        "Kimia", "Kimia", "MTK", "MTK",
        "Bahasa Indonesia", "Bahasa Indonesia", "Bahasa Inggris", "Bahasa Inggris"
    ],
    2: [ // Selasa
        "Tahfidz", "Tahfidz", "SBK", "PKWU",
        "Informatika", "Informatika", "Nahwu", "Fisika"
    ],
    3: [ // Rabu
        "Aqidah", "Aqidah", "PPKN", "PPKN",
        "Tahfidz", "Tahfidz", "MTK Lanjutan", "MTK Lanjutan"
    ],
    4: [ // Kamis
        "Bahasa Arab", "Bahasa Arab", "Sejarah Indonesia", "Sejarah Indonesia",
        "Informatika", "Informatika", "SKI", "SKI"
    ],
    5: [ // Jumat - Libur
        // Kosong
    ],
    6: [ // Sabtu 
        "Upacara", "Shorof", "KMD", "PJOK",
        "PJOK", "Ilmu Faraidh", "Fisika", "BK"
    ]
};

const teacherMap = {
    "PJOK": "Muhammad Azham Dzulkifli, S.Pd",
    "KMD": "Nur Hidayati S.Pd, M.Pd",
    "Shorof": "Nailul Khoir S.Pd",
    "Ilmu Faraidh": "Hayatun Nufus",
    "Fisika": "Ika Jauharini, S.Si",
    "BK": "Emma Juwita Sari S.Sos.I",
    "Fiqih": "Nur Kholis S.Th.I, M.Ag",
    "Qur'an Hadits": "Zakhiru Rahma Zaha, S.Hum M.Pd.I",
    "Biologi": "Ir. Siti Muzayanah, M.Pd",
    "Kimia": "Rifa'ul Ummah, S.Pd",
    "MTK": "Siswi Dwi Wahyuni, S.Si",
    "Bahasa Indonesia": "Wahidul Qohar, S.Pd",
    "Bahasa Inggris": "Wan Aini Nur Adidatin S.Pd",
    "Tahfidz": "Roisul Umam Firnanda Alfahmi, S.Pd",
    "SBK": "Mukaromah, S.Pd.I",
    "PKWU": "Nazihatul Adilah, S.Pd",
    "Informatika": "Aqil Aziz, S.Pd.I",
    "Nahwu": "Lathifatun Najah, S.Pd",
    "Aqidah": "Nur Hidayati S.Pd, M.Pd",
    "PPKN": "-(Belum Ditemukan)",
    "MTK Lanjutan": "Purwanto, S.Pd, M.Pd",
    "Bahasa Arab": "Nur Fazlinawati, S.Ag",
    "Sejarah Indonesia": "Titik Andriyani, S.Sos",
    "SKI": "Yuliana, S.Ag",
    "Upacara": "Semua Guru"
};

const dayNames = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const START_HOUR = 7;
const START_MINUTE = 0;
const DURATION_MINS = 40;
const PERIODS_PER_DAY = 8;

let currentSelectedDay = new Date().getDay();

// --- Elements ---
const clockDisplay = document.getElementById('clockDisplay');
const dateDisplay = document.getElementById('dateDisplay');
const currentSubjectEl = document.getElementById('currentSubject');
const currentTeacherEl = document.getElementById('currentTeacher');
const currentTimeRangeEl = document.getElementById('currentTimeRange');
const statusBadgeEl = document.getElementById('statusBadge');
const progressBarEl = document.getElementById('progressBar');
const nextSubjectEl = document.getElementById('nextSubject');
const scheduleListEl = document.getElementById('scheduleList');
const daySelectorEl = document.getElementById('daySelector');
const activeCardEl = document.getElementById('activeCard');

// --- Init ---
function init() {
    renderDaySelector();
    setInterval(updateRealTime, 1000);
    updateRealTime(); // Initial run
    renderScheduleList(currentSelectedDay);
}

// --- Logic ---

function getScheduleTimes(dayIndex) {
    if (!scheduleData[dayIndex] || scheduleData[dayIndex].length === 0) return [];

    let times = [];
    let currentMs = new Date().setHours(START_HOUR, START_MINUTE, 0, 0);

    for (let i = 0; i < scheduleData[dayIndex].length; i++) {
        // Break after 4th period (index 3), so before 5th period (i=4) starts
        if (i === 4) {
            currentMs += 20 * 60 * 1000; // Add 20 mins break
        }

        let start = new Date(currentMs);
        let end = new Date(currentMs + DURATION_MINS * 60 * 1000);
        const subjectName = scheduleData[dayIndex][i];

        times.push({
            type: 'subject',
            subject: subjectName,
            teacher: teacherMap[subjectName] || "",
            start: start,
            end: end,
            startStr: formatTime(start),
            endStr: formatTime(end)
        });

        currentMs += DURATION_MINS * 60 * 1000;
    }
    return times;
}

function updateRealTime() {
    const now = new Date();
    if (clockDisplay) clockDisplay.innerText = formatTimeWithSeconds(now);
    if (dateDisplay) dateDisplay.innerText = formatDate(now);

    const todayIndex = now.getDay();
    const todaySchedule = getScheduleTimes(todayIndex);

    if (todayIndex === 5 || todaySchedule.length === 0) {
        setNoActiveStatus("Hari Ini Libur / Tidak Ada Jadwal");
        return;
    }

    const firstPeriod = todaySchedule[0];
    const lastPeriod = todaySchedule[todaySchedule.length - 1];

    if (now < firstPeriod.start) {
        setNoActiveStatus("Belum Masuk Sekolah");
        if (nextSubjectEl) nextSubjectEl.innerText = `Pelajaran Pertama: ${firstPeriod.subject} (${firstPeriod.startStr})`;
        setStatusStyle('waiting');
        return;
    }

    if (now > lastPeriod.end) {
        setNoActiveStatus("Sekolah Selesai");
        if (nextSubjectEl) nextSubjectEl.innerText = "Sampai Jumpa Besok!";
        setStatusStyle('finished');
        return;
    }

    let activePeriod = null;
    let nextPeriod = null;
    let isBreak = false;

    for (let i = 0; i < todaySchedule.length; i++) {
        // Check Subject
        if (now >= todaySchedule[i].start && now < todaySchedule[i].end) {
            activePeriod = todaySchedule[i];
            if (i < todaySchedule.length - 1) {
                nextPeriod = todaySchedule[i + 1];
            }
            break;
        }
        // Check Gap (Break)
        if (i < todaySchedule.length - 1) {
            if (now >= todaySchedule[i].end && now < todaySchedule[i + 1].start) {
                isBreak = true;
                nextPeriod = todaySchedule[i + 1];
                break;
            }
        }
    }

    if (activePeriod) {
        updateActiveCard(activePeriod, nextPeriod, now);
    } else if (isBreak) {
        currentSubjectEl.innerText = "ISTIRAHAT";
        currentTeacherEl.innerText = "";
        currentTimeRangeEl.innerText = "09:40 - 10:00";
        statusBadgeEl.innerText = "Waktunya Istirahat";
        if (nextSubjectEl) nextSubjectEl.innerText = nextPeriod ? `Selanjutnya: ${nextPeriod.subject}` : "";

        const breakStart = todaySchedule[3].end;
        const breakEnd = todaySchedule[4].start;
        const total = breakEnd - breakStart;
        const elapsed = now - breakStart;
        const pct = (elapsed / total) * 100;
        if (progressBarEl) progressBarEl.style.width = `${pct}%`;

        setStatusStyle('warning');
    } else {
        setNoActiveStatus("Transisi");
    }

    // Only highlight if showing today's list
    if (currentSelectedDay === todayIndex) {
        highlightActiveInList(activePeriod);
    }
}

function updateActiveCard(period, next, now) {
    if (currentSubjectEl) currentSubjectEl.innerText = period.subject;
    if (currentTeacherEl) currentTeacherEl.innerText = period.teacher;
    if (currentTimeRangeEl) currentTimeRangeEl.innerText = `${period.startStr} - ${period.endStr}`;
    if (statusBadgeEl) statusBadgeEl.innerText = "Sedang Berlangsung";
    if (nextSubjectEl) nextSubjectEl.innerText = next ? `Selanjutnya: ${next.subject}` : "Pelajaran Terakhir";

    if (progressBarEl) {
        const totalDuration = period.end - period.start;
        const elapsed = now - period.start;
        const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        progressBarEl.style.width = `${pct}%`;
    }

    setStatusStyle('active');
}

function setNoActiveStatus(msg) {
    if (currentSubjectEl) currentSubjectEl.innerText = msg;
    if (currentTeacherEl) currentTeacherEl.innerText = "";
    if (currentTimeRangeEl) currentTimeRangeEl.innerText = "--:--";
    if (statusBadgeEl) statusBadgeEl.innerText = "Status";
    if (progressBarEl) progressBarEl.style.width = "0%";
    setStatusStyle('inactive');
}

function setStatusStyle(mode) {
    if (!activeCardEl) return;
    activeCardEl.classList.remove('waiting', 'finished', 'inactive', 'active', 'warning');
    activeCardEl.classList.add(mode);
}

// --- Rendering List ---

function renderDaySelector() {
    if (!daySelectorEl) return;
    daySelectorEl.innerHTML = '';
    dayNames.forEach((name, idx) => {
        const btn = document.createElement('button');
        btn.className = `day-btn ${idx === currentSelectedDay ? 'active' : ''}`;
        btn.innerText = name;
        btn.onclick = () => {
            currentSelectedDay = idx;
            renderScheduleList(currentSelectedDay);
            updateDayButtons();
        };
        daySelectorEl.appendChild(btn);
    });
}

function updateDayButtons() {
    if (!daySelectorEl) return;
    const btns = daySelectorEl.querySelectorAll('.day-btn');
    btns.forEach((btn, idx) => {
        if (idx === currentSelectedDay) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function renderScheduleList(dayIdx) {
    if (!scheduleListEl) return;
    scheduleListEl.innerHTML = '';

    const schedule = getScheduleTimes(dayIdx);

    if (schedule.length === 0) {
        scheduleListEl.innerHTML = `<div class="no-schedule">Tidak ada jadwal pelajaran hari ini.</div>`;
        return;
    }

    for (let i = 0; i < schedule.length; i++) {
        const item = schedule[i];

        // Detect Gap for Break Row
        if (i > 0) {
            const prev = schedule[i - 1];
            // If gap is more than 1 minute, assume break
            if (item.start - prev.end > 60000) {
                const breakRow = document.createElement('div');
                breakRow.className = 'schedule-item break-item';
                // Use matching structure to style.css
                breakRow.innerHTML = `
                    <div class="item-time">09:40 - 10:00</div>
                    <div class="item-content">
                        <div class="item-subject-name" style="color: var(--color-warning); font-style: italic;">ISTIRAHAT</div>
                    </div>
                `;
                scheduleListEl.appendChild(breakRow);
            }
        }

        const row = document.createElement('div');
        row.className = 'schedule-item';

        // Structure matches CSS in style.css
        row.innerHTML = `
            <div class="item-time">
                ${item.startStr} - ${item.endStr}
            </div>
            <div class="item-content">
                <div class="item-subject-name">${i + 1}. ${item.subject}</div>
                <div class="item-teacher">${item.teacher}</div>
            </div>
        `;
        scheduleListEl.appendChild(row);
    }
}

function highlightActiveInList(activePeriod) {
    if (!scheduleListEl) return;
    const items = scheduleListEl.querySelectorAll('.schedule-item:not(.break-item)');
    items.forEach(item => item.classList.remove('active'));

    if (!activePeriod) return;

    // Find item matching time
    items.forEach(item => {
        // Safe check for item-time element
        const timeEl = item.querySelector('.item-time');
        if (timeEl && timeEl.innerText.includes(activePeriod.startStr)) {
            item.classList.add('active');
        }
    });
}

// --- Helpers ---
function formatTime(date) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
}

function formatTimeWithSeconds(date) {
    return date.toLocaleTimeString('id-ID', { hour12: false }).replace(/\./g, ':');
}

function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}


// Start
init();

// --- Interactive Background (Canvas) ---
const canvas = document.getElementById('interactive-bg');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particlesArray;

    // Mouse position
    let mouse = {
        x: null,
        y: null,
        radius: (canvas.height / 80) * (canvas.width / 80)
    }

    window.addEventListener('mousemove', function (event) {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    // Resize canvas
    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        mouse.radius = (canvas.height / 80) * (canvas.width / 80);
        initParticles();
    });

    // Particle Class
    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
        }

        // Draw particle
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // Update particle
        update() {
            // Check canvas boundaries
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            // Mouse Collision
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouse.radius + this.size) {
                if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
                    this.x += 10;
                }
                if (mouse.x > this.x && this.x > this.size * 10) {
                    this.x -= 10;
                }
                if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
                    this.y += 10;
                }
                if (mouse.y > this.y && this.y > this.size * 10) {
                    this.y -= 10;
                }
            }

            // Move particle
            this.x += this.directionX;
            this.y += this.directionY;

            this.draw();
        }
    }

    function initParticles() {
        particlesArray = [];
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Number of particles
        let numberOfParticles = (canvas.height * canvas.width) / 9000;

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 5) + 1;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 2) - 1; // -1 to 1
            let directionY = (Math.random() * 2) - 1; // -1 to 1 - Gravity-less
            let color = 'rgba(59, 130, 246, 0.1)'; // Blue with low opacity

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    function animateParticles() {
        requestAnimationFrame(animateParticles);
        ctx.clearRect(0, 0, innerWidth, innerHeight);

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connectParticles();
    }

    function connectParticles() {
        let opacityValue = 1;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
                    ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));

                if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                    opacityValue = 1 - (distance / 20000);
                    ctx.strokeStyle = 'rgba(59, 130, 246,' + opacityValue * 0.15 + ')'; // Line color
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    initParticles();
    animateParticles();
}
