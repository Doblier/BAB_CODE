import React from "react";
import type { VirtualFile } from "../utils/fileSystem";

interface ToolbarProps {
  files: VirtualFile[];
  setFiles: React.Dispatch<React.SetStateAction<VirtualFile[]>>;
  setActiveFile: (file: VirtualFile) => void;
}

const ToolBar: React.FC<ToolbarProps> = ({
  files,
  setFiles,
  setActiveFile,
}) => {
  const addFile = () => {
    const name = prompt("Enter file name (e.g., `main.ts`):");
    if (!name) return;
    const exists = files.some((f) => f.name === name);
    if (exists) return alert("File already exists!");

    const newFile = { name, content: "// new file" };
    setFiles([...files, newFile]);
    setActiveFile(newFile);
  };

  const deleteFIle = () => {
    const name = prompt("Enter file name to delete:");
    if (!name) return;
    const remaining = files.filter((f) => f.name == name);
    if (remaining.length == files.length) {
      return alert("File not found.");
    }
    setFiles(remaining);
    setActiveFile(remaining[0] || { name: "", content: "" });
  };
  return (
    <div className="mb-4 flex gap-2">
      <button
        onClick={addFile}
        className="bg-blue-500 text-black text-xs px-3 py-3 rounded hover:bg-blue-600"
      >
        + Add File
      </button>
      <button
        onClick={deleteFIle}
        className="bg-red-500 text-black text-xs px-3 py-1 rounded hover:bg-red-600"
      >
        - Delete File
      </button>
    </div>
  );
};

export default ToolBar;
