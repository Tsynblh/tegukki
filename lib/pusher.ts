import PusherServer from "pusher";
import PusherClient from "pusher-js";

// 1. Server Instance (untuk trigger event dari API)
export const pusherServer =
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_CLUSTER
    ? new PusherServer({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        useTLS: true,
      })
    : null;

// Helper trigger event agar aman dan tidak crash jika Pusher env kosong
export async function triggerPusherEvent(
  channel: string,
  event: string,
  data: unknown
) {
  if (!pusherServer) return;
  try {
    await pusherServer.trigger(channel, event, data);
  } catch (error) {
    console.warn("Pusher trigger failed:", error);
  }
}

// 2. Client Instance (untuk subscribe event di browser)
export function getPusherClient() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) return null;

  return new PusherClient(key, {
    cluster,
  });
}
