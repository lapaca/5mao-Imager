import {
  Download,
  Eye,
  EyeOff,
  FolderOpen,
  Image as ImageIcon,
  LoaderCircle,
  Settings,
  Upload,
  WandSparkles,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { generateImageEdit, generateTextImage } from "./lib/apiClient";
import { DEFAULT_SIZE, DIMENSION_PRESETS, REQUEST_TIMEOUT_MS } from "./lib/constants";
import {
  createImageFileName,
  downloadImageUrl,
  saveImageToDirectory,
  validateImageFile,
} from "./lib/files";
import { buildImagePrompt, buildTextPrompt } from "./lib/prompt";
import { loadApiConfig, loadHistory, normalizeApiConfig, saveApiConfig, saveHistory } from "./lib/storage";
import type { ApiConfig, GenerationMode, HistoryRecord, ImageSize, RequestStatus } from "./lib/types";

type SaveDirectoryHandle = FileSystemDirectoryHandle | null;
const LOCAL_PROXY_BASE_URL = "http://127.0.0.1:5173/gptimage2-proxy";
const DEFAULT_PROVIDER_BASE_URL = "https://cc-vibe.com";
const LEGACY_LOCAL_PROXY_PATH = "/gptimage2-proxy";

function App() {
  const [config, setConfig] = useState<ApiConfig | null>(() => loadApiConfig());
  const [history, setHistory] = useState<HistoryRecord[]>(() => loadHistory());
  const [selectedId, setSelectedId] = useState<string | null>(() => loadHistory()[0]?.id ?? null);
  const [mode, setMode] = useState<GenerationMode>("text-to-image");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("Auto-save not configured");
  const [directoryHandle, setDirectoryHandle] = useState<SaveDirectoryHandle>(null);
  const [positivePrompt, setPositivePrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [modificationPrompt, setModificationPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>(DEFAULT_SIZE);
  const [denoising, setDenoising] = useState(0.5);
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [basePreview, setBasePreview] = useState("");
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(() => new Set());
  const activeRequest = useRef<AbortController | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    return () => {
      activeRequest.current?.abort();
      if (basePreview) {
        URL.revokeObjectURL(basePreview);
      }
    };
  }, [basePreview]);

  const selectedRecord = history.find((item) => item.id === selectedId) ?? history[0] ?? null;
  const selectedImageBroken = selectedRecord ? brokenImageIds.has(selectedRecord.id) : false;
  const configured = Boolean(config?.apiKey && config.baseUrl);
  const isLoading = status === "loading";

  const handleSaveConfig = (nextConfig: ApiConfig) => {
    const normalized = normalizeApiConfig(nextConfig);
    saveApiConfig(normalized);
    setConfig(normalized);
    setSettingsOpen(false);
    setError("");
  };

  const handleImageFile = (file: File) => {
    const validation = validateImageFile(file);
    if (validation) {
      setError(validation);
      return;
    }

    if (basePreview) {
      URL.revokeObjectURL(basePreview);
    }
    setBaseImage(file);
    setBasePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleGenerate = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!configured || !config) {
      setError("Please complete API configuration first");
      setSettingsOpen(true);
      return;
    }

    if (mode === "text-to-image" && !positivePrompt.trim()) {
      setError("Please enter an image description");
      return;
    }

    if (mode === "image-to-image") {
      if (!baseImage) {
        setError("Please upload a base image first");
        return;
      }
      if (!modificationPrompt.trim()) {
        setError("Please enter an image description");
        return;
      }
    }

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    requestSeq.current += 1;
    const seq = requestSeq.current;
    setStatus("loading");

    try {
      const prompt =
        mode === "text-to-image"
          ? buildTextPrompt(positivePrompt, negativePrompt)
          : buildImagePrompt(modificationPrompt, denoising, negativePrompt);

      const imageUrl =
        mode === "text-to-image"
          ? await generateTextImage({
              config,
              prompt,
              size,
              signal: controller.signal,
              timeoutMs: REQUEST_TIMEOUT_MS,
            })
          : await generateImageEdit({
              config,
              prompt,
              size,
              image: baseImage!,
              signal: controller.signal,
              timeoutMs: REQUEST_TIMEOUT_MS,
            });

      if (seq !== requestSeq.current) {
        return;
      }

      const fileName = createImageFileName(mode);
      const record: HistoryRecord = {
        id: crypto.randomUUID(),
        imageUrl,
        mode,
        prompt: mode === "text-to-image" ? positivePrompt.trim() : modificationPrompt.trim(),
        size,
        createdAt: new Date().toISOString(),
        saved: false,
        fileName,
      };

      if (directoryHandle) {
        try {
          await saveImageToDirectory(directoryHandle, imageUrl, fileName);
          record.saved = true;
          setSaveStatus(`Auto-saved ${fileName}`);
        } catch {
          setSaveStatus("Auto-save failed. Use manual download instead.");
        }
      }

      setHistory((items) => [record, ...items].slice(0, 30));
      setSelectedId(record.id);
      setStatus("success");
    } catch (caught) {
      if (controller.signal.aborted) {
        return;
      }
      const message = caught instanceof Error ? caught.message : "Image generation failed";
      setError(message);
      setStatus(message.toLowerCase().includes("timed out") ? "timeout" : "failure");
    }
  };

  const chooseDirectory = async () => {
    if (!window.showDirectoryPicker) {
      setSaveStatus("Auto-save is only available in browsers that support folder authorization.");
      return;
    }

    try {
      const handle = await window.showDirectoryPicker();
      setDirectoryHandle(handle);
      setSaveStatus("Auto-save folder selected");
    } catch {
      setSaveStatus("Auto-save folder was not selected");
    }
  };

  return (
    <main className="app-shell">
      <section className="console-panel" aria-label="Generation console">
        <header className="topbar">
          <div>
            <h1>GPTimage2</h1>
            <p>Personal Drawing Tool</p>
          </div>
          <button
            className={`settings-button ${configured ? "is-configured" : "is-warning"}`}
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={`API Settings ${configured ? "Configured" : "Unconfigured"}`}
          >
            <Settings size={18} />
            <span>API Settings</span>
            <strong>{configured ? "Configured" : "Unconfigured"}</strong>
          </button>
        </header>

        <div className="security-note">
          API Key is stored in localStorage on this browser. Avoid shared devices.
        </div>

        <div className="tabs" role="tablist" aria-label="Generation mode">
          <button
            role="tab"
            aria-selected={mode === "text-to-image"}
            className={mode === "text-to-image" ? "active" : ""}
            type="button"
            onClick={() => setMode("text-to-image")}
          >
            <WandSparkles size={17} />
            Text-to-Image
          </button>
          <button
            role="tab"
            aria-selected={mode === "image-to-image"}
            className={mode === "image-to-image" ? "active" : ""}
            type="button"
            onClick={() => setMode("image-to-image")}
          >
            <ImageIcon size={17} />
            Image-to-Image
          </button>
        </div>

        <form className="generation-form" onSubmit={handleGenerate}>
          {mode === "text-to-image" ? (
            <label className="field">
              <span>Positive Prompt</span>
              <textarea
                value={positivePrompt}
                onChange={(event) => setPositivePrompt(event.target.value)}
                placeholder="A clean iOS wallpaper of an alpaca under soft morning light"
              />
            </label>
          ) : (
            <>
              <ImageDropzone
                previewUrl={basePreview}
                onFile={handleImageFile}
              />
              <label className="field">
                <span>Modification Prompt</span>
                <textarea
                  value={modificationPrompt}
                  onChange={(event) => setModificationPrompt(event.target.value)}
                  placeholder="Keep the subject, change the scene into a calm winter studio"
                />
              </label>
              <label className="field compact">
                <span>Denoising Strength: {denoising.toFixed(2)}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={denoising}
                  onChange={(event) => setDenoising(Number(event.target.value))}
                />
              </label>
            </>
          )}

          <label className="field">
            <span>Negative Prompt</span>
            <textarea
              className="short"
              value={negativePrompt}
              onChange={(event) => setNegativePrompt(event.target.value)}
              placeholder="blur, artifacts, low quality"
            />
          </label>

          <label className="field compact">
            <span>Image Dimensions</span>
            <select value={size} onChange={(event) => setSize(event.target.value as ImageSize)}>
              {DIMENSION_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.category} - {preset.label} ({preset.value})
                </option>
              ))}
            </select>
          </label>

          {error ? <div className="error-message">{error}</div> : null}

          <button className="generate-button" type="submit" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="spin" size={19} /> : <WandSparkles size={19} />}
            {isLoading ? "Generating..." : "Generate Image"}
          </button>
        </form>
      </section>

      <section className="canvas-panel" aria-label="Generated image canvas">
        <div className="canvas-toolbar">
          <div>
            <h2>Canvas</h2>
            <p>{saveStatus}</p>
          </div>
          <div className="toolbar-actions">
            <button type="button" onClick={chooseDirectory}>
              <FolderOpen size={17} />
              Select Save Folder
            </button>
            <button
              type="button"
              disabled={!selectedRecord}
              onClick={() => selectedRecord && downloadImageUrl(selectedRecord.imageUrl, selectedRecord.fileName)}
            >
              <Download size={17} />
              Download Image
            </button>
          </div>
        </div>

        <div className={`preview-stage ${selectedRecord ? "has-image" : ""}`}>
          {isLoading ? (
            <div className="loading-overlay">
              <LoaderCircle className="spin" size={28} />
              <span>Generating image...</span>
            </div>
          ) : null}

          {selectedRecord ? (
            <>
              <img
                src={selectedRecord.imageUrl}
                alt={selectedRecord.prompt}
                className={selectedImageBroken ? "is-broken" : ""}
                onError={() => {
                  setBrokenImageIds((ids) => new Set(ids).add(selectedRecord.id));
                }}
              />
              {selectedImageBroken ? (
                <div className="empty-state broken-image-state">
                  <ImageIcon size={42} />
                  <p>Image URL is unavailable or expired.</p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <ImageIcon size={42} />
              <p>Generated images will be displayed here.</p>
            </div>
          )}
        </div>

        {selectedRecord ? (
          <div className="result-meta">
            <span>{selectedRecord.mode === "text-to-image" ? "Text-to-Image" : "Image-to-Image"}</span>
            <span>{selectedRecord.size}</span>
            <span>{new Date(selectedRecord.createdAt).toLocaleString()}</span>
            <span>{selectedRecord.saved ? "Auto-saved" : "Manual save available"}</span>
          </div>
        ) : null}

        <HistoryList
          history={history}
          selectedId={selectedRecord?.id ?? null}
          onSelect={setSelectedId}
        />
      </section>

      {settingsOpen ? (
        <SettingsDialog
          config={config}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveConfig}
        />
      ) : null}
    </main>
  );
}

