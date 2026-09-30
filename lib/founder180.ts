export const FOUNDER_EXPERIMENT_START_DATE = "2026-10-01";
export const TOTAL_EXPERIMENT_DAYS = 180;

/**
 * Calculates Day X of 180 based on calendar date arithmetic.
 * Day 1 = START_DATE (2026-10-01)
 * Day 180 = START_DATE + 179 days (2027-03-29)
 */
export function calculateExperimentDay(targetDateStr?: string): { day: number; total: number; formatted: string } {
  const startDate = new Date(`${FOUNDER_EXPERIMENT_START_DATE}T00:00:00`);
  const targetDate = targetDateStr
    ? new Date(`${targetDateStr}T00:00:00`)
    : new Date();

  // Reset hours to midnight for pure calendar date comparison
  startDate.setHours(0, 0, 0, 0);
  const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const diffMs = targetMidnight.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let day = diffDays + 1;
  if (day < 1) day = 1;
  if (day > TOTAL_EXPERIMENT_DAYS) day = TOTAL_EXPERIMENT_DAYS;

  return {
    day,
    total: TOTAL_EXPERIMENT_DAYS,
    formatted: `Day ${day} / ${TOTAL_EXPERIMENT_DAYS}`,
  };
}

/**
 * Calculates daily check-in score and showed up status:
 * Each item = 20 points (4 items = 80%)
 * Completed count >= 3 => Showed Up: YES
 */
export function calculateCheckinScore(work: boolean, sales: boolean, body: boolean, sleep: boolean) {
  const count = (work ? 1 : 0) + (sales ? 1 : 0) + (body ? 1 : 0) + (sleep ? 1 : 0);
  const score = count * 20;
  const showedUp = count >= 3;
  return {
    count,
    score,
    showedUp,
  };
}
