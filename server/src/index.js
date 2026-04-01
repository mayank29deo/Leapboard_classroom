const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// ── In-memory store ───────────────────────────────────────────────────────────
// sessions[code] = {
//   teacherSocketId, teacherName, teacherEmail,
//   children: Map(socketId -> { name, parentEmail, stars, bravePoints, joinedAt }),
//   parents:  Map(socketId -> { childName, email }),
//   alertLog: [],  startTime, endTime
// }
const sessions = {};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Helper: build leaderboard from session ────────────────────────────────────
function buildLeaderboard(session) {
  const rows = [...session.children.values()].map((c) => ({
    name:        c.name,
    parentEmail: c.parentEmail || null,
    stars:       c.stars       || 0,
    bravePoints: c.bravePoints || 0,
    totalScore:  (c.stars || 0) + (c.bravePoints || 0),
  }));

  // Sort by totalScore desc, then name asc
  rows.sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));

  // Assign rank badges — everyone gets at least "Super Participant"
  return rows.map((r, i) => ({
    ...r,
    rank: i + 1,
    badge: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : r.stars >= 3 ? '🌟' : r.bravePoints >= 2 ? '💜' : '⭐',
    title: i === 0 ? 'Champion'
         : i === 1 ? 'Star Performer'
         : i === 2 ? 'Rising Star'
         : r.stars >= 3 ? 'Shining Star'
         : r.bravePoints >= 2 ? 'Brave Heart'
         : 'Super Participant',
  }));
}

