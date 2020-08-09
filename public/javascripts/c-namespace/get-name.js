function getName() {
  var name =
    prompt('Enter a nickname to use in this room.', localStorage.getItem('previousName', '')) ||
    'Player' + guidGenerator();
  console.log(`Sending name ${name} to server`);
  socket.emit('set-name', name);
  socket.name = name;
  localStorage.setItem('previousName', name);
}

function guidGenerator() {
  var S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return S4() + S4();
}
