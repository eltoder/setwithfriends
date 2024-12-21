import { useMemo } from "react";
import cloneDeep from "clone-deep";

import useFirebaseRef from "./useFirebaseRef";
import { BASE_RATING, modes } from "../game";

/** Listen to statistics for a given user, with filled in default values. */
function useStats(userId) {
  const [value, loading] = useFirebaseRef(
    userId ? `/userStats/${userId}` : null
  );

  // Fill in possibly uninitialized default values
  const stats = useMemo(() => {
    if (loading) {
      return value;
    }

    const stats = cloneDeep(value) ?? {};
    for (const mode of Object.keys(modes)) {
      stats[mode] ??= {};
      stats[mode].rating ??= BASE_RATING;
      for (const variant of ["solo", "multiplayer"]) {
        stats[mode][variant] ??= {};
        stats[mode][variant].finishedGames ??= 0;
        stats[mode][variant].wonGames ??= 0;
        stats[mode][variant].totalSets ??= 0;
        stats[mode][variant].fastestTime ??= Infinity;
        stats[mode][variant].totalTime ??= 0;
      }
      const { solo, multiplayer } = stats[mode];
      stats[mode].all = {
        finishedGames: solo.finishedGames + multiplayer.finishedGames,
        wonGames: solo.wonGames + multiplayer.wonGames,
        totalSets: solo.totalSets + multiplayer.totalSets,
        fastestTime: Math.min(solo.fastestTime, multiplayer.fastestTime),
        totalTime: solo.totalTime + multiplayer.totalTime,
      };
    }
    stats.all = {};
    for (const variant of ["solo", "multiplayer", "all"]) {
      stats.all[variant] = Object.keys(modes)
        .map((mode) => stats[mode][variant])
        .reduce((a, b) => ({
          finishedGames: a.finishedGames + b.finishedGames,
          wonGames: a.wonGames + b.wonGames,
          totalSets: a.totalSets + b.totalSets,
          fastestTime: Math.min(a.fastestTime, b.fastestTime),
          totalTime: a.totalTime + b.totalTime,
        }));
    }

    return stats;
  }, [value, loading]);

  return [stats, loading];
}

export default useStats;
