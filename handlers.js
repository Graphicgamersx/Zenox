var inGame = false;

ws.addEventListener("message", e => {
    let msg = msgpack.decode(new Uint8Array(e.data));
    if (viewWS && (!noUS || msg.e !== "updateStates")) wsDiv.innerHTML = JSON.stringify(msg);

    switch (msg.e) {
        case "result":
            if (!msg.m) {
                if (msg.cookie !== "") {
                    document.cookie = "session=" + msg.cookie;
                    username.value = "";
                    password.value = "";
                }
                if (msg.t.startsWith("Logged in as ")) {
                    user = msg.t.slice(13);
                    send({
                        e: "login",
                        username: user
                    }, clientWS);

                    if (banned.includes(user)) {
                        ban("Hardcoded ban", Infinity);
                    }
                }
                customAlert(msg.t.safe());
                hide(loginData);
                show(logoutDiv);
            } else {
                customAlert(msg.t);
            }
            break;
        case "logout":
            show(loginDiv);
            hide(logoutDiv);
            show(loginData);
            hide(gamesDiv);
            customAlert("Logout");
            break;
        case "games":
            gameListDiv.innerHTML = "";
            msg.g.forEach(g => {
                let div = document.createElement("div");
                div.className = "gameDisplay";
                if (g.private) div.classList.add("private");
                div.innerHTML = `<h2>${g.name}<br>${g.players} players</h2><h5>${g.id}</h5><p>${String(g.mapName).safe()} by ${String(g.creator).safe()}</p>`;
                div.addEventListener("click", () => {
                    if (g.private) {
                        send({
                            e: "join",
                            g: g.id,
                            p: prompt("Password?")
                        });
                    } else {
                        send({
                            e: "join",
                            g: g.id
                        });
                    }
                    id = g.id;
                    send({
                        e: "join",
                        id: g.id,
                        name: g.name
                    }, clientWS);
                });
                gameListDiv.appendChild(div);

                // Autojoin
                if (autojoinGameId === g.id) {
                    customAlert("Joining room from URL...");
                    if (g.private) {
                        send({
                            e: "join",
                            g: g.id,
                            p: autojoinGamePassword ? autojoinGamePassword : prompt("Password?")
                        });
                    } else {
                        send({
                            e: "join",
                            g: g.id
                        });
                    }
                }
                if (autojoinGameName === g.name) {
                    customAlert("Joining room from URL...");
                    if (g.private) {
                        send({
                            e: "join",
                            g: g.id,
                            p: autojoinGamePassword ? autojoinGamePassword : prompt("Password?")
                        });
                    } else {
                        send({
                            e: "join",
                            g: g.id
                        });
                    }
                }
            });
            hide(loginDiv);
            document.body.classList.add("scroll");
            show(gamesDiv);
            break;
        case "join":
            if (msg.m) customAlert("Could not join game");
            else {
                inGame = true;
                logoutDiv.removeChild(logout);
                logoutDiv.removeChild(play);
                if (pauseMenuOpen)
                    togglePauseMenu();

                initMap(msg.i.map);
                powers.clear();
                msg.i.powers.forEach(powers.add.bind(powers));
                document.body.classList.remove("scroll");
                hide(gamesDiv);
                hide(createGameMenu);
                show(gameDiv);
                for (let el of poweroptions) {
                    if (msg.i.powers.includes(parseInt(el.dataset.power))) show(el);
                    else hide(el);
                }
                send({
                    e: "power",
                    slot: 0,
                    //power: power0.value = msg.i.powers[0]
                    power: power1Value = msg.i.powers[0]
                }, clientWS);
                send({
                    e: "power",
                    slot: 1,
                    power: power2Value = msg.i.powers[1]
                    //power: power1.value = msg.i.powers[1]
                }, clientWS);
                updatePowerIcon(power0Img, power1Value);
                updatePowerIcon(power1Img, power2Value);
                if (!isRendering) (function run() {
                    isRendering = true;
                    const now = Date.now();
                    const calcFPS = Math.floor(1000 / (now - lastFrame));
                    if (calcFPS != Infinity && FPSDisplay.innerHTML !== String(calcFPS)) {
                        FPSDisplay.innerHTML = calcFPS;
                    }
                    FPSHistory.push({ time: now, fps: calcFPS });
                    if (FPSHistory.length > 100 || FPSHistory[FPSHistory.length - 1].time - FPSHistory[0].time > 1150) FPSHistory.splice(0, 1);
                    lastFrame = now;
                    try { render(); }
                    catch (err) { console.error(err) }
                    window.requestAnimationFrame(run);
                })();
                customAlert("Joined game. Press escape to join a new game, or change settings.", 20);
            }
            break;
        case "message":
            msg.m.m = msg.m.m.replace(/&gt;/g, ">").replace(/&lt;/g, "<");
             
            if (msg.m.s === user && msg.m.m.toLowerCase() === "ping" && pingTime) {
                message({
                    s: "[CLIENT]",
                    r: 0,
                    m: `Pong! Round-trip took ${Date.now() - pingTime}ms`
                });
                pingTime = 0;
            }
            message(msg.m);
            break;
        case "updateStates":
            updateStates(msg.m);
            break;
        case "initMap":
            initMap(msg.m);
            break;
        case "updateMap":
            if (msg.m.update) {
                for (let o of msg.m.update) {
                    if (o.type === 0) {
                        for (let u of map.rotatingLava) {
                            if (o.id === u.id) {
                                u.angle = (o.angle % 360) * Math.PI / 180;
                                u.center = o.center;
                                break;
                            }
                        }
                    } else if (o.type === 2) {
                        for (let u of map.movingObstacle) {
                            if (o.id === u.id) {
                                u.pos = o.pos;
                                break;
                            }
                        }
                    } else if (o.type === 1) {
                        for (let u of map.movingLava) {
                            if (o.id === u.id) {
                                u.pos = o.pos;
                                break;
                            }
                        }
                    } else if (o.type === 3) {
                        for (let u of map.movingIce) {
                            if (o.id === u.id) {
                                u.pos = o.pos;
                                break;
                            }
                        }
                    } else if (o.type === 4) {
                        for (let u of map.movingSlime) {
                            if (o.id === u.id) {
                                u.pos = o.pos;
                                break;
                            }
                        }
                    } else if (o.type === "turret") {
                        for (let u of map.turret) {
                            if (o.id === u.id) {
                                u.dir = o.dir;
                                break;
                            }
                        }
                    } else if (o.type === "door") {
                        for (let u of map.door) {
                            if (o.id === u.id) {
                                u.opened = o.opened;
                                break;
                            }
                        }
                    } else if (o.type === "button") {
                        for (let u of map.button) {
                            if (o.id === u.id) {
                                u.pressed = o.pressed;
                                u.pos = o.pos;
                                u.size = o.size;
                                u.points = [
                                    [
                                        u.pos.x + (u.dir === "0" ? u.size.x * 0.1 : 0),
                                        u.pos.y + (u.dir === "3" ? u.size.y * 0.1 : 0)
                                    ],
                                    [
                                        u.pos.x + (u.dir === "0" ? u.size.x * 0.9 : u.size.x),
                                        u.pos.y + (u.dir === "1" ? u.size.y * 0.1 : 0)
                                    ],
                                    [
                                        u.pos.x + (u.dir === "2" ? u.size.x * 0.9 : u.size.x),
                                        u.pos.y + (u.dir === "1" ? u.size.y * 0.9 : u.size.y)
                                    ],
                                    [
                                        u.pos.x + (u.dir === "2" ? u.size.x * 0.1 : 0),
                                        u.pos.y + (u.dir === "3" ? u.size.y * 0.9 : u.size.y)
                                    ]
                                ];
                                break;
                            }
                        }
                    } else if (o.type === "switch") {
                        for (let u of map.switch) {
                            if (o.id === u.id) {
                                u.switch = o.switch;
                                u.points = [
                                    [
                                        u.pos.x - (u.dir === "3" && !u.switch ? 2 : 0),
                                        u.pos.y - (u.dir === "0" && u.switch ? 2 : 0)
                                    ],
                                    [
                                        u.pos.x + (u.dir === "1" && u.switch ? 2 : 0) + u.size.x,
                                        u.pos.y - (u.dir === "0" && !u.switch ? 2 : 0)
                                    ],
                                    [
                                        u.pos.x + (u.dir === "1" && !u.switch ? 2 : 0) + u.size.x,
                                        u.pos.y + (u.dir === "2" && u.switch ? 2 : 0) + u.size.y
                                    ],
                                    [
                                        u.pos.x - (u.dir === "3" && u.switch ? 2 : 0),
                                        u.pos.y + (u.dir === "2" && !u.switch ? 2 : 0) + u.size.y
                                    ]
                                ];
                                break;
                            }
                        }
                    }
                }
            }
            if (msg.m.add)
                for (let o of msg.m.add) {
                    if (o.type === "box")
                        map.box.push(o);
                }
            if (msg.m.remove)
                for (let o of msg.m.remove) {
                    if (o.type === "box")
                        for (let i in map.box)
                            if (map.box[i].id === o.id) {
                                map.box.splice(i, 1);
                                break;
                            }
                }

            break;
        case "power":
            for (let el of poweroptions) {
                if (msg.m.includes(parseInt(el.dataset.power))) {
                    show(el);
                }
            }
            break;
        case "reward":
            customAlert("Gained power " + msg.m);
            show(powerRewards[msg.m]);
            break;
        case "hatReward":
            customAlert("Gained hat " + msg.m);
            show(hatRewards[msg.m]);
            break;
        case "style":
            let r = Math.min(Math.max(0, msg.c[0]), 255).toString(16);
            let g = Math.min(Math.max(0, msg.c[1]), 255).toString(16);
            let b = Math.min(Math.max(0, msg.c[2]), 255).toString(16);
            hatsDiv.innerHTML = "";
            for (let h of msg.h) {
                // Create DIV
                let div = document.createElement("div");
                div.className = "hat";
                if (msg.s === h) div.classList.add("active");

                // Create Image
                let img = document.createElement("img");
                img.src = `https://skap.io/textures/hats/${h}.png`;
                img.addEventListener("click", () => {
                    send({
                        e: "hatChange",
                        c: h
                    });
                });

                div.appendChild(img);
                div.appendChild(document.createElement("br"));
                div.appendChild(document.createTextNode(h));

                hatsDiv.appendChild(div);
            }
            playerColor.value = `#${"0".repeat(2 - r.length) + r}${"0".repeat(2 - g.length) + g}${"0".repeat(2 - b.length) + b}`;
            break;
    }
});
/*ws.addEventListener("close", e => {
    canSend = false;
    hide(gameDiv);
    hide(createGameMenu);
    hide(pauseGameDiv);
    hide(loginDiv);
    connect();
});*/

