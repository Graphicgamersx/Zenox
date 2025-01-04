//Handles the connection between the SkapClient socket server (third party) (not the game servers)

class ClientWS {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.onmessage = () => {};
        this.onclose = () => {};
        this.onopen = () => {};
    }
    init() {
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = "arraybuffer";
        this.ws.addEventListener("message", this.onmessage.bind(this))
        this.ws.addEventListener("close", this.onclose.bind(this));
        this.ws.addEventListener("open", this.onopen.bind(this));
    }
    send(x) {
        if (this.ws.readyState === this.ws.OPEN) this.ws.send(x);
    }
}

function onClientMessage(e) {
    const msg = msgpack.decode(new Uint8Array(e.data));

    switch (msg.e) {
        case "msg":
            if (msg.message) message({
                s: "[/msg] " + msg.author,
                r: 0,
                m: msg.message
            });
            break;
        case "fuel":
            if (!(msg.user in SkapClientPlayers) && msg.user) SkapClientPlayers[msg.user] = {
                fuel: 0,
                powers: [{
                    power: null,
                    cooldown: 0,
                    heat: 0
                }, {
                    power: null,
                    cooldown: 0,
                    heat: 0
                }]
            };
            SkapClientPlayers[msg.user].fuel = msg.fuel;
            break;
        case "clientJoined":
            if (!(msg.user in SkapClientPlayers) && msg.user) SkapClientPlayers[msg.user] = {
                fuel: 0,
                powers: [{
                    power: null,
                    cooldown: 0,
                    heat: 0
                }, {
                    power: null,
                    cooldown: 0,
                    heat: 0
                }]
            };
            break;
        case "clientLeft":
            if (msg.user in SkapClientPlayers) delete SkapClientPlayers[msg.user];
            break;
        case "clients":
            msg.clients.forEach(data => (data.username in SkapClientPlayers) || (SkapClientPlayers[data.username] = {
                fuel: data.fuel ?? 0,
                powers: [{
                    power: data.powers[0]?.power ?? null,
                    cooldown: 0,
                    heat: 0
                }, {
                    power: data.powers[1]?.power ?? null,
                    cooldown: 0,
                    heat: 0
                }]
            }));
            break;
        case "power":
            if (!(msg.user in SkapClientPlayers) && msg.user) SkapClientPlayers[msg.user] = {
                fuel: 0,
                powers: [{
                    power: null,
                    cooldown: 0,
                    heat: 0
                }, {
                    power: null,
                    cooldown: 0,
                    heat: 0
                }]
            };
            SkapClientPlayers[msg.user].powers[msg.slot].power = msg.power;
            break;
        case "clientUsername":
            if (!(msg.from in SkapClientPlayers)) return;
            SkapClientPlayers[msg.to] = SkapClientPlayers[msg.from];
            delete SkapClientPlayers[msg.from];
            break;
        case "cooldown":
            if (!(msg.user in SkapClientPlayers) && msg.user) SkapClientPlayers[msg.user] = {
                fuel: 0,
                powers: [{
                    power: null,
                    cooldown: 0,
                    heat: 0
                }, {
                    power: null,
                    cooldown: 0,
                    heat: 0
                }]
            };
            SkapClientPlayers[msg.user].powers[msg.slot].cooldown = msg.cooldown;
            break;
        case "heat":
            if (!(msg.user in SkapClientPlayers) && msg.user) SkapClientPlayers[msg.user] = {
                fuel: 0,
                powers: [{
                    power: null,
                    cooldown: 0,
                    heat: 0
                }, {
                    power: null,
                    cooldown: 0,
                    heat: 0
                }]
            };
            SkapClientPlayers[msg.user].powers[msg.slot].heat = msg.heat;
            break;
    }
};
function onClientClose() {
    customAlert("Client WebSocket closed, reconnecting in 3 seconds...", 3);
    for (let name in SkapClientPlayers) delete SkapClientPlayers[name];
    setTimeout(clientWS.init.bind(clientWS), 3000);
};
function onClientOpen() {
    console.log("Client WS connected");
    send({
        e: "power",
        slot: 0,
        power: Number(power0.value)
    }, clientWS);
    send({
        e: "power",
        slot: 1,
        power: Number(power1.value)
    }, clientWS);
};