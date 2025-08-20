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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Load directory tree when rootPath changes
  React.useEffect(() => {
    const load = async () => {
      if (!rootPath || !(window as any).api?.readDirTree) return;
      const res = await (window as any).api.readDirTree(rootPath);
      if (res?.ok) {
        setFiles([{ name: res.root, path: res.root, type: 'folder', children: res.tree }]);
        setExpandedFolders(new Set([res.root]));
        onLoadTree && onLoadTree(res.root);
      }
    };
    load();
  }, [rootPath, onLoadTree]);

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

  const createNewFile = (parentPath: string) => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      // In a real app, you'd create the file on disk
      console.log(`Creating new file: ${parentPath}/${fileName}`);
      // Refresh the tree to show the new file
      refreshTree();
    }
  };

  const createNewFolder = (parentPath: string) => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      // In a real app, you'd create the folder on disk
      console.log(`Creating new folder: ${parentPath}/${folderName}`);
      // Refresh the tree to show the new folder
      refreshTree();
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
          onMouseEnter={() => setHoveredItem(node.path)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <span className="icon">
            {node.type === 'folder' ? 
              (expandedFolders.has(node.path) ? '📁' : '📂') : 
              '📄'
            }
          </span>
          <span className="name">{node.name}</span>
          
          {/* Hover Icons */}
          {hoveredItem === node.path && (
            <div className="hover-icons">
              {node.type === 'folder' && (
                <>
                  <button 
                    className="hover-icon" 
                    title="New File"
                    onClick={(e) => {
                      e.stopPropagation();
                      createNewFile(node.path);
                    }}
                  >
                    📄
                  </button>
                  <button 
                    className="hover-icon" 
                    title="New Folder"
                    onClick={(e) => {
                      e.stopPropagation();
                      createNewFolder(node.path);
                    }}
                  >
                    📁
                  </button>
                </>
              )}
              <button 
                className="hover-icon" 
                title="Search"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSearch(true);
                  setSearchTerm('');
                }}
              >
                🔍
              </button>
              <button 
                className="hover-icon" 
                title="Refresh"
                onClick={(e) => {
                  e.stopPropagation();
                  refreshTree();
                }}
              >
                🔄
              </button>
            </div>
          )}
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
        <button 
          className="refresh-btn" 
          onClick={refreshTree}
          title="Refresh"
        >
          🔄
        </button>
      </div>
      
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
    </div>
  );
};

export default Sidebar; 