import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot } from 'lucide-react';
import './RightTerminal.css';

interface RightTerminalProps {
	onClose: () => void;
}

interface Message {
	id: string;
	text: string;
	isUser: boolean;
	timestamp: Date;
}

const RightTerminal: React.FC<RightTerminalProps> = ({ onClose }) => {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: '1',
			text: "Hi! Select code or ask a question to get started.",
			isUser: false,
			timestamp: new Date()
		}
	]);
	const [inputValue, setInputValue] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSendMessage = async () => {
		if (!inputValue.trim() || isLoading) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			text: inputValue,
			isUser: true,
			timestamp: new Date()
		};

		setMessages(prev => [...prev, userMessage]);
		setInputValue('');
		setIsLoading(true);

		// Simulate AI response
		setTimeout(() => {
			const aiMessage: Message = {
				id: (Date.now() + 1).toString(),
				text: "I'm here to help you with your code! What would you like to know?",
				isUser: false,
				timestamp: new Date()
			};
			setMessages(prev => [...prev, aiMessage]);
			setIsLoading(false);
		}, 1000);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	return (
		<div className="ai-assistant-container">
			{/* Header */}
			<div className="ai-assistant-header">
				<div className="ai-assistant-title">
					<Bot size={20} className="ai-icon" />
					<span>AI Assistant</span>
				</div>
				<button className="ai-assistant-close" onClick={onClose}>
					<X size={16} />
				</button>
			</div>

			{/* Messages Area */}
			<div className="ai-assistant-messages">
				{messages.map((message) => (
					<div
						key={message.id}
						className={`ai-message ${message.isUser ? 'user-message' : 'ai-message'}`}
					>
						<div className="ai-message-content">
							{message.text}
						</div>
						<div className="ai-message-time">
							{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
						</div>
					</div>
				))}
				{isLoading && (
					<div className="ai-message ai-message">
						<div className="ai-message-content">
							<div className="typing-indicator">
								<span></span>
								<span></span>
								<span></span>
							</div>
						</div>
					</div>
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Input Area */}
			<div className="ai-assistant-input-area">
				<div className="ai-input-container">
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder="Ask something about your code..."
						className="ai-input"
						disabled={isLoading}
					/>
					<button
						onClick={handleSendMessage}
						disabled={!inputValue.trim() || isLoading}
						className="ai-send-button"
					>
						<Send size={16} />
					</button>
				</div>
			</div>
		</div>
	);
};

export default RightTerminal;
