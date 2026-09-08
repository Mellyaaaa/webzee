/* =====================================================
   DISCORD LANYARD
===================================================== */

const DISCORD_ID =
    "901340887303454771";
// ^^^^^^^^^^^^^^^^^^^^^^^
// GANTI DENGAN DISCORD USER ID KAMU


/* Elements */

const discordAvatar =
    document.getElementById("discordAvatar");

const discordName =
    document.getElementById("discordName");

const discordActivity =
    document.getElementById("discordActivity");

const discordStatus =
    document.getElementById("discordStatus");

const discordStatusText =
    document.getElementById("discordStatusText");


const spotifyCard =
    document.getElementById("spotifyCard");

const spotifyCover =
    document.getElementById("spotifyCover");

const spotifySong =
    document.getElementById("spotifySong");

const spotifyArtist =
    document.getElementById("spotifyArtist");


const gameCard =
    document.getElementById("gameCard");

const gameImage =
    document.getElementById("gameImage");

const gameName =
    document.getElementById("gameName");

const gameDetails =
    document.getElementById("gameDetails");


/* =====================================================
   STATUS
===================================================== */

function updateStatus(status) {

    const statusNames = {

        online: "Online",

        idle: "Idle",

        dnd: "Do Not Disturb",

        offline: "Offline"

    };

    const cleanStatus =
        statusNames[status]
        ? status
        : "offline";


    discordStatus.className =
        "discord-status " +
        cleanStatus;


    discordStatusText.className =
        "discord-online " +
        cleanStatus;


    discordStatusText.textContent =
        statusNames[cleanStatus];

}


/* =====================================================
   AVATAR
===================================================== */

function updateAvatar(user) {

    if (!user) return;


    const userId =
        user.id;

    const avatar =
        user.avatar;


    if (avatar) {

        const extension =
            avatar.startsWith("a_")
                ? "gif"
                : "png";


        discordAvatar.src =
            `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${extension}?size=256`;

    } else {

        /*
            Default Discord avatar
        */

        const discriminator =
            user.discriminator || "0";

        const index =
            parseInt(discriminator) % 5;

        discordAvatar.src =
            `https://cdn.discordapp.com/embed/avatars/${index}.png`;

    }

}


/* =====================================================
   SPOTIFY
===================================================== */

function updateSpotify(data) {

    if (
        !data ||
        !data.listening_to_spotify ||
        !data.spotify
    ) {

        spotifyCard.classList.add(
            "hidden"
        );

        return;
    }


    const spotify =
        data.spotify;


    spotifyCard.classList.remove(
        "hidden"
    );


    spotifyCover.src =
        spotify.album_art_url;


    spotifySong.textContent =
        spotify.song;


    spotifyArtist.textContent =
        `${spotify.artist} · ${spotify.album}`;

}


/* =====================================================
   GAME
===================================================== */

function updateGame(data) {

    if (!data || !data.activities) {

        gameCard.classList.add(
            "hidden"
        );

        return;
    }


    /*
        Activity type:

        0 = Playing
        1 = Streaming
        2 = Listening
        3 = Watching
        4 = Custom
        5 = Competing
    */


    const game =
        data.activities.find(
            activity =>
                activity.type === 0
        );


    if (!game) {

        gameCard.classList.add(
            "hidden"
        );

        return;
    }


    gameCard.classList.remove(
        "hidden"
    );


    gameName.textContent =
        game.name;


    gameDetails.textContent =
        game.details ||
        game.state ||
        "Playing";


    /*
        Discord Rich Presence
        artwork
    */

    if (
        game.assets &&
        game.assets.large_image
    ) {

        let image =
            game.assets.large_image;


        /*
            Discord external asset
        */

        if (
            image.startsWith(
                "mp:"
            )
        ) {

            image =
                image.replace(
                    "mp:",
                    ""
                );

        }


        /*
            Application asset
        */

        if (
            game.application_id &&
            !image.startsWith(
                "https://"
            )
        ) {

            gameImage.src =
                `https://cdn.discordapp.com/app-assets/${game.application_id}/${image}.png`;

        }

    } else {

        gameImage.src =
            "assets/avatar.jpg";

    }

}


/* =====================================================
   UPDATE PROFILE
===================================================== */

function updateDiscord(data) {

    if (!data) {

        updateStatus(
            "offline"
        );

        return;
    }


    /* Status */

    updateStatus(
        data.discord_status
    );


    /* User */

    if (data.discord_user) {

        const user =
            data.discord_user;


        discordName.textContent =
            user.global_name ||
            user.username;


        updateAvatar(
            user
        );

    }


    /* Spotify */

    updateSpotify(
        data
    );


    /* Game */

    updateGame(
        data
    );

}


/* =====================================================
   REST API
===================================================== */

async function loadDiscord() {

    try {

        const response =
            await fetch(
                `https://api.lanyard.rest/v1/users/${DISCORD_ID}`
            );


        if (!response.ok) {

            throw new Error(
                "Lanyard API error"
            );

        }


        const result =
            await response.json();


        if (
            result.success &&
            result.data
        ) {

            updateDiscord(
                result.data
            );

        }

    } catch (error) {

        console.error(
            "Discord error:",
            error
        );

        updateStatus(
            "offline"
        );

    }

}


/* =====================================================
   WEBSOCKET REALTIME
===================================================== */

let socket;

let heartbeat;


function connectLanyard() {

    socket =
        new WebSocket(
            "wss://api.lanyard.rest/socket"
        );


    socket.addEventListener(
        "open",
        () => {

            console.log(
                "Connected to Lanyard"
            );

        }
    );


    socket.addEventListener(
        "message",
        (event) => {

            const data =
                JSON.parse(
                    event.data
                );


            /* Hello */

            if (data.op === 1) {

                const heartbeatInterval =
                    data.d.heartbeat_interval;


                socket.send(
                    JSON.stringify({

                        op: 2,

                        d: {

                            subscribe_to_ids: [
                                DISCORD_ID
                            ]

                        }

                    })
                );


                clearInterval(
                    heartbeat
                );


                heartbeat =
                    setInterval(
                        () => {

                            if (
                                socket.readyState ===
                                WebSocket.OPEN
                            ) {

                                socket.send(
                                    JSON.stringify({
                                        op: 3,
                                        d: null
                                    })
                                );

                            }

                        },
                        heartbeatInterval
                    );

            }


            /* Initial state */

            if (
                data.op === 0 &&
                data.t === "INIT_STATE"
            ) {

                const presence =
                    data.d[DISCORD_ID];


                updateDiscord(
                    presence
                );

            }


            /* Live update */

            if (
                data.op === 0 &&
                data.t ===
                    "PRESENCE_UPDATE"
            ) {

                updateDiscord(
                    data.d
                );

            }

        }
    );


    socket.addEventListener(
        "close",
        () => {

            console.log(
                "Lanyard disconnected."
            );


            clearInterval(
                heartbeat
            );


            /*
                Reconnect
            */

            setTimeout(
                connectLanyard,
                5000
            );

        }
    );


    socket.addEventListener(
        "error",
        () => {

            socket.close();

        }
    );

}


/* Start */

loadDiscord();

connectLanyard();