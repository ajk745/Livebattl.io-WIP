var data = getUrlVars();

document.addEventListener('DOMContentLoaded', () => {
  if (data.namespace) document.getElementById('title').innerHTML = 'c/' + decodeURI(data.namespace);
  if (data.description)
    document.getElementById('description').innerHTML = decodeURL(data.description);
  if (data.mainColor) document.documentElement.style.setProperty('--main-color', data.mainColor);
  if (data.secondaryColor)
    document.documentElement.style.setProperty('--secondary-color', data.secondaryColor);
  if (data.background)
    document.documentElement.style.setProperty('--banner-background', `url(${data.background})`);
});

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    vars[key] = value;
  });
  return vars;
}
