import Peer from 'peerjs';

export class ChatManager {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.onMessageCallback = null;
    this.onStatusChangeCallback = null;
    this.myId = null;
  }

  initialize(onIdGenerated) {
    console.log("ChatManager: Initializing Peer...");
    try {
      // Use default PeerJS server (public)
      this.peer = new Peer(null, {
        debug: 2
      });

      this.peer.on('open', (id) => {
        this.myId = id;
        console.log('ChatManager: My Peer ID:', id);
        if (onIdGenerated) onIdGenerated(id);
        this.updateStatus('online');
      });

      this.peer.on('connection', (conn) => {
        console.log("ChatManager: Incoming connection");
        this.handleConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('ChatManager: Peer error:', err);
        this.updateStatus('error');
      });
    } catch (err) {
      console.error("ChatManager: Failed to create Peer instance:", err);
      this.updateStatus('error');
    }
  }

  connect(remoteId) {
    if (!this.peer) return;
    const conn = this.peer.connect(remoteId);
    this.handleConnection(conn);
  }

  handleConnection(conn) {
    if (this.conn) {
      this.conn.close();
    }
    this.conn = conn;
    this.updateStatus('connecting');

    this.conn.on('open', () => {
      this.updateStatus('connected');
    });

    this.conn.on('data', (data) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(data);
      }
    });

    this.conn.on('close', () => {
      this.updateStatus('disconnected');
      this.conn = null;
    });
  }

  sendMessage(msg) {
    if (this.conn && this.conn.open) {
      this.conn.send(msg);
    } else {
      console.warn('Connection not open');
    }
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  onStatusChange(callback) {
    this.onStatusChangeCallback = callback;
  }

  updateStatus(status) {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  destroy() {
    if (this.peer) {
      this.peer.destroy();
    }
  }
}

export const chatManager = new ChatManager();
