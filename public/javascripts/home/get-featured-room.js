function getFeaturedRooms() {
  fetch('./api/rooms-featured')
    .then((res) => res.json())
    .then((res) => {
      res.forEach((room) => {
        if (room.namespace === '/') return;
        let li = document.createElement('li');
        li.style.background = `url(${
          room.style
            ? room.style.background || null
            : getComputedStyle(document.documentElement).getPropertyValue('--banner-background')
        })`;
        li.style.backgroundSize = '100% 100%';
        li.innerHTML = `<h3><a href = './c${room.namespace}'>c${room.namespace}</h3></a>
            <h6>${room.description || ''}</h6>
          <h6>Current Players: ${room.players || '0'}</h6>`;
        featuredRoomList.appendChild(li);
      });
    });
}
