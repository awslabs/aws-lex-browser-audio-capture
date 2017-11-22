(function() {
  'use strict';
  var canvas = document.querySelector('.visualizer');
  var canvasCtx = canvas.getContext('2d');
  var listening = true;

  /**
   * Will render an audio buffer as wave form. Right now, it expects 
   * a canvas element to be on the page with class name "visualizer".
   */
  window.Waveform = function() {
    /**
     * Clears the canvas element.
     */
    var clearCanvas = function() {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      listening = false;
    };

    /**
     * Sets the listening flag to true.
     */
    var prepCanvas = function() {
      listening = true;
    };

    /**
     * Clears the canvas and draws the dataArray. 
     * @param {Uint8Array} dataArray - The time domain audio data to visualize.
     * @param {number} bufferLength - The FFT length.
     */
    var visualizeAudioBuffer = function(dataArray, bufferLength) {
      var WIDTH = canvas.width;
      var HEIGHT = canvas.height;
      var animationId;
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      /**
       * Will be called at about 60 times per second. If listening, draw the dataArray. 
       */
      function draw() {
        if (!listening) {
          return;
        }

        canvasCtx.fillStyle = 'rgb(249,250,252)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.lineWidth = 1;
        canvasCtx.strokeStyle = 'rgb(0,125,188)';
        canvasCtx.beginPath();

        var sliceWidth = WIDTH * 1.0 / bufferLength;
        var x = 0;

        for (var i = 0; i < bufferLength; i++) {
          var v = dataArray[i] / 128.0;
          var y = v * HEIGHT / 2;
          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
      }

      // Register our draw function with requestAnimationFrame. 
      if (typeof animationId === 'undefined') {
        animationId = requestAnimationFrame(draw);
      }
    };
    return {
      clearCanvas: clearCanvas,
      prepCanvas: prepCanvas,
      visualizeAudioBuffer: visualizeAudioBuffer
    };
  };
})();