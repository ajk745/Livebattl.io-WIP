module.exports = function (room, roomDB, delay) {
  setTimeout(() => {
    getThumbnail(room, roomDB);
  }, 1000 * delay);
};

function getThumbnail(room, roomDB) {
  if (true) {
    tPlayer = Math.random() < 0.5 ? room.cam1 : room.cam2;
    if (tPlayer) {
      tPlayer.emit('get-thumbnail');
      function uploadThumbnail(image) {
        roomDB.updateOne(
          { namespace: room.namespace },
          { $set: { thumbnail: image } },
          (err, res) => {
            if (err)
              console.log(
                `Error uploading thumbnail for ${tPlayer.name}, socket ${tPlayer}, room ${room.namespace}`
              );
            else
              console.log(
                `Uploaded new thumbnail for ${tPlayer.name}, socket ${tPlayer}, room ${room.namespace}`
              );
          }
        );
        tPlayer.removeListener('get-thumbnail', uploadThumbnail);
      }
      tPlayer.on('get-thumbnail', uploadThumbnail);
    }
  }
}
