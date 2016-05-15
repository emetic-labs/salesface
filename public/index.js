var conversationsClient;
var activeConversation;
var previewMedia;
var identity;

// Check for WebRTC
if (!navigator.webkitGetUserMedia && !navigator.mozGetUserMedia) {
    alert('WebRTC is not available in your browser.');
}

$.getJSON('/token', function(data) {
    identity = data.identity;
    var accessManager = new Twilio.AccessManager(data.token);

    // Check the browser console to see your generated identity. 
    // Send an invite to yourself if you want! 
    console.log(identity);

    // Create a Conversations Client and connect to Twilio
    conversationsClient = new Twilio.Conversations.Client(accessManager);
    conversationsClient.listen().then(clientConnected, function (error) {
        log('Could not connect to Twilio: ' + error.message);
    });
});

// Successfully connected!
function clientConnected() {
    document.getElementById('invite-controls').style.display = 'block';
    log("Welcome, " + conversationsClient.identity + "!");

    conversationsClient.on('invite', function (invite) {
        log('Incoming invite from: ' + invite.from);
        invite.accept().then(conversationStarted);
    });

    // Bind button to create conversation
    document.getElementById('button-invite').onclick = function () {
        var inviteTo = document.getElementById('invite-to').value;
        if (activeConversation) {
            // Add a participant
            activeConversation.invite(inviteTo);
            } else {
            // Create a conversation
            var options = {};
            if (previewMedia) {
                options.localMedia = previewMedia;
            }
            conversationsClient.inviteToConversation(inviteTo, options).then(conversationStarted, function (error) {
                log('Unable to create conversation');
                console.error('Unable to create conversation', error);
            });
        }
    };
}

// Conversation is live
function conversationStarted(conversation) {
    log('In an active Conversation');
    activeConversation = conversation;
    // Draw local video, if not already previewing
    if (!previewMedia) {
        conversation.localMedia.attach('#local-media');
    }

    // When a participant joins, draw their video on screen
    conversation.on('participantConnected', function (participant) {
        log("Participant '" + participant.identity + "' connected");
        participant.media.attach('#remote-media');
        // Start Tracking
        setTimeout(function(){
            // Quick fix to get video working as-is
            var vid = document.getElementsByTagName("video")[1]
            vid.id = "video"
            startTracker()

        }, 1500)
    });

    // When a participant disconnects, note in log
    conversation.on('participantDisconnected', function (participant) {
        log("Participant '" + participant.identity + "' disconnected");
    });

    // When the conversation ends, stop capturing local video
    conversation.on('ended', function (conversation) {
        log("Connected to Twilio. Listening for incoming Invites as '" + conversationsClient.identity + "'");
        conversation.localMedia.stop();
        conversation.disconnect();
        activeConversation = null;
    });
}

//  Local video preview
document.getElementById('button-preview').onclick = function () {
    if (!previewMedia) {
        previewMedia = new Twilio.Conversations.LocalMedia();
        Twilio.Conversations.getUserMedia().then(
        function (mediaStream) {
            previewMedia.addStream(mediaStream);
            previewMedia.attach('#local-media');

            // // Quick fix to get video working as-is
            // var vid = document.getElementsByTagName("video")[0]
            // vid.id = "video"
            // vid.addEventListener('canplaythrough', function(e){
            //   startTracker()
            // })

        },
        function (error) {
            console.error('Unable to access local media', error);
            log('Unable to access Camera and Microphone');
        });
    };

};

// Activity log
function log(message) {
    document.getElementById('log-content').innerHTML = message;
}

// Tracking
function startTracker() {
  var video = document.getElementById('video');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');

  var objects = new tracking.ObjectTracker(['face', 'eye', 'mouth']);

  objects.setInitialScale(1.5);
  objects.setStepSize(2);
  objects.setEdgesDensity(0.1);

  tracking.track('#video', objects);

  // Set up advertisement management
  var ads = [
      new AdDisplayer(canvas, 'ad_1'),
      new AdDisplayer(canvas, 'ad_2'),
      new AdDisplayer(canvas, 'ad_3')
    ]
  ;
  // End set up advertisment management

  objects.on('track', function(event) {

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (event.data.length > 0) {
        var rectCount = 0;

        event.data.forEach(function(rect) {
          // Update ad display
          if (rectCount < ads.length) {
            ads[rectCount].display(rect.x, rect.y, rect.width, rect.height);
            rectCount++;
          }
        });

        if (event.data.length < ads.length) {
          for (var i = rectCount, len = ads.length; i < len; i++) {
            ads[i].hide();
          }
        }
      }

      // Shuffle the ads so different ones get shown/hidden
      ads.unshift(ads.pop());
  });

};