function updatePowerIcon(html, power) {
    if (power == -1 || power == null || renderSettings.textures.powers[power] == null)
        html.src = renderSettings.textures.enemies.none.src;
    else
        html.src = renderSettings.textures.powers[power].src;
}

// Handle game controls
document.addEventListener("keydown", e => {
    if (!inGame)
        return;
    if (e.key?.toLowerCase() === "escape")
        togglePauseMenu();
        
    if (pauseMenuOpen)
        return;
    if (controls.includes(e.key?.toLowerCase())) {
        keys(controls.indexOf(e.key.toLowerCase()), true);
    }
    if (!e.ctrlKey) switch (e.key?.toLowerCase()) {
        case othercontrols[7]:
            renderSettings.render.hitbox = !renderSettings.render.hitbox;
            customAlert(`Hitboxes ${renderSettings.render.hitbox ? "ON" : "OFF"}`);
            break;
        case othercontrols[2]:
            if (freeCam) {
                customAlert("Freecam OFF");
                freeCam = false;
            } else {
                customAlert("Freecam ON");
                freeCam = true;
            }
            break;
        case othercontrols[0]:
            camScale /= 1.5;
            customAlert(`Camera Scale: ${camScale}`);
            break;
        case othercontrols[1]:
            camScale *= 1.5;
            customAlert(`Camera Scale: ${camScale}`);
            break;
        case localStorage.getItem("powerkeybind0"):
            let powerpreset0 = localStorage.getItem("powerpreset0").split(",");
            changePower(0, powerpreset0[0]);
            changePower(1, powerpreset0[1]);
            break;
        case localStorage.getItem("powerkeybind1"):
            let powerpreset1 = localStorage.getItem("powerpreset1").split(",");
            changePower(0, powerpreset1[0]);
            changePower(1, powerpreset1[1]);
            break;
        case localStorage.getItem("powerkeybind2"):
            let powerpreset2 = localStorage.getItem("powerpreset2").split(",");
            changePower(0, powerpreset2[0]);
            changePower(1, powerpreset2[1]);
            break;
        case localStorage.getItem("powerkeybind3"):
            let powerpreset3 = localStorage.getItem("powerpreset3").split(",");
            changePower(0, powerpreset3[0]);
            changePower(1, powerpreset3[1]);
            break;
        case localStorage.getItem("powerkeybind4"):
            let powerpreset4 = localStorage.getItem("powerpreset4").split(",");
            changePower(0, powerpreset4[0]);
            changePower(1, powerpreset4[1]);
            break;
        case "enter":
        case "/":
            chatInput.focus();
            break;
    }
});
document.addEventListener("keyup", e => {
    if (!inGame)
        return;
    if (controls.includes(e.key?.toLowerCase())) {
        keys(controls.indexOf(e.key.toLowerCase()), false);
    }
});
canvas.addEventListener("mousedown", e => {
    if (!inGame)
        return;
    if (e.button === 0) keys(6, true);
    else if (e.button === 1) {
        keys(8, true);
        e.preventDefault();
        e.stopPropagation();
    }
    else if (e.button === 2) keys(7, true);
});
canvas.addEventListener("mouseup", e => {
    if (!inGame)
        return;
    if (e.button === 0) keys(6, false);
    else if (e.button === 1) keys(8, false);
    else if (e.button === 2) keys(7, false);
});
canvas.addEventListener("contextmenu", e => {     if (!inGame) return; e.preventDefault(); });
document.addEventListener("mousemove", e => {
    if (!inGame)
        return;
    mouse.x = e.x;
    mouse.y = e.y;
});
