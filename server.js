const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { 
  cors: { origin: "*" },
  transports: ['websocket']
});

app.use(express.static('public'));
app.use(express.json());

const sessions = new Map();

app.post('/api/register', (req, res) => {
  const { username } = req.body;
  const sessionId = crypto.randomBytes(16).toString('hex');
  const userId = crypto.randomBytes(8).toString('hex');
  
  sessions.set(sessionId, { userId, username, activeSockets: new Set() });
  res.json({ sessionId, userId });
});

app.get('/panels.html', (req, res) => 
  res.sendFile(path.join(__dirname, 'public', 'panels.html'))
);

app.get('/api/panels', (req, res) => {
  res.json(Array.from(sessions.values()));
});

io.on('connection', (socket) => {
  socket.on('join-session', (sessionId) => {
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      session.activeSockets.add(socket.id);
      socket.join(sessionId);
      socket.sessionId = sessionId;
    }
  });

  socket.on('screen-stream', (data) => {
    socket.to(socket.sessionId).emit('screen-update', data);
  });

  socket.on('control-command', (data) => {
    socket.to(socket.sessionId).emit('control-received', data);
  });

  socket.on('disconnect', () => {
    if (socket.sessionId) {
      const session = sessions.get(socket.sessionId);
      if (session) session.activeSockets.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Xeno on port ${PORT}`));
