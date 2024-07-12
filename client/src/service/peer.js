class PeerService {
  constructor() {
    this.peers = {};
  }

  getPeer(userId) {
    if (!this.peers[userId]) {
      this.peers[userId] = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });
    }
    return this.peers[userId];
  }


  async getAnswer(userId, offer) {
    const peer = this.getPeer(userId);
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(new RTCSessionDescription(answer));
    return answer;
  }

  async setRemoteDescription(userId, ans) {
    const peer = this.getPeer(userId);
    await peer.setRemoteDescription(new RTCSessionDescription(ans));
  }


  closeConnection(userId) {
    if (this.peers[userId]) {
      this.peers[userId].close();
      delete this.peers[userId];
    }
  }
  async getOffer(userId) {
    const peer = this.getPeer(userId);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(new RTCSessionDescription(offer));
    return offer;
  }
}

export default new PeerService();