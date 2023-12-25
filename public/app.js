const socket = io();
let localStream;
let remoteStream;
let peerConnection;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');
const hangupButton = document.getElementById('hangupButton');

// Get local user media
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;
        startButton.disabled = false;
    })
    .catch((error) => {
        console.error('Error accessing camera:', error);
    });

// Handle button clicks
startButton.addEventListener('click', startCall);
hangupButton.addEventListener('click', hangUp);

function startCall() {
    // Create a peer connection
    peerConnection = new RTCPeerConnection();

    // Add the local stream to the peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Set up event handlers for the peer connection
    peerConnection.onicecandidate = handleIceCandidate;
    peerConnection.ontrack = handleTrack;

    // Create an offer to send to the other user
    peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
            // Send the offer to the other user
            socket.emit('offer', { offer: peerConnection.localDescription });
        });

    startButton.disabled = true;
    hangupButton.disabled = false;
}

function handleIceCandidate(event) {
    // Send any ice candidates to the other user
    if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate });
    }
}

function handleTrack(event) {
    // Receive and display the remote stream
    remoteStream = event.streams[0];
    remoteVideo.srcObject = remoteStream;
}

function hangUp() {
    // Close the peer connection
    peerConnection.close();
    peerConnection = null;

    // Stop local video stream
    localStream.getTracks().forEach(track => track.stop());

    // Reset UI
    startButton.disabled = false;
    hangupButton.disabled = true;

    // Clear video elements
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}

// Handle offers from other users
socket.on('offer', (data) => {
    // Create a peer connection
    peerConnection = new RTCPeerConnection();

    // Add the local stream to the peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Set up event handlers for the peer connection
    peerConnection.onicecandidate = handleIceCandidate;
    peerConnection.ontrack = handleTrack;

    // Set the remote description from the offer
    peerConnection.setRemoteDescription(data.offer)
        .then(() => peerConnection.createAnswer())
        .then(answer => peerConnection.setLocalDescription(answer))
        .then(() => {
            // Send the answer to the other user
            socket.emit('answer', { answer: peerConnection.localDescription });
        });
});

// Handle answers from other users
socket.on('answer', (data) => {
    // Set the remote description from the answer
    peerConnection.setRemoteDescription(data.answer);
});

// Handle ICE candidates from other users
socket.on('ice-candidate', (data) => {
    // Add the ICE candidate to the peer connection
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
});

// Handle disconnection
socket.on('disconnect', () => {
    console.log('Disconnected from server');
    // You may want to handle UI updates or reconnection logic here
});
