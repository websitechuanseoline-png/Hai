import { GiftAction } from './types';

// Để trống để người dùng tự dán link từ TikFinity Web
export const WEBSOCKET_URL = ''; 

export const GAME_DURATION_SECONDS = 180; // 3 minutes
export const AUTO_SPAWN_INTERVAL_MS = 3000;
export const FPS = 60;

export const TEAM_1_COLOR = '#10B981'; // Emerald 500 (Bơ)
export const TEAM_2_COLOR = '#8B5CF6'; // Violet 500 (Nho)

export const BASE_MAX_HP = 1000;
export const BASE_WIDTH = 60;

export const UNIT_CONFIG = {
  normal: {
    hp: 1,
    damage: 1,
    speed: 0.8,
    radius: 14,
    attackRange: 15,
    cooldown: 500, // ms
  },
  super: {
    hp: 20,
    damage: 2,
    speed: 0.5,
    radius: 24,
    attackRange: 25,
    cooldown: 800, // ms
  }
};

export const GIFTS: GiftAction[] = [
  { id: 'rose', name: 'Hoa hồng', icon: '🌹', count: 3, type: 'normal', color: '#ef4444' },
  { id: 'shoot', name: 'Bắn', icon: '🔫', count: 9, type: 'normal', color: '#f59e0b' },
  { id: 'clover', name: 'Cỏ ba lá', icon: '🍀', count: 15, type: 'normal', color: '#22c55e' },
  { id: 'donut', name: 'Bánh vòng', icon: '🍩', count: 25, type: 'normal', color: '#ec4899' },
  { id: 'kisses', name: 'Little Kisses', icon: '💋', count: 1, type: 'super', color: '#f43f5e' },
  { id: 'heart', name: 'Thả tim', icon: '❤️', count: 1, type: 'normal', color: '#ef4444' },
  { id: 'coins', name: '100 Xu', icon: '🪙', count: 5, type: 'super', color: '#eab308' },
  { id: 'balloon', name: 'Bóng bay', icon: '🎈', count: 100, type: 'normal', color: '#3b82f6' },
  { id: 'star', name: 'Sao đêm', icon: '⭐', count: 200, type: 'normal', color: '#eab308' },
  { id: 'firework', name: 'Pháo hoa', icon: '🎆', count: 1000, type: 'normal', color: '#a855f7' },
];
