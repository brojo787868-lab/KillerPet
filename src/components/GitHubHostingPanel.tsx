import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FolderGit2,
  Rocket,
  Terminal,
} from 'lucide-react';
import { PluginGlobalConfig } from '../types/petPlugin';
import { GeneratedPluginFile } from '../utils/javaCodeGenerator';
import { soundFX } from '../utils/soundEffects';

interface GitHubHostingPanelProps {
  config: PluginGlobalConfig;
  githubOwner: string;
  githubRepo: string;
  onChangeGithubOwner: (val: string) => void;
  onChangeGithubRepo: (val: string) => void;
  files: GeneratedPluginFile[];
  onDownloadZip: () => void;
  onLog: (msg: string) => void;
}

function encodeBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const GitHubHostingPanel: React.FC<GitHubHostingPanelProps> = ({
  config,
  githubOwner,
  githubRepo,
  onChangeGithubOwner,
  onChangeGithubRepo,
  files,
  onDownloadZip,
  onLog,
}) => {
  const [githubToken, setGithubToken] = useState<string>('');
  const [isPrivateRepo, setIsPrivateRepo] = useState<boolean>(false);
  const [pushState, setPushState] = useState<
    'IDLE' | 'PUBLISHING' | 'SUCCESS' | 'ERROR'
  >('IDLE');
  const [pushStatusText, setPushStatusText] = useState<string>('');
  const [publishedRepoUrl, setPublishedRepoUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const cleanOwner = githubOwner.trim() || 'thekillerdgod';
  const cleanRepo = githubRepo.trim() || 'Pet-Plugin';
  const jarFilename = `${config.pluginName}-${config.pluginVersion}-by-TheKillerDGod.jar`;

  const repoWebUrl = `https://github.com/${cleanOwner}/${cleanRepo}`;
  const latestReleaseJarUrl = `${repoWebUrl}/releases/latest/download/${jarFilename}`;
  const releasesPageUrl = `${repoWebUrl}/releases`;
  const actionsPageUrl = `${repoWebUrl}/actions`;

  const serverWgetCommand = `curl -L -o plugins/${jarFilename} ${latestReleaseJarUrl}`;

  const gitCliScript = `# 1. Unzip ${config.pluginName}-${config.pluginVersion}-by-TheKillerDGod.zip and open terminal inside folder
git init
git branch -M main
git add .
git commit -m "Release ${config.pluginName} v${config.pluginVersion} by ${config.authorName}"
git remote add origin https://github.com/${cleanOwner}/${cleanRepo}.git
git push -u origin main`;

  const copyText = async (key: string, value: string) => {
    soundFX.playGuiClick();
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Fallback
    }
  };

  // Direct Browser-to-GitHub REST API Publisher
  const handleDirectPublishToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = githubToken.trim();
    if (!token) {
      setPushState('ERROR');
      setPushStatusText(
        'Please enter a GitHub Personal Access Token (with repo & workflow scopes) or use the ZIP + Git CLI method on the right.'
      );
      return;
    }

    soundFX.playGuiClick();
    setPushState('PUBLISHING');
    setPushStatusText('Authenticating with GitHub API...');

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    };

    try {
      // 1. Verify authenticated user
      const userRes = await fetch('https://api.github.com/user', { headers });
      if (!userRes.ok) {
        throw new Error(
          `GitHub authentication failed (${userRes.status}). Verify your Personal Access Token.`
        );
      }
      const userData = (await userRes.json()) as { login: string };
      const targetOwner = userData.login || cleanOwner;
      onChangeGithubOwner(targetOwner);

      // 2. Check if repository exists; if not, create it
      setPushStatusText(`Checking repository ${targetOwner}/${cleanRepo}...`);
      const repoCheck = await fetch(
        `https://api.github.com/repos/${targetOwner}/${cleanRepo}`,
        { headers }
      );

      if (repoCheck.status === 404) {
        setPushStatusText(`Creating repository ${targetOwner}/${cleanRepo} on GitHub...`);
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: cleanRepo,
            description: `${config.pluginName} — Minecraft Companion Pet Plugin by ${config.authorName} (Paper/Spigot ${config.apiVersion})`,
            private: isPrivateRepo,
            auto_init: true,
          }),
        });
        if (!createRes.ok) {
          const errBody = await createRes.json().catch(() => ({}));
          throw new Error(
            (errBody as { message?: string }).message ||
              `Failed to create repository (${createRes.status}).`
          );
        }
      }

      // 3. Commit each file in the project
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setPushStatusText(
          `Uploading (${i + 1}/${files.length}): ${f.relativePath}...`
        );

        // Check if file already exists to include its SHA
        let existingSha: string | undefined;
        const existingRes = await fetch(
          `https://api.github.com/repos/${targetOwner}/${cleanRepo}/contents/${f.relativePath}`,
          { headers }
        );
        if (existingRes.ok) {
          const existingJson = (await existingRes.json()) as { sha?: string };
          existingSha = existingJson.sha;
        }

        const putRes = await fetch(
          `https://api.github.com/repos/${targetOwner}/${cleanRepo}/contents/${f.relativePath}`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              message: `Update ${f.filename} (${config.pluginName} v${config.pluginVersion} by ${config.authorName})`,
              content: encodeBase64Utf8(f.content),
              ...(existingSha ? { sha: existingSha } : {}),
            }),
          }
        );

        if (!putRes.ok) {
          const errJson = (await putRes.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(
            `Failed uploading ${f.relativePath}: ${
              errJson.message || putRes.statusText
            } (Ensure your token has 'repo' and 'workflow' permissions).`
          );
        }
      }

      const finalUrl = `https://github.com/${targetOwner}/${cleanRepo}`;
      setPublishedRepoUrl(finalUrl);
      setPushState('SUCCESS');
      setPushStatusText(
        `Successfully published all ${files.length} files to ${targetOwner}/${cleanRepo}! GitHub Actions is now compiling ${jarFilename}.`
      );
      soundFX.playLevelUp();
      onLog(
        `[GitHub] Published ${config.pluginName} v${config.pluginVersion} to ${finalUrl} with automatic .jar Release workflow!`
      );
    } catch (err) {
      soundFX.playTameAttemptFail();
      setPushState('ERROR');
      setPushStatusText(
        err instanceof Error
          ? err.message
          : 'Failed to publish to GitHub. Check your token scopes.'
      );
    }
  };

  const workflowFile = files.find((f) => f.id === 'github_workflow_yml');

  return (
    <div className="space-y-6">
      {/* Top Banner: How GitHub Hosting + Auto-.JAR Release Works */}
      <div className="p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span>GitHub Cloud Builder</span>
              <span aria-hidden="true">·</span>
              <span>Automatic Maven JDK 21 Compilation</span>
              <span aria-hidden="true">·</span>
              <span>GitHub Releases .JAR Hosting</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 font-display">
              Host {config.pluginName} on GitHub &amp; Auto-Generate Downloadable Server .JAR
            </h2>
            <p className="text-xs text-slate-400">
              Your exported project includes{' '}
              <code className="text-amber-400">.github/workflows/build-and-release.yml</code>.
              Whenever you push or upload these files to GitHub, GitHub Actions automatically
              compiles <code className="text-emerald-400">{jarFilename}</code> in the cloud and
              publishes it on your repository&apos;s <strong>Releases</strong> page for 1-click
              download.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onDownloadZip}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download GitHub Bundle (.zip)</span>
            </button>
          </div>
        </div>

        {/* Repository Coordinates & Direct .JAR Download URL Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-3">
            <label className="block text-xs text-slate-400 mb-1">
              GitHub Username / Organization
            </label>
            <input
              type="text"
              value={githubOwner}
              onChange={(e) => onChangeGithubOwner(e.target.value)}
              placeholder="thekillerdgod"
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-xs text-slate-400 mb-1">
              GitHub Repository Name
            </label>
            <input
              type="text"
              value={githubRepo}
              onChange={(e) => onChangeGithubRepo(e.target.value)}
              placeholder="Pet-Plugin"
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="lg:col-span-6">
            <label className="block text-xs text-slate-400 mb-1">
              Direct GitHub Release .JAR Download Link (Generated by Workflow)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={latestReleaseJarUrl}
                className="flex-1 px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 select-all"
              />
              <button
                type="button"
                onClick={() => copyText('jar_url', latestReleaseJarUrl)}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedKey === 'jar_url' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Publishing Options: Direct API Push vs Drag-and-Drop / Git CLI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Columns: Option A — 1-Click Direct Publish via GitHub API */}
        <div className="lg:col-span-6 p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-semibold text-slate-100">
                Option 1: One-Click Direct Push to Your GitHub Account
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">GitHub REST API</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Paste a GitHub Personal Access Token (with <code className="text-amber-400">repo</code>{' '}
            and <code className="text-amber-400">workflow</code> scopes) to automatically create{' '}
            <code className="text-emerald-400">
              {cleanOwner}/{cleanRepo}
            </code>
            , upload all {files.length} plugin files, and trigger GitHub Actions to compile{' '}
            <code className="text-emerald-400">{jarFilename}</code>.
          </p>

          <form onSubmit={handleDirectPublishToGitHub} className="space-y-3.5">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                GitHub Personal Access Token (Classic or Fine-Grained)
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivateRepo}
                  onChange={(e) => setIsPrivateRepo(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950"
                />
                <span>Create as Private Repository</span>
              </label>

              <a
                href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=Pet+Plugin+Studio+TheKillerDGod"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 hover:underline font-mono text-[11px]"
              >
                <span>Generate Token on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <button
              type="submit"
              disabled={pushState === 'PUBLISHING'}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>
                {pushState === 'PUBLISHING'
                  ? 'Publishing Files to GitHub...'
                  : `Publish ${cleanOwner}/${cleanRepo} & Build .JAR`}
              </span>
            </button>
          </form>

          {pushState !== 'IDLE' && (
            <div
              className={`p-3.5 rounded-md border text-xs font-mono space-y-2 ${
                pushState === 'SUCCESS'
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                  : pushState === 'ERROR'
                  ? 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                  : 'bg-slate-900 border-slate-700 text-amber-300'
              }`}
            >
              <div>{pushStatusText}</div>
              {pushState === 'SUCCESS' && publishedRepoUrl && (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={publishedRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                  >
                    <span>Open GitHub Repo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`${publishedRepoUrl}/actions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 text-slate-100 hover:bg-slate-700"
                  >
                    <span>View Live .JAR Build</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`${publishedRepoUrl}/releases`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 text-amber-300 hover:bg-slate-700"
                  >
                    <span>Open GitHub Releases (.JAR)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 6 Columns: Option B — Upload ZIP or Push via Git CLI */}
        <div className="lg:col-span-6 p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-semibold text-slate-100">
                Option 2: Git CLI Push or GitHub Web Upload (No Token Needed)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => copyText('git_cli', gitCliScript)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedKey === 'git_cli' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Script</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Git Commands</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3.5 rounded bg-[#080b12] border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
            {gitCliScript}
          </pre>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                Linux / Pterodactyl Server Direct Download Command:
              </span>
              <button
                type="button"
                onClick={() => copyText('wget_cmd', serverWgetCommand)}
                className="text-xs font-mono text-emerald-400 hover:underline cursor-pointer"
              >
                {copiedKey === 'wget_cmd' ? 'Copied!' : 'Copy curl command'}
              </button>
            </div>
            <pre className="p-2.5 rounded bg-[#080b12] border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              {serverWgetCommand}
            </pre>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 text-xs">
            <a
              href="https://github.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium"
            >
              <span>1. Create Empty Repo on GitHub.com</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <a
              href={releasesPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-amber-400 hover:underline font-mono"
            >
              <span>2. View {cleanOwner}/{cleanRepo} Releases</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <a
              href={actionsPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline font-mono"
            >
              <span>3. GitHub Actions .JAR Artifacts</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Included GitHub Actions Auto-.JAR Builder Workflow Preview */}
      {workflowFile && (
        <div className="rounded-lg border border-slate-800 bg-[#131B2E] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-100 font-semibold">
                {workflowFile.relativePath}
              </span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="text-slate-400">
                Included inside your ZIP download — compiles {jarFilename} on GitHub automatically
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyText('workflow_yml', workflowFile.content)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              {copiedKey === 'workflow_yml' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Workflow</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Workflow YAML</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 bg-[#080b12] font-mono text-xs text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
            {workflowFile.content}
          </pre>
        </div>
      )}
    </div>
  );
};
