/* 
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/* globals AudioContext  */
/* globals lexaudio  */
(function(lexaudio) {
  'use strict';

  var audio_context, audio_stream, worker = new Worker('scripts/worker.js');

  /**
   * The Recorder object. Sets up the onaudioprocess callback and communicates
   * with the web worker to perform audion actions.
   */
  var recorder = function(source) {

    var recording = false,
      initialized = false,
      currCallback, start, silenceCallback, visualizationCallback;

    // Create a ScriptProcessorNode with a bufferSize of 4096 and a single input and output channel
    var node = source.context.createScriptProcessor(4096, 1, 1);

    worker.onmessage = function(message) {
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
    var record = function(onSilence, visualizer) {
      silenceCallback = onSilence;
      visualizationCallback = visualizer;
      start = Date.now();
      recording = true;
    };

    /**
     * Sets recording to false.
     */
    var stop = function() {
      recording = false;
    };

    /**
     * Posts "clear" message to the worker.
     */
    var clear = function() {
      worker.postMessage({ command: 'clear' });
    };

    /**
     * Sets the export callback and posts an "export" message to the worker.
     * @param {onExportComplete} callback - Called when the export is complete.
     */
    var exportWAV = function(callback) {
      currCallback = callback;
      worker.postMessage({
        command: 'export'
      });
    };

    /**
     * Checks the time domain data to see if the amplitude of the sound waveform is more than
     * 0.01 or less than -0.01. If it is, "noise" has been detected and it resets the start time.
     * If the elapsed time reaches 1.5 seconds the silence callback is called.
     */
    var startSilenceDetection = function() {
      analyser.fftSize = 2048;
      var bufferLength = analyser.fftSize;
      var dataArray = new Uint8Array(bufferLength);

      analyser.getByteTimeDomainData(dataArray);

      if (typeof visualizationCallback === 'function') {
        visualizationCallback(dataArray, bufferLength);
      }

      var curr_value_time = (dataArray[0] / 128) - 1.0;

      if (curr_value_time > 0.01 || curr_value_time < -0.01) {
        start = Date.now();
      }
      var newtime = Date.now();
      var elapsedTime = newtime - start;
      if (elapsedTime > 1500) {
        silenceCallback();
      }
    };

    /**
     * The onaudioprocess event handler of the ScriptProcessorNode interface. It is the EventHandler to be 
     * called for the audioprocess event that is dispatched to ScriptProcessorNode node types. 
     * @param {AudioProcessingEvent} audioProcessingEvent - The audio processing event.
     */
    node.onaudioprocess = function(audioProcessingEvent) {
      if (!recording) {

        return;
      }

      worker.postMessage({
        command: 'record',
        buffer: [
          audioProcessingEvent.inputBuffer.getChannelData(0),
        ]
      });
      startSilenceDetection();
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
  lexaudio.audioRecorder = function() {
    /**
     * Creates an audio context and calls getUserMedia to request the mic (audio).
     * If the user denies access to the microphone, the returned Promise rejected 
     * with a PermissionDeniedError
     * @returns {Promise} 
     */
    var requestDevice = function() {

      if (typeof audio_context === 'undefined') {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audio_context = new AudioContext();
      }

      return navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) { audio_stream = stream; });
    };

    var createRecorder = function() {
      return recorder(audio_context.createMediaStreamSource(audio_stream, worker));
    };

    return {
      requestDevice: requestDevice,
      createRecorder: createRecorder
    };

  };
})(lexaudio);
