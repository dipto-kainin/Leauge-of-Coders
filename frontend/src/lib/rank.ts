export type RankInfo = {
  label: string;
  iconPath: string | null;
  colorClass: string;
  isUnranked: boolean;
};

const MMR_PER_TIER = 250;
const SUB_TIERS_PER_RANK = 3;

const majorRanks = [
  { name: "Iron", colorClass: "text-[#928ea0]" },
  { name: "Bronze", colorClass: "text-[#a36b4d]" },
  { name: "Silver", colorClass: "text-[#cbd5e1]" },
  { name: "Gold", colorClass: "text-[#f0a430]" },
  { name: "Platinum", colorClass: "text-[#4cc9f0]" },
  { name: "Diamond", colorClass: "text-[#4361ee]" },
  { name: "Ascendant", colorClass: "text-[#06d6a0]" },
  { name: "Immortal", colorClass: "text-[#ef476f]" },
] as const;

const radiantTierIndex = majorRanks.length * SUB_TIERS_PER_RANK;

export function getRankFromMmr(mmr: number, matchesPlayed: number): RankInfo {
  if (matchesPlayed < 10) {
    return {
      label: "?",
      iconPath: null,
      colorClass: "text-muted-foreground",
      isUnranked: true,
    };
  }

  const safeMMR = Number.isFinite(mmr) ? Math.max(1, Math.floor(mmr)) : 1;
  const tierIndex = Math.floor((safeMMR - 1) / MMR_PER_TIER);

  if (tierIndex >= radiantTierIndex) {
    return {
      label: "Radiant",
      iconPath: "/rank_png/Radiant_Rank.png",
      colorClass: "text-[#f0a430]",
      isUnranked: false,
    };
  }

  const majorIndex = Math.floor(tierIndex / SUB_TIERS_PER_RANK);
  const division = (tierIndex % SUB_TIERS_PER_RANK) + 1;
  const majorRank = majorRanks[majorIndex];

  return {
    label: `${majorRank.name} ${division}`,
    iconPath: `/rank_png/${majorRank.name}_${division}_Rank.png`,
    colorClass: majorRank.colorClass,
    isUnranked: false,
  };
}

export function toWinRatePercentage(winRate: number): number {
  if (!Number.isFinite(winRate) || winRate <= 0) return 0;
  return winRate <= 1 ? winRate * 100 : winRate;
}
