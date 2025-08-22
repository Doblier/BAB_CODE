import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import EditorArea from './components/EditorArea';
import EnhancedTerminal from './components/EnhancedTerminal';
import RightTerminal from './components/RightTerminal';
import ThemeSelector from './components/ThemeSelector';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [activeFile, setActiveFile] = useState<string | null>(null);

	// Handle file changes, including clearing active file
	const handleFileChange = (filePath: string) => {
		if (filePath === '' || filePath === null) {
			setActiveFile(null);
		} else {
			setActiveFile(filePath);
		}
	};
	const [projectRoot, setProjectRoot] = useState<string | null>('E:\\Testing_Files');
	const [showTerminal, setShowTerminal] = useState(true);
	const [showRightTerminal, setShowRightTerminal] = useState(false);
	const [terminalHeight, setTerminalHeight] = useState(() => {
		// Load saved terminal height from localStorage, default to 300px
		const saved = localStorage.getItem('terminal-height');
		return saved ? parseFloat(saved) : 300;
	});
	const [rightTerminalWidth, setRightTerminalWidth] = useState(() => {
		// Load saved right terminal width from localStorage, default to 300px
		const saved = localStorage.getItem('right-terminal-width');
		return saved ? parseFloat(saved) : 300;
	});
	const [isResizing, setIsResizing] = useState(false);
	const [isResizingRight, setIsResizingRight] = useState(false);


	// Handle menu actions
	React.useEffect(() => {
		if ((window as any).api?.onMenuAction) {
			(window as any).api.onMenuAction((action: string) => {
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
						setShowRightTerminal(!showRightTerminal);
						break;
					case 'open-settings':
						// Open settings (placeholder for future feature)
						break;
				}
			});
		}
	}, [sidebarCollapsed, showTerminal]);

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

	// Right terminal resize functionality
	const handleRightMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsResizingRight(true);
	};

	const handleRightMouseMove = (e: MouseEvent) => {
		if (!isResizingRight) return;
		
		const container = document.querySelector('.ide-container') as HTMLElement;
		if (container) {
			const containerRect = container.getBoundingClientRect();
			const containerWidth = containerRect.width;
			const mouseX = e.clientX;
			
			// Calculate width from right edge
			const distanceFromRight = containerRect.right - mouseX;
			
			// Set limits: minimum 200px, maximum 600px
			const minWidth = 200;
			const maxWidth = 600;
			
			if (distanceFromRight >= minWidth && distanceFromRight <= maxWidth) {
				setRightTerminalWidth(distanceFromRight);
				localStorage.setItem('right-terminal-width', distanceFromRight.toString());
			}
		}
	};

	const handleRightMouseUp = () => {
		setIsResizingRight(false);
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
		if (isResizingRight) {
			document.addEventListener('mousemove', handleRightMouseMove);
			document.addEventListener('mouseup', handleRightMouseUp);
			
			return () => {
				document.removeEventListener('mousemove', handleRightMouseMove);
				document.removeEventListener('mouseup', handleRightMouseUp);
			};
		}
	}, [isResizingRight]);

	return (
		<ThemeProvider>
			<div className="ide-container">
				<Sidebar
					collapsed={sidebarCollapsed}
					onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
					onFileSelect={handleFileChange}
					rootPath={projectRoot}
					onLoadTree={(root) => {
						setProjectRoot(root);
					}}
				/>

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
						minWidth: 0 // Allow shrinking
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

							{/* Terminal Area - fixed pixel height */}
							{showTerminal && (
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
										zIndex: 1
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

					{/* AI Terminal - Draggable Panel with Full Height */}
					{/* This block is removed as per the edit hint */}

					{/* Right Terminal - TRUE Full Height (from top to bottom) */}
					{showRightTerminal && (
						<div 
							className="right-terminal-area"
							style={{ 
								width: `${rightTerminalWidth}px`,
								minWidth: '200px',
								maxWidth: '600px',
								height: '100%',
								background: 'var(--terminal-background, #1e1e1e)',
								borderLeft: '1px solid var(--border, #3c3c3c)',
								position: 'relative',
								flexShrink: 0,
								display: 'flex',
								flexDirection: 'column'
							}}>
							{/* Right Terminal Resize Handle */}
							<div 
								className="right-terminal-resize-handle"
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
									zIndex: 1
								}}
								onMouseDown={handleRightMouseDown}
								title="Drag to resize right terminal"
							>
								<div style={{
									height: '40px',
									width: '3px',
									background: 'var(--sidebar-foreground, #cccccc)',
									borderRadius: '2px',
									opacity: 0.6
								}} />
							</div>
							
							{/* Right Terminal Content */}
							<div className="right-terminal-content" style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
								<RightTerminal onClose={() => setShowRightTerminal(false)} />
							</div>
						</div>
					)}
				</div>

				<button
					className="terminal-toggle"
					onClick={() => setShowTerminal((v) => !v)}
				>
					{showTerminal ? 'Hide Terminal' : 'Show Terminal'}
				</button>
			</div>
		</ThemeProvider>
	);
}