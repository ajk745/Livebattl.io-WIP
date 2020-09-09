var delayMS = 100;
var chunks1 = [],
  chunks2 = [];
//GLOBAL TEST

var video1 = document.getElementById('cam-1-embed'),
  video2 = document.getElementById('cam-2-embed');

function Stream(cam) {
  //record video in chunks, send over websocket
  this.cameraStream = null;
  this.cam = cam;
  this.rec = null;

  if (!navigator.mediaDevices) {
    alert(
      'Failed to read video/audio input. Make sure to allow camera and microphone usage on this site. You have been removed from the queue.'
    );
    socket.emit('stream-error');
    this.endStream();
  }

  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      this.cameraStream = stream;
      switch (cam) {
        case 1:
          video1.srcObject = stream;
          video1.volume = 0;
          video1.play();
          break;
        case 2:
          video2.srcObject = stream;
          video2.volume = 0;
          video2.play();
          break;
        default:
          break;
      }
      if (this.cam !== null) record(stream, delayMS);
    })
    .catch((err) => {
      alert(
        'Failed to read video/audio input. Make sure to allow camera and microphone usage on this site. You have been removed from the queue.'
      );
      socket.emit('stream-error');
      this.endStream();
    });

  var record = (stream, ms) => {
    this.rec = new MediaRecorder(stream, {
      mimeType: 'video/webm; codecs="opus,vp8"',
    });
    //rec.mimeType = 'video/webm; codecs="opus,vp8"';
    this.rec.start(ms);
    this.rec.ondataavailable = (e) => {
      var fileReader = new FileReader();
      fileReader.onload = () => {
        socket.emit('stream-frag', {
          stream: fileReader.result,
          room: window.location.pathname.split('/')[0] || '/',
          cam: cam,
        });
      };
      fileReader.readAsArrayBuffer(e.data);
    };
  };

  socket.on('get-thumbnail', () => {
    var video = this.cam === 1 ? video1 : video2;
    var draw = document.createElement('canvas');
    draw.width = video.videoWidth;
    draw.height = video.videoHeight;
    var context2D = draw.getContext('2d');
    context2D.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    draw.toBlob((blob) => {
      socket.emit('get-thumbnail', blob);
    });
  });

  this.endStream = function () {
    if (this.rec) this.rec.stop();
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
    }
    if (this.cam === 1) {
      video1.pause();
      video1.srcObject = null;
      video1.load();
      video1.src = URL.createObjectURL(mediaSource1);
    } else {
      video2.pause();
      video2.srcObject = null;
      video2.load();
      video2.src = URL.createObjectURL(mediaSource2);
    }
    this.cam = null;
  };
}

function getStream() {
  var stream1Ready = true;
  var stream2Ready = true;

  setMSE(chunks1, chunks2);
  //recieve video chunks from server.
  socket.on('stream-frag', (data) => {
    switch (data.cam) {
      case 1:
        if (data.hasHeader) {
          chunks1 = [];
          stream1Ready = true;
        }
        if (data.cluster) chunks1.push(data.cluster);
        //console.log(data, stream1Ready);
        if (
          stream1Ready &&
          mediaSource1.readyState === 'open' &&
          sourceBuffer1 &&
          sourceBuffer1.updating === false &&
          data.cluster
        ) {
          sourceBuffer1.appendBuffer(chunks1.shift());
        }
        break;
      case 2:
        if (data.hasHeader) {
          chunks2 = [];
          stream2Ready = true;
        }
        if (data.cluster) chunks2.push(data.cluster);
        //console.log(data, stream2Ready);
        if (
          stream2Ready &&
          mediaSource2.readyState === 'open' &&
          sourceBuffer2 &&
          sourceBuffer2.updating === false &&
          data.cluster
        ) {
          sourceBuffer2.appendBuffer(chunks2.shift());
        }
        break;
    }
  });
  socket.on('stream-ended', (cam) => {
    if (stream && stream.cam === cam) return;
    else {
      if (cam === 1) {
        stream1Ready = false;
        mediaSource1 = new MediaSource();
        mediaSource1.addEventListener('sourceopen', function () {
          //if (sourceBuffer1) mediaSource1.removeSourceBuffer(sourceBuffer1);
          chunks1 = [];
          sourceBuffer1 = mediaSource1.addSourceBuffer('video/webm; codecs="opus,vp8"');
          sourceBuffer1.addEventListener('error', function (e) {
            console.log('error: ' + mediaSource1.readyState, e);
          });
          sourceBuffer1.addEventListener('abort', function (e) {
            console.log('abort: ' + mediaSource1.readyState, e);
          });
        });

        video1.src = URL.createObjectURL(mediaSource1);
        mediaSource1.isLive = false;
      } else {
        stream2Ready = false;
        mediaSource2 = new MediaSource();
        mediaSource2.addEventListener('sourceopen', function () {
          chunks2 = [];
          //if (sourceBuffer2) mediaSource2.removeSourceBuffer(sourceBuffer1);
          sourceBuffer2 = mediaSource2.addSourceBuffer('video/webm; codecs="opus,vp8"');
          sourceBuffer2.addEventListener('error', function (e) {
            console.log('error: ' + mediaSource2.readyState, e);
          });
          sourceBuffer2.addEventListener('abort', function (e) {
            console.log('abort: ' + mediaSource2.readyState, e);
          });
        });

        video2.src = URL.createObjectURL(mediaSource2);
        mediaSource2.isLive = false;
      }
    }
  });
}

