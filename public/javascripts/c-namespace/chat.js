document.addEventListener('DOMContentLoaded', () => {
  messageBox.onkeypress = (e) => {
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13' && messageBox.value !== '') {
      socket.emit('chat-message', messageBox.value);
      messageBox.value = '';
      return false;
    }
  };
});

socket.on('chat-message', (message) => {
  var li = document.createElement('li');
  li.innerHTML = message;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});
