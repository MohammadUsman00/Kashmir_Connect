import { Server as HTTPServer } from "http";
import { Server as IOServer, type Socket } from "socket.io";
import { io as createClientSocket, type Socket as ClientSocket } from "socket.io-client";

declare global {
  // eslint-disable-next-line no-var
  var __kcEmergencyIO__: IOServer | undefined;
}

export type SOSEventPayload = {
  id: string;
  userId: string;
  name: string;
  district: string;
  type: "MEDICAL" | "POLICE" | "FIRE" | "GENERAL";
  lat: number;
  lng: number;
  timestamp: string;
  status: "ACTIVE" | "RESOLVED";
};

export type AlertPayload = {
  id: string;
  district: string;
  type: "FLOOD" | "SNOWFALL" | "LANDSLIDE" | "EARTHQUAKE" | "FIRE" | "CURFEW";
  severity: "CRITICAL" | "WARNING" | "ADVISORY";
  title: string;
  message: string;
  createdAt: string;
};

export function attachEmergencySocketServer(httpServer: HTTPServer): IOServer {
  if (globalThis.__kcEmergencyIO__) return globalThis.__kcEmergencyIO__;

  const io = new IOServer(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()) ?? "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket: Socket) => {
    socket.on("join-room", (room: string) => socket.join(room));
    socket.on("join:admin", () => socket.join("admin-dashboard"));
    socket.on("join:district", (district: string) => socket.join(`district-${district}`));
    socket.on("join:emergencyType", (type: string) => socket.join(`emergency-${type}`));
    socket.on("join:user", (userId: string) => socket.join(`user-${userId}`));

    socket.on("sos:new", (payload: SOSEventPayload) => {
      io.to("admin-dashboard").emit("sos:new", payload);
      io.to(`district-${payload.district}`).emit("sos:new", payload);
      io.to(`emergency-${payload.type}`).emit("sos:new", payload);
    });

    socket.on("alert:new", (payload: AlertPayload) => {
      io.emit("alert:new", payload);
      io.to(`district-${payload.district}`).emit("alert:new", payload);
    });

    socket.on("responder:location", (payload: { responderId: string; lat: number; lng: number; sosId: string }) => {
      io.to("admin-dashboard").emit("responder:location", payload);
    });

    socket.on("sos:resolved", (payload: { id: string; resolvedAt: string; responseTimeSec: number }) => {
      io.to("admin-dashboard").emit("sos:resolved", payload);
      io.emit("sos:resolved", payload);
    });
  });

  globalThis.__kcEmergencyIO__ = io;
  return io;
}

export function getEmergencySocketServer(): IOServer | null {
  return globalThis.__kcEmergencyIO__ ?? null;
}

let clientSocketSingleton: ClientSocket | null = null;

export function getEmergencyClientSocket(): ClientSocket {
  if (clientSocketSingleton) return clientSocketSingleton;
  clientSocketSingleton = createClientSocket({
    path: "/api/socket.io",
    transports: ["websocket", "polling"]
  });
  return clientSocketSingleton;
}
