import { useState } from "react";
import type { VirtualFile } from "./utils/fileSystem";
import { defaultFiles } from "./utils/fileSystem";
import FileExplorer from "./components/FileExplore";
import ToolBar from "./components/ToolBar";
import CodeEditor from "./components/CodeEditor";

function App() {
  const [files, setFiles] = useState<VirtualFile[]>(defaultFiles);
  const [activeFile, setActiveFile] = useState<VirtualFile>(defaultFiles[0]);
  const [output, setOutput] = useState<string>("");

  const updateFileContent = (content: string) => {
    setFiles(prev =>
      prev.map(f => (f.name === activeFile.name ? { ...f, content } : f))
    );
    setActiveFile(prev => ({ ...prev, content }));
  };

  const runCode = () => {
    setOutput(`// Running ${activeFile.name}\n${activeFile.content}`);
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/5 bg-[#252526] p-4 flex flex-col justify-between">
          <div>
            <ToolBar files={files} setFiles={setFiles} setActiveFile={setActiveFile} />
            <FileExplorer files={files} onSelect={setActiveFile} />
          </div>
          <button
            onClick={runCode}
            className="bg-green-600 text-black px-3 py-2 rounded hover:bg-green-700 text-sm mt-4"
          >
            ▶ Run
          </button>
        </div>

        {/* Editor */}
        <div className="w-5/5 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0">
            <CodeEditor file={activeFile} onChange={updateFileContent} />
          </div>
          <div className="h-40 border-t border-gray-700 bg-black text-green-400 p-4 overflow-y-auto text-sm font-mono">
            <h2 className="text-white font-bold mb-2">▶ Output:</h2>
            <pre>{output || "// Output will appear here..."}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
