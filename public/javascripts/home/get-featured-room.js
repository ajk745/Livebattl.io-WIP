function getFeaturedRooms() {
  fetch('./api/rooms-featured')
    .then((res) => res.json())
    .then((res) => {
      res.forEach((room) => {
        if (room.namespace === '/') return;
        let li = document.createElement('li');
        var backgroundLinkAvaliable =
          room.style.background &&
          typeof room.style.background === 'string' &&
          room.style.background.length < 512;
        //li.style.background =
        //  backgroundLinkAvaliable && room.style.background
        //    ? `url(${room.style.background})`
        //   : `url(../api/room-background${room.namespace})`;
        li.style.background = `url(${getComputedStyle(document.documentElement).getPropertyValue(
          '--banner-background'
        )})`;
        li.style.backgroundSize = '100% 100%';
        li.innerHTML = `<h3><a href = './c${room.namespace}'>c${room.namespace}</h3></a>
            <h6>${room.description || ''}</h6>
          <h6>Current Players: ${room.players || '0'}</h6>`;
        featuredRoomList.appendChild(li);
      });
    });
}
