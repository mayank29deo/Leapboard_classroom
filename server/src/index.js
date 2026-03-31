const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// In-memory session store
// sessions[code] = { teacherSocketId, teacherName, children: Map(socketId -> { name, emotion, bravePoints }), startTime }
const sessions = {};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// REST: create session
app.post('/api/session/create', (req, res) => {
  let code = generateCode();
  while (sessions[code]) code = generateCode();

  sessions[code] = {
    teacherSocketId: null,
    teacherName: null,
    children: new Map(),
    parents: new Map(),
    startTime: Date.now(),
    alertLog: [],
  };

  res.json({ code });
});

// REST: validate session exists
app.get('/api/session/:code', (req, res) => {
  const session = sessions[req.params.code.toUpperCase()];
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ exists: true });
});

// REST: health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  let currentSession = null;
  let currentRole = null;
  let currentName = null;

  // ── JOIN ──────────────────────────────────────────────────────────────────
  socket.on('join:session', ({ code, role, name, childName }) => {
    const upperCode = code.toUpperCase();
    const session = sessions[upperCode];
    if (!session) {
      socket.emit('error:session', { message: 'Session not found. Check the code and try again.' });
      return;
    }

    currentSession = upperCode;
    currentRole = role;
    currentName = name;

    socket.join(`session:${upperCode}`);

    if (role === 'teacher') {
      session.teacherSocketId = socket.id;
      session.teacherName = name;
      socket.emit('joined:teacher', {
        code: upperCode,
        children: [...session.children.values()],
      });
    } else if (role === 'child') {
      session.children.set(socket.id, {
        socketId: socket.id,
        name,
        emotion: null,
        bravePoints: 0,
        stars: 0,
        joinedAt: Date.now(),
      });

      socket.emit('joined:child', { code: upperCode });

      // Notify teacher
      if (session.teacherSocketId) {
        io.to(session.teacherSocketId).emit('child:joined', {
          socketId: socket.id,
          name,
          emotion: null,
        });
      }
    } else if (role === 'parent') {
      const trackedChild = childName || name;
      session.parents.set(socket.id, { socketId: socket.id, childName: trackedChild });
      socket.emit('joined:parent', { code: upperCode, childName: trackedChild });
    }
  });

  // ── FEELING CORNER CHECK-IN ───────────────────────────────────────────────
  socket.on('checkin:emotion', ({ emotion }) => {
    if (!currentSession || currentRole !== 'child') return;
    const session = sessions[currentSession];
    if (!session) return;

    const child = session.children.get(socket.id);
    if (child) {
      child.emotion = emotion;
      session.children.set(socket.id, child);
    }

    // Notify teacher
    if (session.teacherSocketId) {
      io.to(session.teacherSocketId).emit('child:checkin', {
        socketId: socket.id,
        name: currentName,
        emotion,
      });
    }
  });

  // ── DISTRESS DETECTED (from child's audio engine) ─────────────────────────
  socket.on('distress:detected', ({ confidence }) => {
    if (!currentSession || currentRole !== 'child') return;
    const session = sessions[currentSession];
    if (!session) return;

    const overlayTypes = ['balloons', 'stars', 'mascot', 'badge', 'rainbow'];
    const overlayType = overlayTypes[Math.floor(Math.random() * overlayTypes.length)];
    const timestamp = new Date().toISOString();

    // Fire overlay on THIS child's screen only
    socket.emit('trigger:overlay', {
      type: overlayType,
      initiator: 'auto',
      duration: 4000,
    });

    // Alert teacher
    if (session.teacherSocketId) {
      io.to(session.teacherSocketId).emit('alert:distress', {
        childSocketId: socket.id,
        childName: currentName,
        confidence,
        timestamp,
        overlayFired: overlayType,
      });
    }

    // Alert parents watching this child
    for (const [, parent] of session.parents) {
      if (parent.childName === currentName) {
        io.to(parent.socketId).emit('child:distress', {
          childName: currentName,
          timestamp,
        });
      }
    }

    // Log alert
    session.alertLog.push({
      type: 'distress_auto',
      childName: currentName,
      childSocketId: socket.id,
      overlayType,
      timestamp,
      initiator: 'auto',
    });

    // Award brave point when child calms (after 8 seconds)
    setTimeout(() => {
      const child = session.children.get(socket.id);
      if (child) {
        child.bravePoints = (child.bravePoints || 0) + 1;
        session.children.set(socket.id, child);
        socket.emit('award:brave_point', { total: child.bravePoints });
        if (session.teacherSocketId) {
          io.to(session.teacherSocketId).emit('child:brave_point', {
            childSocketId: socket.id,
            childName: currentName,
            total: child.bravePoints,
          });
        }
      }
    }, 8000);
  });

  // ── TEACHER: INDIVIDUAL TRIGGER ──────────────────────────────────────────
  socket.on('trigger:individual', ({ childSocketId, overlayType }) => {
    if (!currentSession || currentRole !== 'teacher') return;
    const session = sessions[currentSession];
    if (!session) return;

    io.to(childSocketId).emit('trigger:overlay', {
      type: overlayType || 'balloons',
      initiator: 'teacher',
      duration: 4000,
    });

    const child = session.children.get(childSocketId);
    const childName = child ? child.name : 'Unknown';
    const timestamp = new Date().toISOString();

    session.alertLog.push({
      type: 'manual_individual',
      childName,
      childSocketId,
      overlayType: overlayType || 'balloons',
      timestamp,
      initiator: 'teacher',
    });

    socket.emit('trigger:confirmed', { childSocketId, childName, overlayType });
  });

  // ── TEACHER: BROADCAST TRIGGER ───────────────────────────────────────────
  socket.on('trigger:broadcast', ({ overlayType }) => {
    if (!currentSession || currentRole !== 'teacher') return;
    const session = sessions[currentSession];
    if (!session) return;

    const timestamp = new Date().toISOString();

    // Send to all children in session
    for (const [childSocketId] of session.children) {
      io.to(childSocketId).emit('trigger:overlay', {
        type: overlayType || 'confetti',
        initiator: 'broadcast',
        duration: 5000,
      });
    }

    session.alertLog.push({
      type: 'broadcast',
      overlayType: overlayType || 'confetti',
      timestamp,
      initiator: 'teacher',
    });

    socket.emit('broadcast:confirmed', { overlayType, timestamp });
  });

  // ── TEACHER: AWARD STAR ──────────────────────────────────────────────────
  socket.on('award:star', ({ childSocketId }) => {
    if (!currentSession || currentRole !== 'teacher') return;
    const session = sessions[currentSession];
    if (!session) return;

    const child = session.children.get(childSocketId);
    if (child) {
      child.stars = (child.stars || 0) + 1;
      session.children.set(childSocketId, child);
      io.to(childSocketId).emit('award:star', { total: child.stars });
    }
  });

  // ── PARENT: PANIC BUTTON ─────────────────────────────────────────────────
  socket.on('parent:panic', ({ childName }) => {
    if (!currentSession || currentRole !== 'parent') return;
    const session = sessions[currentSession];
    if (!session) return;

    if (session.teacherSocketId) {
      io.to(session.teacherSocketId).emit('alert:parent_panic', {
        childName,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ── REQUEST SESSION STATE (teacher reconnect) ────────────────────────────
  socket.on('session:state', () => {
    if (!currentSession) return;
    const session = sessions[currentSession];
    if (!session) return;

    socket.emit('session:state:response', {
      children: [...session.children.values()],
      alertLog: session.alertLog.slice(-20),
    });
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (!currentSession) return;
    const session = sessions[currentSession];
    if (!session) return;

    if (currentRole === 'child') {
      session.children.delete(socket.id);
      if (session.teacherSocketId) {
        io.to(session.teacherSocketId).emit('child:left', {
          socketId: socket.id,
          name: currentName,
        });
      }
    } else if (currentRole === 'teacher') {
      session.teacherSocketId = null;
    } else if (currentRole === 'parent') {
      session.parents.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Leapboard server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Run this to fix it: lsof -ti:${PORT} | xargs kill -9\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
