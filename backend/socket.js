const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let ioInstance = null;

const extractToken = (socket) => {
  const authToken = socket.handshake?.auth?.token;
  const headerToken = socket.handshake?.headers?.authorization;
  const raw = authToken || headerToken || '';
  return String(raw).replace('Bearer ', '').trim();
};

const initializeSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      credentials: true
    }
  });

  ioInstance.use((socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = socket.user?.userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  return ioInstance;
};

const getIO = () => ioInstance;

module.exports = {
  initializeSocket,
  getIO
};