var assert = require('assert');
var helper = require('./helper.js');
var LexAudio = helper.LexAudio;
var conversation;

describe('LexAudio.conversation', function () {
  describe('Initialize Client', function () {
    before(function () {
      conversation = new LexAudio.conversation();
    });
    it('should be initialized', function () {
      expect(conversation).not.to.be.null;
      expect(conversation).not.to.be.undefined;
    });
    it('should be an instance of Object', function () {
      expect(conversation).to.be.an.instanceof(Object);
    });
  });
  describe('Client invokes error handler with invalid input', function () {
    before(function () {
    });
    it('must provide a bot name', function () {
      conversation = new LexAudio.conversation(null,
        function (state) {},
        function (data) {},
        function (error) {
          assert.strictEqual(error, 'A Bot name must be provided.')
        });
    });
    it('must provide credential configuration', function () {
      conversation = new LexAudio.conversation({lexConfig: {botName:'foo'}},
        function (state) {},
        function (data) {},
        function (error) {
          assert.strictEqual(error, 'AWS Credentials must be provided.')
        });
    });
    it('must provide region configuration', function () {
      AWS.config.credentials = {};
      conversation = new LexAudio.conversation({lexConfig: {botName:'foo'}},
        function (state) {},
        function (data) {},
        function (error) {
          assert.strictEqual(error, 'A Region value must be provided.')
        });
    });
  });
  describe('Client initializes with default values', function () {
    it('accept is defaulted to "audio/mpeg"', function () {
      conversation = new LexAudio.conversation({lexConfig: {botName:'foo'}},
        function (state) {},
        function (data) {},
        function (error) {});
      assert.strictEqual(conversation.config.lexConfig.accept, 'audio/mpeg');
    });
    it('botAlias is defaulted to "$LATEST"', function () {
      conversation = new LexAudio.conversation({lexConfig: {botName:'foo'}},
        function (state) {},
        function (data) {},
        function (error) {});
      assert.strictEqual(conversation.config.lexConfig.botAlias, '$LATEST');
    });
    it('contentType is defaulted to "audio/x-l16; sample-rate=16000"', function () {
      conversation = new LexAudio.conversation({lexConfig: {botName:'foo'}},
        function (state) {},
        function (data) {},
        function (error) {});
      assert.strictEqual(conversation.config.lexConfig.contentType, 'audio/x-l16; sample-rate=16000');
    });
    it('userId is defaulted to "userId"', function () {
      conversation = new LexAudio.conversation({lexConfig: {botName:'foo'}},
        function (state) {},
        function (data) {},
        function (error) {});
      assert.strictEqual(conversation.config.lexConfig.userId, 'userId');
    });
    it('silenceDetection is defaulted to "true"', function () {
      conversation = new LexAudio.conversation({lexConfig: {botName:'foo'}},
        function (state) {},
        function (data) {},
        function (error) {});
      assert(conversation.config.silenceDetection == true);
    });

  });

});