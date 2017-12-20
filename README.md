# LexAudio
An example of using the Amazon Lex JavaScript SDK to send and receive audio from the Lex PostContent API. Demonstrates how to capture an audio device, record audio, convert the audio into a format that Lex will recognize, and play the response. All from a web browser.

A companion blog post to the example code can be found [here](https://aws.amazon.com/blogs/ai/capturing-voice-input-in-a-browser/).

## Setup
1. Download and include the AWS JavaScript SDK: 
   * http://aws.amazon.com/sdk-for-browser/
2. Download and include the Amazon Lex Audio SDK for JavaScript:
   * /dist/aws-lex-audio.min.js
  
```
    <script src="/js/aws-sdk.min.js"></script>
    <script src="/js/aws-lex-audio.min.js"></script>
```
## Usage
### Audio control
The Amazon Lex `audioControl` object provides a convenient API for acquiring a recording device, recording, exporting, and playing back audio. 
#### Create the audio control
``` JavaScript
var audioControl = new LexAudio.audioControl();
```

#### Record audio
``` JavaScript
audioControl.startRecording();
```

#### Stop recording
``` JavaScript
audioControl.stopRecording();
```

#### Export and playback
``` JavaScript
audioControl.exportWAV(function(blob){
  audioControl.play(blob);
});
```
You can specify the export sample rate in Hz. 16000 Hz is the default if no value is provided. Note, the Amazon Lex Runtime API accepts 16kHz or 8kHz.
``` JavaScript
audioControl.exportWAV(function(blob){
  audioControl.play(blob);
}, 44100);
```

### Conversation
The Amazon Lex `conversation` object provides an abstraction on top of the Amazon Lex Runtime PostContent API and makes it easy to manage conversation state (Passive, Listening, Recording, Speaking) and perform silence detection. It expects `AWS.config.region` and `AWS.config.credentials` to be set.
#### Set the AWS configuration `region` and `credentials` values  
```
AWS.config.region = 'us-east-1';
AWS.config.credentials = ...;
```
#### Create the `conversation` object 
```
var conversation = new LexAudio.conversation({lexConfig:{botName: 'BOT_NAME'}}, 
function (state) { // Called on each state change.
}, 
function (data) { // Called with the LexRuntime.PostContent response.
},
function (error){ // Called on error.
},
function (timeDomain) { // Called with audio time domain data (useful for rendering the recorded audio levels).
});
```
#### Start the conversation
```
conversation.advanceConversation();
```
Advances the conversation from Passive to Listening. By default, silence detection will be used to transition to Sending and the conversation will continue Listenting, Sending, and Speaking until the Dialog state is [Fulfilled](http://docs.aws.amazon.com/lex/latest/dg/API_runtime_PostContent.html#API_runtime_PostContent_ResponseSyntax), [ReadyForFulfillment](http://docs.aws.amazon.com/lex/latest/dg/API_runtime_PostContent.html#API_runtime_PostContent_ResponseSyntax), or [Failed](http://docs.aws.amazon.com/lex/latest/dg/API_runtime_PostContent.html#API_runtime_PostContent_ResponseSyntax). Here are the conversation state transitions. 

```
                                       onPlaybackComplete and ElicitIntent | ConfirmIntent | ElicitSlot
                                         +--------------------------------------------------------+
                                         |                                                        |
   +---------+                     +-----v-----+                     +---------+            +----------+
   |         | advanceConversation |           | advanceConversation |         | onResponse |          |
   | Passive +-------------------> | Listening +-------------------> | Sending +----------> | Speaking |
   |         |                     |           | onSilence           |         |            |          |
   +----^----+                     +-----------+                     +---------+            +----------+
        |                                                                                         |
        +-----------------------------------------------------------------------------------------+
           onPlaybackComplete and Fulfilled | ReadyForFulfillment | Failed | no silence detection
```

Setting silence detection to false allows you to manually transition out of the Passive and Listening states by calling `conversation.advanceConversation()`.

```
var conversation = new LexAudio.conversation({silenceDetection: false, lexConfig:{botName: 'BOT_NAME'}}, ... );
```

You can pass silence detection configuration values to tune the silence detection algorithm. The `time` value is the amount of silence to wait for (in milliseconds). The `amplitude` is a threshold value (between 1 and -1). Above the `amplitude` threshold value is considered "noise". Below the `amplitude` threshold value is considered "silence". Here is the complete configuration object. Everything except `botName` has a default value.

```
{
  silenceDetection: true, 
  silenceDetectionConfig: {
    time: 1500,
    amplitude: 0.2
  },
  lexConfig:{
    botName: 'BOT_NAME',
    botAlias: '$LATEST',
    contentType: 'audio/x-l16; sample-rate=16000',
    userId: 'userId',
    accept: 'audio/mpeg'
  }
}
```
## Browser support
This example code has been tested in the latest versions of:
* Chrome
* Firefox
* Safari (on macOS)
