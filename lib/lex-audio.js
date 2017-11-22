/**
 * @module LexAudio
 * @description The global namespace for Amazon Lex Audio
 */
global.LexAudio = global.LexAudio || {};
global.LexAudio.audioControl = require('./control.js').audioControl;
global.LexAudio.conversation = require('./conversation.js').conversation;
module.exports = global.LexAudio;