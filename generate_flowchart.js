import fs from 'fs';
import https from 'https';

const mermaidCode = `graph TD
    classDef client fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef gateway fill:#ede7f6,stroke:#5e35b1,stroke-width:2px;
    classDef server fill:#efebe9,stroke:#5d4037,stroke-width:2px;
    classDef cache fill:#ffebee,stroke:#c62828,stroke-width:2px;
    classDef db fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef worker fill:#fff8e1,stroke:#f57f17,stroke-width:2px;

    User["Client Browser (Next.js App)"]:::client
    Vercel["Vercel Edge / API Routing Router"]:::gateway
    Express["Express Core API Engine"]:::server
    
    subgraph Middlewares ["Security & Middlewares"]
        Limiter["Rate Limiter (express-rate-limit)"]:::server
        Auth["JWT Auth Guard (protect)"]:::server
    end

    subgraph Controllers ["Resource Controllers"]
        AuthRoutes["Auth Controller"]:::server
        PostRoutes["Post & Feed Controller"]:::server
        EventRoutes["Events & Places Controller"]:::server
        MsgRoutes["Messages / Socket Controller"]:::server
    end

    subgraph Storage ["Data & State Tier"]
        Redis["Redis Cache / BullMQ Store"]:::cache
        MongoDB[("MongoDB Atlas (Database)")]:::db
    end

    subgraph Workers ["Background Workers (BullMQ)"]
        EmailW["Email Dispatcher Worker"]:::worker
        NotifW["Notification Dispatcher Worker"]:::worker
        FeedW["Feed Builder Worker"]:::worker
    end

    subgraph RealTime ["Real-Time Broadcast Engine"]
        SSE["SSE (Server-Sent Events) Gateway"]:::server
        Sockets["Socket.io Server (WebSockets)"]:::server
    end

    User -->|HTTPS Requests| Vercel
    Vercel -->|Route: /api/*| Express
    Express --> Limiter
    Limiter --> Auth
    Auth --> AuthRoutes
    Auth --> PostRoutes
    Auth --> EventRoutes
    Auth --> MsgRoutes

    AuthRoutes --> MongoDB
    EventRoutes --> MongoDB
    PostRoutes -->|Data Retrieval| MongoDB
    
    PostRoutes -.->|Cache & Queue Jobs| Redis
    Redis -->|Trigger Worker Execution| EmailW
    Redis -->|Trigger Worker Execution| NotifW
    Redis -->|Trigger Worker Execution| FeedW

    EmailW -.->|Update Status| MongoDB
    NotifW -.->|Update Status| MongoDB
    FeedW -.->|Assemble Feed Structure| MongoDB

    MsgRoutes --> Sockets
    Sockets <-->|WebSockets Duplex Sync| User
    SSE -->|Live Push Notifications| User`;

// Create the config object for mermaid.ink
const config = {
  code: mermaidCode,
  mermaid: {
    theme: 'default'
  }
};

const jsonStr = JSON.stringify(config);
const base64 = Buffer.from(jsonStr).toString('base64');
const url = `https://mermaid.ink/img/${base64}`;

console.log('Downloading system design flowchart image from:', url);

const file = fs.createWriteStream('flowchart.png');
https.get(url, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download image. Status Code: ${response.statusCode}`);
    return;
  }
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Successfully saved flowchart as flowchart.png inside the project root directory!');
  });
}).on('error', (err) => {
  fs.unlink('flowchart.png', () => {});
  console.error('Error downloading flowchart:', err.message);
});
