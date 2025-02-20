const WebSocket = require("ws");
const http = require("http");

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end("WebSocket server is running.");
});

const wss = new WebSocket.Server({ server });

let timers = {
    1: { time: 0, running: false, interval: null },
    2: { time: 0, running: false, interval: null }
};

wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.action === "start") {
            if (timers[data.timer].interval) clearInterval(timers[data.timer].interval);
            timers[data.timer].time = data.time;
            timers[data.timer].running = true;

            timers[data.timer].interval = setInterval(() => {
                if (timers[data.timer].time > 0) {
                    timers[data.timer].time--;
                    broadcast(data.timer);
                } else {
                    clearInterval(timers[data.timer].interval);
                    timers[data.timer].running = false;
                }
            }, 1000);

            broadcast(data.timer);
        }

        else if (data.action === "pause" && timers[data.timer].running) {
            clearInterval(timers[data.timer].interval);
            timers[data.timer].running = false;
        }

        else if (data.action === "resume" && !timers[data.timer].running && timers[data.timer].time > 0) {
            timers[data.timer].running = true;

            timers[data.timer].interval = setInterval(() => {
                if (timers[data.timer].time > 0) {
                    timers[data.timer].time--;
                    broadcast(data.timer);
                } else {
                    clearInterval(timers[data.timer].interval);
                    timers[data.timer].running = false;
                }
            }, 1000);

            broadcast(data.timer);
        }

        else if (data.action === "stop") {
            clearInterval(timers[data.timer].interval);
            timers[data.timer].running = false;
            timers[data.timer].time = 0;
            broadcast(data.timer);
        }

        else if (data.action === "reset") {
            clearInterval(timers[data.timer].interval);
            timers[data.timer].running = false;
            timers[data.timer].time = 0;
            broadcast(data.timer);
        }
    });

    ws.on("close", () => console.log("Client disconnected"));
});

function broadcast(timer) {
    const data = JSON.stringify({ timer, time: timers[timer].time });
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
