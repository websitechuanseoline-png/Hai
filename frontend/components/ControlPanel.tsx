import React from 'react';
import { TeamId, GiftAction } from '../types';
import { GIFTS } from '../constants';
import { MessageSquare } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface ControlPanelProps {
  team: TeamId;
  teamName: string;
  colorClass: string;
  onSpawn: (team: TeamId, count: number, type: 'normal' | 'super', avatarUrl?: string) => void;
  disabled: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ team, teamName, colorClass, onSpawn, disabled }) => {
  const handleComment = () => {
    soundManager.resume();
    onSpawn(team, 1, 'normal');
  };

  const handleGift = (gift: GiftAction) => {
    soundManager.resume();
    onSpawn(team, gift.count, gift.type);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-800/50 border-t-4 ${colorClass} p-4 rounded-t-xl`}>
      <h2 className="text-xl font-bold mb-4 text-center">{teamName}</h2>
      
      <div className="mb-6">
        <button
          onClick={handleComment}
          disabled={disabled}
          className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <MessageSquare size={20} />
          <span>Bình luận "{team}" (+1 Lính)</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <h3 className="text-sm text-slate-400 mb-3 uppercase tracking-wider font-semibold">Tặng Quà</h3>
        <div className="grid grid-cols-2 gap-2">
          {GIFTS.map((gift) => (
            <button
              key={gift.id}
              onClick={() => handleGift(gift)}
              disabled={disabled}
              className="flex flex-col items-center justify-center p-3 bg-slate-700/50 hover:bg-slate-600 rounded-lg border border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{gift.icon}</span>
              <span className="text-xs text-center font-medium text-slate-200">{gift.name}</span>
              <span className="text-[10px] text-slate-400 mt-1">
                +{gift.count} {gift.type === 'super' ? 'Siêu nhân' : 'Lính'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
