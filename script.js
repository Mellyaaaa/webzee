/*
====================================================
DISCORD
====================================================

GANTI ID INI DENGAN DISCORD USER ID KAMU.

Contoh:
const DISCORD_ID = "123456789012345678";

*/

const DISCORD_ID = "123456789012345678";


/* ELEMENT HELPER */

const $ = selector => document.querySelector(selector);


/* MUSIC */

const audio = $("#audio");
const playBtn = $("#playBtn");
const playIcon = $("#playIcon");

const progress = $("#progress");
const progressContainer = $("#progressContainer");

const currentTime = $("#currentTime");
const duration = $("#duration");

const visualizer = $("#visualizer");


function formatTime(seconds) {

  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);

  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${secs}`;
}


/* PLAY / PAUSE */

playBtn.addEventListener("click", () => {

  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }

});


audio.addEventListener("play", () => {

  playIcon.className = "fa-solid fa-pause";

  visualizer.classList.add("playing");

});


audio.addEventListener("pause", () => {

  playIcon.className = "fa-solid fa-play";

  visualizer.classList.remove("playing");

});


/* MUSIC TIME */

audio.addEventListener("loadedmetadata", () => {

  duration.textContent =
    formatTime(audio.duration);

});


audio.addEventListener("timeupdate", () => {

  currentTime.textContent =
    formatTime(audio.currentTime);

  if (audio.duration) {

    progress.style.width =
      `${(audio.currentTime / audio.duration) * 100}%`;

  }

});


/* SEEK */

progressContainer.addEventListener("click", event => {

  if (!audio.duration) {
    return;
  }

  const rect =
    progressContainer.getBoundingClientRect();

  const percentage =
    (event.clientX - rect.left) /
    rect.width;

  audio.currentTime =
    percentage * audio.duration;

});


/* VIEW COUNTER */

window.addEventListener("load", () => {

  const key = "wave_profile_views";

  const views =
    parseInt(
      localStorage.getItem(key) || "0",
      10
    ) + 1;

  localStorage.setItem(key, views);

  $("#views").textContent =
    views.toLocaleString("id-ID");

});


/* CUSTOM CURSOR */

document.addEventListener("mousemove", event => {

  const cursor = $(".cursor");
  const dot = $(".cursor-dot");

  if (!cursor || !dot) {
    return;
  }

  cursor.style.left =
    event.clientX + "px";

  cursor.style.top =
    event.clientY + "px";

  dot.style.left =
    event.clientX + "px";

  dot.style.top =
    event.clientY + "px";

});


document
  .querySelectorAll("a, button, .progress-container")
  .forEach(element => {

    element.addEventListener("mouseenter", () => {

      const cursor = $(".cursor");

      if (!cursor) return;

      cursor.style.width = "38px";
      cursor.style.height = "38px";
      cursor.style.background =
        "rgba(255,255,255,.25)";

    });


    element.addEventListener("mouseleave", () => {

      const cursor = $(".cursor");

      if (!cursor) return;

      cursor.style.width = "26px";
      cursor.style.height = "26px";
      cursor.style.background =
        "transparent";

    });

  });


/* DISCORD STATUS */

function setStatus(status) {

  status = status || "offline";

  const labels = {

    online: "Online",

    idle: "Idle",

    dnd: "Do Not Disturb",

    offline: "Offline"

  };

  const label =
    labels[status] || "Offline";


  $("#discordStatus").className =
    `discord-status ${status}`;


  $("#discordStatusText").className =
    `discord-online ${status}`;


  $("#discordStatusText").textContent =
    label;

}


/* DISCORD AVATAR */

function getDiscordAvatar(user) {

  if (!user) {
    return null;
  }

  if (user.avatar) {

    return (
      `https://cdn.discordapp.com/avatars/` +
      `${user.id}/${user.avatar}.png?size=128`
    );

  }


  return (
    `https://cdn.discordapp.com/embed/avatars/` +
    `${Number(BigInt(user.id) % 5n)}.png`
  );

}


/* UPDATE DISCORD */

function updatePresence(data) {

  if (!data) {
    return;
  }


  /* USER */

  const user =
    data.discord_user;


  if (user) {

    $("#discordName").textContent =
      user.global_name ||
      user.display_name ||
      user.username ||
      "Discord";


    const avatar =
      getDiscordAvatar(user);


    if (avatar) {

      $("#discordAvatar").src =
        avatar;

      $("#profileAvatar").src =
        avatar;

    }

  }


  /* STATUS */

  setStatus(
    data.discord_status
  );


  /* SPOTIFY */

  const spotify =
    data.listening_to_spotify &&
    data.spotify;


  if (spotify) {

    $("#spotifyCard")
      .classList
      .remove("hidden");


    $("#spotifySong")
      .textContent =
      spotify.song ||
      "Unknown song";


    $("#spotifyArtist")
      .textContent =
      spotify.artist ||
      "Unknown artist";


    $("#spotifyCover")
      .src =
      spotify.album_art_url ||
      "";

  } else {

    $("#spotifyCard")
      .classList
      .add("hidden");

  }


  /* GAME */

  const game =
    (data.activities || [])
      .find(activity =>
        activity.type === 0
      );


  if (game) {

    $("#gameCard")
      .classList
      .remove("hidden");


    $("#gameName")
      .textContent =
      game.name ||
      "Playing";


    $("#gameDetails")
      .textContent =
      game.details ||
      game.state ||
      "";

  } else {

    $("#gameCard")
      .classList
      .add("hidden");

  }


  /* ACTIVITY TEXT */

  if (game) {

    $("#discordActivity")
      .textContent =
      `Playing ${game.name}`;

  } else if (spotify) {

    $("#discordActivity")
      .textContent =
      `Listening to ${spotify.song}`;

  } else {

    $("#discordActivity")
      .textContent =
      "No current activity";

  }

}


/* LANYARD */

async function loadDiscord() {

  if (!/^\d{17,20}$/.test(DISCORD_ID)) {
    return;
  }


  /*
  REST
  */

  try {

    const response =
      await fetch(
        `https://api.lanyard.rest/v1/users/${DISCORD_ID}`
      );


    if (response.ok) {

      const json =
        await response.json();

      updatePresence(
        json.data
      );

    }

  } catch (error) {

    $("#discordActivity")
      .textContent =
      "Presence unavailable";

  }


  /*
  WEBSOCKET
  */

  try {

    const socket =
      new WebSocket(
        "wss://api.lanyard.rest/socket"
      );


    let heartbeat;


    socket.onmessage = event => {

      const packet =
        JSON.parse(event.data);


      /*
      HELLO
      */

      if (packet.op === 1) {

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
          setInterval(() => {

            socket.send(
              JSON.stringify({
                op: 3,
                d: null
              })
            );

          },
          packet.d.heartbeat_interval
        );

      }


      /*
      PRESENCE UPDATE
      */

      if (
        packet.op === 0 &&
        (
          packet.t === "INIT_STATE" ||
          packet.t === "PRESENCE_UPDATE"
        )
      ) {

        updatePresence(
          packet.d
        );

      }

    };


    socket.onclose = () => {

      clearInterval(
        heartbeat
      );

    };

  } catch (error) {

    console.log(
      "Lanyard WebSocket error:",
      error
    );

  }

}


loadDiscord();


/* AUTOPLAY */

window.addEventListener("load", () => {

  setTimeout(() => {

    audio
      .play()
      .catch(() => {
        /*
        Browser bisa memblokir autoplay.
        User masih bisa menekan tombol Play.
        */
      });

  }, 700);

});