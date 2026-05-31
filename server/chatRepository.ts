import { randomUUID } from 'node:crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getDbPool } from './db';

export type ChatSender = 'assistant' | 'user';
export type VideoIntentAction =
  | 'generate_video_outline'
  | 'regenerate_video_outline'
  | 'add_scene'
  | 'delete_scene'
  | 'regenerate_scene'
  | 'unsupported';

export interface ChatMessageRecord {
  uuid: string;
  projectUuid: string;
  sender: ChatSender;
  content: string;
  action: VideoIntentAction | null;
  reason: string | null;
  createdAt: string;
}

interface ChatMessageRow extends RowDataPacket {
  uuid: string;
  project_uuid: string;
  sender: ChatSender;
  content: string;
  intent_action: VideoIntentAction | null;
  intent_reason: string | null;
  created_at: Date | string;
}

export async function listProjectMessages(projectUuid: string): Promise<ChatMessageRecord[]> {
  const pool = getDbPool();
  const [rows] = await pool.query<ChatMessageRow[]>(
    `SELECT uuid, project_uuid, sender, content, intent_action, intent_reason, created_at
     FROM project_chat_message
     WHERE project_uuid = ?
     ORDER BY created_at ASC, uuid ASC`,
    [projectUuid],
  );

  return rows.map(mapChatMessageRow);
}

export async function createProjectMessage(input: {
  projectUuid: string;
  sender: ChatSender;
  content: string;
  action?: VideoIntentAction | null;
  reason?: string | null;
}): Promise<ChatMessageRecord> {
  const pool = getDbPool();
  const uuid = randomUUID();

  await pool.execute<ResultSetHeader>(
    `INSERT INTO project_chat_message
      (uuid, project_uuid, sender, content, intent_action, intent_reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [uuid, input.projectUuid, input.sender, input.content, input.action ?? null, input.reason ?? null],
  );

  const [rows] = await pool.query<ChatMessageRow[]>(
    `SELECT uuid, project_uuid, sender, content, intent_action, intent_reason, created_at
     FROM project_chat_message
     WHERE uuid = ?
     LIMIT 1`,
    [uuid],
  );

  return mapChatMessageRow(rows[0]);
}

function mapChatMessageRow(row: ChatMessageRow): ChatMessageRecord {
  const createdAt =
    row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString();

  return {
    uuid: row.uuid,
    projectUuid: row.project_uuid,
    sender: row.sender,
    content: row.content,
    action: row.intent_action,
    reason: row.intent_reason,
    createdAt,
  };
}
