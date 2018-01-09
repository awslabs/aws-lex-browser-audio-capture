var assert = require('assert');
var helper = require('./helper.js');
var LexAudio = helper.LexAudio;
var audioControl;
var UNSUPPORTED = 'Audio is not supported';

describe('LexAudio.audioControl', function () {
  describe('Initialize Client', function () {
    before(function () {
      audioControl = new LexAudio.audioControl({});
    });
    it('should be initialized', function () {
      expect(audioControl).not.to.be.null;
      expect(audioControl).not.to.be.undefined;
    });
    it('should be an instance of Object', function () {
      expect(audioControl).to.be.an.instanceof(Object);
    });
  });
  describe('Supports Audio', function () {
    before(function () {
      audioControl = new LexAudio.audioControl({});
    });
    it('returns true or false for audio support', function () {
      audioControl.supportsAudio(function (supported) {
        expect(typeof supported).to.equal('boolean');
      });
    });
    it('returns when no callback is provided', function () {
      expect(audioControl.supportsAudio()).to.be.undefined;
    });
  });
  describe('Start audio capture', function () {
    before(function () {
      audioControl = new LexAudio.audioControl({});
    });
    it('handles null input for visualizer callback', function () {
      audioControl.supportsAudio(function (supported) {
        if (supported) {
          expect(audioControl.startRecording(function () {
          })).to.be.undefined;
          audioControl.stopRecording();
        } else {
          assert.throws(audioControl.startRecording, Error, UNSUPPORTED);
        }

      });
    });

    it('handles null input for silence detection config', function () {
      audioControl.supportsAudio(function (supported) {
        if (supported) {
          expect(audioControl.startRecording(function(){}, function(){}, null)).to.be.undefined;
          audioControl.stopRecording();
        } else {
          assert.throws(audioControl.startRecording, Error, UNSUPPORTED);
        }
      });
    });

    it('handles null input for silence callback', function () {
      audioControl.supportsAudio(function (supported) {
        if (supported) {
          expect(audioControl.startRecording()).to.be.undefined;
          audioControl.stopRecording();
        } else {
          assert.throws(audioControl.startRecording, Error, UNSUPPORTED);
        }
      });
    });
  });
  describe('Stop audio capture', function () {
    before(function () {
      audioControl = new LexAudio.audioControl({});
    });
    it('throws exception when audio is not supported', function () {
      audioControl.supportsAudio(function (supported) {
        if (supported) {
          expect(audioControl.stopRecording()).to.be.undefined;
        } else {
          assert.throws(audioControl.stopRecording, Error, UNSUPPORTED);
        }
      });
    });
  });
  describe('Export WAV', function () {
    before(function () {
      audioControl = new LexAudio.audioControl({});
    });
    it('throws exception when audio is not supported, handles invalid input', function () {
      audioControl.supportsAudio(function (supported) {
        if (supported) {
          assert.throws(audioControl.exportWAV, Error, 'You must pass a callback function to export.');
        } else {
          assert.throws(audioControl.exportWAV, Error, UNSUPPORTED);
        }
      });
    });
  });
  describe('Stop', function () {
    before(function () {
      audioControl = new LexAudio.audioControl({});
    });
    it('gracefully handles undefined source', function () {
      expect(audioControl.stop()).to.be.undefined;
    });
  });

});