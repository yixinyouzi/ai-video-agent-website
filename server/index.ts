import dotenv from 'dotenv';
import express from 'express';
import { listProjectMessages } from './chatRepository';
import { handleProjectChatMessage } from './chatService';
import { createProject, deleteProject, getProjectByUuid, listProjects } from './projectRepository';
import { ProjectMode } from './projectUtils';

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
