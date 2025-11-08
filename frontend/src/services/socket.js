// ILAGAY MO ITO SA: frontend/src/services/socket.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io('http://localhost:5000', {
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinOrderRoom(orderId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('joinOrderRoom', orderId);
    }
  }

  leaveOrderRoom(orderId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leaveOrderRoom', orderId);
    }
  }

  onRiderLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on('riderLocationUpdate', callback);
    }
  }

  offRiderLocationUpdate(callback) {
    if (this.socket) {
      this.socket.off('riderLocationUpdate', callback);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();