var tempdata = {};

module.exports = function manageStream(io, socket, room) {
  socket.emit('stream-frag', {
    cluster: room ? room['stream1'] : null,
    room: '/',
    hasHeader: true,
    cam: 1,
  });
  socket.emit('stream-frag', {
    cluster: room ? room['stream2'] : null,
    room: '/',
    hasHeader: true,
    cam: 2,
  });

  socket.on('stream-frag', (data) => {
    var hasHeader = false;
    //socket.broadcast.emit('stream-frag', data);
    if (!room['stream' + data.cam]) {
      hasHeader = true;
      room['stream' + data.cam] = Buffer.alloc(0);
    }
    socket.broadcast.emit('stream-frag', {
      cluster: data.stream,
      room: data.room,
      hasHeader: hasHeader,
      cam: data.cam,
    });
    room['stream' + data.cam] = Buffer.concat([room['stream' + data.cam], data.stream]);
  });
};
