/**
 * Chatbot.tsx
 * Module Chatbot AI - Hỏi đáp thông tin ao nuôi
 * Tích hợp điều khiển giọng nói (Web Speech API)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  User,
  Mic,
  MicOff,
  Send,
  RotateCcw,
  Zap,
  ThermometerSun,
  Droplets,
  Wind,
  Cpu,
  Fish,
} from 'lucide-react';
import { MOCK_DEVICES, MOCK_SENSORS, MOCK_PONDS, MOCK_ZONES } from '../../data/mockData';

// ===== TYPES =====

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  type?: 'text' | 'device-list' | 'sensor-data';
}

// ===== AI RESPONSE LOGIC =====
// Hệ thống rule-based đơn giản - có thể thay bằng OpenAI API thực tế

const generateBotResponse = (userMessage: string): string => {
  const msg = userMessage.toLowerCase().trim();

  // Hỏi về nhiệt độ
  if (msg.includes('nhiệt độ') || msg.includes('temperature') || msg.includes('nóng') || msg.includes('lạnh')) {
    const tempSensors = MOCK_SENSORS.filter((s) => s.type === 'temperature');
    const abnormal = tempSensors.filter((s) => s.status !== 'normal');
    if (abnormal.length > 0) {
      const list = abnormal.map((s) => {
        const pond = MOCK_PONDS.find((p) => p.id === s.pondId);
        return `• ${pond?.name}: ${s.currentValue}°C (${s.status === 'warning' ? '⚠️ Cảnh báo' : '🔴 Nguy hiểm'})`;
      }).join('\n');
      return `Phát hiện ${abnormal.length} ao có nhiệt độ bất thường:\n\n${list}\n\nTôi khuyến nghị kiểm tra hệ thống làm mát và đảm bảo che nắng cho ao.`;
    }
    const avg = (tempSensors.reduce((s, t) => s + t.currentValue, 0) / tempSensors.length).toFixed(1);
    return `✅ Nhiệt độ các ao đang trong ngưỡng bình thường. Nhiệt độ trung bình hệ thống: **${avg}°C**.\n\nTất cả ${tempSensors.length} cảm biến nhiệt độ hoạt động bình thường.`;
  }

  // Hỏi về pH
  if (msg.includes('ph') || msg.includes('axit') || msg.includes('kiềm')) {
    const phSensors = MOCK_SENSORS.filter((s) => s.type === 'ph');
    const critical = phSensors.filter((s) => s.status === 'critical');
    if (critical.length > 0) {
      const pond = MOCK_PONDS.find((p) => p.id === critical[0].pondId);
      return `🔴 Phát hiện pH bất thường tại ${pond?.name}: **${critical[0].currentValue}** (ngưỡng: ${critical[0].minThreshold} - ${critical[0].maxThreshold})\n\nKhuyến nghị:\n• Kiểm tra và điều chỉnh pH ngay\n• Sử dụng vôi để tăng pH hoặc giấm để giảm pH\n• Tăng cường sục khí để ổn định pH`;
    }
    return `✅ Độ pH các ao đang trong ngưỡng cho phép. Tôi sẽ tiếp tục theo dõi và cảnh báo nếu có biến động.`;
  }

  // Hỏi về oxy/DO
  if (msg.includes('oxy') || msg.includes('do') || msg.includes('sục khí') || msg.includes('oxygen')) {
    const doSensors = MOCK_SENSORS.filter((s) => s.type === 'do');
    const critical = doSensors.filter((s) => s.status === 'critical');
    if (critical.length > 0) {
      const pond = MOCK_PONDS.find((p) => p.id === critical[0].pondId);
      return `🚨 KHẨN CẤP - Nồng độ oxy hòa tan thấp tại **${pond?.name}**: ${critical[0].currentValue} mg/L (tối thiểu: ${critical[0].minThreshold} mg/L)\n\n⚡ Khuyến nghị hành động ngay:\n1. BẬT tất cả máy sục khí trong ao\n2. Tăng lưu lượng bơm nước mới\n3. Ngưng cho ăn tạm thời\n4. Theo dõi liên tục mỗi 15 phút`;
    }
    return `✅ Nồng độ oxy hòa tan (DO) đang trong ngưỡng an toàn cho tất cả các ao.\n\nCác máy sục khí đang hoạt động hiệu quả. Tôi sẽ cảnh báo ngay nếu DO xuống dưới 4.0 mg/L.`;
  }

  // Hỏi về máy bơm
  if (msg.includes('máy bơm') || msg.includes('pump') || msg.includes('bơm nước')) {
    const pumps = MOCK_DEVICES.filter((d) => d.type === 'pump');
    const active = pumps.filter((d) => d.isActive && d.isOnline).length;
    const offline = pumps.filter((d) => !d.isOnline).length;
    return `📊 Trạng thái Máy Bơm (${pumps.length} thiết bị):\n• 🟢 Đang chạy: ${active}\n• ⚫ Đang tắt: ${pumps.length - active - offline}\n• 🔴 Offline: ${offline}\n\nBạn muốn tôi bật/tắt máy bơm nào không? Ví dụ: "Bật máy bơm A1" hoặc "Tắt tất cả máy bơm khu A".`;
  }

  // Lệnh bật thiết bị
  if (msg.includes('bật') || msg.includes('khởi động') || msg.includes('turn on')) {
    if (msg.includes('sục khí')) {
      return `🟢 Đã nhận lệnh BẬT máy sục khí.\n\nĐể thực hiện an toàn, vui lòng:\n1. Vào trang **Điều Khiển Thiết Bị**\n2. Chọn thiết bị cần bật\n3. Chuyển sang chế độ **Thủ công**\n4. Toggle công tắc sang ON\n\n💡 Hoặc tôi có thể hướng dẫn bạn thiết lập lịch tự động dựa trên DO.`;
    }
    return `🟢 Đã nhận lệnh bật thiết bị. Vui lòng vào trang **Điều Khiển Thiết Bị** để thực hiện lệnh một cách an toàn.\n\nLưu ý: Nên xác nhận trước khi bật/tắt thiết bị để tránh ảnh hưởng đến môi trường ao nuôi.`;
  }

  // Hỏi về thiết bị offline
  if (msg.includes('offline') || msg.includes('mất kết nối') || msg.includes('không hoạt động')) {
    const offlineDevices = MOCK_DEVICES.filter((d) => !d.isOnline);
    if (offlineDevices.length === 0) {
      return `✅ Tất cả ${MOCK_DEVICES.length} thiết bị đều đang online và hoạt động bình thường!`;
    }
    const list = offlineDevices.map((d) => {
      const pond = MOCK_PONDS.find((p) => p.id === d.pondId);
      return `• ${d.name} (${pond?.name}) - Mất kết nối từ ${new Date(d.lastUpdated).toLocaleTimeString('vi-VN')}`;
    }).join('\n');
    return `⚠️ Phát hiện ${offlineDevices.length} thiết bị mất kết nối:\n\n${list}\n\nKhuyến nghị:\n1. Kiểm tra nguồn điện và kết nối WiFi\n2. Restart module WiFi của thiết bị\n3. Liên hệ kỹ thuật nếu không khắc phục được`;
  }

  // Hỏi tổng quan
  if (msg.includes('tổng quan') || msg.includes('báo cáo') || msg.includes('trạng thái') || msg.includes('tình trạng')) {
    const activeDevices = MOCK_DEVICES.filter((d) => d.isActive).length;
    const criticalSensors = MOCK_SENSORS.filter((s) => s.status === 'critical').length;
    const activePonds = MOCK_PONDS.filter((p) => p.status === 'active').length;
    return `📋 BÁO CÁO TỔNG QUAN HỆ THỐNG\n\n🏞️ Vùng ao: ${MOCK_ZONES.length} khu vực\n🐟 Ao đang nuôi: ${activePonds}/${MOCK_PONDS.length} ao\n⚡ Thiết bị hoạt động: ${activeDevices}/${MOCK_DEVICES.length} thiết bị\n🌡️ Cảm biến bất thường: ${criticalSensors} điểm\n\n${criticalSensors > 0 ? '🔴 Cần chú ý: Có cảm biến vượt ngưỡng cần xử lý!' : '✅ Tình trạng tổng thể: BÌNH THƯỜNG'}`;
  }

  // Hỏi về cho ăn/feed
  if (msg.includes('cho ăn') || msg.includes('thức ăn') || msg.includes('feeder')) {
    const feeders = MOCK_DEVICES.filter((d) => d.type === 'feeder');
    return `🐟 Thông tin máy cho ăn (${feeders.length} thiết bị):\n${feeders.map((f) => {
      const pond = MOCK_PONDS.find((p) => p.id === f.pondId);
      return `• ${f.name} (${pond?.name}): ${f.isOnline ? (f.isActive ? '🟢 Đang chạy' : '⚫ Đang tắt') : '🔴 Offline'}`;
    }).join('\n')}\n\nLịch cho ăn thông thường:\n• Buổi sáng: 06:30 - 07:00\n• Buổi chiều: 16:00 - 16:30`;
  }

  // Chào hỏi
  if (msg.includes('xin chào') || msg.includes('hello') || msg.includes('hi') || msg.match(/^chào/)) {
    return `Xin chào! 👋 Tôi là AquaBot - trợ lý AI cho hệ thống ao nuôi thủy sản thông minh.\n\nTôi có thể giúp bạn:\n• 🌡️ Kiểm tra nhiệt độ, pH, DO các ao\n• ⚡ Kiểm tra trạng thái thiết bị\n• 📊 Báo cáo tổng quan hệ thống\n• 🔔 Thông tin cảnh báo\n• 💡 Khuyến nghị xử lý sự cố\n\nBạn muốn hỏi gì?`;
  }

  // Cảm ơn
  if (msg.includes('cảm ơn') || msg.includes('thanks') || msg.includes('thank')) {
    return `Không có gì! 😊 Tôi luôn sẵn sàng hỗ trợ bạn. Nếu cần kiểm tra bất cứ điều gì về hệ thống ao nuôi, hãy hỏi tôi nhé!`;
  }

  // Default response
  return `Tôi hiểu bạn đang hỏi về: "${userMessage}"\n\nTôi có thể trả lời các câu hỏi về:\n• Nhiệt độ, pH, DO, độ đục\n• Trạng thái thiết bị (bơm, sục khí, máy cho ăn)\n• Cảnh báo và sự cố\n• Báo cáo tổng quan\n\nBạn có thể thử: "Nhiệt độ các ao hiện tại?", "Thiết bị nào đang offline?", "Báo cáo tổng quan hôm nay"`;
};

// ===== QUICK QUESTIONS =====

const QUICK_QUESTIONS = [
  { icon: <ThermometerSun size={14} />, text: 'Nhiệt độ các ao?' },
  { icon: <Droplets size={14} />, text: 'Độ pH hiện tại?' },
  { icon: <Wind size={14} />, text: 'Nồng độ oxy (DO)?' },
  { icon: <Cpu size={14} />, text: 'Thiết bị offline?' },
  { icon: <Fish size={14} />, text: 'Báo cáo tổng quan' },
  { icon: <Zap size={14} />, text: 'Trạng thái máy bơm?' },
];

// ===== MAIN COMPONENT =====

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: `Xin chào! 👋 Tôi là **AquaBot** - trợ lý AI cho hệ thống ao nuôi.\n\nTôi có thể giúp bạn kiểm tra nhiệt độ, pH, DO, trạng thái thiết bị, cảnh báo và nhiều hơn nữa!\n\nHãy nhập câu hỏi hoặc dùng nút **Thu âm** để điều khiển bằng giọng nói.`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Gửi tin nhắn
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Giả lập thời gian "đang gõ"
    const delay = 800 + Math.random() * 800;
    await new Promise((r) => setTimeout(r, delay));

    const botResponse = generateBotResponse(text.trim());
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      content: botResponse,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsTyping(false);
  }, []);

  // Xử lý Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  // Voice Input với Web Speech API
  const handleVoiceInput = useCallback(() => {
    // Kiểm tra browser support
    const SpeechRecognition =
      (window as typeof window & { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge.');
      return;
    }

    if (isRecording) {
      // Dừng thu âm
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    // Bắt đầu thu âm
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN'; // Tiếng Việt
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setRecordingText('Đang nghe...');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setRecordingText(transcript);
      setInputText(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setRecordingText('');
      // Tự động gửi nếu có text
      if (inputText.trim()) {
        setTimeout(() => sendMessage(inputText), 300);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setRecordingText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isRecording, inputText, sendMessage]);

  // Clear chat
  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'bot',
      content: 'Chat đã được xóa. Tôi sẵn sàng hỗ trợ bạn! Hãy đặt câu hỏi về hệ thống ao nuôi.',
      timestamp: new Date(),
    }]);
  };

  // Format message content (parse **bold** và \n)
  const formatContent = (content: string) => {
    return content.split('\n').map((line, lineIdx) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={lineIdx}>
          {parts.map((part, i) =>
            i % 2 === 1 ? (
              <strong key={i} className="font-semibold">
                {part}
              </strong>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
          {lineIdx < content.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-8rem)]">
      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#0A3622] to-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center">
              <Bot size={20} className="text-[#0A3622]" />
            </div>
            <div>
              <p className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>AquaBot AI</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-emerald-300" style={{ fontSize: '12px' }}>Online • Đang giám sát {MOCK_PONDS.length} ao</p>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Xóa chat"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === 'bot' ? 'bg-[#0A3622]' : 'bg-emerald-600'
                }`}
              >
                {message.role === 'bot' ? (
                  <Bot size={16} className="text-emerald-400" />
                ) : (
                  <User size={16} className="text-white" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}
              >
                <p
                  className={message.role === 'user' ? 'text-white' : 'text-gray-800'}
                  style={{ fontSize: '13px', lineHeight: 1.6 }}
                >
                  {formatContent(message.content)}
                </p>
                <p
                  className={`mt-1 ${message.role === 'user' ? 'text-emerald-200' : 'text-gray-400'}`}
                  style={{ fontSize: '10px' }}
                >
                  {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0A3622] flex items-center justify-center shrink-0">
                <Bot size={16} className="text-emerald-400" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 border border-gray-100 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="px-5 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <span className="text-red-600" style={{ fontSize: '13px' }}>
              {recordingText || 'Đang nghe... Nói câu hỏi của bạn'}
            </span>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-100 p-4 bg-white">
          <form onSubmit={handleSubmit} className="flex gap-2">
            {/* Voice Button */}
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`p-3 rounded-xl transition-all shrink-0 ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isRecording ? 'Dừng thu âm' : 'Thu âm giọng nói (vi-VN)'}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập câu hỏi hoặc lệnh điều khiển..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              style={{ fontSize: '14px' }}
              disabled={isRecording}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl transition-colors shrink-0"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Quick Questions Sidebar */}
      <div className="lg:w-64 space-y-4">
        {/* Quick Questions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-gray-700 mb-3" style={{ fontSize: '13px', fontWeight: 600 }}>
            💬 Câu hỏi nhanh
          </p>
          <div className="space-y-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q.text}
                onClick={() => sendMessage(q.text)}
                disabled={isTyping}
                className="w-full flex items-center gap-2 p-2.5 text-left bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors disabled:opacity-50 text-gray-600"
              >
                <span className="text-gray-400">{q.icon}</span>
                <span style={{ fontSize: '12px' }}>{q.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Guide */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mic size={16} className="text-emerald-600" />
            <p className="text-emerald-800" style={{ fontSize: '13px', fontWeight: 600 }}>
              Điều khiển giọng nói
            </p>
          </div>
          <p className="text-emerald-700 mb-3" style={{ fontSize: '12px', lineHeight: 1.6 }}>
            Nhấn nút 🎤 và nói câu lệnh bằng tiếng Việt:
          </p>
          <div className="space-y-1.5">
            {[
              '"Nhiệt độ ao A1 là bao nhiêu?"',
              '"Thiết bị nào đang offline?"',
              '"Bật máy sục khí khu A"',
              '"Báo cáo tổng quan hôm nay"',
            ].map((example) => (
              <div key={example} className="bg-white/70 rounded-lg px-3 py-1.5">
                <p className="text-emerald-700" style={{ fontSize: '11px', fontStyle: 'italic' }}>
                  {example}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-gray-700 mb-3" style={{ fontSize: '13px', fontWeight: 600 }}>
            📡 Trạng thái hệ thống
          </p>
          <div className="space-y-2">
            {[
              { label: 'Adafruit IO', status: 'online' },
              { label: 'Cảm biến', status: MOCK_SENSORS.some((s) => s.status !== 'normal') ? 'warning' : 'online' },
              { label: 'Thiết bị', status: MOCK_DEVICES.some((d) => !d.isOnline) ? 'warning' : 'online' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-gray-500" style={{ fontSize: '12px' }}>{item.label}</span>
                <span className={`flex items-center gap-1 ${item.status === 'online' ? 'text-emerald-600' : 'text-amber-600'}`}
                  style={{ fontSize: '12px', fontWeight: 500 }}>
                  <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {item.status === 'online' ? 'Bình thường' : 'Cảnh báo'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
