import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";

export interface RealtimeEvent {
  type: string;
  equipmentId?: number;
  reservationId?: number;
  visualStatus?: string;
  occurredAt: string;
  correlationId?: string;
}

const apiUrl =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8080/api/v1";
const brokerURL = apiUrl.replace(/^http/, "ws").replace(/\/api\/v1$/, "") + "/ws";

let client: Client | null = null;

export async function disconnectRealtime() {
  const current = client;
  client = null;
  if (current) await current.deactivate();
}

export function connectRealtime(
  token: () => string | null,
  onEvent: (event: RealtimeEvent) => void,
) {
  if (typeof window === "undefined" || client?.active) return () => undefined;

  const subscriptions: StompSubscription[] = [];
  client = new Client({
    brokerURL,
    reconnectDelay: 3_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    beforeConnect: async () => {
      const value = token();
      client!.connectHeaders = value ? { Authorization: `Bearer ${value}` } : {};
    },
    onConnect: () => {
      const receive = (message: IMessage) => {
        try {
          onEvent(JSON.parse(message.body) as RealtimeEvent);
        } catch {
          // Malformed optional notifications never break the REST application.
        }
      };
      subscriptions.push(client!.subscribe("/topic/equipment-status", receive));
      subscriptions.push(client!.subscribe("/topic/reservations", receive));
      subscriptions.push(client!.subscribe("/topic/dashboard", receive));
    },
  });
  client.activate();

  return () => {
    subscriptions.forEach((subscription) => subscription.unsubscribe());
    void disconnectRealtime();
  };
}
