import type { ClassroomFolder, FolderNode } from './types';

export function buildFolderTree(folders: ClassroomFolder[]): FolderNode[] {
  const byId = new Map<string, FolderNode>();
  for (const f of folders) {
    byId.set(f.uid, { ...f, children: [] });
  }
  const roots: FolderNode[] = [];
  for (const node of byId.values()) {
    const pid = node.parent_folder_id;
    if (pid && byId.has(pid)) {
      byId.get(pid)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortRec = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.name.localeCompare(b.name));
    for (const n of nodes) sortRec(n.children);
  };
  sortRec(roots);
  return roots;
}

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
