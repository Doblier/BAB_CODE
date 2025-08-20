import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import EditorArea from './components/EditorArea';
import EnhancedTerminal from './components/EnhancedTerminal';

export default function App() {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [activeFile, setActiveFile] = useState<string | null>(null);
	const [projectRoot, setProjectRoot] = useState<string | null>(null);
	const [showTerminal, setShowTerminal] = useState(true);

	return (
		<div className="ide-container">
			<Sidebar
				collapsed={sidebarCollapsed}
				onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
				onFileSelect={(path) => setActiveFile(path)}
				rootPath={projectRoot}
				onLoadTree={(root) => setProjectRoot(root)}
			/>

			<div className="main-content">
				<EditorArea 
					activeFile={activeFile} 
					onFileChange={(p) => setActiveFile(p)}
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