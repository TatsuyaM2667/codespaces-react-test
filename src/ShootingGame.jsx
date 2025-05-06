import React, { useState, useRef, useEffect } from 'react';

const ShootingGame = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // ゲーム状態を保持するRef
  const gameStateRef = useRef({
    player: null,
    enemies: [],
    bullets: [],
    config: null,
    ctx: null,
    isDragging: false,
    animationFrameId: null
  });

  // ゲームの初期化
  const initGame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // ゲーム設定
    const config = {
      width: 400,
      height: 600,
      playerSize: 40,
      enemySize: 30,
      bulletSize: 10,
      playerColor: '#4CAF50',
      enemyColor: '#F44336',
      bulletColor: '#2196F3'
    };

    // ゲーム状態の更新
    gameStateRef.current = {
      player: { x: config.width / 2, y: config.height - 100 },
      enemies: [],
      bullets: [],
      config: config,
      ctx: ctx,
      isDragging: false,
      animationFrameId: null
    };

    // 敵の生成
    const createEnemy = () => {
      const { enemies, config } = gameStateRef.current;
      const x = Math.random() * (config.width - config.enemySize);
      enemies.push({ x, y: 0 });
    };

    // ゲームループ
    const gameLoop = () => {
      const { player, enemies, bullets, config, ctx } = gameStateRef.current;

      ctx.clearRect(0, 0, config.width, config.height);

      // 敵の生成と移動
      if (Math.random() < 0.03) createEnemy();
      
      // 弾丸と敵の当たり判定をここに移動
      for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
          const bullet = bullets[i];
          const enemy = enemies[j];
          
          if (
            bullet &&
            enemy &&
            bullet.x < enemy.x + config.enemySize &&
            bullet.x + config.bulletSize > enemy.x &&
            bullet.y < enemy.y + config.enemySize &&
            bullet.y + config.bulletSize > enemy.y
          ) {
            // 敵と弾丸を削除
            enemies.splice(j, 1);
            bullets.splice(i, 1);
            
            // スコア更新
            setScore(prevScore => prevScore + 1);
            
            // ループを抜ける（1つの弾丸は1体の敵にのみ当たる）
            break;
          }
        }
      }

      // 敵の移動と画面外チェック
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += 3;
        
        ctx.fillStyle = config.enemyColor;
        ctx.fillRect(enemy.x, enemy.y, config.enemySize, config.enemySize);

        // 敵の画面外チェック
        if (enemy.y > config.height) {
          enemies.splice(i, 1);
        }
      }

      // 弾丸の移動と画面外チェック
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= 5;
        
        ctx.fillStyle = config.bulletColor;
        ctx.fillRect(bullet.x, bullet.y, config.bulletSize, config.bulletSize);

        // 弾丸の画面外チェック
        if (bullet.y < 0) {
          bullets.splice(i, 1);
        }
      }

      // プレイヤーの描画
      ctx.fillStyle = config.playerColor;
      ctx.fillRect(
        player.x, 
        player.y, 
        config.playerSize, 
        config.playerSize
      );

      // ゲームオーバー判定
      const gameOverCheck = enemies.some(enemy => 
        enemy.y + config.enemySize > config.height - 100
      );

      if (gameOverCheck) {
        setGameOver(true);
      } else {
        // アニメーションフレームIDを保存
        gameStateRef.current.animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    // キャンバスサイズ設定
    canvas.width = config.width;
    canvas.height = config.height;

    // ゲームループ開始
    gameLoop();
  };

  // 弾丸の生成
  const createBullet = (event) => {
    if (gameOver) {
      initGame();
      setGameOver(false);
      setScore(0);
      return;
    }

    const { player, bullets, config } = gameStateRef.current;
    const bulletX = player.x + config.playerSize / 2 - config.bulletSize / 2;
    const bulletY = player.y;
    bullets.push({ x: bulletX, y: bulletY });
  };

  // プレイヤーの移動ハンドラ
  const handlePlayerMove = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const { player, config, isDragging } = gameStateRef.current;

    // タッチイベントとマウスイベントの座標を取得
    const clientX = event.touches 
      ? event.touches[0].clientX 
      : event.clientX;

    // キャンバスの位置を取得
    const rect = canvas.getBoundingClientRect();
    
    // 新しいプレイヤー位置を計算
    const newX = clientX - rect.left - config.playerSize / 2;
    
    // プレイヤーの移動範囲を制限
    const limitedX = Math.max(
      0, 
      Math.min(newX, config.width - config.playerSize)
    );

    // ゲーム状態を更新
    if (player) {
      player.x = limitedX;
    }
  };

  // ドラッグ開始
  const handleDragStart = (event) => {
    event.preventDefault();
    gameStateRef.current.isDragging = true;
    handlePlayerMove(event);
  };

  // ドラッグ中
  const handleDragMove = (event) => {
    event.preventDefault();
    const { isDragging } = gameStateRef.current;
    if (isDragging) {
      handlePlayerMove(event);
    }
  };

  // ドラッグ終了
  const handleDragEnd = (event) => {
    event.preventDefault();
    gameStateRef.current.isDragging = false;
  };

  // コンポーネントマウント時にゲーム初期化とイベントリスナー追加
  useEffect(() => {
    initGame();
    const canvas = canvasRef.current;

    // マウスイベントリスナー
    canvas.addEventListener('mousedown', handleDragStart);
    canvas.addEventListener('mousemove', handleDragMove);
    canvas.addEventListener('mouseup', handleDragEnd);
    canvas.addEventListener('mouseleave', handleDragEnd);

    // タッチイベントリスナー
    canvas.addEventListener('touchstart', handleDragStart);
    canvas.addEventListener('touchmove', handleDragMove);
    canvas.addEventListener('touchend', handleDragEnd);

    // クリーンアップ関数
    return () => {
      // アニメーションフレームをキャンセル
      const { animationFrameId } = gameStateRef.current;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      canvas.removeEventListener('mousedown', handleDragStart);
      canvas.removeEventListener('mousemove', handleDragMove);
      canvas.removeEventListener('mouseup', handleDragEnd);
      canvas.removeEventListener('mouseleave', handleDragEnd);
      canvas.removeEventListener('touchstart', handleDragStart);
      canvas.removeEventListener('touchmove', handleDragMove);
      canvas.removeEventListener('touchend', handleDragEnd);
    };
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold">クリックシューティングゲーム</h2>
        <p>スコア: {score}</p>
        {gameOver && <p className="text-red-500">ゲームオーバー！クリックでリスタート</p>}
      </div>
      <canvas 
        ref={canvasRef} 
        onClick={createBullet}
        className="border-2 border-gray-300 touch-none"
      />
      <p className="mt-2 text-sm text-gray-600">
        プレイヤーをドラッグまたはタッチして移動、クリックで弾を撃つ
      </p>
    </div>
  );
};

export default ShootingGame;