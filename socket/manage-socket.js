var manageStream = require('./manage-stream');
var Game = require('./game/game-logic');
var getThumbnail = require('./game/get-thumbnail');
var path = require('path');
var fs = require('fs');
var db = require('../db');
const { time } = require('console');

var namespaces = fs
  .readFileSync(path.join(__dirname, '..', 'namespaces.txt'))
  .toString()
  .replace(/\r/g, '')
  .split('\n');

module.exports = function (io) {
  db.connect('VSCam', (err) => {
    if (err) console.log('Failed to connect to MongoDB Database');
    var roomDB = db.getDB('VSCam').collection('rooms');
    namespaces.forEach((namespace) => {
      manageConnection(io.of(namespace), namespace, roomDB);
    });
  });
};

var rooms = {};

function manageConnection(io, namespace, roomDB) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id} on namespace ${namespace}`);

    if (!rooms[namespace]) {
      rooms[namespace] = {
        namespace: namespace,
        currentGame: null,
        cam1: null,
        cam2: null,
        queue: [],
        spectators: [],
        userCount: 0,
        stream1: null,
        stream2: null,
        stars: [],
      };
      roomDB.find({ namespace: namespace }).toArray((err, res) => {
        if (err || res.length === 0) {
          console.log(`Socket ${socket.id} connected to non-existant room ${namespace}`);
          socket.emit('room-not-found');
          rooms[namespace] = null;
        } else {
          rooms[namespace].rules = res[0].rules || {
            maxQueue: 20,
            maxSpec: 100,
            timeLimit: 10,
            votingTime: 10,
            endTime: 5,
            turnMode: true,
          };
          rooms[namespace].style = res[0].style;
          rooms[namespace].description = res[0].description;
          rooms[namespace].description = res[0].description;

          manageSocket(rooms[namespace]);
        }
      });
    } else manageSocket(rooms[namespace]);

    //TESTING; hope this isn't too expensive
    function checkDuplicateIP(socket, room) {
      var ip =
        socket.handshake.headers['x-forwarded-for'].split(',')[0] ||
        socket.conn.remoteAddress.split(':')[3];
      if (!ip) return false;
      if (
        room.cam1 &&
        (room.cam1.handshake.headers['x-forwarded-for'].split(',')[0] ||
          room.cam1.conn.remoteAddress.split(':')[3]) === ip
      )
        return false;
      if (
        room.cam2 &&
        (room.cam2.handshake.headers['x-forwarded-for'].split(',')[0] ||
          room.cam2.conn.remoteAddress.split(':')[3]) === ip
      )
        return false;
      for (let i = 0; i < room.queue.length; i++) {
        if (
          (room.queue[i].handshake.headers['x-forwarded-for'].split(',')[0] ||
            room.queue[i].conn.remoteAddress.split(':')[3]) === ip
        )
          return false;
      }
      for (let i = 0; i < room.spectators.length; i++) {
        if (
          (room.spectators[i].handshake.headers['x-forwarded-for'].split(',')[0] ||
            room.spectators[i].conn.remoteAddress.split(':')[3]) === ip
        )
          return false;
      }
      return true;
    }

    function manageSocket(room) {
      if (!checkDuplicateIP(socket, room)) {
        socket.emit('duplicate-client');
        setTimeout(socket.disconnect, 1000);
        console.log(
          `Socket ${socket.id} joined with duplicate IP ${
            socket.handshake.headers['x-forwarded-for'].split(',')[0] ||
            socket.conn.remoteAddress.split(':')[3]
          }. Terminating connection`
        );
        return;
      }
      room.userCount++;
      socket.emit('page-style', room.style, room.description);
      socket.emit('game-rules', room.rules);
      room.spectators.push(socket);

      manageStream(io, socket, room);
      handlePlayerFunctions(io, socket, room, roomDB);
      socket.on('disconnect', () => {
        console.log('User disconnected: ' + socket.id);

        if (room.cam1 === socket) {
          room.cam1 = null;
          room['stream1'] = null;
          socket.broadcast.emit('stream-ended', 1);
          if (room.currentGame) room.currentGame.interrupt(1);
        }
        if (room.cam2 === socket) {
          room.cam2 = null;
          room['stream2'] = null;
          socket.broadcast.emit('stream-ended', 2);
          if (room.currentGame) room.currentGame.interrupt(2);
        }

        if (room.queue.indexOf(socket) !== -1) room.queue.splice(room.queue.indexOf(socket), 1);
        if (room.spectators.indexOf(socket) !== -1)
          room.spectators.splice(room.spectators.indexOf(socket), 1);
        room.userCount--;
        if (room.userCount === 0) {
          rooms[namespace] = null;
        }
      });
      socket.on('stream-error', () => {
        console.log('User Stream Error: ' + socket.id);

        if (room.cam1 === socket) {
          room.cam1 = null;
          room['stream1'] = null;
          socket.broadcast.emit('stream-ended', 1);
          if (room.currentGame) room.currentGame.interrupt(1);
        }
        if (room.cam2 === socket) {
          room.cam2 = null;
          room['stream2'] = null;
          socket.broadcast.emit('stream-ended', 2);
          if (room.currentGame) room.currentGame.interrupt(2);
        }

        if (room.queue.indexOf(socket) !== -1) room.queue.splice(room.queue.indexOf(socket), 1);
        if (room.spectators.indexOf(socket) !== -1)
          room.spectators.splice(room.spectators.indexOf(socket), 1);
        room.userCount--;
        if (room.userCount === 0) {
          rooms[namespace] = null;
        }
      });
    }
  });
  setInterval(() => {
    if (rooms[namespace]) sendPlayerData(io, rooms[namespace]);
  }, 1000);
}

function sendPlayerData(io, room) {
  var data = {
    playerCount:
      room.spectators.length + room.queue.length + (room.cam1 ? 1 : 0) + (room.cam2 ? 1 : 0),
    queue: room.queue.map((socket) => {
      return socket.name;
    }),
    game: room.currentGame ? room.currentGame.getData() : null,
    cam1: room.cam1 ? { name: room.cam1.name, streak: room.cam1.streak || 0 } : null,
    cam2: room.cam2 ? { name: room.cam2.name, streak: room.cam2.streak || 0 } : null,
  };
  io.emit('player-data', data);
}

function handlePlayerFunctions(io, socket, room, roomDB) {
  socket.on('vote', (vote) => {
    if (room.currentGame) room.currentGame.vote(socket, vote);
  });

  socket.on('set-name', (name) => {
    console.log(`Setting name of socket ${socket.id} to ${name}`);
    socket.name = name;
  });

  socket.on('votekick', (player) => {
    var index = room.spectators.indexOf(socket) + room.queue.indexOf(socket);
    var votes, spectators;
    if (index !== -2) {
      spectators = room.spectators.length + room.queue.length;
      if (room.currentGame) {
        votes = room.currentGame.voteKick(socket, player, spectators);
        if (votes) {
          socket.emit('votekick', player, votes, spectators);
          socket.broadcast.emit('votekick', player, votes, spectators);
        }
      }
    }
  });

  socket.on('join-queue', () => {
    if (room.queue.length < room.rules.maxQueue) {
      room.spectators.splice(room.spectators.indexOf(socket), 1);
      if (room.cam1 === null) {
        room.cam1 = socket;
        socket.emit('start-stream', 1);
      } else if (room.cam2 === null) {
        room.cam2 = socket;
        io.emit('start-game');
        socket.emit('start-stream', 2);
        room.currentGame = new Game(room.rules, () => startNewGame(io, room, roomDB));
        getThumbnail(room, roomDB, 5);
      } else {
        room.queue.push(socket);
      }
    }
  });
  socket.on('leave-queue', () => {
    var index = room.queue.indexOf(socket);
    if (index !== -1) {
      room.queue.splice(index, 1);
      room.spectators.push(socket);
    }
  });
  socket.on('chat-message', (message) => {
    if (message.length < 512 && Date.now() - (socket.lastMessage || 0) > 1000) {
      message = `<b>${socket.name}</b>: ${message}`;
      socket.broadcast.emit('chat-message', message);
      socket.emit('chat-message', message);
      socket.lastMessage = Date.now();
    }
  });
}

function startNewGame(io, room, roomDB) {
  roomDB.updateOne({ namespace: room.namespace }, { $set: { players: room.userCount } });

  io.emit('game-ended');
  io.emit('stream-ended', 1);
  io.emit('stream-ended', 2);

  if (room.queue.length >= 1) {
    if (room.currentGame.winner === 1) {
      if (room.cam2) {
        room.spectators.push(room.cam2);
        room.cam2.emit('end-stream');
        if (room.cam2) room.cam2.streak = 0;
      }
      if (room.cam1) {
        room.cam1.emit('end-stream');
        room.cam1.streak = room.cam1 && room.cam1.streak ? room.cam1.streak++ : 1;
      }
      room.cam2 = room.queue.shift();
      if (room.cam1 === null) room.cam1 = room.queue.shift();
    } else if (room.currentGame.winner === 2) {
      if (room.cam1) {
        room.spectators.push(room.cam1);
        room.cam1.emit('end-stream');
        if (room.cam1) room.cam1.streak = 0;
      }
      if (room.cam2) {
        room.cam2.emit('end-stream');
        room.cam2.streak = room.cam2 && room.cam2.streak ? room.cam2.streak++ : 1;
      }
      room.cam1 = room.queue.shift();
      if (room.cam2 === null) room.cam2 = room.queue.shift();
    }
    //TODO account for no winner bug
    else {
      if (room.cam1) {
        room.cam1.emit('end-stream');
      }
      if (room.cam2) {
        room.cam2.emit('end-stream');
      }
      if (room.cam1 === null) room.cam1 = room.queue.shift();
      if (room.cam2 === null) room.cam2 = room.queue.shift();
    }
    room.currentGame = null;
    setTimeout(() => {
      room.stream1 = null;
      room.stream2 = null;
      if (room.cam1) room.cam1.emit('start-stream', 1);
      if (room.cam2) room.cam2.emit('start-stream', 2);
      room.currentGame = new Game(room.rules, () => startNewGame(io, room, roomDB));
      getThumbnail(room, roomDB, 5);
    }, 500);
  } else {
    if (room.currentGame.winner !== 0) {
      if (room.cam1) {
        room.spectators.push(room.cam1);
        room.cam1.emit('end-stream');
      }
      if (room.cam2) {
        room.spectators.push(room.cam2);
        room.cam2.emit('end-stream');
      }

      if (room.currentGame.winner === 1) {
        room.cam1.streak = room.cam1 && room.cam1.streak ? room.cam1.streak++ : 1;
        if (room.cam2) room.cam2.streak = 0;
      } else if (room.currentGame.winner === 2) {
        room.cam2.streak = room.cam2 && room.cam2.streak ? room.cam2.streak++ : 1;
        if (room.cam1) room.cam1.streak = 0;
      }

      room.cam1 = null;
      room.cam2 = null;

      room.currentGame = null;
      setTimeout(() => {
        room.stream1 = null;
        room.stream2 = null;
      }, 500);
    } else {
      if (room.cam1) {
        room.cam1.emit('end-stream');
      }
      if (room.cam2) {
        room.cam2.emit('end-stream');
      }
      room.currentGame = null;
      setTimeout(() => {
        if (room.cam1 && room.cam2) {
          room.stream1 = null;
          room.stream2 = null;
          if (room.cam1) room.cam1.emit('start-stream', 1);
          if (room.cam2) room.cam2.emit('start-stream', 2);
          room.currentGame = new Game(room.rules, () => startNewGame(io, room, roomDB));
          getThumbnail(room, roomDB, 5);
        }
      }, 500);
    }
  }
}
