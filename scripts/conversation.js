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
(function(lexaudio) {
  'use strict';

  function example() {

    var lexruntime, params,
      message = document.getElementById('message'),
      audioControl = lexaudio.audioControl(),
      renderer = lexaudio.renderer();

    var Conversation = function(messageEl) {
      var message, audioInput, audioOutput, currentState;

      this.messageEl = messageEl;

      this.renderer = renderer;

      this.messages = Object.freeze({
        PASSIVE: 'Passive...',
        LISTENING: 'Listening...',
        SENDING: 'Sending...',
        SPEAKING: 'Speaking...'
      });

      this.onSilence = function() {
        audioControl.stopRecording();
        currentState.state.renderer.clearCanvas();
        currentState.advanceConversation();
      };

      this.transition = function(conversation) {
        currentState = conversation;
        var state = currentState.state;
        messageEl.textContent = state.message;
        if (state.message === state.messages.SENDING) {
          currentState.advanceConversation();
        } else if (state.message === state.messages.SPEAKING) {
          currentState.advanceConversation();
        }
      };

      this.advanceConversation = function() {
        currentState.advanceConversation();
      };

      currentState = new Initial(this);
    }

    var Initial = function(state) {
      this.state = state;
      state.message = state.messages.PASSIVE;
      this.advanceConversation = function() {
        state.renderer.prepCanvas();
        audioControl.startRecording(state.onSilence, state.renderer.visualizeAudioBuffer);
        state.transition(new Listening(state));
      }
    };

    var Listening = function(state) {
      this.state = state;
      state.message = state.messages.LISTENING;
      this.advanceConversation = function() {
        audioControl.exportWAV(function(blob) {
          state.audioInput = blob;
          state.transition(new Sending(state));
        });
      }
    };

    var Sending = function(state) {
      this.state = state;
      state.message = state.messages.SENDING;
      this.advanceConversation = function() {
        params.inputStream = state.audioInput;
        lexruntime.postContent(params, function(err, data) {
          if (err) {
            console.log(err, err.stack);
          } else {
            state.audioOutput = data;
            state.transition(new Speaking(state));
          }
        });
      }
    };

    var Speaking = function(state) {
      this.state = state;
      state.message = state.messages.SPEAKING;
      this.advanceConversation = function() {
        if (state.audioOutput.contentType === 'audio/mpeg') {
          audioControl.play(state.audioOutput.audioStream, function() {
            state.renderer.prepCanvas();
            audioControl.startRecording(state.onSilence, state.renderer.visualizeAudioBuffer);
            state.transition(new Listening(state));
          });
        } else if (state.audioOutput.dialogState === 'ReadyForFulfillment') {
          state.transition(new Initial(state));
        }
      }
    };

    audioControl.supportsAudio(function(supported) {
      if (supported) {
        var conversation = new Conversation(message);
        message.textContent = conversation.message;
        document.getElementById('audio-control').onclick = function() {
          params = {
            botAlias: '$LATEST',
            botName: document.getElementById('BOT').value,
            contentType: 'audio/x-l16; sample-rate=16000',
            userId: 'BlogPostTesting',
            accept: 'audio/mpeg'
          };
          lexruntime = new AWS.LexRuntime({
            region: 'us-east-1',
            credentials: new AWS.Credentials(document.getElementById('ACCESS_KEY_ID').value, document.getElementById('SECRET_KEY').value, null)
          });
          conversation.advanceConversation();
        };
      } else {
        message.textContent = 'Audio capture is not supported.';
      }
    });
  }
  lexaudio.example = example;
})(lexaudio);
