let sessionId, socket;

async function signup() {
  const username = document.getElementById('username').value;
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username})
  });
  const {sessionId: sid, userId} = await res.json();
  
  sessionId = sid;
  socket = io();
  socket.emit('join-session', sessionId);
  
  document.body.innerHTML = `
    <h2>✅ Welcome ${username}!</h2>
    <p>Account created. Screen sharing active...</p>
    <div id="status">Status: Connected</div>
  `;
  
  // Fake screen capture (logs for testing)
  setInterval(() => {
    socket.emit('screen-stream', {
      type: 'frame',
      data: `screen-${Date.now()}`,
      userId
    });
  }, 1000);
  
  socket.on('control-received', (cmd) => {
    document.getElementById('status').textContent = `Control received: ${cmd.type}`;
  });
}
