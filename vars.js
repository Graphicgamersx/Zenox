function ban(reason, time) {
    localStorage.setItem("banned", reason);
    localStorage.setItem("bantime", Date.now() + time);
    location.reload();
}
if (localStorage.getItem("banned") !== null) {
    if (localStorage.getItem("bantime") === "Infinity" || Date.now() <= parseInt(localStorage.getItem("bantime"))) {
        document.getElementById("connecting").innerHTML = `
    You are banned<br>
    Reason: ${localStorage.getItem("banned")}<br>
    Banned ${localStorage.getItem("bantime") === "Infinity" ? "forever" : "until " + new Date(parseInt(localStorage.getItem("bantime")))}`;
    } else {
        alert("Your ban has expired.");
        localStorage.removeItem("banned");
    }
}

let hideSKAP = false;
let isRendering = false;

const URLParams = new URLSearchParams(location.search);
const autojoinGameId = URLParams.get("gameId");
const autojoinGameName = URLParams.get("gameName");
const autojoinGamePassword = URLParams.get("gamePassword");
const username = document.getElementById("username");
const password = document.getElementById("password");
if (URLParams.has("username")) {
    username.value = URLParams.get("username");
    password.value = URLParams.get("password") || "";
}
history.replaceState(null, "SkapClient", location.protocol + "//" + location.host + location.pathname);

//This is not true. It's barely customizable......................................!!!!!!!!!!
console.log("%cSkapNightly, the hyper-customizable SkapClient", `color: #ff33cc; font-size: 24px; background-color: rgba(20, 20, 20, 0.6);`);

/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("render");
const ctx = canvas.getContext("2d");

