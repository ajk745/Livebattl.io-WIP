var previewData = {};

var title, description, mainColor, secondaryColor, background;
var previewFrame;
document.addEventListener('DOMContentLoaded', () => {
  previewFrame = document.getElementById('room-preview');
  title = document.getElementById('namespace');
  description = document.getElementById('room-description');
  mainColor = document.getElementById('main-color');
  secondaryColor = document.getElementById('secondary-color');
  background = document.getElementById('background');
  [title, description, mainColor, secondaryColor].forEach((field) => {
    field.onchange = function () {
      previewData[field.name] = field.value;
      console.log(previewData);
      reloadPreview();
    };
  });
  background.onchange = function () {
    previewData.background = URL.createObjectURL(background.files[0]);
    reloadPreview();
  };
});

function reloadPreview() {
  var query = Object.keys(previewData)
    .map((key) => `${key}=${previewData[key]}`)
    .join('&');
  previewFrame.setAttribute('src', ``);
  previewFrame.setAttribute('src', `../roompreview?${query}`);
  setTimeout(() => {
    previewFrame.src = previewFrame.src;
  }, 100);
}
