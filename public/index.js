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

    // Start Tracking
    setTimeout(function(){
      // Quick fix to get video working as-is
      var vid = document.getElementsByTagName("video")[0]
      vid.id = "video"
      startTracker()

    }, 2000)

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

  var tracker = new tracking.ObjectTracker('eye', 'mouth');
  tracker.setInitialScale(4);
  tracker.setStepSize(2);
  tracker.setEdgesDensity(0.1);

  tracking.track('#video', tracker, { camera: true });

  tracker.on('track', function(event) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    event.data.forEach(function(rect) {
      context.strokeStyle = '#a64ceb';
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
      context.font = '11px Helvetica';
      context.fillStyle = "#fff";
      context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
      context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
    });
  });

  var gui = new dat.GUI();
  gui.add(tracker, 'edgesDensity', 0.1, 0.5).step(0.01);
  gui.add(tracker, 'initialScale', 1.0, 10.0).step(0.1);
  gui.add(tracker, 'stepSize', 1, 5).step(0.1);
};
