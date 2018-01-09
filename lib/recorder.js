 (function () {
  'use strict';
  var work = require('webworkify');
  var worker = work(require('./worker.js'));
  var audio_context, audio_stream;

  /**
   * The Recorder object. Sets up the onaudioprocess callback and communicates
   * with the web worker to perform audio actions.
   */
  var recorder = function (source, silenceDetectionConfig) {

    silenceDetectionConfig = silenceDetectionConfig || {};
    silenceDetectionConfig.time = silenceDetectionConfig.hasOwnProperty('time') ? silenceDetectionConfig.time : 1500;
    silenceDetectionConfig.amplitude = silenceDetectionConfig.hasOwnProperty('amplitude') ? silenceDetectionConfig.amplitude : 0.2;
    
    var recording = false,
      currCallback, start, silenceCallback, visualizationCallback;

    // Create a ScriptProcessorNode with a bufferSize of 4096 and a single input and output channel
    var node = source.context.createScriptProcessor(4096, 1, 1);

    worker.onmessage = function (message) {
      var blob = message.data;
      currCallback(blob);
    };

    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: source.context.sampleRate,
      }
    });

    /**
     * Sets the silence and viz callbacks, resets the silence start time, and sets recording to true.
     * @param {?onSilenceCallback} onSilence - Called when silence is detected.
     * @param {?visualizerCallback} visualizer - Can be used to visualize the captured buffer.
     */
    var record = function (onSilence, visualizer) {
      silenceCallback = onSilence;
      visualizationCallback = visualizer;
      start = Date.now();
      recording = true;
    };

    /**
     * Sets recording to false.
     */
    var stop = function () {
      recording = false;
    };

    /**
     * Posts "clear" message to the worker.
     */
    var clear = function () {
      stop();
      worker.postMessage({command: 'clear'});
    };

    /**
     * Sets the export callback and posts an "export" message to the worker.
     * @param {onExportComplete} callback - Called when the export is complete.
     * @param {sampleRate} The sample rate to use in the export.
     */
    var exportWAV = function (callback, sampleRate) {
      currCallback = callback;
      worker.postMessage({
        command: 'export',
        sampleRate: sampleRate
      });
    };

    /**
     * Checks the time domain data to see if the amplitude of the audio waveform is more than
     * the silence threshold. If it is, "noise" has been detected and it resets the start time.
     * If the elapsed time reaches the time threshold the silence callback is called. If there is a 
     * visualizationCallback it invokes the visualization callback with the time domain data.
     */
    var analyse = function () {
      analyser.fftSize = 2048;
      var bufferLength = analyser.fftSize;
      var dataArray = new Uint8Array(bufferLength);
      var amplitude = silenceDetectionConfig.amplitude;
      var time = silenceDetectionConfig.time;

      analyser.getByteTimeDomainData(dataArray);

      if (typeof visualizationCallback === 'function') {
        visualizationCallback(dataArray, bufferLength);
      }

      for (var i = 0; i < bufferLength; i++) {
        // Normalize between -1 and 1.
        var curr_value_time = (dataArray[i] / 128) - 1.0;
        if (curr_value_time > amplitude || curr_value_time < (-1 * amplitude)) {
          start = Date.now();
        }
      }
      var newtime = Date.now();
      var elapsedTime = newtime - start;
      if (elapsedTime > time) {
        silenceCallback();
      }
    };

    /**
     * The onaudioprocess event handler of the ScriptProcessorNode interface. It is the EventHandler to be
     * called for the audioprocess event that is dispatched to ScriptProcessorNode node types.
     * @param {AudioProcessingEvent} audioProcessingEvent - The audio processing event.
     */
    node.onaudioprocess = function (audioProcessingEvent) {
      if (!recording) {
        return;
      }
      worker.postMessage({
        command: 'record',
        buffer: [
          audioProcessingEvent.inputBuffer.getChannelData(0),
        ]
      });
      analyse();
    };

    var analyser = source.context.createAnalyser();
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;

    source.connect(analyser);
    analyser.connect(node);
    node.connect(source.context.destination);

    return {
      record: record,
      stop: stop,
      clear: clear,
      exportWAV: exportWAV
    };
  };

  /**
   * Audio recorder object. Handles setting up the audio context,
   * accessing the mike, and creating the Recorder object.
   */
  exports.audioRecorder = function () {

    /**
     * Creates an audio context and calls getUserMedia to request the mic (audio).
     */
    var requestDevice = function () {

      if (typeof audio_context === 'undefined') {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audio_context = new AudioContext();
      }

      return navigator.mediaDevices.getUserMedia({audio: true}).then(function (stream) {
        audio_stream = stream;
      });
    };

    var createRecorder = function (silenceDetectionConfig) {
      return recorder(audio_context.createMediaStreamSource(audio_stream), silenceDetectionConfig);
    };

    var audioContext = function () {
      return audio_context;
    };

    return {
      requestDevice: requestDevice,
      createRecorder: createRecorder,
      audioContext: audioContext
    };

  };
})();