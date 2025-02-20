const WebSocket = require("ws");
const http = require("http");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

let timers = {
    1: { time: 0, running: false, paused: false, interval: null },
    2: { time: 0, running: false, interval: null }
};

wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (message) => {
        const data = JSON.parse(message);
        const timer = timers[data.timer];

        if (data.action === "start") {
            if (!timer.running || timer.paused) {
                clearInterval(timer.interval);
                if (!timer.paused) {
                    timer.time = data.time;
                }
                timer.running = true;
                timer.paused = false;
                startTimer(data.timer);
            }
        }

        else if (data.action === "pause") {
            clearInterval(timer.interval);
            timer.paused = true;
            timer.running = false;
            broadcast(data.timer);
        }

        else if (data.action === "resume") {
            if (timer.paused) {
                timer.running = true;
                timer.paused = false;
                startTimer(data.timer);
            }
        }

        else if (data.action === "stop") {
            clearInterval(timer.interval);
            timer.running = false;
            timer.paused = false;
            timer.time = 0;
            broadcast(data.timer);
        }

        else if (data.action === "reset") {
            clearInterval(timer.interval);
            timer.running = false;
            timer.paused = false;
            timer.time = data.time;
            broadcast(data.timer);
        }
    });

    ws.on("close", () => console.log("Client disconnected"));
});

function startTimer(timerID) {
    timers[timerID].interval = setInterval(() => {
        if (timers[timerID].time > 0) {
            timers[timerID].time--;
            broadcast(timerID);
        } else {
            clearInterval(timers[timerID].interval);
            timers[timerID].running = false;
            timers[timerID].paused = false;
        }
    }, 1000);
}

function broadcast(timerID) {
    const data = JSON.stringify({ timer: timerID, time: timers[timerID].time });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
