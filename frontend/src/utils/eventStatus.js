/**
 * Computes the display status of an event based on its date and capacity.
 *
 * Rules (evaluated in priority order):
 *  1. If endDate < now                          → COMPLETED
 *  2. If participants >= maxParticipants        → REGISTRATION_CLOSED
 *  3. If startDate <= now + 30 days             → REGISTRATION_OPEN
 *  4. Otherwise                                 → UPCOMING
 *
 * If the stored status is CANCELLED, that is always preserved.
 *
 * @param {object} event - The event object from the API
 * @param {string}  event.status        - Stored DB status
 * @param {string}  event.startDate     - ISO date string for start
 * @param {string}  event.endDate       - ISO date string for end
 * @param {number}  event.maxParticipants
 * @param {object}  [event._count]      - { registration: number }
 * @returns {string} Computed status string
 */
export function getComputedStatus(event) {
  if (!event) return 'UPCOMING';

  // Always honour CANCELLED
  if (event.status === 'CANCELLED') return 'CANCELLED';

  const now = new Date();
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const startDate = event.startDate ? new Date(event.startDate) : null;

  // Rule 1: Past event → Completed
  if (endDate && endDate < now) return 'COMPLETED';

  // Rule 2: Full capacity → Registration Closed
  const registrationCount = event._count?.registration ?? event._count?.registrations ?? 0;
  if (event.maxParticipants && registrationCount >= event.maxParticipants) {
    return 'REGISTRATION_CLOSED';
  }

  // Rule 3: Within next 30 days → Registration Open
  if (startDate) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    if (startDate <= thirtyDaysFromNow) return 'REGISTRATION_OPEN';
  }

  // Rule 4: More than 30 days away → Upcoming
  return 'UPCOMING';
}

/**
 * Returns MUI Chip style props for a given computed status.
 * Supports both light and dark modes.
 *
 * @param {string} status  - Computed status string
 * @param {boolean} isLight - Whether the theme is in light mode
 * @returns {{ bg: string, text: string, label: string }}
 */
export function getStatusStyle(status, isLight = true) {
  const styles = {
    COMPLETED: {
      bg: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)',
      text: isLight ? '#166534' : '#34d399',
      label: 'Completed',
    },
    CANCELLED: {
      bg: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
      text: isLight ? '#991b1b' : '#f87171',
      label: 'Cancelled',
    },
    UPCOMING: {
      bg: isLight ? '#e0f2fe' : 'rgba(59, 130, 246, 0.15)',
      text: isLight ? '#075985' : '#60a5fa',
      label: 'Upcoming',
    },
    ONGOING: {
      bg: isLight ? '#fef9c3' : 'rgba(245, 158, 11, 0.15)',
      text: isLight ? '#854d0e' : '#fbbf24',
      label: 'Ongoing',
    },
    REGISTRATION_OPEN: {
      bg: isLight ? '#dbeafe' : 'rgba(99, 102, 241, 0.15)',
      text: isLight ? '#1e40af' : '#818cf8',
      label: 'Reg Open',
    },
    REGISTRATION_CLOSED: {
      bg: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)',
      text: isLight ? '#92400e' : '#fbbf24',
      label: 'Reg Closed',
    },
    ACTIVE: {
      bg: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)',
      text: isLight ? '#166534' : '#34d399',
      label: 'Active',
    },
    PROPOSED: {
      bg: isLight ? '#f3e8ff' : 'rgba(168, 85, 247, 0.15)',
      text: isLight ? '#6b21a8' : '#c084fc',
      label: 'Proposed',
    },
    APPROVED: {
      bg: isLight ? '#e0f2fe' : 'rgba(59, 130, 246, 0.15)',
      text: isLight ? '#075985' : '#60a5fa',
      label: 'Approved',
    },
  };

  return styles[status] || { bg: 'action.hover', text: 'text.secondary', label: status };
}
