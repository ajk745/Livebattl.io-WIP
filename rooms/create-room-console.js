var createRoom = require('./create-room');
var readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

var room = {
  rules: {
    votingTime: 10,
    endTime: 5,
  },
  style: {},
};

rl.question('Enter namespace (no /) \n', (line) => {
  if (line === '') process.exit(1);
  room.namespace = '/' + line;
  rl.question('Enter Description \n', (line) => {
    room.description = line !== '' ? line : null;
    rl.question('Enter MaxQueue \n', (line) => {
      let val = parseInt(line);
      room.rules.maxQueue = val !== NaN ? val : 20;
      rl.question('Enter MaxSpec \n', (line) => {
        let val = parseInt(line);
        room.rules.maxSpec = val !== NaN ? val : 100;
        rl.question('Enter timeLimit (secs) \n', (line) => {
          let val = parseInt(line);
          room.rules.timeLimit = val !== NaN ? val : 60;
          rl.question('Enter turnMode (1= true, 0 = false) \n', (line) => {
            let val = parseInt(line);
            let bool = parseInt === 0 ? false : true;
            room.rules.turnMode = bool;
            rl.question('Enter mainColor (css property) \n', (line) => {
              room.style.mainColor = line !== '' ? line : null;
              rl.question('Enter secondaryColor (css property) \n', (line) => {
                room.style.secondaryColor = line !== '' ? line : null;
                rl.question('Enter url to background \n', (line) => {
                  room.style.background = line !== '' ? line : null;
                  console.log('Uploading room data: \n' + room);
                  rl.close;
                  createRoom(room, () => process.exit(0));
                });
              });
            });
          });
        });
      });
    });
  });
});
