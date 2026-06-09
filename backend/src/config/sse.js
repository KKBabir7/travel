import winston from 'winston';

// Map of userId -> Set of Express Response objects
const clients = new Map();

export const sseSubscribe = (req, res) => {
  const userId = req.user.id;

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000',
    'Access-Control-Allow-Credentials': 'true'
  });

  // Write initial response
  res.write('retry: 10000\n\n');

  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(res);

  winston.info(`User ${userId} subscribed to SSE events. Total active user connections: ${clients.get(userId).size}`);

  // Ping client periodically to keep connection alive
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    if (clients.has(userId)) {
      clients.get(userId).delete(res);
      if (clients.get(userId).size === 0) {
        clients.delete(userId);
      }
    }
    winston.info(`User ${userId} closed SSE subscription`);
  });
};

export const sendSSEEvent = (userId, eventType, data) => {
  const userClients = clients.get(userId.toString());
  if (!userClients) return false;

  const eventPayload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  
  userClients.forEach((client) => {
    try {
      client.write(eventPayload);
    } catch (error) {
      winston.error(`Failed to send SSE to user ${userId}: ${error.message}`);
    }
  });
  return true;
};

export const broadcastSSEEvent = (eventType, data) => {
  const eventPayload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((userClients) => {
    userClients.forEach((client) => {
      try {
        client.write(eventPayload);
      } catch (error) {
        winston.error(`Failed to broadcast SSE: ${error.message}`);
      }
    });
  });
};
