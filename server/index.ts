import dotenv from 'dotenv';
import express from 'express';
import { listProjectMessages } from './chatRepository';
import { confirmRegenerateVideoOutline, handleProjectChatMessage } from './chatService';
import { createProject, deleteProject, getProjectByUuid, listProjects, updateProjectVideoSource } from './projectRepository';
import { isHtmlVideoStyleId } from '../shared/htmlVideoStyles';
import { ProjectMode } from './projectUtils';
import { generateStoryboardAudio } from './storyboardAudioService';
import { generateStoryboardImage, getProjectImagePath } from './storyboardImageService';
import { generateStoryboardHtml } from './storyboardHtmlService';

dotenv.config();

const app = express();
const port = Number(process.env.API_PORT ?? '3001');

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/projects', async (_req, res) => {
  try {
    const projects = await listProjects();
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const mode = req.body?.mode as ProjectMode | undefined;
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt : undefined;
    const title = typeof req.body?.title === 'string' ? req.body.title : undefined;

    if (mode !== 'slideshow' && mode !== 'html') {
      res.status(400).json({ error: 'Invalid project mode.' });
      return;
    }

    const project = await createProject({ mode, prompt, title });
    res.status(201).json({ project });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.delete('/api/projects/:uuid', async (req, res) => {
  try {
    const deleted = await deleteProject(req.params.uuid);

    if (!deleted) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.get('/api/projects/:uuid/messages', async (req, res) => {
  try {
    const project = await getProjectByUuid(req.params.uuid);

    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const messages = await listProjectMessages(req.params.uuid);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.post('/api/projects/:uuid/messages', async (req, res) => {
  try {
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

    if (!content) {
      res.status(400).json({ error: 'Message content is required.' });
      return;
    }

    const project = await getProjectByUuid(req.params.uuid);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const result = await handleProjectChatMessage({
      projectUuid: req.params.uuid,
      content,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.post('/api/projects/:uuid/regenerate-outline-confirmations/:messageUuid', async (req, res) => {
  try {
    const result = await confirmRegenerateVideoOutline({
      projectUuid: req.params.uuid,
      confirmationMessageUuid: req.params.messageUuid,
    });
    res.status(201).json(result);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(message.includes('已过期') ? 409 : 500).json({ error: message });
  }
});

app.put('/api/projects/:uuid/html-style', async (req, res) => {
  try {
    const project = await getProjectByUuid(req.params.uuid);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    if (project.type !== 'html' || !isHtmlVideoStyleId(req.body?.styleId)) {
      res.status(400).json({ error: 'A valid HTML video style is required.' });
      return;
    }
    const currentSource = parseVideoSource(project.videoSource);
    const updatedProject = await updateProjectVideoSource(
      project.uuid,
      JSON.stringify({ ...currentSource, htmlStyleId: req.body.styleId }, null, 2),
    );
    res.json({ project: updatedProject });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.post('/api/projects/:uuid/storyboard-images', async (req, res) => {
  const abortController = new AbortController();
  req.on('aborted', () => {
    console.warn(`[storyboard-image] Client aborted request project=${req.params.uuid}`);
    abortController.abort();
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      console.warn(`[storyboard-image] Client connection closed project=${req.params.uuid}`);
      abortController.abort();
    }
  });

  try {
    const sceneNumber = Number(req.body?.sceneNumber);
    if (!Number.isInteger(sceneNumber) || sceneNumber <= 0) {
      res.status(400).json({ error: 'Valid sceneNumber is required.' });
      return;
    }

    console.log(`[storyboard-image] Request received project=${req.params.uuid} scene=${sceneNumber}`);
    const project = await getProjectByUuid(req.params.uuid);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const result = await generateStoryboardImage({
      project,
      sceneNumber,
      force: req.body?.force === true,
      signal: abortController.signal,
    });

    res.status(201).json(result);
  } catch (error) {
    if (abortController.signal.aborted) {
      console.warn(`[storyboard-image] Generation aborted project=${req.params.uuid} scene=${req.body?.sceneNumber}`);
      return;
    }

    console.error(
      `[storyboard-image] Generation failed project=${req.params.uuid} scene=${req.body?.sceneNumber}:`,
      error,
    );
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.post('/api/projects/:uuid/storyboard-html', async (req, res) => {
  const abortController = new AbortController();
  req.on('aborted', () => abortController.abort());
  res.on('close', () => {
    if (!res.writableEnded) abortController.abort();
  });

  try {
    const sceneNumber = Number(req.body?.sceneNumber);
    if (!Number.isInteger(sceneNumber) || sceneNumber <= 0) {
      res.status(400).json({ error: 'Valid sceneNumber is required.' });
      return;
    }
    const project = await getProjectByUuid(req.params.uuid);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    const result = await generateStoryboardHtml({
      project,
      sceneNumber,
      force: req.body?.force === true,
      signal: abortController.signal,
    });
    res.status(201).json(result);
  } catch (error) {
    if (abortController.signal.aborted) return;
    console.error(`[storyboard-html] Generation failed project=${req.params.uuid} scene=${req.body?.sceneNumber}:`, error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.post('/api/projects/:uuid/storyboard-audio', async (req, res) => {
  const abortController = new AbortController();
  req.on('aborted', () => abortController.abort());
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  try {
    const sceneNumber = Number(req.body?.sceneNumber);
    if (!Number.isInteger(sceneNumber) || sceneNumber <= 0) {
      res.status(400).json({ error: 'Valid sceneNumber is required.' });
      return;
    }

    console.log(`[storyboard-audio] Request received project=${req.params.uuid} scene=${sceneNumber}`);
    const project = await getProjectByUuid(req.params.uuid);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const result = await generateStoryboardAudio({
      project,
      sceneNumber,
      force: req.body?.force === true,
      signal: abortController.signal,
    });
    res.status(201).json(result);
  } catch (error) {
    if (abortController.signal.aborted) {
      console.warn(`[storyboard-audio] Generation aborted project=${req.params.uuid} scene=${req.body?.sceneNumber}`);
      return;
    }

    console.error(`[storyboard-audio] Generation failed project=${req.params.uuid} scene=${req.body?.sceneNumber}:`, error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.get('/api/project-images/:uuid/:fileName', (req, res) => {
  const { uuid, fileName } = req.params;
  if (!/^[0-9a-f-]{36}$/i.test(uuid) || fileName.includes('/') || fileName.includes('\\')) {
    res.status(400).json({ error: 'Invalid image path.' });
    return;
  }

  res.sendFile(getProjectImagePath(uuid, fileName), (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({ error: 'Image not found.' });
    }
  });
});

const server = app.listen(port, () => {
  console.log(`Project API server listening on http://127.0.0.1:${port}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`API port ${port} is already in use. Set a different API_PORT or run "npm run dev" to auto-pick an available port.`);
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown server error';
}

function parseVideoSource(raw: string): { version: 1; type: 'storyboard_assets'; htmlStyleId?: string; scenes: Record<string, unknown> } {
  try {
    const parsed = JSON.parse(raw) as { version?: number; htmlStyleId?: string; scenes?: Record<string, unknown> };
    if (parsed.version === 1 && parsed.scenes) {
      return { version: 1, type: 'storyboard_assets', htmlStyleId: parsed.htmlStyleId, scenes: parsed.scenes };
    }
  } catch {
    // Initialize an empty source document.
  }
  return { version: 1, type: 'storyboard_assets', scenes: {} };
}