const renderSettings = {
    render: {
        obstacle: true,
        lava: true,
        slime: true,
        ice: true,
        block0: true,
        text: true,
        teleporter: true,
        block1: true,
        gravityZone: true,
        door: true,
        button: true,
        switch: true,
        turret: true,
        reward: true,
        player: true,
        playerFuel: true,
        playerHat: true,
        playerName: true,
        playerPowers: true,

        hitbox: false,
        invert: false
    },
    colors: {
        obstacle: null,
        lava: "#d01000",
        slime: "#00c000",
        ice: "#00e0e0",
        box: "#00000060",
        gravOutline: [
            "#ffff00",
            "#ff0000",
            "#0000ff",
            "#00ff00",
            "#000000",
        ],
        gravFill: [
            "#ffff0008",
            "#ff000008",
            "#0000ff08",
            "#00ff0008",
            "#00000008"
        ],
        button: "#404040",
        buttonPressed: "#505050",
        doorClosedOutline: "#404040",
        doorFill: "#404040c0",
        doorOpenedOutline: "#40404080",

        doorLineOn: "#ffff0040",
        doorLineOff: "#40404040",

        turretBody: "#404040",
        turretCannon: "#303030",

        mineRegion: "#00000010",
        mineExpRegion: "#d0100010",

        followingRegion: "#00000010",

        contracRegion: "#8080a010",
        contracTriggerRegion: "#c000c010",

        drainerRegion: "#00000020",
        drainerDrainingRegion: "#ffc00020",

        playerDead: "#ff0000",
        playerFreeze: "#00ffff",
        playerFreezeDead: "#ff0080",

        playerDeadText: "#00ffff",
        playerFreezeText: "#ff0000",
        playerFreezeDeadText: "#00ff80",

        fuel: "#ffff40",
        powerBG: "#c0c0c0c0",
        powerStroke: "#000000",
        cooldown: "#ff404080",
        heat: "#2040ff80",

        meteor: "#c08000e0",
        ghost: "#20a040e0",
        blueFire: "#4040ff10",
        shield: "#383838e0",
        frost: "#00ffff40",
        tail: "#d0a020e0",
        dash: "#00ffc0c0",
        shrink: "#b000ff",
        bombParticle: "#d0100010",
        explosion: "#00000008",
        ghostParticles: "#40a040c0",
        refuel: "#ffff00c0",
        jetpack: "#c0c0c020",

        FPSStroke: "#4040ff",
        FPSFill: "#4040ff80",
        TPSStroke: "#ff4040",
        TPSFill: "#ff404080"
    },
    textures: {
        enemies: {
            bouncer: loadImage("enemies/bouncer.svg"),
            megaBouncer: loadImage("enemies/megabouncer.svg"),
            freezer: loadImage("enemies/freezer.svg"),
            spike: loadImage("enemies/spike.svg"),
            normal: loadImage("enemies/normal.svg"),
            reverse: loadImage("enemies/reverse.svg"),
            rotating: loadImage("enemies/rotating.svg"),
            bomb: [
                loadImage("enemies/bomb0.svg"),
                loadImage("enemies/bomb1.svg")
            ],
            contractor: [
                loadImage("enemies/contractor0.svg"),
                loadImage("enemies/contractor1.svg")
            ],
            taker: loadImage("enemies/taker.svg"),
            immune: loadImage("enemies/immune.svg"),
            monster: loadImage("enemies/monster.svg"),
            following: loadImage("enemies/following.svg"),
            stutter: loadImage("enemies/stutter.svg"),
            snekHead: loadImage("enemies/snekHead.svg"),
            snekBody: loadImage("enemies/snekBody.svg"),
            wavy: loadImage("enemies/wavy.svg"),
            shooter: loadImage("enemies/shooter.svg"),
            expander: loadImage("enemies/expander.svg"),
            gravityUp: loadImage("enemies/gravityUp.svg"),
            gravityDown: loadImage("enemies/gravityDown.svg"),
            gravityLeft: loadImage("enemies/gravityLeft.svg"),
            gravityRight: loadImage("enemies/gravityRight.svg"),
            harmless: loadImage("enemies/harmless.svg"),
            accelerator: loadImage("enemies/accelerator.svg"),
            decelerator: loadImage("enemies/decelerator.svg"),
            drainer: loadImage("enemies/drainer.svg"),
            disabler: loadImage("enemies/disabler.svg"),

            none: loadImage("enemies/none.svg")
        },
        hats: {
            none: {
                offset: [0, 0],
                textOffset: -1.3,
                size: [0, 0],
                texture: loadImage("https://skap.io/textures/hats/wolf.png")
            },
            catEars: {
                offset: [-1.09, -2.0],
                textOffset: -1.6,
                size: [2.2, 2.2],
                texture: loadImage("https://skap.io/textures/hats/catEars.png")
            },
            tophat: {
                offset: [-1.3, -2.4],
                textOffset: -2.4,
                size: [2.6, 2.6],
                texture: loadImage("https://skap.io/textures/hats/topHat.png")
            },
            guest: {
                offset: [0, 0],
                textOffset: -1.3,
                size: [0, 0],
                texture: loadImage("https://skap.io/textures/hats/none.png")
            },
            santa: {
                offset: [-1.3, -2.4],
                textOffset: -1.9,
                size: [3.2, 3.2],
                texture: loadImage("https://skap.io/textures/hats/santa.png")
            },
            militaryHat: {
                offset: [-1.55, -2],
                textOffset: -1.9,
                size: [3, 3],
                texture: loadImage("https://skap.io/textures/hats/militaryHat.png")
            },
            nookyHat: {
                offset: [-1.2, -2.8],
                textOffset: -1.6,
                size: [2.6, 2.6],
                texture: loadImage("https://skap.io/textures/hats/nookyHat.png")
            },
            ravelHat: {
                offset: [-1.2, -2.8],
                textOffset: -3,
                size: [2.6, 2.6],
                texture: loadImage("https://skap.io/textures/hats/eggplant.png")
            },
            wolf: {
                offset: [-1.5, -2.0],
                textOffset: -2.2,
                size: [3, 3],
                texture: loadImage("https://skap.io/textures/hats/wolf.png")
            },
            trumpHat: {
                offset: [-1.53, -2.1],
                textOffset: -1.7,
                size: [3.2, 3.2],
                texture: loadImage("https://skap.io/textures/hats/trumpHat1.png")
            },
            bunnyEars: {
                offset: [-1.4, -3],
                textOffset: -2.2,
                size: [3, 3],
                texture: loadImage("https://skap.io/textures/hats/bunnyEars.png")
            },
            crown: {
                offset: [-1.55, -2.65],
                textOffset: -2.2,
                size: [3.2, 3.2],
                texture: loadImage("https://skap.io/textures/hats/catEars.png")
            },
            kite: {
                offset: [-0.8, -0.8],
                textOffset: -1.3,
                size: [1.6, 1.6],
                texture: loadImage("https://skap.io/textures/hats/kite.png")
            },
            onigiri: {
                offset: [-1.05, -1.9],
                textOffset: -2.5,
                size: [2.1, 2.1],
                texture: loadImage("https://skap.io/textures/hats/onigiri.png")
            },
            taria: {
                offset: [-1.34, -2.1],
                textOffset: -2.5,
                size: [2.7, 2.7],
                texture: loadImage("https://skap.io/textures/hats/flowerHat.png")
            },
            horns: {
                offset: [-1.8, -2.0],
                textOffset: -1.5,
                size: [3.5, 3.5],
                texture: loadImage("https://skap.io/textures/hats/horns.png")
            },
            devil: {
                offset: [-1.8, -2.0],
                textOffset: -1.5,
                size: [3.5, 3.5],
                texture: loadImage("https://skap.io/textures/hats/devil.png")
            },
            sakura: {
                offset: [-1.05, -1.4],
                textOffset: -1.3,
                size: [2.0, 2.0],
                texture: loadImage("https://skap.io/textures/hats/sakura.png")
            },
            cowboy: {
                offset: [-1.6, -2.4],
                textOffset: -2,
                size: [3.2, 3.2],
                texture: loadImage("https://skap.io/textures/hats/cowboy.png")
            },
            party: {
                offset: [-1.36, -2.1],
                textOffset: -2.4,
                size: [2.65, 2.65],
                texture: loadImage("https://skap.io/textures/hats/party.png")
            },
            bimbo: {
                offset: [-1.2, -1.8],
                textOffset: -1.5,
                size: [2.4, 2.4],
                texture: loadImage("https://skap.io/textures/hats/bimbo.png")
            },
            uwu: {
                offset: [-2.8, -3.5],
                textOffset: -2.4,
                size: [5.6, 5.6],
                texture: loadImage("https://skap.io/textures/hats/wowo.png")
            },
            flowerHat: {
                offset: [-1.55, -2.4],
                textOffset: -2.1,
                size: [3.2, 3.2],
                texture: loadImage("https://skap.io/textures/hats/flowerHat.png")
            }
        },
        powers: [
            loadImage("https://skap.io/textures/powers/shrinker.svg"),
            loadImage("https://skap.io/textures/powers/explosion.svg"),
            loadImage("https://skap.io/textures/powers/wall.svg"),
            loadImage("https://skap.io/textures/powers/meteor.svg"),
            loadImage("https://skap.io/textures/powers/refuel.svg"),
            loadImage("https://skap.io/textures/powers/feather.svg"),
            loadImage("https://skap.io/textures/powers/shield.svg"),
            loadImage("https://skap.io/textures/powers/dash.svg"),
            loadImage("https://skap.io/textures/powers/lantern.svg"),
            loadImage("https://skap.io/textures/powers/ghost.svg"),
            loadImage("https://skap.io/textures/powers/frost.svg"),
            loadImage("https://skap.io/textures/powers/shell.svg")
        ],
        skins: {
            /*NKY: loadImage("skins/NKY.png"),
            NKY5223: loadImage("skins/NKY.png"),*/
            "star.": loadImage("skins/star.png"),
            leaked: loadImage("skins/kinda_pro.png"),
            ZeroTix: loadImage("skins/zerotixpro.png"),
            wolfie: loadImage("skins/wolfer.png"),
            wolfer: loadImage("skins/wolfer.png"),
            wolfy: loadImage("skins/wolfer.png"),
            HayrenRyzm: loadImage("skins/RayhanADev.png"),
            RayhanADev: loadImage("skins/RayhanADev.png"),
            SClientOfficial: loadImage("skins/SkapClientOfficial.svg"),
            SkapClientAdmin: loadImage("skins/SkapClientOfficial.svg")
        },
        trail: loadImage("https://skap.io/textures/particles/blackHeart.png"),
        skapclient: loadImage("./skapclient.svg", true),
        iconSize: {
            x: 2,
            y: 2
        }
    }
};

