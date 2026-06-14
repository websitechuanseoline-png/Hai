import { useEffect, useRef, useState, useCallback } from 'react';
import { Unit, TeamId, UnitType, GameStats } from '../types';
import { UNIT_CONFIG, TEAM_1_COLOR, TEAM_2_COLOR, AUTO_SPAWN_INTERVAL_MS, BASE_MAX_HP, BASE_WIDTH } from '../constants';
import { soundManager } from '../utils/sound';

interface UseGameEngineProps {
  width: number;
  height: number;
  onGameOver: (winner: TeamId | 0) => void;
}

// Kích thước của mỗi phân vùng không gian (bucket)
const BUCKET_SIZE = 60; 

export const useGameEngine = ({ width, height, onGameOver }: UseGameEngineProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const team1Ref = useRef<Unit[]>([]);
  const team2Ref = useRef<Unit[]>([]);
  
  const statsRef = useRef<GameStats>({ 
    team1Kills: 0, team2Kills: 0, 
    team1Units: 0, team2Units: 0,
    team1BaseHp: BASE_MAX_HP, team2BaseHp: BASE_MAX_HP
  });
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const autoSpawnTimerRef = useRef<number>(0);
  const isRunningRef = useRef(false);

  const lastHitSoundTimeRef = useRef<number>(0);
  const lastBaseHitSoundTimeRef = useRef<number>(0);

  // Refs for images
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const explosionImgRef = useRef<HTMLCanvasElement | null>(null);

  const [uiStats, setUiStats] = useState<GameStats>({ 
    team1Kills: 0, team2Kills: 0, 
    team1Units: 0, team2Units: 0,
    team1BaseHp: BASE_MAX_HP, team2BaseHp: BASE_MAX_HP
  });
  const [isRunning, setIsRunning] = useState(false);

  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  // Load background & pre-render explosion
  useEffect(() => {
    const bgImg = new Image();
    bgImg.src = 'https://storage.googleapis.com/generativeai-downloads/images/battlefield.jpeg';
    bgImgRef.current = bgImg;

    // Pre-render explosion
    const expCanvas = document.createElement('canvas');
    expCanvas.width = 64;
    expCanvas.height = 64;
    const ctx = expCanvas.getContext('2d');
    if (ctx) {
      ctx.font = '40px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💥', 32, 32);
      explosionImgRef.current = expCanvas;
    }
  }, []);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Thêm tham số avatarUrl
  const spawnUnits = useCallback((team: TeamId, count: number, type: UnitType, avatarUrl?: string) => {
    const newUnits: Unit[] = [];
    const config = UNIT_CONFIG[type];
    const color = team === 1 ? TEAM_1_COLOR : TEAM_2_COLOR;
    
    for (let i = 0; i < count; i++) {
      const spawnX = team === 1 ? BASE_WIDTH + Math.random() * 20 : width - BASE_WIDTH - Math.random() * 20;
      const spawnY = 150 + Math.random() * (height - 250);
      const id = generateId();
      
      // Sử dụng Avatar thật từ TikTok, nếu không có thì dùng ảnh ngẫu nhiên
      const img = new Image();
      // Thêm crossOrigin để tránh lỗi canvas bị tainted khi vẽ ảnh từ domain khác
      img.crossOrigin = "anonymous"; 
      img.src = avatarUrl || `https://picsum.photos/seed/${id}/64/64`;
      
      newUnits.push({
        id,
        team,
        type,
        x: spawnX,
        y: spawnY,
        hp: config.hp,
        maxHp: config.hp,
        speed: config.speed * (0.8 + Math.random() * 0.4),
        damage: config.damage,
        attackRange: config.attackRange,
        lastAttackTime: 0,
        color,
        radius: config.radius,
        image: img
      });
    }
    
    if (team === 1) {
      team1Ref.current.push(...newUnits);
    } else {
      team2Ref.current.push(...newUnits);
    }
    
    updateStats();

    if (type === 'super') soundManager.playSpawnSuper();
    else soundManager.playSpawnNormal();
  }, [width, height]);

  const updateStats = useCallback(() => {
    statsRef.current.team1Units = team1Ref.current.length;
    statsRef.current.team2Units = team2Ref.current.length;
  }, []);

  const stopGame = useCallback(() => {
    setIsRunning(false);
    isRunningRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    const s = statsRef.current;
    let winner: TeamId | 0 = 0;
    if (s.team1BaseHp > s.team2BaseHp) winner = 1;
    else if (s.team2BaseHp > s.team1BaseHp) winner = 2;
    
    soundManager.playWin();
    onGameOverRef.current(winner);
  }, []);

  const updatePhysics = useCallback((now: number) => {
    const t1 = team1Ref.current;
    const t2 = team2Ref.current;
    
    const t1ToRemove = new Set<string>();
    const t2ToRemove = new Set<string>();
    
    const damagesToApply: { target: Unit, damage: number, attackerTeam: TeamId }[] = [];
    let playedHitSoundThisFrame = false;
    let playedBaseHitSoundThisFrame = false;

    const numBuckets = Math.ceil(width / BUCKET_SIZE);
    const t1Buckets: Unit[][] = Array.from({ length: numBuckets }, () => []);
    const t2Buckets: Unit[][] = Array.from({ length: numBuckets }, () => []);

    for (let i = 0; i < t1.length; i++) {
      const u = t1[i];
      if (u.hp > 0) {
        const bIdx = Math.max(0, Math.min(numBuckets - 1, Math.floor(u.x / BUCKET_SIZE)));
        t1Buckets[bIdx].push(u);
      }
    }
    for (let i = 0; i < t2.length; i++) {
      const u = t2[i];
      if (u.hp > 0) {
        const bIdx = Math.max(0, Math.min(numBuckets - 1, Math.floor(u.x / BUCKET_SIZE)));
        t2Buckets[bIdx].push(u);
      }
    }

    const findNearestEnemy = (unit: Unit, enemyBuckets: Unit[][]) => {
      let nearest: Unit | null = null;
      let minDist = Infinity;
      const bIdx = Math.floor(unit.x / BUCKET_SIZE);
      
      const startBucket = Math.max(0, bIdx - 2);
      const endBucket = Math.min(numBuckets - 1, bIdx + 2);

      for (let b = startBucket; b <= endBucket; b++) {
        const enemiesInBucket = enemyBuckets[b];
        for (let j = 0; j < enemiesInBucket.length; j++) {
          const enemy = enemiesInBucket[j];
          if (enemy.hp <= 0) continue;
          
          if (Math.abs(unit.x - enemy.x) > 150 || Math.abs(unit.y - enemy.y) > 150) continue;

          const dist = Math.hypot(unit.x - enemy.x, unit.y - enemy.y);
          if (dist < minDist) {
            minDist = dist;
            nearest = enemy;
          }
        }
      }
      return { nearest, minDist };
    };

    const processTeam = (
      units: Unit[], 
      enemyBuckets: Unit[][], 
      isTeam1: boolean
    ) => {
      for (let i = 0; i < units.length; i++) {
        const unit = units[i];
        if (unit.hp <= 0) continue;

        const { nearest: targetEnemy, minDist: minDistToTarget } = findNearestEnemy(unit, enemyBuckets);

        let attackingBase = false;
        const config = UNIT_CONFIG[unit.type];

        if (isTeam1 && unit.x + unit.attackRange + unit.radius >= width - BASE_WIDTH) {
          attackingBase = true;
          if (now - unit.lastAttackTime > config.cooldown) {
            statsRef.current.team2BaseHp -= unit.damage;
            unit.lastAttackTime = now;
            if (!playedBaseHitSoundThisFrame && now - lastBaseHitSoundTimeRef.current > 100) {
              soundManager.playBaseHit();
              lastBaseHitSoundTimeRef.current = now;
              playedBaseHitSoundThisFrame = true;
            }
          }
        } else if (!isTeam1 && unit.x - unit.attackRange - unit.radius <= BASE_WIDTH) {
          attackingBase = true;
          if (now - unit.lastAttackTime > config.cooldown) {
            statsRef.current.team1BaseHp -= unit.damage;
            unit.lastAttackTime = now;
            if (!playedBaseHitSoundThisFrame && now - lastBaseHitSoundTimeRef.current > 100) {
              soundManager.playBaseHit();
              lastBaseHitSoundTimeRef.current = now;
              playedBaseHitSoundThisFrame = true;
            }
          }
        }

        if (!attackingBase && targetEnemy && minDistToTarget <= unit.attackRange + targetEnemy.radius) {
          if (now - unit.lastAttackTime > config.cooldown) {
            damagesToApply.push({ target: targetEnemy, damage: unit.damage, attackerTeam: unit.team });
            unit.lastAttackTime = now;
            
            if (!playedHitSoundThisFrame && now - lastHitSoundTimeRef.current > 50) {
              soundManager.playHit();
              lastHitSoundTimeRef.current = now;
              playedHitSoundThisFrame = true;
            }
          }
        } else if (!attackingBase) {
          let targetX = isTeam1 ? width : 0;
          let targetY = unit.y;

          if (targetEnemy) {
            targetX = targetEnemy.x;
            targetY = targetEnemy.y;
          }

          const dx = targetX - unit.x;
          const dy = targetY - unit.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 0) {
            unit.x += (dx / dist) * unit.speed;
            unit.y += (dy / dist) * unit.speed;
          }

          if (unit.y < 10) unit.y = 10;
          if (unit.y > height - 10) unit.y = height - 10;
        }
      }
    };

    processTeam(t1, t2Buckets, true);
    processTeam(t2, t1Buckets, false);

    for (let i = 0; i < damagesToApply.length; i++) {
      const d = damagesToApply[i];
      if (d.target.hp > 0) {
        d.target.hp -= d.damage;
        if (d.target.hp <= 0) {
          if (d.target.team === 1) t1ToRemove.add(d.target.id);
          else t2ToRemove.add(d.target.id);
          
          if (d.attackerTeam === 1) statsRef.current.team1Kills++;
          else statsRef.current.team2Kills++;
        }
      }
    }

    if (t1ToRemove.size > 0) {
      team1Ref.current = t1.filter(u => !t1ToRemove.has(u.id));
    }
    if (t2ToRemove.size > 0) {
      team2Ref.current = t2.filter(u => !t2ToRemove.has(u.id));
    }
    
    if (t1ToRemove.size > 0 || t2ToRemove.size > 0) {
      updateStats();
    }
  }, [width, height, updateStats]);

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (bgImgRef.current && bgImgRef.current.complete && bgImgRef.current.naturalHeight !== 0) {
      ctx.drawImage(bgImgRef.current, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.fillRect(0, 0, BASE_WIDTH, height);
      ctx.strokeStyle = TEAM_1_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(BASE_WIDTH, 0);
      ctx.lineTo(BASE_WIDTH, height);
      ctx.stroke();

      ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
      ctx.fillRect(width - BASE_WIDTH, 0, BASE_WIDTH, height);
      ctx.strokeStyle = TEAM_2_COLOR;
      ctx.beginPath();
      ctx.moveTo(width - BASE_WIDTH, 0);
      ctx.lineTo(width - BASE_WIDTH, height);
      ctx.stroke();
    }

    const barWidth = (width / 2) - 30;
    const barHeight = 24;
    const topMargin = 110;

    // Team 1 HP Bar
    const t1Hp = Math.max(0, statsRef.current.team1BaseHp);
    const t1Pct = t1Hp / BASE_MAX_HP;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(20, topMargin, barWidth, barHeight);
    ctx.fillStyle = TEAM_1_COLOR;
    ctx.fillRect(20, topMargin, barWidth * t1Pct, barHeight);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, topMargin, barWidth, barHeight);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`BƠ THỊ: ${Math.ceil(t1Hp)}`, 28, topMargin + barHeight / 2);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText(`Lính: ${statsRef.current.team1Units} | Diệt: ${statsRef.current.team1Kills}`, 20, topMargin + barHeight + 16);

    // Team 2 HP Bar
    const t2Hp = Math.max(0, statsRef.current.team2BaseHp);
    const t2Pct = t2Hp / BASE_MAX_HP;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(width - barWidth - 20, topMargin, barWidth, barHeight);
    ctx.fillStyle = TEAM_2_COLOR;
    ctx.fillRect(width - 20 - (barWidth * t2Pct), topMargin, barWidth * t2Pct, barHeight);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(width - barWidth - 20, topMargin, barWidth, barHeight);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText(`NHO THỊ: ${Math.ceil(t2Hp)}`, width - 28, topMargin + barHeight / 2);
    
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText(`Lính: ${statsRef.current.team2Units} | Diệt: ${statsRef.current.team2Kills}`, width - 20, topMargin + barHeight + 16);

    const allUnits = [...team1Ref.current, ...team2Ref.current];
    
    for (let i = 0; i < allUnits.length; i++) {
      const unit = allUnits[i];
      
      ctx.save();
      ctx.translate(unit.x, unit.y);
      
      let facingDir = unit.team === 1 ? 1 : -1;
      
      const seed = parseInt(unit.id, 36) || 0;
      const wobbleAngle = Math.sin(time / 100 + seed) * 0.15;
      ctx.rotate(wobbleAngle);

      const timeSinceAttack = time - unit.lastAttackTime;
      const isAttacking = timeSinceAttack < 150;
      const scale = isAttacking ? 1.3 : 1;
      
      ctx.scale(facingDir * scale, scale);

      const drawSize = unit.radius * 3.5; 

      // Vẽ Avatar User
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, drawSize / 2, 0, Math.PI * 2);
      ctx.clip();
      
      if (unit.image && unit.image.complete && unit.image.naturalHeight !== 0) {
        ctx.drawImage(unit.image, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else {
        ctx.fillStyle = '#334155'; // slate-700 placeholder
        ctx.fill();
      }
      ctx.restore();

      // Vẽ Border Team (Xanh lá hoặc Tím)
      ctx.beginPath();
      ctx.arc(0, 0, drawSize / 2, 0, Math.PI * 2);
      ctx.lineWidth = unit.type === 'super' ? 4 : 2;
      ctx.strokeStyle = unit.team === 1 ? TEAM_1_COLOR : TEAM_2_COLOR;
      ctx.stroke();

      // Vòng sáng phụ cho siêu nhân
      if (unit.type === 'super') {
        ctx.beginPath();
        ctx.arc(0, 0, drawSize / 2 + 6, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fbbf24';
        ctx.stroke();
      }

      ctx.restore();
      
      if (isAttacking && explosionImgRef.current) {
        const expSize = unit.radius * 2.5;
        ctx.drawImage(
          explosionImgRef.current, 
          unit.x + (facingDir * unit.radius) - expSize/2, 
          unit.y - unit.radius - expSize/2, 
          expSize, 
          expSize
        );
      }

      if (unit.type === 'super') {
        const hpPercent = unit.hp / unit.maxHp;
        const uBarWidth = 30;
        const uBarHeight = 5;
        const yOffset = (unit.radius * 3.5) / 2 + 12;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(unit.x - uBarWidth/2, unit.y - yOffset, uBarWidth, uBarHeight);
        ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : '#ef4444';
        ctx.fillRect(unit.x - uBarWidth/2, unit.y - yOffset, uBarWidth * hpPercent, uBarHeight);
      }
    }
  }, [width, height]);

  const gameLoop = useCallback((time: number) => {
    if (!isRunningRef.current) return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    autoSpawnTimerRef.current += deltaTime;
    if (autoSpawnTimerRef.current >= AUTO_SPAWN_INTERVAL_MS) {
      spawnUnits(1, 2, 'normal');
      spawnUnits(2, 2, 'normal');
      autoSpawnTimerRef.current = 0;
    }

    updatePhysics(time);
    draw(time);

    if (statsRef.current.team1BaseHp <= 0 || statsRef.current.team2BaseHp <= 0) {
      stopGame();
      return;
    }

    if (Math.floor(time / 100) !== Math.floor((time - deltaTime) / 100)) {
       setUiStats({ ...statsRef.current });
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [spawnUnits, stopGame, updatePhysics, draw]);

  const startGame = useCallback(() => {
    team1Ref.current = [];
    team2Ref.current = [];
    statsRef.current = { 
      team1Kills: 0, team2Kills: 0, 
      team1Units: 0, team2Units: 0,
      team1BaseHp: BASE_MAX_HP, team2BaseHp: BASE_MAX_HP
    };
    setUiStats(statsRef.current);
    setIsRunning(true);
    isRunningRef.current = true;
    lastTimeRef.current = performance.now();
    autoSpawnTimerRef.current = 0;
    
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return {
    canvasRef,
    uiStats,
    spawnUnits,
    startGame,
    stopGame,
    isRunning
  };
};
