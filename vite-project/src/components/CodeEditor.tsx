import React from "react";
import Editor from "@monaco-editor/react";
import type { VirtualFile } from "../utils/fileSystem";

interface CodeEditorProps {
  file: VirtualFile;
  onChange: (value: string) => void;
}

// Detect language from file extension
function getLanguage(filename: string): string {
  if (filename.endsWith(".ts")) return "typescript";
  if (filename.endsWith(".js")) return "javascript";
  if (filename.endsWith(".py")) return "python";
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".html")) return "html";
  if (filename.endsWith(".css")) return "css";
  return "plaintext";
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file, onChange }) => {
  const handleChange = (value: string | undefined) => {
    onChange(value || "");
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        width="100%"
        language={getLanguage(file.name)}
        value={file.content}
        onChange={handleChange}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          padding: { top: 20 },
        }}
      />
    </div>
  );
};

export default CodeEditor;
