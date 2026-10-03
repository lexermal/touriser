const SWEEP_EVERY_MS = 15 * 60 * 1000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { deleteExpiredTrips } = await import("./lib/db");
  // Plans are deleted 30 days after upload, no exceptions: sweep at boot and every 15 minutes.
  const sweep = () => {
    const removed = deleteExpiredTrips();
    if (removed) console.log(`[retention] deleted ${removed} expired trip(s)`);
  };
  sweep();
  setInterval(sweep, SWEEP_EVERY_MS).unref();
}
