ws.addEventListener("open", () => {
    customAlert("Connected to skap.io servers.", 5);

    canSend = true;
    if (!URLParams.has("username")) {
        let sessionCookie = document.cookie.split(";").filter(cookie => cookie.startsWith("session="));
        if (sessionCookie.length) {
            // `{"e":"session","cookie":"${sessionCookie[0].slice(8)}"}`
            send({
                e: "session",
                cookie: sessionCookie[0].slice(8)
            });
        }
    }
    hide(connectP);
    show(loginDiv);
    username.addEventListener("keydown", e => {
        e.stopPropagation();
    });
    password.addEventListener("keydown", e => {
        e.stopPropagation();
    });
    login.addEventListener("click", () => {
        getToken(token => {
            send({
                e: "login",
                m: {
                    username: username.value,
                    password: SHA256(username.value + password.value)
                },
                t: token
            });
        });
    });
    changingRoomBtn.addEventListener("click", () => {
        send({
            e: "getStyle"
        })
        hide(logoutDiv);
        show(changingRoom);
    });
    backtoLoginFromChangingRoom.addEventListener("click", () => {
        hide(changingRoom);
        show(logoutDiv);
    });
    playerColor.addEventListener("input", () => {
        send({
            e: "colorChange",
            c: hexToArr(playerColor.value)
        });
    });
    logout.addEventListener("click", () => {
        send({//Invalidates session
            e: "logout"
        });
        //ws.close();
        //connect();
    });
    guest.addEventListener("click", () => {
        getToken(token => {
            send({
                e: "guest",
                t: token
            });
        });
    });
    register.addEventListener("click", () => {
        getToken(token => {
            send({
                e: "register",
                m: {
                    username: username.value,
                    password: SHA256(username.value + password.value)
                }
            });
        });
    });
    play.addEventListener("click", () => {
        send({
            e: "games"
        });
    });
    backtoLogin.addEventListener("click", () => {
        hide(gamesDiv);
        show(loginDiv);
    });
    refresh.addEventListener("click", () => {
        send({
            e: "games"
        });
    });
    /*power0.addEventListener("input", () => {
        changePower(0, power0.value);
    });
    power1.addEventListener("input", () => {
        changePower(1, power1.value);
    });*/
    for (let el of poweroptions) {
        el.addEventListener("click", () => {
            changePower(parseInt(el.dataset.slot, 10), parseInt(el.dataset.power, 10));
        });
    }

    chatInput.addEventListener("keydown", e => {
        e.stopPropagation();
        if (e.key === "Escape") {
            chatInput.value = "";
            chatInput.blur();
            return;
        }
        if (e.key === "Enter" && !e.shiftKey) {
            if (chatInput.value !== "") {
                /**
                 * @type {string}
                 */
                let msg = chatInput.value;
                if (msg.startsWith("/block ") && msg.length > 7) {
                    let p = msg.slice(7);
                    if (user === p) {
                        message({
                            s: "[CLIENT]",
                            r: 0,
                            m: `You can't block yourself :/`
                        }, true);
                    } else if (devs.includes(p)) {
                        message({
                            s: "[CLIENT]",
                            r: 0,
                            m: `Seriously? Blocking a DEV?`
                        }, true);
                    } else if (blocked.includes(p)) {
                        message({
                            s: "[CLIENT]",
                            r: 0,
                            m: `User ${p.safe()} is already blocked`
                        }, true);
                    } else {
                        blocked.push(p);
                        message({
                            s: "[CLIENT]",
                            r: 0,
                            m: `Blocked user ${p.safe()}`
                        }, true);
                        localStorage.setItem("blocked", blocked.join(" "));
                    }
                } else if (msg.startsWith("/unblock ") && msg.length > 9) {
                    let p = msg.slice(9);
                    if (blocked.includes(p)) {
                        blocked.splice(blocked.indexOf(p), 1);
                        message({
                            s: "[CLIENT]",
                            r: 0,
                            m: `Unblocked user ${p.safe()}`
                        }, true);
                        localStorage.setItem("blocked", blocked.join(" "));
                    } else {
                        message({
                            s: "[CLIENT]",
                            r: 0,
                            m: `Could not unblock user ${p.safe()}<br>because they are not in the blocked list, or something went wrong.`
                        }, true);
                    }
                } else if (msg.startsWith("/blocked")) {
                    message({
                        s: "[CLIENT]",
                        r: 0,
                        m: blocked.length ? "Blocked users: " + blocked.join(", ") : "No blocked users"
                    }, true);
                } else if (msg.startsWith("/help")) {
                    message({
                        s: "[CLIENT]",
                        r: 0,
                        m: `
Commands:<br>
Without perms:<ul>
<li>/list - Tells you who has perms</li>
<li>/respawn - Respawns you to Home</li>
<li>/banned - Check bans</li>
<li>/help - [CLIENT] Displays this message</li>
<li>/block &lt;username&gt; - [CLIENT] Blocks a user</li>
<li>/unblock &lt;username&gt; - [CLIENT] Unblocks a user</li>
<li>/shrug &lt;message&gt; - [CLIENT] Appends ¯\\_(ツ)_/¯ to the end of the message.</li>
<li>/tableflip &lt;message&gt; - [CLIENT] Appends (╯°□°）╯︵ ┻━┻ to the end of the message.</li>
<li>/unflip &lt;message&gt; - [CLIENT] Appends ┬─┬ ノ( ゜-゜ノ) to the end of the message.</li>
<li>/msg &lt;message&gt; - [CLIENT] Sends a private message to all client users.</li>
</ul>
With perms:<ul>
<li>/res - Rescues yourself</li>
<li>/god - Turns on godmode</li>
<li>/tp &lt;areaname&gt; - Teleports to an area</li>
<li>/kick &lt;username&gt; - Kicks someone</li>
<li>/ban &lt;username&gt; - Bring the BANHAMMER down on someone</li>
<li>/unban &lt;username&gt; - Remove the ban from someone</li>
</ul>
Owner:<ul>
<li>/add &lt;username&gt; - Gives someone perms</li>
<li>/remove &lt;username&gt; - Removes ones' perms</li>
</ul>
                        `
                    }, true);
                    chat.scrollTop = chat.scrollHeight;
                } else if (msg.startsWith("/shrug")) {
                    sendMessage(msg.slice(7) + " ¯\\_(ツ)_/¯");
                } else if (msg.startsWith("/tableflip")) {
                    sendMessage(msg.slice(11) + " (╯°□°）╯︵ ┻━┻");
                } else if (msg.startsWith("/unflip")) {
                    sendMessage(msg.slice(8) + " ┬─┬ ノ( ゜-゜ノ)");
                } else if (msg.startsWith("/msg")) {
                    send(msgpack.encode({
                        e: "msg",
                        message: Object.entries(emojiList).reduce((m, [i, { char, regex }]) => m.replace(regex, char), msg.slice(5))
                    }), clientWS);
                } else if (msg.startsWith("/clear")) {
                    chat.innerHTML = "";
                } else {
                    sendMessage(msg);
                }
                chatInput.value = "";
            }
            chatInput.blur();
        }
    });
    chatInput.addEventListener("focus", () => {
        chatFocus = true;
    });
    chatInput.addEventListener("blur", () => {
        chatFocus = false;
    });
    /*power0.addEventListener("keydown", e => {
        e.stopPropagation();
    });
    power1.addEventListener("keydown", e => {
        e.stopPropagation();
    });*/
    createGameMenuBtn.addEventListener("click", () => {
        if (inGame) {
            customAlert("Creating games is not supported while in game, Ravel is a weird guy...", 20);

            return;
        }

        hide(gamesDiv);
        hide(loginDiv);
        show(createGameMenu);
    });
    gameFile.addEventListener("input", () => {
        gameFileLabel.innerHTML = gameFile.files[0].name;
    });
    private.addEventListener("input", () => {
        if (private.checked) show(gamePwWrapper);
        else hide(gamePwWrapper);
    });
    gamePw.addEventListener("keydown", e => {
        e.stopPropagation();
    });
    gameName.addEventListener("keydown", e => {
        e.stopPropagation();
    });
    powerRestrict.addEventListener("input", () => {
        if (powerRestrict.checked) show(powerRestrictOptions);
        else hide(powerRestrictOptions);
    });
    for (let power of powerRestrictOptions.children) {
        power.addEventListener("click", () => {
            power.classList.toggle("restricted");
        });
    }
    document.getElementById("logo").addEventListener("mousedown", e => {
        if (e.detail >= 20) {
            customAlert("Toggled Invert Mode");
            invertDiv.classList.toggle("hidden");
        } else if (e.detail >= 10) {
            customAlert(e.detail);
        }
    });
    createGameBtn.addEventListener("click", () => {
        if (gameFile.files.length) {
            gameFile.files[0].text().then(e => {
                let settings = {
                    n: gameName.value,
                    g: perms.checked,
                    p: private.checked,
                    pa: gamePw.value,
                    r: powerRestrict.checked,
                    rd: Array.from(powerRestrictOptions.children).slice(3, 15).map((el, i) => el.classList.contains("restricted") ? i : false).filter(i => i !== false),
                    u: uploadMap.checked,
                    s: speedrun.checked
                };
                try {
                    send({
                        e: "createGame",
                        s: settings,
                        j: JSON.parse(e)
                    });
                } catch (err) {
                    customAlert("Error: " + err);
                }
            });
        } else {
            let settings = {
                n: gameName.value,
                g: perms.checked,
                p: private.checked,
                pa: gamePw.value,
                r: powerRestrict.checked,
                rd: Array.from(powerRestrictOptions.children).slice(3, 15).map((el, i) => el.classList.contains("restricted") ? i : false).filter(i => i !== false),
                u: uploadMap.checked,
                s: speedrun.checked
            };
            send({
                e: "createGame",
                s: settings
            });
        }
    });
    settingsBtn.addEventListener("click", () => {
        if (showingSettings) {
            hide(settingsDiv);
            loadSettings();
        }
        else
            show(settingsDiv);
        showingSettings = !showingSettings;
    });
});

var showingSettings = false;