let RENDER_HAT = null;
let RENDER_SKIN = null;

const map = {
    background: "#ffffff",
    color: "#191919",
    areaSize: { x: 100, y: 100 },
    obstacle: [],
    movingObstacle: [],
    circularObstacle: [],
    teleporter: [],
    lava: [],
    rotatingLava: [],
    movingLava: [],
    circularLava: [],
    ice: [],
    movingIce: [],
    circularIce: [],
    slime: [],
    movingSlime: [],
    circularSlime: [],
    button: [],
    switch: [],
    door: [],
    block0: [],
    text: [],
    turret: [],
    block1: [],
    gravityZone: [],
    reward: [],
    hatReward: [],
    box: [],
    image0: [],
    image1: []
};
let camScale = 5;
let camX = 0;
let camY = 0;
let camSpeed = 5;
let freeCam = false;

let time = 0;

var controls;
var othercontrols;

var blocked;
var debug;
var censor;


var darkMode;
var playerInterpolation;

function loadSettings() {
    othercontrols = [
        localStorage.getItem("zoomOut") ?? "u",
        localStorage.getItem("zoomIn") ?? "i",
        localStorage.getItem("freeCam") ?? "f",
        localStorage.getItem("freeCamUp") ?? "arrowup",
        localStorage.getItem("freeCamLeft") ?? "arrowleft",
        localStorage.getItem("freeCamDown") ?? "arrowdown",
        localStorage.getItem("freeCamRight") ?? "arrowright",
        localStorage.getItem("hitbox") ?? "o"
    ];
    controls = [
        localStorage.getItem("up") ?? "w",
        localStorage.getItem("left") ?? "a",
        localStorage.getItem("down") ?? "s",
        localStorage.getItem("right") ?? "d",
        localStorage.getItem("shift") ?? "shift",
        localStorage.getItem("sprint") ?? " ",
        localStorage.getItem("power0") ?? "",
        localStorage.getItem("power1") ?? "",
        localStorage.getItem("combo") ?? "",
        localStorage.getItem("respawn") ?? "r"
    ];
    blocked = localStorage.getItem("blocked") ? localStorage.getItem("blocked").split(" ") : [];
    debug = Boolean(localStorage.getItem("debug"));
    darkMode = Boolean(localStorage.getItem("dkmode"));
    playerInterpolation = Boolean(localStorage.getItem("plrinterp"));
    if (debug) {
        show(posDiv);
        show(rateDiv);
    } else {
        hide(posDiv);
        hide(rateDiv);
    }
    censor = localStorage.getItem("censor");
    if (localStorage.getItem("overlay")) show(document.getElementById("overlay"));
    else hide(document.getElementById("overlay"));
}

