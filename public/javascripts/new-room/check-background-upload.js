var maxsize = 4;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('background').onchange = function () {
    console.log('test');
    if (this.files[0].size > 1048576 * maxsize) {
      alert('File is too big!');
      this.value = '';
    }
  };
});
