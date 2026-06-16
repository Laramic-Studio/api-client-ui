const PREFIX = "noidr-onboarding";

function key(userId) {
  return `${PREFIX}:${userId}`;
}

export function getOnboarding(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveOnboarding(userId, data) {
  if (!userId) return;
  localStorage.setItem(
    key(userId),
    JSON.stringify({ ...data, completed: true, completedAt: Date.now() })
  );
}

export function isOnboarded(userId) {
  return Boolean(getOnboarding(userId)?.completed);
}