let state = null;
/** @typedef {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | null} PowerValue */
/** @typedef {{ power: PowerValue, cooldown: number, heat: number }} Power 0 <= cooldown, heat <= 1 */
/** @type {{ [name: string]: { fuel: number, powers: [ Power, Power ] }}} */
const SkapClientPlayers = {};
let particles = {
    dash: [],
    shrink: [],
    bomb: [],
    explosion: [],
    ghost: [],
    refuel: [],
    jetpack: [],
    trail: []
};
let mouse = { x: 0, y: 0 };
let user = "";
const mention = document.getElementById("mention");

let chatFocus = false;

let viewWS = false;
let noUS = false;
const devs = [/*"NKY", "NKY5223", "NKYv2", "NKYv3", "NKYv4", "3225YKN", */"SkapClientAdmin", "ZeroTix", "ZeroFix", "haha0201", "RayhanADev", "ban"];
const banned = [];
const profanCheck = atob("c2hpdCBmdWNrIG1pbmdlIGNvY2sgdGl0cyBwZW5pcyBjbGl0IHB1c3N5IG1lYXRjdXJ0YWluIGppenogcHJ1bmUgZG91Y2hlIHdhbmtlciBqZXJr").split(" ");
const seriousProfanCheck = atob("bmlnZ2VyIG5pZ2dhIGZhZ2dvdCBjdW50IHdob3JlIHJhcGU=").split(" ");
let showChat = true;
/** @type {Object<string, {t: number, m: string}>} */
let chatMsgs = {};

