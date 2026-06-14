import { useState, useEffect, useRef } from 'react';
import { TeamId } from '../types';
import { GIFTS } from '../constants';

interface UseTikTokLiveProps {
  wsUrl: string;
  onSpawn: (team: TeamId, count: number, type: 'normal' | 'super', avatarUrl?: string) => void;
}

export const useTikTokLive = ({ wsUrl, onSpawn }: UseTikTokLiveProps) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  // Lưu trữ team mà user đã chọn (dựa vào uniqueId của TikTok)
  const userTeamCache = useRef<Record<string, TeamId>>({});

  useEffect(() => {
    if (!wsUrl) return;

    setStatus('connecting');
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
    } catch (error) {
      console.error("Invalid WebSocket URL", error);
      setStatus('error');
      return;
    }

    ws.onopen = () => {
      setStatus('connected');
      console.log('✅ Đã kết nối thành công tới TikFinity!');
    };

    ws.onclose = () => {
      setStatus('disconnected');
      console.log('🔴 Đã ngắt kết nối khỏi TikFinity.');
    };

    ws.onerror = (err) => {
      console.error('❌ Lỗi kết nối TikFinity WebSocket:', err);
      setStatus('error');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        // TikFinity gửi data theo format: { event: 'chat', data: { comment: '...', uniqueId: '...', profilePictureUrl: '...' } }
        const eventType = msg.event || msg.type;
        const data = msg.data || msg;

        if (!data || !data.uniqueId) return;

        // Lấy URL Avatar thật của người dùng từ TikFinity
        const avatarUrl = data.profilePictureUrl || data.avatarUrl || data.profile_picture;

        // 1. Xử lý Bình luận
        if (eventType === 'chat' && data.comment) {
          const text = data.comment.trim();
          if (text === '1') {
            userTeamCache.current[data.uniqueId] = 1;
            onSpawn(1, 1, 'normal', avatarUrl);
          } else if (text === '2') {
            userTeamCache.current[data.uniqueId] = 2;
            onSpawn(2, 1, 'normal', avatarUrl);
          }
        }

        // 2. Xử lý Tặng quà
        if (eventType === 'gift' && data.giftName) {
          const gift = GIFTS.find(g => g.name.toLowerCase() === data.giftName.toLowerCase());
          if (gift) {
            const team = userTeamCache.current[data.uniqueId] || 1; // Mặc định team 1 nếu chưa chọn
            const totalCount = gift.count * (data.repeatCount || 1);
            onSpawn(team, totalCount, gift.type, avatarUrl);
          }
        }

        // 3. Xử lý Thả tim
        if (eventType === 'like') {
          const team = userTeamCache.current[data.uniqueId] || 1;
          // Mỗi lần nhận event like từ TikFinity, ta sinh 1 lính
          onSpawn(team, 1, 'normal', avatarUrl);
        }

      } catch (e) {
        console.error('Lỗi đọc dữ liệu từ TikFinity:', e);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [wsUrl, onSpawn]);

  return { status };
};
