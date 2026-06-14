import React, { useState, useEffect, useCallback } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { ControlPanel } from './components/ControlPanel';
import { ConnectionScreen } from './components/ConnectionScreen';
import { useTikTokLive } from './hooks/useTikTokLive';
import { GAME_DURATION_SECONDS, BASE_MAX_HP } from './constants';
import { TeamId } from './types';
import { Trophy, Play, RotateCcw, Clock, Shield, Wifi, WifiOff } from 'lucide-react';
import { soundManager } from './utils/sound';

// Kích thước chuẩn 9:16 cho TikTok Live
const CANVAS_WIDTH = 540;
const CANVAS_HEIGHT = 960;

export default function App() {
  const [wsUrl, setWsUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<TeamId | 0>(0);
  const [restartCountdown, setRestartCountdown] = useState<number | null>(null);

  const handleGameOver = useCallback((winTeam: TeamId | 0) => {
    setGameOver(true);
    setWinner(winTeam);
    setRestartCountdown(10); // Bắt đầu đếm ngược 10 giây
  }, []);

  const {
    canvasRef,
    uiStats,
    spawnUnits,
    startGame,
    stopGame,
    isRunning
  } = useGameEngine({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    onGameOver: handleGameOver
  });

  // Hook kết nối TikFinity
  const { status: liveStatus } = useTikTokLive({
    wsUrl: wsUrl,
    onSpawn: spawnUnits
  });

  const handleStart = useCallback(() => {
    soundManager.init();
    soundManager.resume();

    setTimeLeft(GAME_DURATION_SECONDS);
    setGameOver(false);
    setWinner(0);
    setRestartCountdown(null);
    startGame();
  }, [startGame]);

  // Timer logic cho trận đấu
  useEffect(() => {
    let timer: number;
    if (isRunning && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, stopGame]);

  // Timer logic cho đếm ngược tự động chơi lại
  useEffect(() => {
    if (restartCountdown === null) return;
    
    if (restartCountdown === 0) {
      handleStart();
      return;
    }

    const timer = window.setTimeout(() => {
      setRestartCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [restartCountdown, handleStart]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Nếu chưa nhập URL, hiển thị màn hình kết nối
  if (!wsUrl) {
    return <ConnectionScreen onConnect={setWsUrl} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-950 p-4 shadow-md z-10 relative">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 w-1/3">
            <div className="text-left">
              <h1 className="text-2xl font-black text-emerald-400 drop-shadow-md">BƠ THỊ</h1>
              <div className="flex items-center gap-2 text-emerald-300 mt-1">
                <Shield size={16} />
                <span className="font-bold">{Math.ceil(Math.max(0, uiStats.team1BaseHp))} / {BASE_MAX_HP}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Lính: {uiStats.team1Units} | Diệt: {uiStats.team1Kills}</p>
            </div>
          </div>

          <div className="flex flex-col items-center w-1/3">
            {/* Trạng thái kết nối TikFinity */}
            <div className="flex items-center gap-2 mb-2 text-xs font-medium bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              {liveStatus === 'connected' ? (
                <><Wifi size={14} className="text-green-400" /> <span className="text-green-400">TikFinity Đã Kết Nối</span></>
              ) : liveStatus === 'connecting' ? (
                <><Wifi size={14} className="text-yellow-400 animate-pulse" /> <span className="text-yellow-400">Đang kết nối...</span></>
              ) : (
                <><WifiOff size={14} className="text-red-400" /> <span className="text-red-400">Mất kết nối</span></>
              )}
            </div>

            <div className="flex items-center gap-2 text-3xl font-mono font-bold bg-slate-800 px-6 py-2 rounded-full border border-slate-700">
              <Clock size={24} className={timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-slate-400'} />
              <span className={timeLeft <= 30 ? 'text-red-500' : 'text-white'}>
                {formatTime(timeLeft)}
              </span>
            </div>
            {!isRunning && !gameOver && (
              <button 
                onClick={handleStart}
                className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-full font-bold transition-transform hover:scale-105"
              >
                <Play size={20} /> Bắt Đầu Trận Chiến
              </button>
            )}
            {gameOver && (
              <button 
                onClick={handleStart}
                className="mt-4 flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-full font-bold transition-transform hover:scale-105"
              >
                <RotateCcw size={20} /> Chơi Lại Ngay
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 w-1/3 justify-end">
            <div className="text-right">
              <h1 className="text-2xl font-black text-violet-400 drop-shadow-md">NHO THỊ</h1>
              <div className="flex items-center justify-end gap-2 text-violet-300 mt-1">
                <span className="font-bold">{Math.ceil(Math.max(0, uiStats.team2BaseHp))} / {BASE_MAX_HP}</span>
                <Shield size={16} />
              </div>
              <p className="text-xs text-slate-500 mt-1">Lính: {uiStats.team2Units} | Diệt: {uiStats.team2Kills}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Team 1 */}
        <div className="w-80 flex-shrink-0 border-r border-slate-800">
          <ControlPanel 
            team={1} 
            teamName="Team Bơ Thị 🥑" 
            colorClass="border-emerald-500"
            onSpawn={spawnUnits}
            disabled={!isRunning}
          />
        </div>

        {/* Battlefield Canvas */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden p-4">
          {/* Container tỷ lệ 9:16 */}
          <div className="relative h-full max-h-[960px] aspect-[9/16] rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-full object-contain bg-slate-800"
            />
            
            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-500 text-center p-4">
                <Trophy size={80} className="text-yellow-400 mb-6 animate-bounce" />
                <h2 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  TRẬN CHIẾN KẾT THÚC!
                </h2>
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {winner === 1 ? 'BƠ THỊ PHÁ HỦY TRỤ THÀNH CÔNG! 🥑' : 
                   winner === 2 ? 'NHO THỊ PHÁ HỦY TRỤ THÀNH CÔNG! 🍇' : 
                   'TRẬN ĐẤU HÒA! 🤝'}
                </div>
                <div className="text-lg md:text-xl text-slate-300 mb-6">
                  Bơ Thị: {Math.ceil(Math.max(0, uiStats.team1BaseHp))} HP | Nho Thị: {Math.ceil(Math.max(0, uiStats.team2BaseHp))} HP
                </div>
                
                <div className="text-base md:text-lg text-slate-400 animate-pulse mb-6">
                  Tự động bắt đầu lại sau {restartCountdown} giây...
                </div>

                <button 
                  onClick={handleStart}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-8 py-3 rounded-full font-bold transition-transform hover:scale-105"
                >
                  <RotateCcw size={20} /> Chơi Lại Ngay
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Team 2 */}
        <div className="w-80 flex-shrink-0 border-l border-slate-800">
          <ControlPanel 
            team={2} 
            teamName="Team Nho Thị 🍇" 
            colorClass="border-violet-500"
            onSpawn={spawnUnits}
            disabled={!isRunning}
          />
        </div>
      </main>
    </div>
  );
}
