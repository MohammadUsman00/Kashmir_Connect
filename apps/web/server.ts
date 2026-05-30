import { createServer } from "http";
import next from "next";
import { attachEmergencySocketServer } from "./src/lib/emergency/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const server = createServer((req, res) => {
    void handle(req, res);
  });

  attachEmergencySocketServer(server);

  server.listen(port, hostname, () => {
    // eslint-disable-next-line no-console
    console.log(`> Emergency-enabled server ready on http://${hostname}:${port}`);
  });
});
