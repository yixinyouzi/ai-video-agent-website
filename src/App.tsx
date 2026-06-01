import React, { useState } from 'react';
import HomeView from './components/HomeView';
import StudioView from './components/StudioView';
import { createProject } from './lib/projectApi';
import { ProjectMode } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'studio'>('home');
  const [selectedMode, setSelectedMode] = useState<ProjectMode | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleStartCreation = async (mode: ProjectMode, prompt: string) => {
    const project = await createProject({ mode, prompt });
    setSelectedMode(mode);
    setSelectedPrompt(prompt);
    setSelectedProjectId(project.uuid);
    setCurrentView('studio');
  };

  const handleOpenProject = (projectId: string) => {
    setSelectedMode(null);
    setSelectedPrompt(null);
    setSelectedProjectId(projectId);
    setCurrentView('studio');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedMode(null);
    setSelectedPrompt(null);
    setSelectedProjectId(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#dae2fd]">
      {currentView === 'home' ? (
        <HomeView onStartCreation={handleStartCreation} onOpenProject={handleOpenProject} />
      ) : (
        <StudioView 
          initialProjectId={selectedProjectId}
          initialMode={selectedMode} 
          initialPrompt={selectedPrompt} 
          onBackToHome={handleBackToHome} 
        />
      )}
    </div>
  );
}
