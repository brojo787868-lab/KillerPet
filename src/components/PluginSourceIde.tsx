import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, FolderTree } from 'lucide-react';
import { GeneratedPluginFile } from '../utils/javaCodeGenerator';
import { soundFX } from '../utils/soundEffects';

interface PluginSourceIdeProps {
  files: GeneratedPluginFile[];
  onDownloadFullZip: () => void;
}

export const PluginSourceIde: React.FC<PluginSourceIdeProps> = ({
  files,
  onDownloadFullZip,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id || 'plugin_yml');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeFile = files.find((f) => f.id === selectedFileId) || files[0];

  const handleCopy = async () => {
    if (!activeFile) return;
    soundFX.playGuiClick();
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopiedId(activeFile.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback
    }
  };

  const handleDownloadSingleFile = () => {
    if (!activeFile) return;
    soundFX.playGuiClick();
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const lines = activeFile ? activeFile.content.split('\n') : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 4 Cols: Maven Project File Tree */}
      <div className="lg:col-span-4 p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-100">
              Maven Project Structure
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {files.length} Files
          </span>
        </div>

        <div className="space-y-1">
          {files.map((file) => {
            const isSelected = file.id === activeFile?.id;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => {
                  soundFX.playGuiClick();
                  setSelectedFileId(file.id);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border border-emerald-500/80 text-slate-100'
                    : 'border border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                }`}
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <FileCode
                    className={`w-4 h-4 shrink-0 ${
                      file.language === 'java'
                        ? 'text-amber-400'
                        : file.language === 'yaml'
                        ? 'text-emerald-400'
                        : 'text-sky-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-semibold truncate">
                      {file.filename}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      {file.relativePath}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase text-slate-500 shrink-0">
                  {file.language}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800 space-y-2.5">
          <div className="text-xs text-slate-400 leading-relaxed">
            All Java classes, <code className="text-emerald-400">plugin.yml</code>, and{' '}
            <code className="text-emerald-400">config.yml</code> are dynamically synchronized with
            your species, XP curves, and cosmetics.
          </div>
          <button
            type="button"
            onClick={onDownloadFullZip}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Complete Maven Project (.zip)
          </button>
        </div>
      </div>

      {/* Right 8 Cols: Active Code Inspector */}
      <div className="lg:col-span-8 rounded-lg border border-slate-800 bg-[#131B2E] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900 border-b border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
              <span className="font-semibold text-amber-400">{activeFile?.filename}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400 truncate">{activeFile?.relativePath}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{activeFile?.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedId === activeFile?.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadSingleFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save {activeFile?.filename}</span>
            </button>
          </div>
        </div>

        <div className="max-h-[600px] overflow-auto bg-[#090d16] p-4 font-mono text-xs leading-relaxed">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-slate-900/60">
                  <td className="select-none pr-4 text-right text-slate-600 tabular-nums w-10 align-top">
                    {i + 1}
                  </td>
                  <td className="text-slate-200 whitespace-pre overflow-x-auto">
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