function setMSE() {
  mediaSource1.addEventListener('sourceopen', function () {
    //if (sourceBuffer1) mediaSource1.removeSourceBuffer(sourceBuffer1);
    sourceBuffer1 = mediaSource1.addSourceBuffer('video/webm; codecs="opus,vp8"');
    sourceBuffer1.addEventListener('error', function (e) {
      console.log('error: ' + mediaSource1.readyState, e);
    });
    sourceBuffer1.addEventListener('abort', function (e) {
      console.log('abort: ' + mediaSource1.readyState, e);
    });
    sourceBuffer1.addEventListener('update', function () {
      if (chunks1.length !== 0) {
        sourceBuffer1.appendBuffer(chunks1.shift());
        console.log('test1');
      }
    });
  });
  mediaSource1.isLive = false;
  mediaSource2.addEventListener('sourceopen', function () {
    //if (sourceBuffer2) mediaSource2.removeSourceBuffer(sourceBuffer2);
    sourceBuffer2 = mediaSource2.addSourceBuffer('video/webm; codecs="opus,vp8"');
    sourceBuffer2.addEventListener('error', function (e) {
      console.log('error: ' + mediaSource2.readyState, e);
    });
    sourceBuffer2.addEventListener('abort', function (e) {
      console.log('abort: ' + mediaSource2.readyState, e);
    });
    sourceBuffer2.addEventListener('update', function () {
      if (chunks2.length !== 0) sourceBuffer2.appendBuffer(chunks2.shift());
    });
  });
  mediaSource2.isLive = false;
}

socket.on('start-stream', (cam) => {
  stream = new Stream(cam);
  var joinButton = document.getElementById('queue-button');
  joinButton.disabled = true;
  socket.on('end-stream', () => {
    joinButton.innerHTML = 'Join Queue';
    joinButton.disabled = false;
    stream.endStream();
  });
});

var mediaSource1 = new MediaSource();
var sourceBuffer1 = null;

var mediaSource2 = new MediaSource();
var sourceBuffer2 = null;

setInterval(() => {
  if (mediaSource1 && sourceBuffer1 && sourceBuffer1.buffered.length > 0) {
    let latestTime = sourceBuffer1.buffered.end(sourceBuffer1.buffered.length - 1);
    if (latestTime - video1.currentTime > 2) video1.currentTime = latestTime - 1;
  }
  if (mediaSource2 && sourceBuffer2 && sourceBuffer2.buffered.length > 0) {
    let latestTime = sourceBuffer2.buffered.end(sourceBuffer2.buffered.length - 1);
    if (latestTime - video2.currentTime > 2) video2.currentTime = latestTime - 1;
  }
}, 1000);

video1.src = URL.createObjectURL(mediaSource1);
video2.src = URL.createObjectURL(mediaSource2);

getStream();
