const { WebcastPushConnection } = require('tiktok-live-connector');
const { Server } = require('socket.io');

// Khởi tạo Socket.io server ở port 3001, cho phép Frontend kết nối (CORS)
const io = new Server(3001, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

console.log('🚀 Server WebSocket đang chạy tại cổng 3001...');

io.on('connection', (socket) => {
  console.log('🟢 Game (Frontend) đã kết nối tới Server!');

  let tiktokLiveConnection = null;

  // Lắng nghe yêu cầu kết nối TikTok ID từ Game
  socket.on('setUniqueId', (uniqueId) => {
    console.log(`⏳ Đang kết nối tới kênh TikTok: @${uniqueId}...`);
    
    // Khởi tạo kết nối với TikTok Live
    tiktokLiveConnection = new WebcastPushConnection(uniqueId);

    tiktokLiveConnection.connect().then(state => {
      console.log(`✅ Đã kết nối THÀNH CÔNG với livestream: ${state.roomId}`);
    }).catch(err => {
      console.error('❌ Lỗi kết nối TikTok:', err.message);
    });

    // 1. Lắng nghe sự kiện Bình luận (Chat)
    tiktokLiveConnection.on('chat', data => {
      console.log(`💬 [Chat] ${data.uniqueId}: ${data.comment}`);
      // Gửi dữ liệu về cho Game
      socket.emit('chat', { 
        uniqueId: data.uniqueId, 
        comment: data.comment 
      });
    });

    // 2. Lắng nghe sự kiện Tặng quà (Gift)
    tiktokLiveConnection.on('gift', data => {
      // Quà tặng liên tục (combo) sẽ gửi nhiều event. Chỉ lấy event cuối cùng khi combo kết thúc.
      if (data.giftType === 1 && !data.repeatEnd) return; 
      
      console.log(`🎁 [Gift] ${data.uniqueId} tặng: ${data.giftName} x${data.repeatCount}`);
      socket.emit('gift', { 
        uniqueId: data.uniqueId, 
        giftName: data.giftName, 
        repeatCount: data.repeatCount 
      });
    });

    // 3. Lắng nghe sự kiện Thả tim (Like)
    tiktokLiveConnection.on('like', data => {
      console.log(`❤️ [Like] ${data.uniqueId} thả ${data.likeCount} tim`);
      socket.emit('like', { 
        uniqueId: data.uniqueId, 
        likeCount: data.likeCount 
      });
    });
  });

  // Xử lý khi Game bị đóng hoặc ngắt kết nối
  socket.on('disconnect', () => {
    console.log('🔴 Game đã ngắt kết nối khỏi Server.');
    if (tiktokLiveConnection) {
      tiktokLiveConnection.disconnect();
    }
  });
});
