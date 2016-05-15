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
    log("Connected to Twilio. Listening for incoming Invites as '" + conversationsClient.identity + "'");

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
        },
        function (error) {
            console.error('Unable to access local media', error);
            log('Unable to access Camera and Microphone');
        }).then(
        function() {
            
            // Just playing around with face detection stuff
            
            console.log('+ + + + +');

            // On a canvas element created from the video.

            var 
                vCanv = document.getElementById('test_canvas'),
                vCtx = vCanv.getContext('2d'),
                dCanv = document.getElementById('display_canvas'),
                dCtx = dCanv.getContext('2d'),
                mediaContainer = document.getElementById('local-media'),
                videoEl = mediaContainer.getElementsByTagName('video')[0]
            ;
            
            videoEl.addEventListener('canplaythrough', function(e) {
                
                console.log('canplaythrough fired!')

                setInterval(function() {
                    vCtx.drawImage(videoEl, 0, 0, 270, 202);                    

                    $(vCanv).faceDetection({
                        complete: function(faces) {
                            console.log('found some faces');
                            console.log(faces);

                            if (faces && faces.length > 0) {
                                console.log('there is a face in faces');

                                dCtx.clearRect(0,0, dCanv.width, dCanv.height);

                                for (var i = 0, len = faces.length; i < len; i++) {
                                    dCtx.strokeRect(faces[i].x*2, faces[i].y*2, faces[i].width*2, faces[i].height*2);
                                }
                            }                            
                        }
                    })

                }, 200)


                    // setInterval(function() {
                //     console.log('drawing an image...');
                //     ctx.drawImage(videoEl, 0, 0);

                //     // $(canv).faceDetection({
                //     //     complete: function(faces) {
                //     //         console.log('found some faces');
                //     //         console.log(faces);

                //     //         if (faces && faces.length > 0) {
                //     //             console.log('there is a face in faces');
                //     //             ctx.strokeRect(faces[0].x, faces[0].y, faces[0].width, faces[0].height);
                //     //         }
                //     //     }
                //     // })

                // }, 500)

            });

            console.log(videoEl);

            // On a static image. It worked. It found a face.

            // var j = document.getElementById('test_image');
            // $(j).faceDetection({
            //     complete: function(faces) {
            //         console.log('found some faces');
            //         console.log(faces);
            //     }
            // })

            // Straight from the video element. It didn't work. It threw an exception.

            // console.log(previewMedia)
            // var mediaContainer = document.getElementById('local-media');
            // var videoEl = mediaContainer.getElementsByTagName('video')[0];
            // console.log(videoEl);
            
            // $(videoEl).faceDetection({
            //     complete: function(faces) {
            //         console.log('found some faces!');
            //         console.log(faces);
            //     }
            // })
        })
        ;
    };
};

// Activity log
function log(message) {
    document.getElementById('log-content').innerHTML = message;
}