// ── Helper: generate HTML email for one child ─────────────────────────────────
function buildEmailHTML({ child, leaderboard, sessionCode, teacherName, sessionDate }) {
  const rank = leaderboard.find((r) => r.name === child.name);
  if (!rank) return null;

  const allRows = leaderboard.map((r) => `
    <tr style="background:${r.name === child.name ? '#FEF3C7' : 'white'}">
      <td style="padding:10px 14px;font-size:20px;text-align:center">${r.badge}</td>
      <td style="padding:10px 14px;font-weight:${r.name === child.name ? 700 : 400};color:#111">${r.name}${r.name === child.name ? ' ← you!' : ''}</td>
      <td style="padding:10px 14px;text-align:center;font-weight:700;color:#F59E0B">${r.stars} ⭐</td>
      <td style="padding:10px 14px;text-align:center;font-weight:700;color:#8B5CF6">${r.bravePoints} 💜</td>
      <td style="padding:10px 14px;text-align:center;color:#6B7280;font-size:13px">${r.title}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFF;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(99,102,241,0.12)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 28px;text-align:center">
      <div style="font-size:48px;margin-bottom:8px">🚀</div>
      <h1 style="margin:0;color:white;font-size:28px;font-weight:900;letter-spacing:-0.5px">Leapboard</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:15px">Class Report · ${sessionDate}</p>
    </div>

    <!-- Child hero card -->
    <div style="padding:28px 28px 0">
      <div style="background:linear-gradient(135deg,#FEF3C7,#FDE68A);border-radius:20px;padding:24px;text-align:center;border:2px solid #F59E0B22">
        <div style="font-size:52px;margin-bottom:6px">${rank.badge}</div>
        <h2 style="margin:0;font-size:26px;font-weight:900;color:#92400E">${rank.name}</h2>
        <p style="margin:6px 0 0;font-size:16px;color:#B45309;font-weight:600">${rank.title}</p>
        <div style="display:flex;justify-content:center;gap:24px;margin-top:16px">
          <div style="text-align:center">
            <div style="font-size:28px;font-weight:900;color:#F59E0B">${rank.stars}</div>
            <div style="font-size:12px;color:#92400E;margin-top:2px">Stars ⭐</div>
          </div>
          <div style="width:1px;background:#F59E0B44"></div>
          <div style="text-align:center">
            <div style="font-size:28px;font-weight:900;color:#8B5CF6">${rank.bravePoints}</div>
            <div style="font-size:12px;color:#7C3AED;margin-top:2px">Brave Points 💜</div>
          </div>
          <div style="width:1px;background:#F59E0B44"></div>
          <div style="text-align:center">
            <div style="font-size:28px;font-weight:900;color:#10B981">#${rank.rank}</div>
            <div style="font-size:12px;color:#065F46;margin-top:2px">Rank 🏆</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Leaderboard table -->
    <div style="padding:24px 28px">
      <h3 style="margin:0 0 14px;font-size:16px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em">
        Class Leaderboard
      </h3>
      <table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #F3F4F6">
        <thead>
          <tr style="background:#F9FAFB">
            <th style="padding:10px 14px;text-align:center;font-size:12px;color:#6B7280;font-weight:600"></th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;color:#6B7280;font-weight:600">NAME</th>
            <th style="padding:10px 14px;text-align:center;font-size:12px;color:#6B7280;font-weight:600">STARS</th>
            <th style="padding:10px 14px;text-align:center;font-size:12px;color:#6B7280;font-weight:600">BRAVE</th>
            <th style="padding:10px 14px;text-align:center;font-size:12px;color:#6B7280;font-weight:600">AWARD</th>
          </tr>
        </thead>
        <tbody>${allRows}</tbody>
      </table>
    </div>

    <!-- Encouragement -->
    <div style="padding:0 28px 28px">
      <div style="background:#EEF2FF;border-radius:16px;padding:18px 20px;text-align:center">
        <p style="margin:0;font-size:15px;color:#4338CA;font-weight:600">
          🌟 Every star is a step forward! Keep attending, keep answering, keep growing.
        </p>
        <p style="margin:10px 0 0;font-size:13px;color:#6366F1">
          See you in the next class! — ${teacherName} &amp; the Leapboard team
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#F9FAFB;padding:16px 28px;text-align:center;border-top:1px solid #F3F4F6">
      <p style="margin:0;font-size:12px;color:#9CA3AF">
        Class Code: <strong>${sessionCode}</strong> · Powered by Leapboard 🚀
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── REST: create session ──────────────────────────────────────────────────────
app.post('/api/session/create', (req, res) => {
  let code = generateCode();
  while (sessions[code]) code = generateCode();

  sessions[code] = {
    teacherSocketId: null,
    teacherName:     null,
    teacherEmail:    null,
    children:        new Map(),
    parents:         new Map(),
    startTime:       Date.now(),
    endTime:         null,
    alertLog:        [],
  };
  res.json({ code });
});

// ── REST: validate session ────────────────────────────────────────────────────
app.get('/api/session/:code', (req, res) => {
  const session = sessions[req.params.code.toUpperCase()];
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ exists: true });
});

// ── REST: get leaderboard ─────────────────────────────────────────────────────
app.get('/api/session/:code/leaderboard', (req, res) => {
  const session = sessions[req.params.code.toUpperCase()];
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ leaderboard: buildLeaderboard(session), teacherName: session.teacherName });
});

// ── REST: send email report ───────────────────────────────────────────────────
app.post('/api/session/:code/send-report', async (req, res) => {
  const { smtpUser, smtpPass } = req.body;
  const session = sessions[req.params.code.toUpperCase()];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const leaderboard = buildLeaderboard(session);
  const sessionDate = new Date(session.startTime).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Build transporter — teacher provides their Gmail + App Password
  let transporter;
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.verify();
  } catch {
    return res.status(400).json({ error: 'Email credentials invalid. Use a Gmail App Password.' });
  }

  const results = { sent: [], failed: [] };

  for (const child of session.children.values()) {
    if (!child.parentEmail) { results.failed.push({ name: child.name, reason: 'No parent email' }); continue; }

    const html = buildEmailHTML({
      child, leaderboard,
      sessionCode:  req.params.code.toUpperCase(),
      teacherName:  session.teacherName || 'Your Teacher',
      sessionDate,
    });
    if (!html) { results.failed.push({ name: child.name, reason: 'Not in leaderboard' }); continue; }

    try {
      await transporter.sendMail({
        from:    `"Leapboard 🚀" <${smtpUser}>`,
        to:      child.parentEmail,
        subject: `⭐ ${child.name}'s Class Report — ${sessionDate}`,
        html,
      });
      results.sent.push(child.name);
    } catch (e) {
      results.failed.push({ name: child.name, reason: e.message });
    }
  }

  res.json(results);
});

