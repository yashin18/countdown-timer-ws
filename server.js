const WebSocket = require("ws");
const http = require("http");

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Security-Policy": "default-src *; connect-src * wss://countdown-ws.onrender.com"
    });
    res.end("WebSocket server is running.");
});

const wss = new WebSocket.Server({ server });

let timer1 = { time: 0, running: false, interval: null };
let timer2 = { time: 0, running: false, interval: null };

wss.on("connection", (ws) => {
    console.log("New client connected");

    // Send the current timer states to the new client
    ws.send(JSON.stringify({ timer: 1, time: timer1.time }));
    ws.send(JSON.stringify({ timer: 2, time: timer2.time }));

    ws.on("message", (message) => {
        const data = JSON.parse(message);
        console.log("Received:", data);

        if (data.timer === 1) {
            if (data.action === "start") {
                if (!timer1.running) {
                    timer1.running = true;
                    if (timer1.time === 0) {
                        timer1.time = data.time;
                    }
                    timer1.interval = setInterval(() => {
                        if (timer1.time > 0) {
                            timer1.time--;
                            broadcast(1, timer1.time);
                        } else {
                            clearInterval(timer1.interval);
                            timer1.running = false;
                        }
                    }, 1000);
                } else {
                    // Pause the timer
                    clearInterval(timer1.interval);
                    timer1.running = false;
                }
                broadcast(1, timer1.time);
            } else if (data.action === "reset") {
                clearInterval(timer1.interval);
                timer1 = { time: 0, running: false, interval: null };
                broadcast(1, 0);
            }
        } else if (data.timer === 2) {
            if (data.action === "start") {
                clearInterval(timer2.interval);
                timer2.time = data.time;
                timer2.running = true;
                timer2.interval = setInterval(() => {
                    if (timer2.time > 0) {
                        timer2.time--;
                        broadcast(2, timer2.time);
                    } else {
                        clearInterval(timer2.interval);
                        timer2.running = false;
                    }
                }, 1000);
                broadcast(2, timer2.time);
            }
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

function broadcast(timer, time) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ timer, time }));
        }
    });
}

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
