import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Code,
  Download,
  GripVertical,
  HelpCircle,
  Layers,
  Maximize,
  Mic,
  Minimize,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Subtitles,
  Trash2,
  Video,
  Volume2,
} from 'lucide-react';
import { StoryboardOutline } from '../../shared/storyboardOutline';
import { ApiProjectRecord, ChatMessage, Project, ProjectMode } from '../types';
import {
  createProject as createProjectApi,
  deleteProjectById,
  fetchProjectMessages,
  fetchProjects,
  generateStoryboardAudio,
  generateStoryboardImage,
  sendProjectMessage,
} from '../lib/projectApi';
import {
  attachOutlineToLatestMessage,
  createProjectFromRecord,
  getDefaultPrompt,
  mapApiChatMessage,
} from '../lib/projectContent';

interface StudioViewProps {
  initialProjectId: string | null;
  initialMode: ProjectMode | null;
  initialPrompt: string | null;
  onBackToHome: () => void;
}

const RIGHT_PANEL_MIN_WIDTH = 360;
const SPLIT_HANDLE_WIDTH = 12;

export default function StudioView({ initialProjectId, initialMode, initialPrompt, onBackToHome }: StudioViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(initialProjectId);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [isCaptionsOn, setIsCaptionsOn] = useState(true);
  const [isFullscreenOn, setIsFullscreenOn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('');
  const [rightPanelWidth, setRightPanelWidth] = useState(420);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);

  const [inputText, setInputText] = useState('');
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageLoadError, setMessageLoadError] = useState<string | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenerationStatus, setImageGenerationStatus] = useState('');
  const [imageGenerationError, setImageGenerationError] = useState(false);
  const [currentGeneratingSceneNumber, setCurrentGeneratingSceneNumber] = useState<number | null>(null);
  const [currentGenerationPhase, setCurrentGenerationPhase] = useState<'image' | 'audio' | null>(null);
  const [imageGenerationProgress, setImageGenerationProgress] = useState({ completed: 0, total: 0 });
  const [playingAudioSceneNumber, setPlayingAudioSceneNumber] = useState<number | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjMode, setNewProjMode] = useState<ProjectMode>('slideshow');
  const [newProjPrompt, setNewProjPrompt] = useState('');
  const [expandedOutline, setExpandedOutline] = useState<StoryboardOutline | null>(null);

  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; width: number } | null>(null);
  const playerTimerRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const imageGenerationAbortRef = useRef<AbortController | null>(null);
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);

  const activeProject = projects.find((project) => project.isActive) || projects[0] || null;
  const totalDuration = useMemo(
    () => activeProject?.scenes.reduce((sum, scene) => sum + scene.duration, 0) ?? 0,
    [activeProject?.scenes],
  );
  const currentActiveScene = activeProject?.scenes[activeSceneIndex] || null;
  const canGenerateStoryboardImages = Boolean(
    activeProject?.mode === 'slideshow' && activeProject.outline && activeProject.scenes.length > 0,
  );

  useEffect(() => {
    setActiveProjectId(initialProjectId);
    void loadProjects(initialProjectId, initialPrompt);
    // This only reboots studio state when a new initial project enters the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProjectId, initialMode, initialPrompt]);

  useEffect(() => {
    if (!activeProjectId) {
      return;
    }

    void loadMessages(activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    if (!messageListRef.current) {
      return;
    }

    messageListRef.current.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [activeProject?.messages, isAssistantTyping]);

  useEffect(() => {
    if (!isPlaying || totalDuration <= 0) {
      if (playerTimerRef.current) {
        window.clearInterval(playerTimerRef.current);
        playerTimerRef.current = null;
      }
      return;
    }

    playerTimerRef.current = window.setInterval(() => {
      setPlaybackTime((previousTime) => {
        const nextTime = Math.min(totalDuration, Math.round((previousTime + 0.1) * 10) / 10);
        if (nextTime >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return nextTime;
      });
    }, 100);

    return () => {
      if (playerTimerRef.current) {
        window.clearInterval(playerTimerRef.current);
        playerTimerRef.current = null;
      }
    };
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    if (!activeProject || activeProject.scenes.length === 0) {
      setActiveSceneIndex(0);
      setPlaybackTime(0);
      setIsPlaying(false);
      return;
    }

    let accumulatedTime = 0;
    for (let index = 0; index < activeProject.scenes.length; index += 1) {
      const scene = activeProject.scenes[index];
      if (playbackTime >= accumulatedTime && playbackTime < accumulatedTime + scene.duration) {
        setActiveSceneIndex(index);
        return;
      }
      accumulatedTime += scene.duration;
    }

    setActiveSceneIndex(Math.max(0, activeProject.scenes.length - 1));
  }, [activeProject, playbackTime]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenOn(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      if (!dragStartRef.current) {
        return;
      }

      const delta = dragStartRef.current.x - event.clientX;
      setRightPanelWidth(clampRightPanelWidth(dragStartRef.current.width + delta, workspaceRef.current));
    };

    const handlePointerUp = () => {
      dragStartRef.current = null;
    };

    const handleResize = () => {
      setRightPanelWidth((currentWidth) => clampRightPanelWidth(currentWidth, workspaceRef.current));
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  async function loadProjects(preferredProjectId?: string | null, preferredPrompt?: string | null) {
    setIsLoadingProjects(true);
    setProjectLoadError(null);

    try {
      const records = await fetchProjects();
      const resolvedActiveId = preferredProjectId ?? activeProjectId ?? records[0]?.uuid ?? null;
      const nextProjects = records.map((record) =>
        createProjectFromRecord(record, {
          isActive: record.uuid === resolvedActiveId,
          promptOverride: record.uuid === resolvedActiveId ? preferredPrompt : null,
        }),
      );

      setProjects(nextProjects);
      setActiveProjectId(resolvedActiveId);
    } catch (error) {
      setProjectLoadError(error instanceof Error ? error.message : '项目列表加载失败');
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  }

  async function loadMessages(projectId: string) {
    setIsLoadingMessages(true);
    setMessageLoadError(null);

    try {
      const records = await fetchProjectMessages(projectId);
      setProjects((previousProjects) =>
        previousProjects.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          const messages = attachOutlineToLatestMessage(
            records.map((record) => mapApiChatMessage(record)),
            project.outline,
          );

          return {
            ...project,
            messages,
          };
        }),
      );
    } catch (error) {
      setMessageLoadError(error instanceof Error ? error.message : '加载对话历史失败');
      setProjects((previousProjects) =>
        previousProjects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                messages: [],
              }
            : project,
        ),
      );
    } finally {
      setIsLoadingMessages(false);
    }
  }

  const handleSceneCardClick = (index: number) => {
    if (!activeProject || activeProject.scenes.length === 0) {
      return;
    }

    setActiveSceneIndex(index);
    setPlaybackTime(activeProject.scenes[index].startTime);
  };

  const handleNarrationAudioClick = (sceneNumber: number, audioUrl: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (playingAudioSceneNumber === sceneNumber && narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.currentTime = 0;
      narrationAudioRef.current = null;
      setPlayingAudioSceneNumber(null);
      return;
    }

    narrationAudioRef.current?.pause();
    const audio = new Audio(audioUrl);
    narrationAudioRef.current = audio;
    setPlayingAudioSceneNumber(sceneNumber);
    audio.addEventListener('ended', () => {
      narrationAudioRef.current = null;
      setPlayingAudioSceneNumber(null);
    }, { once: true });
    void audio.play().catch((error) => {
      narrationAudioRef.current = null;
      setPlayingAudioSceneNumber(null);
      console.error('[storyboard-audio] Playback failed', error);
    });
  };

  const applyGeneratedProjectRecord = (projectId: string, record: ApiProjectRecord) => {
    const refreshedProject = createProjectFromRecord(record, { isActive: true });
    setProjects((previousProjects) =>
      previousProjects.map((project) =>
        project.id === projectId
          ? {
              ...refreshedProject,
              isActive: true,
              messages: project.messages,
            }
          : project,
      ),
    );
  };

  const handleGenerateAllStoryboardImages = async () => {
    if (!activeProject || !canGenerateStoryboardImages || isGeneratingImages) {
      return;
    }

    const projectId = activeProject.id;
    const scenesToGenerate = activeProject.scenes.filter((scene) => !scene.imageUrl || !scene.audioUrl);
    if (scenesToGenerate.length === 0) {
      setImageGenerationStatus('所有分镜画面和旁白音频已生成');
      setImageGenerationError(false);
      return;
    }

    const abortController = new AbortController();
    imageGenerationAbortRef.current = abortController;
    setIsGeneratingImages(true);
    setImageGenerationError(false);
    setImageGenerationProgress({ completed: 0, total: scenesToGenerate.length });
    setImageGenerationStatus(`已开始生成，共 ${scenesToGenerate.length} 个分镜资源`);
    console.info(`[storyboard-assets] Starting batch project=${projectId} scenes=${scenesToGenerate.length}`);

    try {
      for (let index = 0; index < scenesToGenerate.length; index += 1) {
        const scene = scenesToGenerate[index];
        if (abortController.signal.aborted) {
          break;
        }

        setCurrentGeneratingSceneNumber(scene.sceneNumber);
        let latestProjectRecord: ApiProjectRecord | null = null;
        if (!scene.imageUrl) {
          setCurrentGenerationPhase('image');
          setImageGenerationStatus(`正在生成画面 ${index + 1}/${scenesToGenerate.length}：Scene ${scene.sceneNumber}`);
          console.info(`[storyboard-image] Generating scene=${scene.sceneNumber}`);
          const imageResult = await generateStoryboardImage({
            projectUuid: projectId,
            sceneNumber: scene.sceneNumber,
            signal: abortController.signal,
          });
          latestProjectRecord = imageResult.project;
          applyGeneratedProjectRecord(projectId, imageResult.project);
          console.info(`[storyboard-image] Completed scene=${scene.sceneNumber} skipped=${imageResult.skipped}`);
        }

        if (abortController.signal.aborted) {
          break;
        }

        if (!scene.audioUrl) {
          setCurrentGenerationPhase('audio');
          setImageGenerationStatus(`正在生成旁白 ${index + 1}/${scenesToGenerate.length}：Scene ${scene.sceneNumber}`);
          console.info(`[storyboard-audio] Generating scene=${scene.sceneNumber}`);
          const audioResult = await generateStoryboardAudio({
            projectUuid: projectId,
            sceneNumber: scene.sceneNumber,
            signal: abortController.signal,
          });
          latestProjectRecord = audioResult.project;
          applyGeneratedProjectRecord(projectId, audioResult.project);
          console.info(`[storyboard-audio] Completed scene=${scene.sceneNumber} skipped=${audioResult.skipped}`);
        }

        if (!latestProjectRecord) {
          continue;
        }
        setImageGenerationProgress({ completed: index + 1, total: scenesToGenerate.length });
      }

      setImageGenerationStatus(abortController.signal.aborted ? '已中断生成，已完成的资源已保存' : '分镜画面和旁白音频生成完成');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setImageGenerationStatus('已中断生成，已完成的资源已保存');
        return;
      }

      setImageGenerationError(true);
      setImageGenerationStatus(error instanceof Error ? `生成失败：${error.message}` : '分镜画面生成失败');
      console.error('[storyboard-image] Batch generation failed', error);
    } finally {
      if (imageGenerationAbortRef.current === abortController) {
        imageGenerationAbortRef.current = null;
      }
      setIsGeneratingImages(false);
      setCurrentGeneratingSceneNumber(null);
      setCurrentGenerationPhase(null);
    }
  };

  const handleStopStoryboardImageGeneration = () => {
    imageGenerationAbortRef.current?.abort();
    setImageGenerationStatus('正在中断生成...');
  };

  const selectProject = (projectId: string) => {
    narrationAudioRef.current?.pause();
    narrationAudioRef.current = null;
    setPlayingAudioSceneNumber(null);
    imageGenerationAbortRef.current?.abort();
    imageGenerationAbortRef.current = null;
    setIsGeneratingImages(false);
    setImageGenerationStatus('');
    setImageGenerationError(false);
    setCurrentGeneratingSceneNumber(null);
    setCurrentGenerationPhase(null);
    setImageGenerationProgress({ completed: 0, total: 0 });
    setActiveProjectId(projectId);
    setProjects((previousProjects) =>
      previousProjects.map((project) => ({
        ...project,
        isActive: project.id === projectId,
      })),
    );
    setIsPlaying(false);
    setActiveSceneIndex(0);
    setPlaybackTime(0);
  };

  const deleteProject = async (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (projects.length <= 1) {
      window.alert('请至少保留一个项目目录。');
      return;
    }

    const projectToDelete = projects.find((project) => project.id === projectId);
    if (!projectToDelete) {
      return;
    }

    const confirmed = window.confirm(`确定要删除“${projectToDelete.title}”项目吗？该操作无法撤销。`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingProjectId(projectId);
      await deleteProjectById(projectId);
      const remainingProjects = projects.filter((project) => project.id !== projectId);
      const nextActiveId = projectToDelete.isActive ? remainingProjects[0]?.id ?? null : activeProjectId;
      setIsPlaying(false);
      setActiveSceneIndex(0);
      setPlaybackTime(0);
      await loadProjects(nextActiveId);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除项目失败');
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleCreateNewProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newProjTitle.trim()) {
      window.alert('请输入项目名称。');
      return;
    }

    const draftPrompt = newProjPrompt.trim() || getDefaultPrompt(newProjMode);

    try {
      setIsCreatingProject(true);
      const project = await createProjectApi({
        mode: newProjMode,
        prompt: draftPrompt,
        title: newProjTitle.trim(),
      });

      setIsCreateModalOpen(false);
      setNewProjTitle('');
      setNewProjPrompt('');
      setActiveSceneIndex(0);
      setPlaybackTime(0);
      setIsPlaying(false);
      await loadProjects(project.uuid, draftPrompt);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '创建项目失败');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const triggerQuickAction = (phrase: string) => {
    setInputText(phrase);
    void handleSendChatMessage(phrase);
  };

  const handleSendChatMessage = async (textToSend?: string) => {
    const rawText = textToSend ?? inputText;
    if (!rawText.trim() || !activeProject) {
      return;
    }

    const content = rawText.trim();
    const projectId = activeProject.id;
    const userMessage: ChatMessage = {
      id: `usr-msg-${Date.now()}`,
      sender: 'user',
      text: content,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setProjects((previousProjects) =>
      previousProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              messages: [...project.messages, userMessage],
            }
          : project,
      ),
    );

    if (!textToSend) {
      setInputText('');
    }

    setIsAssistantTyping(true);
    setMessageLoadError(null);

    try {
      const result = await sendProjectMessage({
        projectUuid: projectId,
        content,
      });

      const refreshedProject = createProjectFromRecord(result.project, {
        isActive: true,
      });
      const assistantMessage = mapApiChatMessage(result.assistantMessage, result.outline);

      setProjects((previousProjects) =>
        previousProjects.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          return {
            ...refreshedProject,
            isActive: true,
            messages: [...project.messages, assistantMessage],
          };
        }),
      );

      setActiveSceneIndex(0);
      setPlaybackTime(0);
    } catch (error) {
      setProjects((previousProjects) =>
        previousProjects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                messages: [
                  ...project.messages,
                  {
                    id: `asst-error-${Date.now()}`,
                    sender: 'assistant',
                    text: error instanceof Error ? error.message : '消息发送失败，请稍后重试。',
                    timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                  },
                ],
              }
            : project,
        ),
      );
    } finally {
      setIsAssistantTyping(false);
    }
  };

  const handleFullscreenToggle = () => {
    if (!previewContainerRef.current) {
      return;
    }

    if (!document.fullscreenElement) {
      previewContainerRef.current.requestFullscreen().catch(() => undefined);
      return;
    }

    document.exitFullscreen().catch(() => undefined);
  };

  const handleExportRecording = () => {
    if (!activeProject || activeProject.scenes.length === 0) {
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportStage('正在整理分镜时间线与字幕轨道...');

    const stages = [
      { progress: 22, message: '正在汇总旁白与分镜时长信息...' },
      { progress: 48, message: '正在准备录屏导出参数与媒体容器...' },
      { progress: 75, message: '正在模拟合成视频输出文件...' },
      { progress: 100, message: '导出完成，正在触发下载...' },
    ];

    let stageIndex = 0;
    const interval = window.setInterval(() => {
      setExportProgress((currentProgress) => {
        const target = stages[stageIndex]?.progress ?? 100;
        if (currentProgress < target) {
          return currentProgress + 1;
        }

        if (stageIndex < stages.length - 1) {
          stageIndex += 1;
          setExportStage(stages[stageIndex].message);
          return currentProgress;
        }

        window.clearInterval(interval);
        window.setTimeout(() => {
          const file = new Blob(
            [
              `VisionCraft storyboard export\nproject=${activeProject.title}\nmode=${activeProject.mode}\nscenes=${activeProject.scenes.length}`,
            ],
            { type: 'text/plain' },
          );
          const link = document.createElement('a');
          link.href = URL.createObjectURL(file);
          link.download = `${activeProject.title}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setIsExporting(false);
        }, 500);

        return currentProgress;
      });
    }, 40);
  };

  const handleSplitMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    dragStartRef.current = {
      x: event.clientX,
      width: rightPanelWidth,
    };
  };

  if (isLoadingProjects && !activeProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-[#dae2fd]">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-[#ddb7ff]" />
          <p className="text-sm text-slate-300">正在加载项目历史...</p>
        </div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] px-6 text-[#dae2fd]">
        <div className="max-w-md rounded-2xl border border-[#1e293b] bg-[#131b2e] p-6 text-center shadow-[0_0_30px_rgba(221,183,255,0.08)]">
          <AlertCircle className="mx-auto mb-4 h-8 w-8 text-[#ddb7ff]" />
          <h2 className="text-lg font-bold text-white">暂无可用项目</h2>
          <p className="mt-2 text-sm text-slate-400">
            {projectLoadError || '数据库里还没有项目记录，先回首页创建一个项目吧。'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => void loadProjects()}
              className="rounded-lg border border-[#ddb7ff]/30 px-4 py-2 text-sm text-[#ddb7ff] transition hover:bg-[#ddb7ff]/10"
            >
              重新加载
            </button>
            <button
              onClick={onBackToHome}
              className="rounded-lg bg-[#ddb7ff] px-4 py-2 text-sm font-semibold text-[#2c0051] transition hover:bg-white"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#020617] text-[#dae2fd]">
      <header className="z-10 flex h-16 items-center justify-between border-b border-[#1e293b]/50 px-6 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button
            onClick={onBackToHome}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#1e293b]/80 bg-[#1e293b]/40 px-3 py-1.5 text-xs font-mono text-[#cfc2d6] transition-all hover:bg-[#1e293b] hover:text-[#ddb7ff]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>返回首页</span>
          </button>

          <div className="flex items-center gap-2.5">
            <span className="bg-gradient-to-r from-[#ddb7ff] to-[#adc6ff] bg-clip-text text-lg font-bold tracking-tight text-transparent">
              VisionCraft AI
            </span>
            <div className="h-4 w-px bg-[#1e293b]" />
            <span className="text-xs font-mono text-[#cfc2d6]/60">核心创作空间</span>
          </div>
        </div>

        <div className="hidden items-center gap-1 rounded-full border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400 md:flex">
          <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          WORKSPACE ONLINE
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="flex h-full w-80 shrink-0 flex-col justify-between border-r border-[#1e293b]/40 bg-[#0b1326]">
          <div className="flex flex-1 flex-col overflow-hidden p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wide text-white">历史项目</span>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={isCreatingProject}
                className="cursor-pointer rounded-lg border border-[#ddb7ff]/20 bg-[#ddb7ff]/10 p-1.5 text-[#ddb7ff] transition-all hover:bg-[#ddb7ff]/20 hover:border-[#ddb7ff]/40 disabled:cursor-not-allowed disabled:opacity-40"
                title="新建视频项目"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="custom-scrollbar flex-1 space-y-2.5 overflow-y-auto pr-1">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => selectProject(project.id)}
                  className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3.5 transition-all duration-300 ${
                    project.isActive
                      ? 'border-[#ddb7ff] bg-[#171f33]/95 shadow-[0_0_15px_rgba(221,183,255,0.1)]'
                      : 'border-[#1e293b]/70 bg-[#131b2e]/45 hover:border-[#ddb7ff]/30 hover:bg-[#131b2e]/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`truncate text-xs font-semibold ${project.isActive ? 'text-[#ddb7ff]' : 'text-slate-300'}`}>
                      {project.title}
                    </span>
                    <button
                      onClick={(event) => void deleteProject(project.id, event)}
                      disabled={deletingProjectId === project.id}
                      className="cursor-pointer rounded p-1 text-slate-500 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-100"
                      title="删除项目"
                    >
                      {deletingProjectId === project.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {project.mode === 'slideshow' ? (
                      <span className="inline-flex items-center gap-1 rounded border border-[#ddb7ff]/10 bg-[#ddb7ff]/5 px-1.5 py-0.5 text-[10px] text-[#ddb7ff]/70">
                        <Video className="h-2.5 w-2.5" />
                        图片轮播
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded border border-[#4cd7f6]/10 bg-[#4cd7f6]/5 px-1.5 py-0.5 text-[10px] text-[#4cd7f6]/70">
                        <Code className="h-2.5 w-2.5" />
                        Web动画
                      </span>
                    )}

                    <span className="text-[10px] text-slate-500">{project.createdAt}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#1e293b]/30 pt-1">
                    <p className="max-w-[170px] truncate text-[11px] italic text-slate-400">
                      {project.scenes.length > 0 ? `已生成 ${project.scenes.length} 个分镜` : '等待生成视频大纲'}
                    </p>
                    {project.scenes.length > 0 ? (
                      <span className="flex items-center gap-1 text-[9px] text-slate-500">
                        <Check className="h-3 w-3 text-[#4cd7f6]" />
                        100%
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[9px] text-slate-500">空项目</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#1e293b]/30 bg-[#020617]/40 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex cursor-default items-center gap-1.5">
                <HelpCircle className="h-4 w-4" />
                帮助中心
              </span>
              <span className="font-mono text-[10px] text-slate-500">ENGINE v2.4</span>
            </div>
          </div>
        </aside>

        <div ref={workspaceRef} className="flex min-w-0 flex-1 overflow-hidden">
          <section
            className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden bg-[#020617] p-4"
            style={{ width: `calc(100% - ${rightPanelWidth}px - ${SPLIT_HANDLE_WIDTH}px)` }}
          >
            <div className="flex h-14 items-center justify-between rounded-xl border border-[#1e293b]/60 bg-[#131b2e]/80 px-4 shadow-[0_0_15px_rgba(221,183,255,0.02)]">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-[#ddb7ff]/20 bg-[#ddb7ff]/10 p-1.5 text-[#ddb7ff]">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="max-w-[320px] truncate text-sm font-bold tracking-wide text-white">{activeProject.title}</h2>
                  <p className="text-[11px] text-slate-400">
                    {activeProject.mode === 'slideshow' ? '图片轮播视频工作流' : 'HTML 动画视频工作流'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canGenerateStoryboardImages && (
                  <>
                    <button
                      onClick={() => void handleGenerateAllStoryboardImages()}
                      disabled={isGeneratingImages}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all ${
                        isGeneratingImages
                          ? 'cursor-not-allowed border-slate-700/60 bg-slate-800 text-slate-500'
                          : 'border-[#ddb7ff]/30 bg-[#ddb7ff]/10 text-[#ddb7ff] hover:bg-[#ddb7ff]/20'
                      }`}
                    >
                      {isGeneratingImages ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      <span>{isGeneratingImages ? '生成中' : '一键生成'}</span>
                    </button>

                    <button
                      onClick={handleStopStoryboardImageGeneration}
                      disabled={!isGeneratingImages}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all ${
                        isGeneratingImages
                          ? 'cursor-pointer border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
                          : 'cursor-not-allowed border-slate-700/60 bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Pause className="h-3.5 w-3.5" />
                      <span>中断生成</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setIsCaptionsOn((currentValue) => !currentValue)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all ${
                    isCaptionsOn
                      ? 'border-[#ddb7ff] bg-[#ddb7ff]/10 text-[#ddb7ff]'
                      : 'border-[#1e293b] bg-[#1a2336]/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <Subtitles className="h-3.5 w-3.5" />
                  <span>字幕</span>
                </button>

                <button
                  onClick={handleFullscreenToggle}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#1a2336]/40 px-3 py-1.5 text-xs text-slate-400 transition-all hover:text-white"
                >
                  {isFullscreenOn ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                  <span>全屏</span>
                </button>

                <button
                  disabled={activeProject.scenes.length === 0}
                  onClick={handleExportRecording}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-4 py-1.5 text-xs font-bold transition-all ${
                    activeProject.scenes.length === 0
                      ? 'cursor-not-allowed border-slate-700/60 bg-slate-800 text-slate-500'
                      : 'cursor-pointer border-transparent bg-gradient-to-r from-[#ddb7ff] to-[#adc6ff] text-[#2c0051] hover:from-white hover:to-white hover:shadow-[0_0_15px_rgba(221,183,255,0.3)]'
                  }`}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>录屏导出</span>
                </button>
              </div>
            </div>

            {imageGenerationStatus && (
              <div
                className={`shrink-0 rounded-lg border px-4 py-3 ${
                  imageGenerationError
                    ? 'border-rose-400/40 bg-rose-500/10 text-rose-100'
                    : 'border-[#ddb7ff]/30 bg-[#ddb7ff]/10 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-2 text-xs">
                    {isGeneratingImages ? (
                      <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-[#ddb7ff]" />
                    ) : imageGenerationError ? (
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-300" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    )}
                    <span className="truncate">{imageGenerationStatus}</span>
                  </div>
                  {imageGenerationProgress.total > 0 && (
                    <span className="shrink-0 font-mono text-[11px] text-slate-400">
                      {imageGenerationProgress.completed}/{imageGenerationProgress.total}
                    </span>
                  )}
                </div>
                {imageGenerationProgress.total > 0 && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
                    <div
                      className={`h-full transition-all duration-300 ${
                        imageGenerationError ? 'bg-rose-400' : 'bg-[#ddb7ff]'
                      }`}
                      style={{
                        width: `${(imageGenerationProgress.completed / imageGenerationProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <div
              ref={previewContainerRef}
              className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#1e293b]/60 bg-[#060e20] shadow-inner"
            >
              {activeProject.scenes.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <div className="mb-5 rounded-full border border-[#ddb7ff]/20 bg-[#ddb7ff]/10 p-4 text-[#ddb7ff]">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">还没有生成视频大纲</h3>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400">
                    中间预览区现在保持为空。请在右侧发送创作指令，AI 生成结构化分镜后，这里会按真实大纲加载每个镜头的标题、旁白和画面提示词。
                  </p>
                  <div className="mt-6 rounded-2xl border border-dashed border-[#ddb7ff]/20 bg-[#131b2e]/40 px-5 py-4 text-left text-sm text-slate-300">
                    <div className="mb-1 text-xs font-mono uppercase tracking-[0.24em] text-[#ddb7ff]">当前项目提示词</div>
                    <p className="select-text whitespace-pre-wrap leading-6">{activeProject.prompt}</p>
                  </div>
                </div>
              ) : (
                <div className="relative flex h-full flex-col bg-[radial-gradient(circle_at_top,_rgba(221,183,255,0.18),_transparent_36%),linear-gradient(135deg,#0b1326_0%,#060e20_55%,#111827_100%)]">
                  <div className="flex items-start justify-between gap-6 p-6">
                    <div className="min-w-0">
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-slate-300">
                        <span>{activeProject.mode === 'slideshow' ? 'Image Prompt Scene' : 'HTML Motion Scene'}</span>
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-white">
                        Scene {String(currentActiveScene?.sceneNumber ?? 0).padStart(2, '0')} · {currentActiveScene?.title}
                      </h3>
                      <p className="mt-3 max-w-3xl select-text whitespace-pre-wrap text-sm leading-7 text-slate-300">
                        {currentActiveScene?.narration}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (activeProject.scenes.length === 0) {
                          return;
                        }

                        if (isPlaying) {
                          setIsPlaying(false);
                          return;
                        }

                        if (playbackTime >= totalDuration) {
                          setPlaybackTime(0);
                          setActiveSceneIndex(0);
                        }
                        setIsPlaying(true);
                      }}
                      className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#ddb7ff]/20 bg-[#171f33]/90 text-[#ddb7ff] shadow-[0_0_20px_rgba(221,183,255,0.2)] transition-all hover:scale-105"
                    >
                      {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current translate-x-0.5" />}
                    </button>
                  </div>

                  <div className="grid flex-1 gap-5 px-6 pb-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(140deg,rgba(18,24,43,0.96),rgba(13,19,38,0.82))] p-6">
                      {currentActiveScene?.imageUrl && (
                        <img
                          src={currentActiveScene.imageUrl}
                          alt={currentActiveScene.title}
                          className="absolute inset-0 z-10 h-full w-full object-cover"
                        />
                      )}
                      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#ddb7ff]/10 to-transparent" />
                      <div className="relative flex h-full flex-col justify-between">
                        <div>
                          <div className="mb-3 text-xs font-mono uppercase tracking-[0.24em] text-[#ddb7ff]">画面预览预留区</div>
                          <div className="rounded-2xl border border-dashed border-[#ddb7ff]/25 bg-[#0b1326]/70 p-6">
                            <p className="text-sm font-semibold text-white">
                              {activeProject.mode === 'slideshow' ? '后续将在这里展示 AI 生成的分镜图片' : '后续将在这里展示 AI 生成的网页动画'}
                            </p>
                            <p className="mt-3 select-text whitespace-pre-wrap text-sm leading-7 text-slate-300">
                              {currentActiveScene?.visualPrompt}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
                          <span>{activeProject.scenes.length} 个分镜</span>
                          <span>总时长 {totalDuration} 秒</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="rounded-2xl border border-white/10 bg-[#131b2e]/88 p-5">
                        <div className="mb-2 text-xs font-mono uppercase tracking-[0.24em] text-[#4cd7f6]">当前镜头信息</div>
                        <div className="space-y-3 text-sm text-slate-300">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">镜头时长</div>
                            <div className="mt-1 font-semibold text-white">{currentActiveScene?.duration} 秒</div>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">镜头区间</div>
                            <div className="mt-1 font-semibold text-white">
                              00:{String(currentActiveScene?.startTime ?? 0).padStart(2, '0')} - 00:
                              {String(currentActiveScene?.endTime ?? 0).padStart(2, '0')}
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">模式</div>
                            <div className="mt-1 font-semibold text-white">
                              {activeProject.mode === 'slideshow' ? '图片生成提示词' : 'HTML 动画提示词'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 rounded-2xl border border-white/10 bg-[#0b1326]/75 p-5">
                        <div className="mb-2 text-xs font-mono uppercase tracking-[0.24em] text-[#ddb7ff]">项目概要</div>
                        <p className="select-text whitespace-pre-wrap text-sm leading-7 text-slate-300">
                          {activeProject.outline?.summary || '生成后将在这里展示整支视频的叙事概要。'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isCaptionsOn && currentActiveScene && (
                    <div className="pointer-events-none absolute bottom-7 left-1/2 z-10 w-[min(88%,760px)] -translate-x-1/2">
                      <div className="rounded-2xl border border-white/10 bg-black/55 px-5 py-3 text-center text-sm leading-7 text-white backdrop-blur-sm">
                        <span className="select-text">{currentActiveScene.narration}</span>
                      </div>
                    </div>
                  )}

                  <div className="absolute left-0 right-0 bottom-0 h-1 bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-[#ddb7ff] to-[#4cd7f6] transition-all duration-100"
                      style={{ width: `${totalDuration > 0 ? (playbackTime / totalDuration) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex h-52 shrink-0 flex-col gap-1.5">
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-slate-400">
                  <Layers className="h-3 w-3" />
                  分镜脚本
                </span>
                <div className="flex min-w-0 items-center gap-3">
                  {imageGenerationStatus && (
                    <span className="max-w-[260px] truncate text-[#ddb7ff]">{imageGenerationStatus}</span>
                  )}
                  <span className="tracking-wider text-slate-500">
                  共 {activeProject.scenes.length} 个镜头 • 总长 {totalDuration} 秒
                  </span>
                </div>
              </div>

              {activeProject.scenes.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#1e293b] bg-[#131b2e]/25 px-6 text-sm text-slate-500">
                  生成大纲后，这里会按真实分镜动态加载列表。
                </div>
              ) : (
                <div className="custom-scrollbar flex flex-1 gap-3 overflow-x-auto pb-1.5">
                  {activeProject.scenes.map((scene, index) => {
                    const isActive = index === activeSceneIndex;

                    return (
                      <div
                        key={scene.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSceneCardClick(index)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSceneCardClick(index);
                          }
                        }}
                        className={`flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border text-left transition-all duration-300 ${
                          isActive
                            ? 'translate-y-[-2px] border-[#ddb7ff] bg-[#171f33] shadow-[0_0_15px_rgba(221,183,255,0.15)]'
                            : 'border-[#1e293b] bg-[#131b2e]/60 hover:border-[#ddb7ff]/30 hover:bg-[#131b2e]/90'
                        }`}
                      >
                        <div className="relative h-24 overflow-hidden border-b border-white/5 bg-[linear-gradient(135deg,rgba(221,183,255,0.12),rgba(76,215,246,0.08),rgba(11,19,38,0.9))] p-3">
                          {scene.imageUrl && (
                            <img
                              src={scene.imageUrl}
                              alt={scene.title}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050816]/95 via-[#050816]/40 to-[#050816]/25" />
                          {currentGeneratingSceneNumber === scene.sceneNumber && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#050816]/70">
                              <div className="flex items-center gap-2 rounded-lg border border-[#ddb7ff]/30 bg-[#131b2e]/90 px-3 py-2 text-[11px] text-[#ddb7ff]">
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                {currentGenerationPhase === 'audio' ? '正在生成旁白' : '正在生成画面'}
                              </div>
                            </div>
                          )}
                          <div className="relative flex items-center justify-between">
                            <span className={`text-[10px] font-bold ${isActive ? 'text-[#ddb7ff]' : 'text-slate-300'}`}>
                              SCENE {String(scene.sceneNumber).padStart(2, '0')}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-slate-300">
                                {scene.duration}s
                              </span>
                              <button
                                type="button"
                                disabled={!scene.audioUrl}
                                onClick={(event) => scene.audioUrl && handleNarrationAudioClick(scene.sceneNumber, scene.audioUrl, event)}
                                className={`flex h-6 w-6 items-center justify-center rounded-md border bg-black/35 transition ${
                                  scene.audioUrl
                                    ? 'cursor-pointer border-orange-400/40 text-orange-400 hover:bg-orange-400/15'
                                    : 'cursor-not-allowed border-white/10 text-slate-500'
                                }`}
                                title={scene.audioUrl ? '播放分镜旁白' : '旁白音频尚未生成'}
                              >
                                <Volume2 className={`h-3.5 w-3.5 ${playingAudioSceneNumber === scene.sceneNumber ? 'animate-pulse' : ''}`} />
                              </button>
                            </div>
                          </div>
                          <h3 className="relative mt-3 line-clamp-1 text-sm font-semibold text-white">{scene.title}</h3>
                          <p className="relative mt-2 line-clamp-2 text-[11px] leading-5 text-slate-300">{scene.narration}</p>
                        </div>
                        <div className="flex flex-1 flex-col gap-2 p-3">
                          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-slate-500">
                            {activeProject.mode === 'slideshow' ? '图片提示词' : '动画提示词'}
                          </div>
                          <p className="line-clamp-3 text-[11px] leading-5 text-slate-400">{scene.visualPrompt}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <div
            onMouseDown={handleSplitMouseDown}
            className="hidden h-full w-3 shrink-0 cursor-col-resize items-center justify-center bg-[#020617] text-slate-600 md:flex"
            title="拖拽调整右侧面板宽度"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <aside
            className="flex h-full shrink-0 flex-col border-l border-[#1e293b]/40 bg-[#0b1326]"
            style={{ width: rightPanelWidth }}
          >
            <div className="flex items-center gap-3 border-b border-[#1e293b]/40 bg-[#0c152a] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#ddb7ff] to-[#adc6ff] shadow-[0_0_15px_rgba(221,183,255,0.3)]">
                <Sparkles className="h-4 w-4 text-[#2c0051]" />
              </div>
              <div>
                <h2 className="text-xs font-mono tracking-wider text-slate-400">AI 创意助手</h2>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-[#ddb7ff]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>结构化大纲生成已就绪</span>
                </p>
              </div>
            </div>

            <div ref={messageListRef} className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
              {isLoadingMessages && (
                <div className="rounded-2xl border border-[#1e293b] bg-[#131b2e]/50 p-3 text-[11px] text-slate-400">
                  正在加载历史对话...
                </div>
              )}

              {messageLoadError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-[11px] text-red-200">
                  {messageLoadError}
                </div>
              )}

              {activeProject.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex max-w-[92%] flex-col gap-1.5 ${message.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                >
                  <div
                    className={`rounded-2xl p-3 ${
                      message.sender === 'user'
                        ? 'rounded-tr-none bg-[#ddb7ff] text-[#2c0051]'
                        : 'rounded-tl-none border border-[#1e293b] bg-[#1a2336]/60 text-slate-200 shadow-sm'
                    }`}
                  >
                    {message.action && message.sender === 'assistant' && (
                      <div className="mb-2 inline-flex rounded-full border border-[#ddb7ff]/20 bg-[#ddb7ff]/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-[#ddb7ff]">
                        {message.action}
                      </div>
                    )}

                    <p className="select-text whitespace-pre-wrap text-xs leading-6">{message.text}</p>

                    {message.progressList && (
                      <div className="mt-3.5 space-y-2.5 border-t border-[#1e293b] pt-3.5">
                        {message.progressList.map((step) => (
                          <div key={step.id} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1.5">
                                {step.status === 'success' ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                ) : step.status === 'loading' ? (
                                  <RefreshCw className="h-3 w-3 shrink-0 animate-spin text-[#ddb7ff]" />
                                ) : (
                                  <span className="h-3 w-3 shrink-0 rounded-full bg-slate-700" />
                                )}
                                <span>{step.label}</span>
                              </span>
                              {step.percentage !== undefined && (
                                <span className="font-mono text-[9px] text-[#ddb7ff]">{step.percentage}%</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {message.outline && (
                      <OutlineCard outline={message.outline} onOpen={() => setExpandedOutline(message.outline)} />
                    )}
                  </div>

                  <span className="text-[9px] font-mono tracking-wider text-slate-500">
                    {message.sender === 'user' ? '用户' : 'VisionCraft AI'} • {message.timestamp}
                  </span>
                </div>
              ))}

              {isAssistantTyping && (
                <div className="mr-auto flex max-w-[80%] flex-col gap-1 items-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-[#1e293b] bg-[#1a2336]/60 p-3.5">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#ddb7ff]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#ddb7ff] [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#ddb7ff] [animation-delay:0.4s]" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">AI 正在分析意图并生成结构化大纲...</span>
                  </div>
                </div>
              )}

              {!isLoadingMessages && !messageLoadError && activeProject.messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#1e293b] bg-[#131b2e]/35 p-4 text-[11px] leading-relaxed text-slate-400">
                  当前项目还没有历史对话，发送第一条创作指令后会自动写入数据库。
                </div>
              )}
            </div>

            <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-[#1e293b]/20 bg-[#060e20]/60 px-4 py-2">
              <button
                onClick={() => triggerQuickAction('请根据当前项目提示词生成完整的视频大纲')}
                disabled={isAssistantTyping}
                className="shrink-0 rounded-full border border-[#1e293b] bg-[#1a2336]/50 px-2.5 py-1 text-[10px] text-slate-400 transition-all hover:border-[#ddb7ff]/30 hover:text-[#ddb7ff]"
              >
                生成大纲
              </button>
              <button
                onClick={() => triggerQuickAction('重新生成一个更有张力的视频大纲')}
                disabled={isAssistantTyping}
                className="shrink-0 rounded-full border border-[#1e293b] bg-[#1a2336]/50 px-2.5 py-1 text-[10px] text-slate-400 transition-all hover:border-[#ddb7ff]/30 hover:text-[#ddb7ff]"
              >
                重写大纲
              </button>
              <button
                onClick={() => triggerQuickAction('在末尾增加一个情绪收束的镜头')}
                disabled={isAssistantTyping}
                className="shrink-0 rounded-full border border-[#1e293b] bg-[#1a2336]/50 px-2.5 py-1 text-[10px] text-slate-400 transition-all hover:border-[#ddb7ff]/30 hover:text-[#ddb7ff]"
              >
                添加镜头
              </button>
            </div>

            <div className="border-t border-[#1e293b]/40 bg-[#131b2e]/80 p-4">
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && !isAssistantTyping) {
                      event.preventDefault();
                      void handleSendChatMessage();
                    }
                  }}
                  disabled={isAssistantTyping}
                  className="custom-scrollbar min-h-[76px] max-h-[120px] w-full resize-none rounded-xl border border-[#1e293b]/80 bg-[#0b1326] py-3 pl-4 pr-20 text-xs text-white placeholder-slate-500 focus:border-[#ddb7ff] focus:outline-none"
                  placeholder="输入您的创意修改指令... (回车发送)"
                />
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => window.alert('语音助手启动中... 请在设置中启用麦克风授权。')}
                    disabled={isAssistantTyping}
                    className="cursor-pointer p-1.5 text-slate-400 transition-colors hover:text-[#ddb7ff]"
                    title="语音输入指令"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSendChatMessage()}
                    disabled={isAssistantTyping}
                    className="flex cursor-pointer items-center justify-center rounded-lg bg-[#ddb7ff] p-2 text-[#2c0051] shadow-md transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    title="发送指令"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {expandedOutline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[#1e293b] bg-[#09111f] shadow-[0_0_40px_rgba(17,24,39,0.55)]">
            <div className="flex items-start justify-between gap-6 border-b border-[#1e293b]/70 px-6 py-5">
              <div className="min-w-0">
                <div className="mb-2 text-xs font-mono uppercase tracking-[0.24em] text-[#ddb7ff]">完整视频大纲</div>
                <h3 className="text-xl font-bold text-white">{activeProject.title}</h3>
                <p className="mt-2 max-w-3xl select-text whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {expandedOutline.summary}
                </p>
              </div>
              <button
                onClick={() => setExpandedOutline(null)}
                className="shrink-0 rounded-xl border border-[#1e293b] px-4 py-2 text-sm text-slate-300 transition hover:border-[#ddb7ff]/40 hover:text-white"
              >
                关闭
              </button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-5">
              {expandedOutline.globalImageStylePrompt && (
                <div className="mb-6 border-l-2 border-orange-400 bg-orange-400/5 px-5 py-4">
                  <div className="mb-2 text-xs font-mono uppercase tracking-[0.24em] text-orange-300">全局图像风格</div>
                  <p className="select-text whitespace-pre-wrap text-sm leading-7 text-slate-300">
                    {expandedOutline.globalImageStylePrompt}
                  </p>
                </div>
              )}

              <div className="mb-6 rounded-2xl border border-[#1e293b] bg-[#101827] p-5">
                <div className="mb-2 text-xs font-mono uppercase tracking-[0.24em] text-[#4cd7f6]">完整逐字稿</div>
                <p className="select-text whitespace-pre-wrap text-sm leading-7 text-slate-300">{expandedOutline.fullScript}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {expandedOutline.scenes.map((scene) => (
                  <div key={scene.sceneNumber} className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#101827]">
                    <div className="border-b border-white/5 bg-[linear-gradient(135deg,rgba(221,183,255,0.12),rgba(76,215,246,0.08),rgba(11,19,38,0.9))] p-4">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#ddb7ff]">
                        Scene {String(scene.sceneNumber).padStart(2, '0')}
                      </div>
                      <h4 className="mt-2 text-base font-semibold text-white">{scene.title}</h4>
                      <p className="mt-1 text-xs text-slate-400">预览位预留，后续将展示真实分镜画面</p>
                    </div>
                    <div className="space-y-4 p-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">旁白</div>
                        <p className="mt-2 select-text whitespace-pre-wrap text-sm leading-7 text-slate-300">{scene.narration}</p>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          {expandedOutline.mode === 'slideshow' ? '图片提示词' : 'HTML 动画提示词'}
                        </div>
                        <p className="mt-2 select-text whitespace-pre-wrap text-sm leading-7 text-slate-300">{scene.visualPrompt}</p>
                      </div>
                      <div className="text-xs text-slate-500">建议时长：{scene.durationSeconds} 秒</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md">
          <div className="w-full max-w-md space-y-6 rounded-2xl border border-[#ddb7ff]/30 bg-[#131b2e] p-6 text-center shadow-[0_0_50px_rgba(221,183,255,0.15)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#ddb7ff]/30 bg-[#ddb7ff]/10 text-[#ddb7ff] shadow-[0_0_20px_rgba(221,183,255,0.2)] animate-pulse">
              <Download className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold tracking-wide text-white">多通道前端高保真录屏导出中</h3>
              <p className="flex h-8 items-center justify-center px-4 text-xs leading-relaxed text-slate-400">{exportStage}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 font-mono text-xs text-slate-400">
                <span>EXPORT_PIPELINE.mp4</span>
                <span className="font-bold text-[#ddb7ff]">{exportProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full border border-[#1e293b] bg-[#020617]">
                <div
                  className="h-full bg-gradient-to-r from-[#ddb7ff] via-[#b76dff] to-[#4cd7f6] transition-all duration-100"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateNewProject}
            className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[#1e293b] bg-[#131b2e] p-6 text-left shadow-[0_0_30px_rgba(221,183,255,0.15)]"
          >
            <div className="flex items-center justify-between border-b border-[#1e293b]/40 pb-2">
              <span className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
                <Sparkles className="h-4 w-4 text-[#ddb7ff]" />
                启动全新 AI 创作项目
              </span>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreatingProject}
                className="cursor-pointer text-xs font-semibold text-slate-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                取消
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#cfc2d6]">项目名称</label>
              <input
                type="text"
                value={newProjTitle}
                onChange={(event) => setNewProjTitle(event.target.value)}
                placeholder="例如：量子网络节点演变"
                required
                disabled={isCreatingProject}
                className="w-full rounded-lg border border-[#1e293b] bg-[#0b1326] px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-[#ddb7ff] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#cfc2d6]">视觉渲染媒介</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => !isCreatingProject && setNewProjMode('slideshow')}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    newProjMode === 'slideshow'
                      ? 'border-[#ddb7ff] bg-[#ddb7ff]/10 text-white'
                      : 'border-[#1e293b] bg-[#0b1326] text-slate-400 hover:border-slate-700'
                  } ${isCreatingProject ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span className="mb-1 block text-xs font-bold">图片轮播模式</span>
                  <p className="text-[10px] leading-relaxed opacity-75">生成图片提示词，后续用于 AI 文生图。</p>
                </button>
                <button
                  type="button"
                  onClick={() => !isCreatingProject && setNewProjMode('html')}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    newProjMode === 'html'
                      ? 'border-[#4cd7f6] bg-[#4cd7f6]/10 text-white'
                      : 'border-[#1e293b] bg-[#0b1326] text-slate-400 hover:border-slate-700'
                  } ${isCreatingProject ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span className="mb-1 block text-xs font-bold">HTML 网页动画</span>
                  <p className="text-[10px] leading-relaxed opacity-75">生成网页动画提示词，后续用于 HTML/CSS/SVG/Canvas。</p>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#cfc2d6]">分镜创意提示词</label>
              <textarea
                value={newProjPrompt}
                onChange={(event) => setNewProjPrompt(event.target.value)}
                placeholder="在此输入您的 AI 视频构思描述..."
                disabled={isCreatingProject}
                className="min-h-[88px] w-full resize-none rounded-lg border border-[#1e293b] bg-[#0b1326] p-3 text-xs text-white placeholder-slate-600 focus:border-[#ddb7ff] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingProject}
              className="mt-2 w-full cursor-pointer rounded-lg bg-gradient-to-r from-[#ddb7ff] to-[#adc6ff] py-2.5 text-xs font-bold text-[#2c0051] transition-all hover:shadow-[0_0_15px_rgba(221,183,255,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingProject ? '正在创建项目...' : '初始化多模态创作管线'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function OutlineCard({ outline, onOpen }: { outline: StoryboardOutline; onOpen: () => void }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#ddb7ff]/20 bg-[#101827]/90">
      <div className="border-b border-[#1e293b]/70 px-4 py-3">
        <div className="mb-1 text-[10px] font-mono uppercase tracking-[0.24em] text-[#ddb7ff]">视频大纲</div>
        <p className="select-text whitespace-pre-wrap text-[11px] leading-6 text-slate-300">{outline.summary}</p>
        {outline.globalImageStylePrompt && (
          <p className="mt-2 line-clamp-2 select-text text-[11px] leading-5 text-orange-200/80">
            全局图像风格：{outline.globalImageStylePrompt}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-[11px] text-slate-300">
          <thead className="bg-[#0b1326]/80 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">编号</th>
              <th className="px-4 py-2 font-medium">标题</th>
              <th className="px-4 py-2 font-medium">旁白</th>
            </tr>
          </thead>
          <tbody>
            {outline.scenes.map((scene) => (
              <tr key={scene.sceneNumber} className="border-t border-[#1e293b]/60">
                <td className="px-4 py-2 align-top font-mono text-slate-500">{scene.sceneNumber}</td>
                <td className="px-4 py-2 align-top text-white">{scene.title}</td>
                <td className="px-4 py-2 align-top text-slate-300">{scene.narration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#1e293b]/70 bg-[#0b1326]/70 px-4 py-3">
        <span className="text-[11px] text-slate-500">共 {outline.scenes.length} 个分镜</span>
        <button
          onClick={onOpen}
          className="rounded-lg border border-[#ddb7ff]/30 px-3 py-1.5 text-[11px] font-medium text-[#ddb7ff] transition hover:bg-[#ddb7ff]/10"
        >
          查看完整大纲内容
        </button>
      </div>
    </div>
  );
}

function clampRightPanelWidth(nextWidth: number, container: HTMLDivElement | null): number {
  if (!container) {
    return Math.max(RIGHT_PANEL_MIN_WIDTH, nextWidth);
  }

  const containerWidth = container.clientWidth;
  const maxWidth = Math.max(240, Math.floor((containerWidth - SPLIT_HANDLE_WIDTH) / 2));
  const minWidth = Math.min(RIGHT_PANEL_MIN_WIDTH, maxWidth);
  return Math.min(maxWidth, Math.max(minWidth, Math.round(nextWidth)));
}
