/**
 * Lays out the shifts of one day in the time grid. Overlapping shifts are
 * placed side by side in "lanes".
 *
 * Lanes are assigned in WORKER ORDER (not by start time), so moving or
 * resizing a shift never makes cards swap places: a card only changes lane
 * when it would otherwise overlap another shift in its lane.
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
    .sort((x, y) => x.startMin - y.startMin);

  const byWorker = (x, y) =>
    (workerOrder[x.shift.empId] ?? 999) - (workerOrder[y.shift.empId] ?? 999) || String(x.shift.id).localeCompare(String(y.shift.id));
  const overlaps = (a, b) => a.startMin < b.endMin && b.startMin < a.endMin;

  let maxLanes = 1;
  let cluster = [];
  let clusterEnd = -1;

  // A cluster = shifts connected by overlaps. Lanes are computed per cluster.
  const flush = () => {
    const lanes = [];
    for (const it of [...cluster].sort(byWorker)) {
      let lane = lanes.findIndex((list) => list.every((o) => !overlaps(o, it)));
      if (lane < 0) {
        lane = lanes.length;
        lanes.push([]);
      }
      lanes[lane].push(it);
      it.lane = lane;
    }
    for (const it of cluster) it.lanes = lanes.length;
    maxLanes = Math.max(maxLanes, lanes.length);
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
