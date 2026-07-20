import type { ClassroomFolder, FolderNode } from './types';

export function buildFolderTree(folders: ClassroomFolder[]): FolderNode[] {
  const map = new Map<string, FolderNode>();
  const roots: FolderNode[] = [];

  for (const f of folders) {
    map.set(f.uid, { ...f, children: [] });
  }

  for (const f of folders) {
    const node = map.get(f.uid)!;
    const parentId = f.parent_folder_id;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function findPathToFolder(folders: ClassroomFolder[], targetId: string): ClassroomFolder[] {
  const tree = buildFolderTree(folders);
  const path: ClassroomFolder[] = [];

  function dfs(nodes: FolderNode[]): boolean {
    for (const node of nodes) {
      path.push(node);
      if (node.uid === targetId) return true;
      if (dfs(node.children)) return true;
      path.pop();
    }
    return false;
  }

  dfs(tree);
  return path;
}
