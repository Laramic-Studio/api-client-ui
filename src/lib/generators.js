// Dynamic data generators used by Request Builder and Mock Engine.

export function nanoUid(prefix = "id") {
  return (
    prefix +
    "_" +
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 6)
  );
}

export function uuidV4() {
  // RFC4122 v4 compatible
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function currentTimestamp() {
  return new Date().toISOString();
}

export function randomNumber(min = 0, max = 1000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomString(len = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const FIRST = ["alex", "sara", "jordan", "kai", "noah", "mia", "lukas", "ava", "leo", "isla"];
const LAST = ["nova", "stone", "ray", "miles", "ortiz", "khan", "chen", "park", "silva", "kim"];
const DOMAINS = ["noidr.dev", "frontstac.io", "acme.test", "mailpilot.app", "example.com"];

export function fakeEmail() {
  const f = FIRST[Math.floor(Math.random() * FIRST.length)];
  const l = LAST[Math.floor(Math.random() * LAST.length)];
  const d = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
  return `${f}.${l}${Math.floor(Math.random() * 99)}@${d}`;
}

export const GENERATORS = [
  { id: "uuid", name: "UUID v4", description: "Random RFC4122 UUID", fn: () => uuidV4() },
  { id: "timestamp", name: "ISO Timestamp", description: "Current ISO-8601 timestamp", fn: () => currentTimestamp() },
  { id: "epoch", name: "Unix Epoch", description: "Seconds since 1970-01-01", fn: () => String(Math.floor(Date.now() / 1000)) },
  { id: "number", name: "Random Number", description: "Integer between 0 and 100000", fn: () => String(randomNumber(0, 100000)) },
  { id: "string", name: "Random String", description: "16-char alphanumeric", fn: () => randomString(16) },
  { id: "email", name: "Fake Email", description: "Realistic fake email", fn: () => fakeEmail() },
];
