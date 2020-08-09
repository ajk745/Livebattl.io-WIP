module.exports = function Game(rules, endCallback) {
  this.gameState = 'game';
  this.player = 1;
  this.time = rules.timeLimit;
  this.winner = 1;
  this.playerInterrupt = null;

  var vote1 = [],
    vote2 = [];
  var voteKick1 = [],
    voteKick2 = [];
  this.timer = setInterval(() => {
    this.time--;
    if (this.time === 0) {
      if (this.player === 1) {
        this.player = 2;
        this.time = rules.timeLimit;
      } else if (this.player === 2) {
        this.player = 0;
        this.gameState = 'voting';
        this.time = rules.votingTime;
      } else if (this.player === 0) {
        if (this.playerInterrupt) {
          this.winner = this.playerInterrupt === 1 ? 2 : 1;
          this.gameState = 'results-interrupt';
          this.time = rules.endTime;
          this.player = -1;
        } else {
          if (vote1.length === vote2.length) this.winner = 0;
          else this.winner = vote1.length > vote2.length ? 1 : 2;
          this.gameState = 'results';
          this.time = rules.endTime;
          this.player = -1;
        }
      } else if (this.player === -1) {
        this.gameState = 'ended';
        clearInterval(this.timer);
        endCallback();
      }
    }
  }, 1000);

  this.vote = function (socket, vote) {
    let index1 = vote1.indexOf(socket);
    let index2 = vote2.indexOf(socket);
    if (vote === 1) {
      if (index1 === -1) vote1.push(socket);
      if (index2 !== -1) vote2.splice(index2, 1);
    } else if (vote === 2) {
      if (index2 === -1) vote2.push(socket);
      if (index1 !== -1) vote1.splice(index1, 1);
    }
  };

  this.voteKick = function (socket, player, spectators) {
    let index1 = voteKick1.indexOf(socket);
    let index2 = voteKick2.indexOf(socket);
    if (player === 1 && index1 === -1) {
      voteKick1.push(socket);
      if (voteKick1.length >= 2 && voteKick1.length / spectators > 0.66) {
        this.playerInterrupt = 1;
        this.player = 0;
        this.time = 1;
      }
      return voteKick1.length;
    } else if (player === 2 && index2 === -1) {
      voteKick2.push(socket);
      if (voteKick2.length >= 2 && voteKick2.length / spectators > 0.66) {
        this.playerInterrupt = 2;
        this.player = 0;
        this.time = 1;
      }
      return voteKick2.length;
    }
  };

  this.interrupt = function (cam) {
    //TODO: Better implementation
    this.playerInterrupt = cam;
    this.player = 0;
    this.time = 1;
  };

  this.getData = function () {
    return {
      gameState: this.gameState,
      player: this.player,
      time: this.time,
      winner: this.winner,
    };
  };
};
