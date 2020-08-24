function getRooms(query) {
  fetch('./api/rooms-details')
    .then((res) => res.json())
    .then((res) => {
      let roomCount = 0;
      res.forEach((room) => {
        if (room.namespace === '/') return;
        if (query && query !== '') {
          if (room.namespace.toUpperCase().indexOf(query.toUpperCase()) !== -1) {
            addRoom(room);
            roomCount++;
          }
        } else {
          addRoom(room);
          roomCount++;
        }
      });
      roomSearchInfo.innerHTML = `Found ${roomCount} rooms`;
    });
}

function addRoom(room) {
  var rows = roomList.getElementsByClassName('row');
  var lastRow = rows[rows.length - 1];
  if (!lastRow || (lastRow && lastRow.getElementsByClassName('column').length >= 4)) {
    newRow = document.createElement('div');
    newRow.setAttribute('class', 'row');
    roomList.appendChild(newRow);
    addRoom(room);
    return;
  } else if (lastRow) {
    lastRow.innerHTML += `<div class="column">
          <div class="card" onclick="hrefRoom('${room.namespace}')"
            ><div
              class="card-image"
              style="
                background-image: url(../api/room-thumbnail${room.namespace});
                background-color: ${room.style ? room.style.mainColor || '' : ''};
              "
            ></div
            ><h3>c${room.namespace}</h3><h5>${room.description || ''}</h5><h5>${
      room.rules && room.rules.turnMode ? 'Players take turns' : 'Free for all'
    } - Time Limit: ${
      room.rules && room.rules.timeLimit ? fancyTimeFormat(room.rules.timeLimit) : '0:10'
    }</h5></div
          >
        </div>`;
  }
}

function hrefRoom(namespace) {
  window.location.href = `../c${namespace}`;
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