const URLRegex = /(https?:\/\/[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+((\/[A-z0-9-_]+)*)?(\.[a-z]+)*\/?(\?[A-z0-9\._\-;]+(=[A-z0-9\._\-%]+)?(&[A-z0-9\._\-;]+(=[A-z0-9\._\-%]+)?)*)?(#[A-z0-9\._\-]+(=[A-z0-9\._\-]+)?(&[A-z0-9\._\-]+(=[A-z0-9\._\-]+)?)*)?)/g;
const EmailRegex = /([A-z0-9_!#$%&"*+/=?`{|}~^.-]+@([A-z0-9-]+(\.[A-z0-9-]+)))/;

let emoji = localStorage.getItem("emoji");
/** @type {Object<string, {char: string, regex: RegExp}>} */
const emojiList = emoji === "0" ? {}
    : emoji === "1"
        ? {
            tm: {
                char: "™️",
                regex: /:tm:/gi
            },
            smile: {
                char: "😊",
                regex: /:smile:/gi
            },
            laugh: {
                char: "😊",
                regex: /:laugh:/gi
            },
            cry: {
                char: "😢",
                regex: /:cry:/gi
            },
            sob: {
                char: "😭",
                regex: /:sob:/gi
            },
            rage: {
                char: "😡",
                regex: /:rage:/gi
            },
            wolf: {
                char: "🐺",
                regex: /:wolf:/gi
            },
            heart: {
                char: "❤️",
                regex: /:heart:/gi
            },
            eyes: {
                char: "👀",
                regex: /:eyes:/gi
            }
        }
        : emoji === "2"
            ? {
                tm: {
                    char: "™️",
                    regex: /:tm:/gi
                },
                evil_smile: {
                    char: "😈",
                    regex: />:\)/gi
                },
                smile: {
                    char: "😊",
                    regex: /:smile:/gi
                },
                smile2: {
                    char: "😊",
                    regex: /:\)/gi
                },
                laugh: {
                    char: "😊",
                    regex: /:laugh:/gi
                },
                laugh2: {
                    char: "😊",
                    regex: /:D/gi
                },
                rage: {
                    char: "😡",
                    regex: /:rage:/gi
                },
                rage2: {
                    char: "😡",
                    regex: />:\(/gi
                },
                rage3: {
                    char: "😡",
                    regex: />:\C/gi
                },
                // Have top position over cry
                cry: {
                    char: "😢",
                    regex: /:cry:/gi
                },
                cry2: {
                    char: "😢",
                    regex: /:\(/gi
                },
                sob: {
                    char: "😭",
                    regex: /:sob:/gi
                },
                sob2: {
                    char: "😭",
                    regex: /;\(/gi
                },
                wolf: {
                    char: "🐺",
                    regex: /:wolf:/gi
                },
                heart: {
                    char: "❤️",
                    regex: /:heart:/gi
                },
                heart2: {
                    char: "❤️",
                    regex: /<3/gi
                },
                eyes: {
                    char: "👀",
                    regex: /:eyes:/gi
                }
            } : {};

let pingTime = 0;

let id = "";
let canSend = false;


let lastUpdate = 0;
let lastFrame = 0;
/** @type {{ time: number, fps: number }[]} */
const FPSHistory = [{ time: 0, fps: 0 }];
/** @type {{ time: number, tps: number }[]} */
const TPSHistory = [{ time: 0, tps: 0 }];

// HTML Elements
// Other stuff
const wsDiv = document.getElementById("ws");
const alertDiv = document.getElementById("alert");


const connectP = document.getElementById("connecting");
// Login
const guest = document.getElementById("guest");
const login = document.getElementById("login");
const register = document.getElementById("register");
const logout = document.getElementById("logout");
const logoutDiv = document.getElementById("logoutDiv");
const play = document.getElementById("play");
const loginData = document.getElementById("loginData");
const loginDiv = document.getElementById("loginDiv");

// Changing room
const playerColor = document.getElementById("playerColor");
const changingRoom = document.getElementById("changingRoom");
const changingRoomBtn = document.getElementById("changingRoomBtn");
const backtoLoginFromChangingRoom = document.getElementById("backToLogout");
const hatsDiv = document.getElementById("hats");

// GameList
const backtoLogin = document.getElementById("backtoLogin");
const gamesDiv = document.getElementById("gamesDiv");
const gameListDiv = document.getElementById("games");
const refresh = document.getElementById("refresh");

// createGame
const createGameMenuBtn = document.getElementById("createGameMenuBtn");
const createGameMenu = document.getElementById("createGameMenu");
const gameName = document.getElementById("gameName");
const gameFile = document.getElementById("gameFile");
const gameFileLabel = document.getElementById("gameFileLabel");
const createGameBtn = document.getElementById("createGameBtn");
const perms = document.getElementById("perms");
const speedrun = document.getElementById("speedrun");
const private = document.getElementById("private");
const gamePwWrapper = document.getElementById("gamePwWrapper");
const gamePw = document.getElementById("gamePw");
const powerRestrict = document.getElementById("powerRestrict");
const powerRestrictOptions = document.getElementById("powerRestrictOptions");
const uploadMap = document.getElementById("uploadMap");

const settingsBtn = document.getElementById("settings");
const settingsDiv = document.getElementById("settingsDiv");

// GameDiv
const gameDiv = document.getElementById("gameDiv");
const playerList = document.getElementById("playerList");
const chatDiv = document.getElementById("chat");
const chat = document.getElementById("chatContent");
const chatInput = document.getElementById("chatInput");
const fuelBar = document.getElementById("fuelBarInner");
const rateDiv = document.getElementById("rate");
const FPSDisplay = document.getElementById("FPS");
const TPSDisplay = document.getElementById("TPS");
/** @type {HTMLCanvasElement} */
const FPSCanvas = document.getElementById("FPSGraph");
/** @type {HTMLCanvasElement} */
const TPSCanvas = document.getElementById("TPSGraph");
const posDiv = document.getElementById("pos");
const posXSpan = document.getElementById("posX");
const posYSpan = document.getElementById("posY");
const velSpan = document.getElementById("vel");
const velXSpan = document.getElementById("velX");
const velYSpan = document.getElementById("velY");
const aimXSpan = document.getElementById("aimX");
const aimYSpan = document.getElementById("aimY");
const FPSctx = FPSCanvas.getContext("2d");
const TPSctx = TPSCanvas.getContext("2d");
FPSctx.strokeStyle = renderSettings.colors.FPSStroke;
FPSctx.fillStyle = renderSettings.colors.FPSFill;
TPSctx.strokeStyle = renderSettings.colors.TPSStroke;
TPSctx.fillStyle = renderSettings.colors.TPSFill;

const deathM = document.getElementById("deathText");
const freezeM = document.getElementById("freezeText");

const power0 = document.getElementById("power0input");
const power1 = document.getElementById("power1input");
const power0CD = document.getElementById("power0CD");
const power1CD = document.getElementById("power1CD");
const power0Heat = document.getElementById("power0Heat");
const power1Heat = document.getElementById("power1Heat");
const power0Img = document.getElementById("power0Img");
const power1Img = document.getElementById("power1Img");
const poweroptions = document.getElementsByClassName("poweroption");
const powers = new Set();

const pauseGameDiv = document.getElementById("pauseGameDiv");

const overlays = [
    document.getElementById("overlayUp"),
    document.getElementById("overlayLeft"),
    document.getElementById("overlayDown"),
    document.getElementById("overlayRight"),
    document.getElementById("overlayShift"),
    document.getElementById("overlaySprint"),
    document.getElementById("overlayPower0"),
    document.getElementById("overlayPower1"),
    document.getElementById("overlayCombo"),
    document.getElementById("overlayRespawn")
];

const powerRewards = document.getElementsByClassName("powerreward");
const exitPowerRewards = document.getElementsByClassName("exitpowerreward");
const hatRewards = {
    militaryHat: document.getElementById("militaryHat"),
    santa: document.getElementById("santa"),
    crown: document.getElementById("crown"),
    party: document.getElementById("party"),
    cowboy: document.getElementById("cowboy"),
    kite: document.getElementById("kite"),
    onigiri: document.getElementById("onigiri"),
    taria: document.getElementById("taria"),
    horns: document.getElementById("horns"),
    devil: document.getElementById("devil"),
    sakura: document.getElementById("sakura")
};
const exitHatRewards = document.getElementsByClassName("exithatreward");

const invertDiv = document.getElementById("invert");

loadSettings();

// Functions
/**
 * Custom Alert UwU <3
 * @param {string} s The message
 * @param {number} t Fade time with who knows what time unit
 */
function customAlert(s, t = 1) {
    alertDiv.innerHTML = s;
    show(alertDiv);
    alertDiv.style.opacity = 1;
    let i = 0;
    let interv = setInterval(() => {
        i += 0.01;
        if (i >= t) {
            hide(alertDiv);
            clearInterval(interv);
        }
        alertDiv.style.opacity -= 0.01 / t;
    }, 10)
}
/**
 * Hide Element
 * @param {Element} el Element
 */
function hide(el) {
    el.classList.add("hidden");
}
/**
 * Show Element
 * @param {Element} el Element
 */
function show(el) {
    el.classList.remove("hidden");
}
/**
 * LOAD IMAGE
 * @param {string} src 
 */
function loadImage(src = "", root = false) {
    let image = new Image();
    image.src = src.startsWith("http") ? src : root ? src : `Textures/${src}`;
    image.onerror = () => {
        console.log("ERROR AT", image.src);
    }
    return image;
}
/**
 * safe
 */
String.prototype.safe = function () {
    return this.replace(/&/g, "&amp;").replace(/ /g, "&nbsp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
/**
 * clamp when
 * @param {number} min 
 * @param {number} num 
 * @param {number} max 
 */
function clamp(min, num, max) {
    return Math.max(Math.min(num, max), min);
}

/**
 * When i want to punish u
 */
function rickroll(newWindow = false) {
    return newWindow ? window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ") : location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
}
function zerotix(x = "ZeroTix") {
    return x + " pro";
}
// function haha0201(x = "haha0201") {
//     if (x.toLowerCase() != "zerotix" && x.toLowerCase() != "zerofix" && x.toLowerCase() != "zephyrus") {
//         for (let i = 3; i--; i > 0) {
//             message({
//                 s: "[CLIENT]",
//                 r: 0,
//                 m: `${x} pro`
//             }, true);
//         }
//         customAlert(x + " pro", 10000);
//         setTimeout(() => {
//             sendMessage(x + " very pro");
//             RENDER_HAT = "ravelHat";
//             renderSettings.render.invert = !renderSettings.render.invert;
//         }, 5000)
//         setTimeout(() => {
//             RENDER_HAT = "crown";
//             renderSettings.render.invert = !renderSettings.render.invert;
//         }, 5500)
//         setTimeout(() => {
//             RENDER_HAT = "";
//             renderSettings.render.invert = !renderSettings.render.invert;
//         }, 6000)
//         setTimeout(() => {
//             renderSettings.render.invert = !renderSettings.render.invert;
//         }, 6200)

//         setTimeout(() => {
//             sendMessage(x + " super pro")
//         }, 10000)
//         renderSettings.render.invert = !renderSettings.render.invert;
//         RENDER_HAT = "ravelHat"

//         setTimeout(() => {
//             renderSettings.render.invert = !renderSettings.render.invert
//         }, 500)
//         setTimeout(() => {
//             renderSettings.render.invert = !renderSettings.render.invert
//             RENDER_HAT = ""
//         }, 700)
//         setTimeout(() => {
//             renderSettings.render.invert = !renderSettings.render.invert
//         }, 900)

//         return x + " pro";
//     } else {
//         for (let i = 3; i--; i > 0) {
//             message({
//                 s: "[CLIENT]",
//                 r: 0,
//                 m: `${x} trash`
//             }, true);
//         }
//         customAlert(x + " noob", 10000);
//         setTimeout(() => {
//             sendMessage(x + " very noob")
//         }, 10000)
//         renderSettings.render.invert = !renderSettings.render.invert;
//         RENDER_HAT = "ravelHat"

//         setTimeout(() => {
//             renderSettings.render.invert = !renderSettings.render.invert
//         }, 500)
//         setTimeout(() => {
//             renderSettings.render.invert = !renderSettings.render.invert
//             RENDER_HAT = ""
//         }, 700)
//         setTimeout(() => {
//             renderSettings.render.invert = !renderSettings.render.invert
//         }, 900)

//         return x + " noob";
//     }

// }
/**
 * 
 * @param {function(string)} func 
 * @param {function(Error)} onerr 
 */
function getToken(func, onerr = console.error) {
    grecaptcha.ready(() => {
        grecaptcha.execute("6Ld2wFMaAAAAAIL8fjR5Bwg6kn3fP2t-b9NFoK_R", {
            action: "submit"
        }).then(func).catch(onerr);
    });
}
/**
 * @param {Object | Uint8Array} obj 
 */
function send(obj, e = ws) {
    if (e.readyState === e.OPEN) {
        if (obj instanceof Uint8Array) e.send(obj);
        else e.send(msgpack.encode(obj));
    }
}
/**
 * @param {string} hex
 */
function hexToArr(hex) {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
    ];
}
