import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import EditorArea from './components/EditorArea';
import EnhancedTerminal from './components/EnhancedTerminal';

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
					case 'ai-terminal':
						// Show AI assistant
						document.dispatchEvent(new CustomEvent('trigger-ai-assistant'));
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
						// Toggle right sidebar (placeholder for future feature)
						break;
					case 'open-settings':
						// Open settings (placeholder for future feature)
						break;
				}
			});
		}
	}, [sidebarCollapsed, showTerminal]);

	return (
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

			<div className="main-content">
				<EditorArea 
					activeFile={activeFile} 
					onFileChange={handleFileChange}
					onFolderSelect={(folderPath) => {
						setProjectRoot(folderPath);
						setActiveFile(null); // Don't open folder as a file
					}}
				/>

				{showTerminal && (
					<div style={{ height: '40%', minHeight: 250 }}>
						<EnhancedTerminal onClose={() => setShowTerminal(false)} />
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
	);
}