function ImageDropzone({
  previewUrl,
  onFile,
}: {
  previewUrl: string;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFile(file);
    }
  };

  return (
    <div
      className="dropzone"
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
          onFile(file);
        }
      }}
    >
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onInput} />
      {previewUrl ? (
        <img src={previewUrl} alt="Base image preview" />
      ) : (
        <>
          <Upload size={26} />
          <span>Drop or choose a base image</span>
          <small>PNG, JPG, JPEG, or WebP. Max 25MB.</small>
        </>
      )}
    </div>
  );
}

function SettingsDialog({
  config,
  onClose,
  onSave,
}: {
  config: ApiConfig | null;
  onClose: () => void;
  onSave: (config: ApiConfig) => void;
}) {
  const [apiKey, setApiKey] = useState(config?.apiKey ?? "");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? DEFAULT_PROVIDER_BASE_URL);
  const [model, setModel] = useState(config?.model ?? "gpt-image-2");
  const [generationPath, setGenerationPath] = useState(config?.generationPath ?? "/images/generations");
  const [editPath, setEditPath] = useState(config?.editPath ?? "/images/edits");
  const [useLocalProxy, setUseLocalProxy] = useState(config?.useLocalProxy ?? false);
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState("");

  const canSave = Boolean(apiKey.trim() && baseUrl.trim());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!apiKey.trim()) {
      setMessage("Please enter API Key");
      return;
    }
    if (!baseUrl.trim()) {
      setMessage("Please enter Base URL");
      return;
    }

    try {
      new URL(baseUrl);
    } catch {
      setMessage("Please enter a valid Base URL");
      return;
    }

    onSave({
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      generationPath: generationPath.trim(),
      editPath: editPath.trim(),
      useLocalProxy,
    });
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="settings-dialog" onSubmit={submit} role="dialog" aria-modal="true" aria-label="API Settings">
        <header>
          <div>
            <h2>API Settings</h2>
            <p>Stored only in this browser localStorage.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </header>

        <div className="field">
          <label htmlFor="api-key-input">API Key</label>
          <div className="password-row">
            <input
              id="api-key-input"
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <button type="button" onClick={() => setShowKey((value) => !value)} aria-label="Show or hide API key">
              {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="base-url-input">Provider Base URL</label>
          <input
            id="base-url-input"
            type="url"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder={DEFAULT_PROVIDER_BASE_URL}
          />
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              if (!baseUrl.trim() || baseUrl.includes(LEGACY_LOCAL_PROXY_PATH)) {
                setBaseUrl(DEFAULT_PROVIDER_BASE_URL);
              }
              setUseLocalProxy(true);
            }}
          >
            Use Local Proxy
          </button>
          <small>
            Local proxy sends browser requests to {LOCAL_PROXY_BASE_URL}, then forwards to the Provider Base URL.
          </small>
        </div>

        <label className="field">
          <span>Model</span>
          <input
            type="text"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="gpt-image-2"
          />
        </label>

        <label className="field">
          <span>Text Generation Path</span>
          <input
            type="text"
            value={generationPath}
            onChange={(event) => setGenerationPath(event.target.value)}
            placeholder="/images/generations"
          />
        </label>

        <label className="field">
          <span>Image Edit Path</span>
          <input
            type="text"
            value={editPath}
            onChange={(event) => setEditPath(event.target.value)}
            placeholder="/images/edits"
          />
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={useLocalProxy}
            onChange={(event) => setUseLocalProxy(event.target.checked)}
          />
          <span>Use local proxy for CORS-blocked providers</span>
        </label>

        {message ? <div className="error-message">{message}</div> : null}

        <button className="generate-button" type="submit" disabled={!canSave}>
          Save & Confirm
        </button>
      </form>
    </div>
  );
}

function HistoryList({
  history,
  selectedId,
  onSelect,
}: {
  history: HistoryRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="history-panel" aria-label="History log">
      <div className="history-header">
        <h2>History</h2>
        <span>{history.length} records</span>
      </div>
      {history.length === 0 ? (
        <p className="history-empty">Successful generations will appear here.</p>
      ) : (
        <div className="history-list">
          {history.map((record) => (
            <button
              key={record.id}
              type="button"
              className={`history-item ${record.id === selectedId ? "selected" : ""}`}
              onClick={() => onSelect(record.id)}
            >
              <img
                src={record.imageUrl}
                alt=""
                onError={(event) => {
                  event.currentTarget.classList.add("is-broken");
                }}
              />
              <span>
                <strong>{record.mode === "text-to-image" ? "Text" : "Image"}</strong>
                <small>{record.size}</small>
                <small>{new Date(record.createdAt).toLocaleTimeString()}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

export default App;
