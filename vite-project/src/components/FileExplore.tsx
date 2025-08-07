import React from "react";
import type { VirtualFile } from "../utils/fileSystem";

interface FileExplorerProps {
  files: VirtualFile[];
  onSelect: (file: VirtualFile) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, onSelect }) => {
  return (
    <div className="space-y-2">
      <h2 className="font-bold mb-2">📁 Files</h2>
      {files.map((file) => (
        <button
          key={file.name}
          onClick={() => onSelect(file)}
          className="block w-full text-left p-2 rounded text-black hover:bg-gray-100 text-sm font-mono"
        >
          {file.name}
        </button>
      ))}
    </div>
  );
};

export default FileExplorer;
