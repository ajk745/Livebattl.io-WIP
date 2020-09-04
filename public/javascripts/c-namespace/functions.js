function joinQueue() {
  if (!navigator.mediaDevices) {
    alert(
      'Failed to read video/audio input. Make sure to allow camera and microphone usage on this site. You have been removed from the queue.'
    );
    return;
  }
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then(() => {
      var joinButton = document.getElementById('queue-button');
      if (queue.length < rules.maxQueue) {
        socket.emit('join-queue');
        joinButton.innerHTML = 'Leave Queue';
        joinButton.setAttribute('onclick', 'leaveQueue()');
      }
    })
    .catch((err) => {
      alert(
        'Failed to read video/audio input. Make sure to allow camera and microphone usage on this site. You have been removed from the queue.'
      );
      return;
    });
}

function leaveQueue() {
  var joinButton = document.getElementById('queue-button');
  socket.emit('leave-queue');
  joinButton.innerHTML = 'Join Queue';
  joinButton.setAttribute('onclick', 'joinQueue()');
}

function vote(element) {
  var player = parseInt(element.getAttribute('player'));
  overlayText.forEach((element) => {
    element.style.color = 'rgba(255, 255, 255, 0.6)';
  });
  element.querySelector('.overlay-text').style.color = 'gold';
  console.log(`Sending vote for player ${player} to server`);
  socket.emit('vote', player);
}

function voteKick(element, player) {
  //element.disabled = true;
  console.log(`Sending votekick for player ${player} to server`);
  socket.emit('votekick', player);
}

function report(player) {
  if (player === 1 && playerTag1.innerHTML === '') return;
  if (player === 2 && playerTag2.innerHTML === '') return;
  var reportText = prompt(
    'Please explain clearly the reason for reporting this player. Refer to the TOS to make sure the action you are reporting is in voilation. '
  );
  socket.emit('report', { player: player, reportText: reportText });
}

socket.on('page-style', async (style, descriptionText) => {
  title.innerHTML = 'c' + namespace;
  description.innerHTML = descriptionText || '';

  if (style) {
    if (style.mainColor)
      document.documentElement.style.setProperty('--main-color', style.mainColor);
    if (style.secondaryColor)
      document.documentElement.style.setProperty('--secondary-color', style.secondaryColor);
    if (style.background) {
      var backgroundLinkAvaliable =
        typeof style.background === 'string' && style.background.length < 512
          ? await fetch(style.background)
              .then((res) => {
                if (res.ok) return true;
                else {
                  console.log('Failed to fetch background from URL');
                  return false;
                }
              })
              .catch(() => {
                console.log('Failed to fetch background from URL');
                return false;
              })
          : false;
      if (backgroundLinkAvaliable) {
        document.documentElement.style.setProperty(
          '--banner-background',
          `url(${style.background})`
        );
      } else {
        document.documentElement.style.setProperty(
          '--banner-background',
          `url(../api/room-background${namespace})`
        );
      }
    }
  }
});

socket.on('player-data', (data) => {
  playerCount = data.playerCount;

  playerStats.innerHTML = `${data.playerCount} Current Viewers </br> ${data.queue.length} in Queue`;
  playerTag1.innerHTML = data.cam1 === null ? '' : data.cam1;
  playerTag2.innerHTML = data.cam2 === null ? '' : data.cam2;

  updateGameData(data.game || { player: null });

  var queueList = document.createElement('ol');
  queue = data.queue;
  data.queue.forEach((name) => {
    let li = document.createElement('li');
    queueList.appendChild(li);
    li.innerHTML += name;
  });
  playerQueue.innerHTML = '';
  playerQueue.appendChild(queueList);
});

socket.on('votekick', (player, votes, spectators) => {
  if (player === 1) {
    voteKickText1.innerHTML = `Voting to Kick: ${votes}/${
      spectators > 2 ? Math.floor(spectators * (2 / 3)) : 2
    } Votes Recieved`;
  } else if (player === 2) {
    voteKickText2.innerHTML = `Voting to Kick: ${votes}/${
      spectators > 2 ? Math.floor(spectators * (2 / 3)) : 2
    } Votes Recieved`;
  }
});

socket.on('game-rules', (data) => {
  rules = data;
});
