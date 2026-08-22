const DEVICE_ID_KEY = 'fla_device_id';
const COACH_TOKEN_KEY = 'fla_coach_token';

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getCoachToken(): string {
  return localStorage.getItem(COACH_TOKEN_KEY) || '';
}

export function setCoachToken(token: string): void {
  if (token.trim()) {
    localStorage.setItem(COACH_TOKEN_KEY, token.trim());
  } else {
    localStorage.removeItem(COACH_TOKEN_KEY);
  }
}

export function aiRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-allin-device-id': getDeviceId(),
  };
  const coachToken = getCoachToken();
  if (coachToken) headers['x-coach-token'] = coachToken;
  return headers;
}
