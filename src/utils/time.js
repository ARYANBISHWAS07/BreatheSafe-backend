/**
 * Time utilities.
 * Provides helpers to format timestamps in Indian Standard Time (IST, UTC+05:30).
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30 in milliseconds

const pad = (n) => String(n).padStart(2, '0');

const formatToISTLocal = (timestamp) => {
  const t = Number(timestamp) || Date.now();
  const dt = new Date(t);
  // Use Intl to format in Asia/Kolkata timezone for a human-friendly string
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(dt) + ' IST';
  } catch (e) {
    // Fallback: compute by offset
    const ist = new Date(t + IST_OFFSET_MS);
    return `${pad(ist.getUTCDate())}-${pad(ist.getUTCMonth() + 1)}-${ist.getUTCFullYear()} ${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())} IST`;
  }
};

const formatToISTIso = (timestamp) => {
  const t = Number(timestamp) || Date.now();
  // Create an ISO-like string with explicit +05:30 offset
  const ist = new Date(t + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const month = pad(ist.getUTCMonth() + 1);
  const day = pad(ist.getUTCDate());
  const hours = pad(ist.getUTCHours());
  const minutes = pad(ist.getUTCMinutes());
  const seconds = pad(ist.getUTCSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:30`;
};

module.exports = {
  formatToISTLocal,
  formatToISTIso,
};
