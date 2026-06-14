import React, { useState } from 'react';
import { Play, Link, Info } from 'lucide-react';
import { WEBSOCKET_URL } from '../constants';

interface ConnectionScreenProps {
  onConnect: (wsUrl: string) => void;
}

export const ConnectionScreen: React.FC<ConnectionScreenProps> = ({ onConnect }) => {
  const [wsUrl, setWsUrl] = useState(WEBSOCKET_URL);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wsUrl.trim()) {
      onConnect(wsUrl.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"></div>

      <div className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-violet-500 mb-2">
            TIKTOK LIVE BATTLE
          </h1>
          <p className="text-slate-400">Bơ Thị 🥑 vs Nho Thị 🍇</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="wsUrl" className="block text-sm font-medium text-slate-300 mb-2">
              TikFinity WebSocket URL
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <Link size={18} />
              </span>
              <input
                type="text"
                id="wsUrl"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="wss://..."
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div className="mt-4 bg-emerald-900/20 border border-emerald-800/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-emerald-100/80 leading-relaxed">
                  <strong className="text-emerald-400 block mb-1">Dành cho TikFinity Web App:</strong>
                  1. Mở trang web <a href="https://tikfinity.zerody.one/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">https://tikfinity.zerody.one/</a> và đăng nhập.<br/>
                  2. Vào menu <b>Setup</b> (Cài đặt) ➔ Tìm mục <b>API</b> hoặc <b>Websocket</b>.<br/>
                  3. Copy đường link <b>Cloud WebSocket URL</b> (thường bắt đầu bằng <code className="bg-black/30 px-1 rounded">wss://</code>).<br/>
                  4. Dán link đó vào ô trống phía trên.
                  <br/><br/>
                  <span className="text-xs text-slate-400">
                    *Nếu bạn dùng phần mềm TikFinity cài trên máy tính, hãy nhập: <code className="bg-black/30 px-1 rounded">ws://localhost:2134</code>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-violet-500 hover:from-emerald-400 hover:to-violet-400 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-lg"
          >
            <Play size={20} />
            Kết Nối TikFinity & Vào Game
          </button>
        </form>
      </div>
    </div>
  );
};
