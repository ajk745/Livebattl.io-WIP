const winMessages = ['Winner', 'EZ Win', 'VICTORY', 'Winna', 'You Win'];
const lossMessages = ['Loser', 'Take the L', 'L', 'LLLLLLL', 'Lose', 'You Lose'];

function updateGameData(game) {
  switch (game.player) {
    case null:
      playerNotif.innerHTML =
        queue.length > 0 ? 'Starting Next Game...' : 'Waiting for Players to Start...';
      timer1.innerHTML = 'Waiting for Players...';
      timer2.innerHTML = 'Waiting for Players...';
      video1.volume = 1;
      video2.volume = 1;
      overlayText.forEach((element) => {
        element.style.color = 'rgba(255, 255, 255, 0.6)';
        element.style.visibility = 'hidden';
        element.className = 'overlay-text';
        element.innerHTML = 'Click to Vote';
      });
      break;
    case -1:
      playerNotif.innerHTML = 'The  Votes are In!';
      voteKickText1.innerHTML = '';
      voteKickText2.innerHTML = '';
      timer1.innerHTML = '';
      timer2.innerHTML = '';
      playerTag1.style.color = 'white';
      playerTag2.style.color = 'white';
      video1.volume = 1;
      video2.volume = 1;
      overlayText.forEach((element) => {
        element.style.visibility = 'visible';
        element.style.removeProperty('color');
        if (game.winner === parseInt(element.getAttribute('player'))) {
          element.classList.add('winner');
          element.innerHTML = winMessages[Math.floor(Math.random() * winMessages.length)];
        } else if (game.winner === 0) {
          element.classList.add('draw');
          element.innerHTML = 'Draw';
          playerNotif.innerHTML = 'We have a DRAW! Starting REMATCH!';
        } else {
          element.classList.add('loser');
          element.innerHTML = lossMessages[Math.floor(Math.random() * lossMessages.length)];
        }
      });
      break;
    case 1:
      timer1.innerHTML = fancyTimeFormat(game.time);
      timer2.innerHTML = '';
      video1.volume = stream && stream.cam === 1 ? 0 : 1;
      video2.volume = 0;
      video1.className = '';
      video2.className = 'muted-video';
      playerTag1.style.color = 'gold';
      playerTag2.style.color = 'white';
      overlayText.forEach((element) => {
        element.style.visibility = 'hidden';
      });
      playerNotif.style.innerHTML = '';
      break;
    case 2:
      timer2.innerHTML = fancyTimeFormat(game.time);
      timer1.innerHTML = '';
      video2.volume = stream && stream.cam === 2 ? 0 : 1;
      video1.volume = 0;
      video2.className = '';
      video1.className = 'muted-video';
      playerTag2.style.color = 'gold';
      playerTag1.style.color = 'white';
      overlayText.forEach((element) => {
        element.style.visibility = 'hidden';
      });
      playerNotif.innerHTML = '';
      break;
    //TODO: VOTING
    default:
      timer1.innerHTML = '';
      timer2.innerHTML = '';
      video1.volume = stream && stream.cam === 1 ? 0 : 1;
      video2.volume = stream && stream.cam === 2 ? 0 : 1;
      video1.className = 'ended-video';
      video2.className = 'ended-video';
      playerTag1.style.color = 'white';
      playerTag2.style.color = 'white';
      playerNotif.innerHTML =
        'Vote for the Winner! ' + fancyTimeFormat(game.time) + ' Remaining...';
      overlayText.forEach((element) => {
        element.style.visibility = 'visible';
      });
  }
}

//thanks StackOverflow
function fancyTimeFormat(time) {
  // Hours, minutes and seconds
  var hrs = ~~(time / 3600);
  var mins = ~~((time % 3600) / 60);
  var secs = ~~time % 60;

  // Output like "1:01" or "4:03:59" or "123:03:59"
  var ret = '';

  if (hrs > 0) {
    ret += '' + hrs + ':' + (mins < 10 ? '0' : '');
  }

  ret += '' + mins + ':' + (secs < 10 ? '0' : '');
  ret += '' + secs;
  return ret;
}
