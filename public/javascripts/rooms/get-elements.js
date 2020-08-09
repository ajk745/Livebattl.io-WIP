var roomList, roomSearch, roomSearchInfo;

document.addEventListener('DOMContentLoaded', () => {
  roomList = document.getElementById('roomlist');
  roomSearch = document.getElementById('room-search');
  roomSearchInfo = document.getElementById('room-search-info');
  roomSearch.onchange = () => {
    'test';
    roomList.innerHTML = '';
    getRooms(roomSearch.value);
  };
});