// ── REST: update parent email by child name (teacher enters it post-join) ─────
app.post('/api/session/:code/update-parent-email', (req, res) => {
  const { childName, parentEmail } = req.body;
  const session = sessions[req.params.code.toUpperCase()];
  if (!session) return res.status(404).json({ error: 'Session not found' });
  for (const [, child] of session.children) {
    if (child.name === childName) { child.parentEmail = parentEmail; }
  }
  res.json({ ok: true });
});

// ── REST: health ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  let currentSession = null;
  let currentRole    = null;
  let currentName    = null;

  // JOIN
  socket.on('join:session', ({ code, role, name, childName, parentEmail }) => {
    const upperCode = code.toUpperCase();
    const session   = sessions[upperCode];
    if (!session) {
      socket.emit('error:session', { message: 'Session not found. Check the code and try again.' });
      return;
    }
    currentSession = upperCode;
    currentRole    = role;
    currentName    = name;
    socket.join(`session:${upperCode}`);

    if (role === 'teacher') {
      session.teacherSocketId = socket.id;
      session.teacherName     = name;
      if (parentEmail) session.teacherEmail = parentEmail; // teacher's own email for sending
      socket.emit('joined:teacher', { code: upperCode, children: [...session.children.values()] });

    } else if (role === 'child') {
      session.children.set(socket.id, {
        socketId:    socket.id,
        name,
        parentEmail: parentEmail || null,
        emotion:     null,
        bravePoints: 0,
        stars:       0,
        joinedAt:    Date.now(),
      });
      socket.emit('joined:child', { code: upperCode });
      if (session.teacherSocketId) {
        io.to(session.teacherSocketId).emit('child:joined', { socketId: socket.id, name, emotion: null });
      }

    } else if (role === 'parent') {
      session.parents.set(socket.id, { socketId: socket.id, childName: childName || name, email: parentEmail || null });
      // Also update the matching child's parentEmail if not set
      for (const [, child] of session.children) {
        if (child.name === (childName || name) && !child.parentEmail && parentEmail) {
          child.parentEmail = parentEmail;
        }
      }
      socket.emit('joined:parent', { code: upperCode, childName: childName || name });
    }
  });

  // FEELING CORNER
  socket.on('checkin:emotion', ({ emotion }) => {
    if (!currentSession || currentRole !== 'child') return;
    const session = sessions[currentSession];
    if (!session) return;
    const child = session.children.get(socket.id);
    if (child) { child.emotion = emotion; session.children.set(socket.id, child); }
    if (session.teacherSocketId) {
      io.to(session.teacherSocketId).emit('child:checkin', { socketId: socket.id, name: currentName, emotion });
    }
  });

  // DISTRESS DETECTED
  socket.on('distress:detected', ({ confidence }) => {
    if (!currentSession || currentRole !== 'child') return;
    const session = sessions[currentSession];
    if (!session) return;

    const types       = ['balloons','stars','mascot','badge','rainbow'];
    const overlayType = types[Math.floor(Math.random() * types.length)];
    const timestamp   = new Date().toISOString();

    socket.emit('trigger:overlay', { type: overlayType, initiator: 'auto', duration: 4000 });

    if (session.teacherSocketId) {
      io.to(session.teacherSocketId).emit('alert:distress', {
        childSocketId: socket.id, childName: currentName, confidence, timestamp, overlayFired: overlayType,
      });
    }
    for (const [, parent] of session.parents) {
      if (parent.childName === currentName) {
        io.to(parent.socketId).emit('child:distress', { childName: currentName, timestamp });
      }
    }
    session.alertLog.push({ type: 'distress_auto', childName: currentName, childSocketId: socket.id, overlayType, timestamp, initiator: 'auto' });

    // Award brave point after 8s
    setTimeout(() => {
      const child = session.children.get(socket.id);
      if (child) {
        child.bravePoints = (child.bravePoints || 0) + 1;
        socket.emit('award:brave_point', { total: child.bravePoints });
        if (session.teacherSocketId) {
          io.to(session.teacherSocketId).emit('child:brave_point', { childSocketId: socket.id, childName: currentName, total: child.bravePoints });
        }
      }
    }, 8000);
  });

  // TEACHER: INDIVIDUAL TRIGGER
  socket.on('trigger:individual', ({ childSocketId, overlayType }) => {
    if (!currentSession || currentRole !== 'teacher') return;
    const session = sessions[currentSession];
    if (!session) return;

    io.to(childSocketId).emit('trigger:overlay', { type: overlayType || 'balloons', initiator: 'teacher', duration: 4000 });

    const child     = session.children.get(childSocketId);
    const childName = child ? child.name : 'Unknown';
    const timestamp = new Date().toISOString();
    session.alertLog.push({ type: 'manual_individual', childName, childSocketId, overlayType: overlayType || 'balloons', timestamp, initiator: 'teacher' });
    socket.emit('trigger:confirmed', { childSocketId, childName, overlayType });
  });

  // TEACHER: BROADCAST TRIGGER — awards +1 participation star to ALL children
  socket.on('trigger:broadcast', ({ overlayType }) => {
    if (!currentSession || currentRole !== 'teacher') return;
    const session = sessions[currentSession];
    if (!session) return;

    const timestamp = new Date().toISOString();

    for (const [childSocketId, child] of session.children) {
      // Fire overlay
      io.to(childSocketId).emit('trigger:overlay', { type: overlayType || 'confetti', initiator: 'broadcast', duration: 5000 });
      // Award participation star
      child.stars = (child.stars || 0) + 1;
      session.children.set(childSocketId, child);
      io.to(childSocketId).emit('award:star', { total: child.stars, reason: 'participation' });
    }

    // Notify teacher of updated child states
    socket.emit('broadcast:confirmed', { overlayType, timestamp, childrenUpdated: [...session.children.values()] });
    session.alertLog.push({ type: 'broadcast', overlayType: overlayType || 'confetti', timestamp, initiator: 'teacher' });
  });

  // TEACHER: AWARD INDIVIDUAL STAR
  socket.on('award:star', ({ childSocketId }) => {
    if (!currentSession || currentRole !== 'teacher') return;
    const session = sessions[currentSession];
    if (!session) return;
    const child = session.children.get(childSocketId);
    if (child) {
      child.stars = (child.stars || 0) + 1;
      session.children.set(childSocketId, child);
      io.to(childSocketId).emit('award:star', { total: child.stars });
      // Tell teacher so their grid updates
      socket.emit('child:star_updated', { childSocketId, total: child.stars });
    }
  });

  // TEACHER: UPDATE CHILD PARENT EMAIL (if entered later)
  socket.on('child:set_parent_email', ({ childSocketId, parentEmail }) => {
    if (!currentSession || currentRole !== 'teacher') return;
    const session = sessions[currentSession];
    if (!session) return;
    const child = session.children.get(childSocketId);
    if (child) { child.parentEmail = parentEmail; session.children.set(childSocketId, child); }
  });

  // PARENT: PANIC BUTTON
  socket.on('parent:panic', ({ childName }) => {
    if (!currentSession || currentRole !== 'parent') return;
    const session = sessions[currentSession];
    if (!session) return;
    if (session.teacherSocketId) {
      io.to(session.teacherSocketId).emit('alert:parent_panic', { childName, timestamp: new Date().toISOString() });
    }
  });

  // SESSION STATE (teacher reconnect)
  socket.on('session:state', () => {
    if (!currentSession) return;
    const session = sessions[currentSession];
    if (!session) return;
    socket.emit('session:state:response', { children: [...session.children.values()], alertLog: session.alertLog.slice(-20) });
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    if (!currentSession) return;
    const session = sessions[currentSession];
    if (!session) return;
    if (currentRole === 'child') {
      session.children.delete(socket.id);
      if (session.teacherSocketId) io.to(session.teacherSocketId).emit('child:left', { socketId: socket.id, name: currentName });
    } else if (currentRole === 'teacher') {
      session.teacherSocketId = null;
    } else if (currentRole === 'parent') {
      session.parents.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Leapboard server running on port ${PORT}`));
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') { console.error(`\n❌ Port ${PORT} is in use. Run: lsof -ti:${PORT} | xargs kill -9\n`); process.exit(1); }
  else throw err;
});
