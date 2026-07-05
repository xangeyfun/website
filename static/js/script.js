const terminal = document.getElementById("terminal");
const progress = document.getElementById("progress");
const button = document.getElementById("calcBtn");

const cpuMeter = document.getElementById("cpuMeter");
const ramMeter = document.getElementById("ramMeter");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
    
function startMetrics() {
    setInterval(() => {
        cpuMeter.textContent =
            Math.floor(20 + Math.random() * 70) + "%";

        ramMeter.textContent =
            Math.floor(30 + Math.random() * 60) + "%";
    }, 1200);
}

async function typeLine(text, cssClass) {

    const line = document.createElement("div");
    line.className = cssClass;
    terminal.appendChild(line);

    for (let i = 0; i < text.length; i++) {
        line.textContent += text[i];
        await sleep(10 + Math.random() * 40);
    }

    terminal.scrollTop = terminal.scrollHeight;

    await sleep(250 + Math.random() * 400);
}

async function startCalc() {

    button.disabled = true;

    terminal.innerHTML = "";
    progress.style.width = "0%";

    const lines = [
        "[SYS] booting AI calculator core",
        "[INFO] initializing neural computation array",
        "[INFO] connecting to mathematics network",
        "[WARN] accessing tel aviv research archives",
        "[INFO] downloading more imaginary RAM",
        "[WARN] consulting ancient mathematicians",
        "[INFO] contacting interdimensional math council",
        "[INFO] translating alien algebra",
        "[WARN] pythagoras is confused again",
        "[INFO] simulating alternate universes",
        "[ERROR] universe #428 collapsed",
        "[INFO] scanning quantum probability grid",
        "[INFO] searching forbidden knowledge directory",
        "[WARN] reddit response: skill issue",
        "[INFO] querying stackoverflow memory",
        "[WARN] stackoverflow user 420 deleted answer",
        "[INFO] opening 800 browser tabs",
        "[SYS] pretending everything is fine",
        "[INFO] overclocking brain circuits",
        "[INFO] installing 3 new braincells",
        "[WARN] brain temperature critical",
        "[ERROR] brain cooling system offline",
        "[INFO] deploying emergency ice cream",
        "[INFO] feeding numbers to the oracle",
        "[WARN] oracle says maybe",
        "[INFO] consulting cosmic microwave math background",
        "[INFO] detecting butterfly in brazil",
        "[WARN] hurricane predicted inside calculator",
        "[INFO] running 14 million timeline simulations",
        "[INFO] probability of success: 3%",
        "[SYS] arguing with math demons",
        "[INFO] math demons are winning",
        "[WARN] summoning backup logic",
        "[INFO] backup logic failed",
        "[SYS] continuing anyway",
        "[INFO] predicting future",
        "[INFO] future is blurry",
        "[WARN] future contains pineapple pizza",
        "[SYS] preparing final answer"
    ];

    for (let i = 0; i < lines.length; i++) {

        const cls =
            lines[i].includes("[ERROR]") ? "error" :
            lines[i].includes("[WARN]") ? "warn" :
            lines[i].includes("[SYS]") ? "sys" :
            "info";

        await typeLine(lines[i], cls);

        progress.style.width =
            ((i + 1) / lines.length * 100) + "%";
    }

    await sleep(400);

    await typeLine("\nFINAL ANSWER:", "sys");

    const answers = [
        "Hello World",
        "42",
        "definitely not 4",
        "undefined",
        "segmentation fault",
        "skill issue",
        "¯\\_(ツ)_/¯"
    ];

    await typeLine(
        answers[Math.floor(Math.random() * answers.length)],
        "answer"
    );

    button.disabled = false;
}

function showDiscordPopup() {
    const popup = document.getElementById("discordPopup");
    popup.classList.add("active");
    document.body.style.overflow = "hidden";
}

function hideDiscordPopup(event) {
    if (event && event.target !== event.currentTarget) return;
    const popup = document.getElementById("discordPopup");
    popup.classList.remove("active");
    document.body.style.overflow = "";
}

function copyDiscordUsername() {
    navigator.clipboard.writeText("xangey").then(() => {
        const hint = document.querySelector(".popup-hint");
        hint.textContent = "Copied!";
        hint.style.color = "#22c55e";
        setTimeout(() => {
            hint.textContent = "Click to copy";
            hint.style.color = "";
        }, 1500);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const calcButton = document.getElementById("calcBtn");
    if (calcButton) {
        calcButton.addEventListener("click", startCalc);
        startMetrics();
    }

    const username = document.querySelector(".popup-username");
    if (username) {
        username.addEventListener("click", copyDiscordUsername);
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const popup = document.getElementById("discordPopup");
            if (popup && popup.classList.contains("active")) {
                hideDiscordPopup();
            }
        }
    });
});