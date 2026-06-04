import { randomUUID } from 'node:crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { createProjectMessage } from './chatRepository';
import { getDbPool } from './db';
import {
  buildInitialStoryboardOutline,
  getDefaultProjectTitle,
  getDefaultPrompt,
  ProjectMode,
} from './projectUtils';

export interface ProjectRecord {
  uuid: string;
  title: string;
  type: ProjectMode;
  storyboardOutline: string;
  videoSource: string;
  createdAt: string;
}

interface ProjectRow extends RowDataPacket {
  uuid: string;
  title: string;
  type: ProjectMode;
  storyboard_outline: string;
  video_source: string;
  created_at: Date | string;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const pool = getDbPool();
  const [rows] = await pool.query<ProjectRow[]>(
    `SELECT uuid, title, type, storyboard_outline, video_source, created_at
     FROM project
     ORDER BY created_at DESC`,
  );

  return rows.map(mapProjectRow);
}

export async function createProject(input: {
  mode: ProjectMode;
  prompt?: string;
  title?: string;
}): Promise<ProjectRecord> {
  const pool = getDbPool();
  const prompt = input.prompt?.trim() || getDefaultPrompt(input.mode);
  const title = input.title?.trim() || getDefaultProjectTitle(input.mode, prompt);
  const uuid = randomUUID();
  const storyboardOutline = buildInitialStoryboardOutline(input.mode, prompt);
  const videoSource = '';

  await pool.execute<ResultSetHeader>(
    `INSERT INTO project (uuid, title, created_at, type, storyboard_outline, video_source)
     VALUES (?, ?, NOW(), ?, ?, ?)`,
    [uuid, title, input.mode, storyboardOutline, videoSource],
  );

  await createProjectMessage({
    projectUuid: uuid,
    sender: 'assistant',
    content: `项目“${title}”已创建。请在右侧输入创作指令，我会先分析你的意图，再执行对应的视频创作动作。`,
  });

  const [rows] = await pool.query<ProjectRow[]>(
    `SELECT uuid, title, type, storyboard_outline, video_source, created_at
     FROM project
     WHERE uuid = ?
     LIMIT 1`,
    [uuid],
  );

  return mapProjectRow(rows[0]);
}

export async function deleteProject(uuid: string): Promise<boolean> {
  const pool = getDbPool();
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM project WHERE uuid = ?',
    [uuid],
  );

  return result.affectedRows > 0;
}

export async function getProjectByUuid(uuid: string): Promise<ProjectRecord | null> {
  const pool = getDbPool();
  const [rows] = await pool.query<ProjectRow[]>(
    `SELECT uuid, title, type, storyboard_outline, video_source, created_at
     FROM project
     WHERE uuid = ?
     LIMIT 1`,
    [uuid],
  );

  return rows[0] ? mapProjectRow(rows[0]) : null;
}

export async function updateProjectStoryboardOutline(uuid: string, storyboardOutline: string): Promise<ProjectRecord> {
  const pool = getDbPool();

  await pool.execute<ResultSetHeader>(
    `UPDATE project
     SET storyboard_outline = ?
     WHERE uuid = ?`,
    [storyboardOutline, uuid],
  );

  const project = await getProjectByUuid(uuid);
  if (!project) {
    throw new Error('Project not found after updating storyboard outline.');
  }

  return project;
}

export async function updateProjectVideoSource(uuid: string, videoSource: string): Promise<ProjectRecord> {
  const pool = getDbPool();

  await pool.execute<ResultSetHeader>(
    `UPDATE project
     SET video_source = ?
     WHERE uuid = ?`,
    [videoSource, uuid],
  );

  const project = await getProjectByUuid(uuid);
  if (!project) {
    throw new Error('Project not found after updating video source.');
  }

  return project;
}

function mapProjectRow(row: ProjectRow): ProjectRecord {
  const createdAt =
    row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString();

  return {
    uuid: row.uuid,
    title: row.title,
    type: row.type,
    storyboardOutline: row.storyboard_outline ?? '',
    videoSource: row.video_source ?? '',
    createdAt,
  };
}
