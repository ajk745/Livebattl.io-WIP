var playerQueue, playerStats;
var playerTag1, playerTag2;
var title, description;
var timer1, timer2;
var video1, video2;
var streak1, streak2;
var playerNotif;
var overlayText;
var rules;
var messageBox;
var messages;
var queue = [],
  inQueue = false;
var playerCount;
var stream;

document.addEventListener('DOMContentLoaded', () => {
  title = document.getElementById('title');
  description = document.getElementById('description');
  playerQueue = document.getElementById('player-queue');
  playerStats = document.getElementById('player-stats');
  playerTag1 = document.getElementById('playername1');
  playerTag2 = document.getElementById('playername2');
  streak1 = document.getElementById('winstreak1');
  streak2 = document.getElementById('winstreak2');
  timer1 = document.getElementById('timer1');
  timer2 = document.getElementById('timer2');
  video1 = document.getElementById('cam-1-embed');
  video2 = document.getElementById('cam-2-embed');
  playerNotif = document.getElementById('player-notif');
  overlayText = Array.from(document.querySelectorAll('.overlay-text'));
  messageBox = document.getElementById('message-box');
  messages = document.getElementById('messages');
  voteKickText1 = document.getElementById('votekick-text1');
  voteKickText2 = document.getElementById('votekick-text2');
});
