// Crockford base32 ULID-style id (sortable, 26 chars): 10 time + 16 random.
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function ulid(): string {
  let time = Date.now();
  let ts = "";
  for (let i = 0; i < 10; i++) {
    ts = ENCODING[time % 32] + ts;
    time = Math.floor(time / 32);
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let rand = "";
  for (let i = 0; i < 16; i++) rand += ENCODING[bytes[i] % 32];
  return ts + rand;
}

export const nowIso = () => new Date().toISOString();
