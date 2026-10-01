/**
 * Lays out the shifts of one day in the time grid. Overlapping shifts are
 * placed side by side in "lanes" (like Google Calendar).
 *
 * Ordering is stable: shifts that start at the same time keep the worker
 * order of the calendar, so resizing one never makes cards swap places.
 */
import { GRID_START_MIN } from '@/config/constants';
import { toMinutes, shiftHours, MINUTES_PER_DAY } from '@/lib/time';

/**
 * @param {object[]} shifts   shifts of one day/local
 * @param {Record<string,number>} workerOrder  empId → display order
 * @returns {{ items: Array<{shift,startMin,endMin,lane,lanes,hours}>, maxLanes:number }}
 *   startMin/endMin are minutes from the grid start (06:00).
 */
export function layoutDay(shifts, workerOrder) {
  const items = shifts
    .map((shift) => {
      const startMin = (toMinutes(shift.start) - GRID_START_MIN + MINUTES_PER_DAY) % MINUTES_PER_DAY;
      const hours = shiftHours(shift.start, shift.end);
      const endMin = Math.min(MINUTES_PER_DAY, startMin + hours.total * 60);
      return { shift, startMin, endMin, hours, lane: 0, lanes: 1 };
    })
    .sort(
      (x, y) =>
        x.startMin - y.startMin ||
        (workerOrder[x.shift.empId] ?? 999) - (workerOrder[y.shift.empId] ?? 999) ||
        String(x.shift.id).localeCompare(String(y.shift.id)),
    );

  let maxLanes = 1;
  let cluster = [];
  let clusterEnd = -1;

  const flush = () => {
    const laneEnds = [];
    for (const it of cluster) {
      let lane = laneEnds.findIndex((end) => end <= it.startMin);
      if (lane < 0) {
        lane = laneEnds.length;
        laneEnds.push(0);
      }
      laneEnds[lane] = it.endMin;
      it.lane = lane;
    }
    for (const it of cluster) it.lanes = laneEnds.length;
    maxLanes = Math.max(maxLanes, laneEnds.length);
    cluster = [];
    clusterEnd = -1;
  };

  for (const it of items) {
    if (cluster.length && it.startMin >= clusterEnd) flush();
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.endMin);
  }
  if (cluster.length) flush();

  return { items, maxLanes };
}
