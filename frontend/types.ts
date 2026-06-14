export type TeamId = 1 | 2;
export type UnitType = 'normal' | 'super';

export interface Unit {
  id: string;
  team: TeamId;
  type: UnitType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackRange: number;
  lastAttackTime: number;
  color: string;
  radius: number;
  image?: HTMLImageElement;
}

export interface GameStats {
  team1Kills: number;
  team2Kills: number;
  team1Units: number;
  team2Units: number;
  team1BaseHp: number;
  team2BaseHp: number;
}

export interface GiftAction {
  id: string;
  name: string;
  icon: string;
  count: number;
  type: UnitType;
  color: string;
}
