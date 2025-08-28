import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import EditorArea from './components/EditorArea';
import EnhancedTerminal from './components/EnhancedTerminal';
import AITerminal from './components/AITerminal';
import ThemeSelector from './components/ThemeSelector';
import TopBar from './components/TopBar';
import SettingsPanel from './components/SettingsPanel';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [activeFile, setActiveFile] = useState<string | null>(null);
	const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo'); // Add selected model state
	const [showSettings, setShowSettings] = useState(false);

	// Handle file changes, including clearing active file
	const handleFileChange = (filePath: string) => {
		if (filePath === '' || filePath === null) {
			setActiveFile(null);
		} else {
			setActiveFile(filePath);
		}
	};

	// Handle file deletion to close corresponding tab
	const handleFileDeleted = (filePath: string) => {
		// If the deleted file is currently active, clear it
		if (activeFile === filePath) {
			setActiveFile(null);
		}
		// Notify EditorArea to close the tab
		document.dispatchEvent(new CustomEvent('file-deleted', { detail: filePath }));
	};
	const [projectRoot, setProjectRoot] = useState<string | null>('E:\\Testing_Files');
	const [showTerminal, setShowTerminal] = useState(true); // Changed to true
	const [showAssistant, setShowAssistant] = useState(false);
	const [terminalHeight, setTerminalHeight] = useState(() => {
		// Load saved terminal height from localStorage, default to 300px
		const saved = localStorage.getItem('terminal-height');
		return saved ? parseFloat(saved) : 300;
	});
	const [isResizing, setIsResizing] = useState(false);

	// AI Assistant panel resize functionality
	const [assistantWidth, setAssistantWidth] = useState(() => {
		// Load saved assistant width from localStorage, default to 360px
		const saved = localStorage.getItem('assistant-width');
		return saved ? parseFloat(saved) : 360;
	});
	const [isResizingAssistant, setIsResizingAssistant] = useState(false);

	// Handle menu actions
	const handleMenuAction = (action: string) => {
		switch (action) {
			case 'new-text-file':
				// Trigger new file input in sidebar
				document.dispatchEvent(new CustomEvent('trigger-new-file'));
				break;
			case 'new-folder':
				// Trigger new folder input in sidebar
				document.dispatchEvent(new CustomEvent('trigger-new-folder'));
				break;
			case 'new-terminal':
				// Show terminal if hidden
				setShowTerminal(true);
				break;
			case 'toggle-left-sidebar':
				// Toggle sidebar collapse
				setSidebarCollapsed(!sidebarCollapsed);
				break;
			case 'toggle-bottom-panel':
				// Toggle terminal visibility
				setShowTerminal(!showTerminal);
				break;
			case 'toggle-right-sidebar':
				// Toggle right terminal
				// This action is no longer used for the right terminal,
				// but keeping it for consistency if other parts of the app use it.
				break;
			case 'toggle-ai-terminal':
				// Toggle AI Assistant panel
				setShowAssistant(!showAssistant);
				break;
			case 'open-settings':
				// Open settings panel
				setShowSettings(true);
				break;
			default:
				// Handle model selection
				if (action.startsWith('select-model-')) {
					const modelId = action.replace('select-model-', '');
					setSelectedModel(modelId);
					console.log('Model selected:', modelId);
				}
				break;
		}
	};

	// Listen for AI assistant trigger
	React.useEffect(() => {
		const handleAIAssistant = () => {
			setShowAssistant(true);
		};

		document.addEventListener('trigger-ai-assistant', handleAIAssistant);

		return () => {
			document.removeEventListener('trigger-ai-assistant', handleAIAssistant);
		};
	}, []);

	// Listen for show terminal trigger
	React.useEffect(() => {
		const handleShowTerminal = () => {
			setShowTerminal(!showTerminal);
		};

		document.addEventListener('show-terminal', handleShowTerminal);

		return () => {
			document.removeEventListener('show-terminal', handleShowTerminal);
		};
	}, [showTerminal]);

	// Listen for toggle AI assistant trigger
	React.useEffect(() => {
		const handleToggleAIAssistant = () => {
			setShowAssistant(!showAssistant);
		};

		document.addEventListener('toggle-ai-assistant', handleToggleAIAssistant);

		return () => {
			document.removeEventListener('toggle-ai-assistant', handleToggleAIAssistant);
		};
	}, [showAssistant]);

	// Terminal resize functionality
	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsResizing(true);
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (!isResizing) return;
		
		const container = document.querySelector('.main-content') as HTMLElement;
		if (container) {
			const containerRect = container.getBoundingClientRect();
			const mouseY = e.clientY;
			
			// Calculate height from bottom of container
			const distanceFromBottom = containerRect.bottom - mouseY;
			
			// Set limits: minimum 150px, maximum 100% of viewport height
			const minHeight = 150;
			const maxHeight = window.innerHeight;
			
			if (distanceFromBottom >= minHeight && distanceFromBottom <= maxHeight) {
				setTerminalHeight(distanceFromBottom);
				// Save to localStorage
				localStorage.setItem('terminal-height', distanceFromBottom.toString());
			}
		}
	};

	const handleMouseUp = () => {
		setIsResizing(false);
	};

	// AI Assistant panel resize functionality
	const handleAssistantMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsResizingAssistant(true);
	};

	const handleAssistantMouseMove = (e: MouseEvent) => {
		if (!isResizingAssistant) return;
		
		const windowWidth = window.innerWidth;
		const mouseX = e.clientX;
		
		// Calculate width from right edge of window
		const distanceFromRight = windowWidth - mouseX;
		
		// Set limits: minimum 280px, maximum 100% of window width
		const minWidth = 280;
		const maxWidth = windowWidth;
		
		if (distanceFromRight >= minWidth && distanceFromRight <= maxWidth) {
			setAssistantWidth(distanceFromRight);
			// Save to localStorage
			localStorage.setItem('assistant-width', distanceFromRight.toString());
		}
	};

	const handleAssistantMouseUp = () => {
		setIsResizingAssistant(false);
	};

	React.useEffect(() => {
		if (isResizing) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isResizing]);

	React.useEffect(() => {
		if (isResizingAssistant) {
			document.addEventListener('mousemove', handleAssistantMouseMove);
			document.addEventListener('mouseup', handleAssistantMouseUp);
			
			return () => {
				document.removeEventListener('mousemove', handleAssistantMouseMove);
				document.removeEventListener('mouseup', handleAssistantMouseUp);
			};
		}
	}, [isResizingAssistant]);

	return (
		<ThemeProvider>
			<div className="ide-container">
				<TopBar 
					sidebarCollapsed={sidebarCollapsed}
					showTerminal={showTerminal}
					showAssistant={showAssistant}
					onMenuAction={handleMenuAction}
					selectedModel={selectedModel}
				/>
				<div className="ide-content">
					{!sidebarCollapsed && (
						<Sidebar
							collapsed={sidebarCollapsed}
							onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
							onFileSelect={handleFileChange}
							rootPath={projectRoot}
							onLoadTree={(root) => {
								setProjectRoot(root);
							}}
							onFileDeleted={handleFileDeleted}
						/>
					)}

				<div className="main-content" style={{ 
					display: 'flex', 
					flex: 1,
					overflow: 'hidden'
				}}>
					{/* Main Editor and Terminal Area */}
					<div style={{ 
						display: 'flex', 
						flexDirection: 'column', 
						flex: 1,
						overflow: 'hidden',
						minWidth: 0, // Allow shrinking
						marginRight: showAssistant ? `${assistantWidth}px` : '0px',
						transition: 'margin-right 0.1s ease'
					}}>
						<div className="editor-header">
							<ThemeSelector />
						</div>
						
						<div style={{ 
							display: 'flex', 
							flexDirection: 'column', 
							flex: 1,
							overflow: 'hidden'
						}}>
							{/* Editor Area - takes remaining space */}
							<div style={{ 
								flex: 1,
								minHeight: 0,
								overflow: 'hidden',
								position: 'relative',
								zIndex: 2
							}}>
								<EditorArea 
									activeFile={activeFile} 
									onFileChange={handleFileChange}
									onFolderSelect={(folderPath) => {
										setProjectRoot(folderPath);
										setActiveFile(null); // Don't open folder as a file
									}}
								/>
							</div>

							{/* Terminal Area - only show when terminal is visible */}
							{showTerminal && terminalHeight > 0 && (
								<div 
									className="terminal-area"
									style={{ 
										height: `${terminalHeight}px`,
										minHeight: '150px',
										maxHeight: '100vh',
										background: 'var(--terminal-background, #1e1e1e)',
										borderTop: '1px solid var(--border, #3c3c3c)',
										position: 'relative',
										flexShrink: 0,
										zIndex: 1,
										bottom: 0
									}}>
									{/* Resize Handle */}
									<div 
										className="terminal-resize-handle"
										style={{
											position: 'absolute',
											top: '-3px',
											left: 0,
											right: 0,
											height: '6px',
											cursor: 'ns-resize',
											background: 'var(--border, #3c3c3c)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											zIndex: 1
										}}
										onMouseDown={handleMouseDown}
										title="Drag to resize terminal"
									>
										<div style={{
											width: '40px',
											height: '3px',
											background: 'var(--sidebar-foreground, #cccccc)',
											borderRadius: '2px',
											opacity: 0.6
										}} />
									</div>
									
									{/* Terminal Content */}
									<div className="terminal-content" style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
										<EnhancedTerminal onClose={() => setShowTerminal(false)} />
									</div>
								</div>
							)}
						</div>
					</div>

					{/* AI Assistant Panel - positioned absolutely to extend full height */}
					{showAssistant && (
						<div 
							className="ai-assistant-panel"
							style={{
								position: 'fixed',
								right: 0,
								top: 0,
								bottom: 0,
								width: `${assistantWidth}px`,
								maxWidth: '100%',
								zIndex: 15,
								background: 'var(--ai-terminal-background, #1e1e1e)',
								borderLeft: '1px solid var(--terminal-border, #3c3c3c)',
								display: 'flex',
								flexDirection: 'column'
							}}
						>
							{/* AI Assistant Resize Handle */}
							<div 
								className="ai-assistant-resize-handle"
								style={{
									position: 'absolute',
									left: '-3px',
									top: 0,
									bottom: 0,
									width: '6px',
									cursor: 'ew-resize',
									background: 'var(--border, #3c3c3c)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									zIndex: 16
								}}
								onMouseDown={handleAssistantMouseDown}
								title="Drag to resize AI Assistant panel"
							>
								<div style={{
									width: '3px',
									height: '40px',
									background: 'var(--sidebar-foreground, #cccccc)',
									borderRadius: '2px',
									opacity: 0.6
								}} />
							</div>
							
							<AITerminal 
								onClose={() => setShowAssistant(false)}
								selectedModel={selectedModel}
							/>
						</div>
					)}
				</div>
				</div>
			</div>

			{/* Settings Panel */}
			<SettingsPanel 
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
			/>
		</ThemeProvider>
	);
}