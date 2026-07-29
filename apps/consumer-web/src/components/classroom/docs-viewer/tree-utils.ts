import type { ClassroomDoc, ClassroomFolder, FolderNode } from './types';

export function findPathToFolder(folders: ClassroomFolder[], targetUid: string): ClassroomFolder[] {
  const byId = new Map<string, ClassroomFolder>();
  for (const f of folders) byId.set(f.uid, f);
  const path: ClassroomFolder[] = [];
  let cur: ClassroomFolder | undefined = byId.get(targetUid);
  let safety = 0;
  while (cur && safety++ < 100) {
    path.unshift(cur);
    cur = cur.parent_folder_id ? byId.get(cur.parent_folder_id) : undefined;
  }
  return path;
}

// Backend returns folders as a nested tree (each node carries children + its own docs).
// These helpers derive the flat list and per-folder doc map the rest of the UI still expects.
export function flattenTree(nodes: FolderNode[]): ClassroomFolder[] {
  const out: ClassroomFolder[] = [];
  const walk = (list: FolderNode[]) => {
    for (const n of list) {
      const { children, docs, ...folder } = n;
      out.push(folder);
      walk(children);
    }
  };
  walk(nodes);
  return out;
}

export function collectDocsByFolder(nodes: FolderNode[]): Record<string, ClassroomDoc[]> {
  const out: Record<string, ClassroomDoc[]> = {};
  const walk = (list: FolderNode[]) => {
    for (const n of list) {
      out[n.uid] = n.docs;
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}
