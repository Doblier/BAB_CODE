import React, { useState } from 'react';
import './Sidebar.css';
import { 
  FileText, FileCode, FileJson, FileImage, FileVideo, FileAudio, 
  FileArchive, File, Folder, FolderOpen, Settings, Package,
  Type, Code, Database, FileText as MarkdownIcon, GitBranch, Search, RefreshCw,
  Plus, X, Save, ChevronRight, ChevronDown
} from 'lucide-react';

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

  // Get file icon based on extension (VS Code style)
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconSize = 16;
    const iconColor = '#cccccc';
    
    switch (ext) {
      case 'html':
      case 'htm':
        return <FileCode size={iconSize} color="#e34c26" />;
      case 'css':
        return <FileCode size={iconSize} color="#1572b6" />;
      case 'js':
      case 'jsx':
        return <FileCode size={iconSize} color="#f7df1e" />;
      case 'ts':
      case 'tsx':
        return <Type size={iconSize} color="#3178c6" />;
      case 'json':
        return <FileJson size={iconSize} color="#f7df1e" />;
      case 'py':
        return <FileCode size={iconSize} color="#3776ab" />;
      case 'java':
        return <FileCode size={iconSize} color="#ed8b00" />;
      case 'cpp':
      case 'c':
        return <FileCode size={iconSize} color="#00599c" />;
      case 'php':
        return <FileCode size={iconSize} color="#777bb4" />;
      case 'rb':
        return <FileCode size={iconSize} color="#cc342d" />;
      case 'go':
        return <FileCode size={iconSize} color="#00add8" />;
      case 'rs':
        return <FileCode size={iconSize} color="#ce422b" />;
      case 'sql':
        return <Database size={iconSize} color="#336791" />;
      case 'md':
        return <MarkdownIcon size={iconSize} color="#000000" />;
      case 'txt':
        return <FileText size={iconSize} color={iconColor} />;
      case 'xml':
        return <FileCode size={iconSize} color="#f05032" />;
      case 'yaml':
      case 'yml':
        return <Settings size={iconSize} color="#cb171e" />;
      case 'sh':
      case 'bat':
      case 'cmd':
        return <FileCode size={iconSize} color="#4d4d4d" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <FileImage size={iconSize} color="#4d4d4d" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <FileVideo size={iconSize} color="#4d4d4d" />;
      case 'mp3':
      case 'wav':
        return <FileAudio size={iconSize} color="#4d4d4d" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <FileArchive size={iconSize} color="#4d4d4d" />;
      case 'gitignore':
        return <GitBranch size={iconSize} color="#f05032" />;
      case 'package.json':
      case 'package-lock.json':
        return <Package size={iconSize} color="#cb3837" />;
      case 'tsconfig.json':
      case 'vite.config.ts':
        return <Settings size={iconSize} color="#3178c6" />;
      case 'license':
        return <FileText size={iconSize} color="#d73a49" />;
      case 'readme.md':
        return <MarkdownIcon size={iconSize} color="#0366d6" />;
      default:
        return <File size={iconSize} color={iconColor} />;
    }
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
               (expandedFolders.has(node.path) ? 
                 <FolderOpen size={16} color="#cccccc" /> : 
                 <Folder size={16} color="#cccccc" />
               ) : 
               getFileIcon(node.name)
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
             <File size={16} />
           </button>
           <button
             className="header-btn"
             title="New Folder"
             onClick={() => {
               setShowNewFolderInput(true);
               setShowNewFileInput(false);
             }}
           >
             <Folder size={16} />
           </button>
           <button
             className="header-btn"
             title="Search"
             onClick={() => { setShowSearch(true); setSearchTerm(''); }}
           >
             <Search size={16} />
           </button>
                       <button 
              className="header-btn" 
              onClick={refreshTree}
              title="Refresh"
            >
              <RefreshCw size={16} />
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
              <X size={14} />
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
             <X size={14} />
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
             <X size={14} />
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
             <span><FileText size={14} /></span> Rename
           </div>
           <div className="context-menu-item" onClick={handleCopy}>
             <span><FileText size={14} /></span> Copy
           </div>
           <div className="context-menu-item" onClick={handleDelete}>
             <span><X size={14} /></span> Delete
           </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 