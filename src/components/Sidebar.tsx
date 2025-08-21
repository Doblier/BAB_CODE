import React, { useState } from 'react';
import './Sidebar.css';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onFileSelect: (filePath: string) => void;
  rootPath?: string | null;
  onLoadTree?: (root: string) => void;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, onFileSelect, rootPath, onLoadTree }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<FileNode[]>([]);
  // Hover actions removed; icons are now in the header
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetNode: FileNode | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    targetNode: null
  });

  // Load directory tree when rootPath changes
  React.useEffect(() => {
    const load = async () => {
      if (!rootPath || !(window as any).api?.readDirTree) {
        return;
      }
      const res = await (window as any).api.readDirTree(rootPath);
      if (res?.ok) {
        setFiles([{ name: res.root, path: res.root, type: 'folder', children: res.tree }]);
        setExpandedFolders(new Set([res.root]));
        onLoadTree && onLoadTree(res.root);
      }
    };
    load();
  }, [rootPath, onLoadTree]);

  // Listen for menu-triggered actions
  React.useEffect(() => {
    const handleNewFile = () => {
      setShowNewFileInput(true);
      setShowNewFolderInput(false);
    };

    const handleNewFolder = () => {
      setShowNewFolderInput(true);
      setShowNewFileInput(false);
    };

    document.addEventListener('trigger-new-file', handleNewFile);
    document.addEventListener('trigger-new-folder', handleNewFolder);

    return () => {
      document.removeEventListener('trigger-new-file', handleNewFile);
      document.removeEventListener('trigger-new-folder', handleNewFolder);
    };
  }, []);

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible]);

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const refreshTree = async () => {
    if (!rootPath || !(window as any).api?.readDirTree) return;
    const res = await (window as any).api.readDirTree(rootPath);
    if (res?.ok) {
      setFiles([{ name: res.root, path: res.root, type: 'folder', children: res.tree }]);
      setExpandedFolders(new Set([res.root]));
      onLoadTree && onLoadTree(res.root);
    }
  };

  const createNewFile = async (parentPath: string, fileName: string) => {
    if (!fileName.trim()) return;
    try {
      if ((window as any).api?.createFile) {
        const res = await (window as any).api.createFile(parentPath, fileName.trim());
        if (!res?.ok) {
          alert(res?.error || 'Failed to create file');
        }
      } else {
        // Simulated file creation
      }
    } finally {
      setNewFileName('');
      setShowNewFileInput(false);
      refreshTree();
    }
  };

  const createNewFolder = async (parentPath: string, folderName: string) => {
    if (!folderName.trim()) return;
    try {
      if ((window as any).api?.createFolder) {
        const res = await (window as any).api.createFolder(parentPath, folderName.trim());
        if (!res?.ok) {
          alert(res?.error || 'Failed to create folder');
        }
      } else {
        // Simulated folder creation
      }
    } finally {
      setNewFolderName('');
      setShowNewFolderInput(false);
      refreshTree();
    }
  };

  const handleNewFileSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!rootPath) {
        alert('Please open a folder first');
        return;
      }
      createNewFile(rootPath, newFileName);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowNewFileInput(false);
      setNewFileName('');
    }
  };

  const handleNewFolderSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!rootPath) {
        alert('Please open a folder first');
        return;
      }
      createNewFolder(rootPath, newFolderName);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowNewFolderInput(false);
      setNewFolderName('');
    }
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetNode: node
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      targetNode: null
    });
  };

  const handleRename = async () => {
    if (!contextMenu.targetNode) return;
    
    const oldName = contextMenu.targetNode.name;
    const newName = prompt('Enter new name:', oldName);
    
    if (newName && newName !== oldName) {
      try {
        const oldPath = contextMenu.targetNode.path;
        const newPath = oldPath.replace(oldName, newName);
        
        // Use the API to rename the file/folder
        const result = await window.api.renameFile(oldPath, newPath);
        if (result.ok) {
          alert(`Renamed ${oldName} to ${newName}`);
          refreshTree();
        } else {
          alert('Failed to rename: ' + result.error);
        }
      } catch (error) {
        alert('Failed to rename: ' + error);
      }
    }
    closeContextMenu();
  };

  const handleCopy = async () => {
    if (!contextMenu.targetNode) return;
    
    try {
      await navigator.clipboard.writeText(contextMenu.targetNode.path);
      alert('Path copied to clipboard!');
    } catch (error) {
      alert('Failed to copy: ' + error);
    }
    closeContextMenu();
  };

  const handleDelete = async () => {
    if (!contextMenu.targetNode) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete "${contextMenu.targetNode.name}"?`);
    if (confirmDelete) {
      try {
        // Use the API to delete the file/folder
        const result = await window.api.deleteFile(contextMenu.targetNode.path);
        if (result.ok) {
          alert(`Deleted ${contextMenu.targetNode.name}`);
          refreshTree();
        } else {
          alert('Failed to delete: ' + result.error);
        }
      } catch (error) {
        alert('Failed to delete: ' + error);
      }
    }
    closeContextMenu();
  };

  const filteredFiles = files.filter(file => {
    if (!searchTerm) return true;
    return file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (file.children && file.children.some(child => 
             child.name.toLowerCase().includes(searchTerm.toLowerCase())
           ));
  });

  const renderFileTree = (nodes: FileNode[], level = 0): React.ReactNode => {
    return nodes.map((node) => (
      <div key={node.path} style={{ paddingLeft: level * 16 }}>
        <div 
          className={`file-item ${node.type}`}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          <span className="icon">
            {node.type === 'folder' ? 
              (expandedFolders.has(node.path) ? '📁' : '📂') : 
              '📄'
            }
          </span>
          <span className="name">{node.name}</span>
          
          {/* Item-level hover icons removed; actions are in header */}
        </div>
        {node.type === 'folder' && 
         expandedFolders.has(node.path) && 
         node.children && 
         renderFileTree(node.children, level + 1)
        }
      </div>
    ));
  };


  
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={onToggle}>
          {collapsed ? '→' : '←'}
        </button>
        <span className="title">Explorer</span>
        <div className="header-actions">
                     <button
             className="header-btn"
             title="New File"
             onClick={() => {
               setShowNewFileInput(true);
               setShowNewFolderInput(false);
             }}
           >
             📄
           </button>
          <button
            className="header-btn"
            title="New Folder"
            onClick={() => {
              setShowNewFolderInput(true);
              setShowNewFileInput(false);
            }}
          >
            📁
          </button>
          <button
            className="header-btn"
            title="Search"
            onClick={() => { setShowSearch(true); setSearchTerm(''); }}
          >
            🔍
          </button>
          <button 
            className="header-btn" 
            onClick={refreshTree}
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>
      
                    {/* New File Input */}
       {showNewFileInput && (
         <div className="new-item-input">
           <input
             type="text"
             placeholder="Enter file name (e.g., index.ts)"
             value={newFileName}
             onChange={(e) => setNewFileName(e.target.value)}
             onKeyDown={handleNewFileSubmit}
             autoFocus
           />
           <button 
             className="close-input"
             onClick={() => {
               setShowNewFileInput(false);
               setNewFileName('');
             }}
           >
             ×
           </button>
         </div>
       )}

      {/* New Folder Input */}
      {showNewFolderInput && (
        <div className="new-item-input">
          <input
            type="text"
            placeholder="Enter folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={handleNewFolderSubmit}
            autoFocus
          />
          <button 
            className="close-input"
            onClick={() => {
              setShowNewFolderInput(false);
              setNewFolderName('');
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Search Bar */}
      {showSearch && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowSearch(false);
                setSearchTerm('');
              }
            }}
          />
          <button 
            className="close-search"
            onClick={() => {
              setShowSearch(false);
              setSearchTerm('');
            }}
          >
            ×
          </button>
        </div>
      )}
      
      <div className="sidebar-content">
        {renderFileTree(filteredFiles)}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={handleRename}>
            <span>📝</span> Rename
          </div>
          <div className="context-menu-item" onClick={handleCopy}>
            <span>📋</span> Copy
          </div>
          <div className="context-menu-item" onClick={handleDelete}>
            <span>🗑️</span> Delete
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 