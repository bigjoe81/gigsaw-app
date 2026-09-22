import { Injectable } from '@angular/core';
import { MagicProposal, SetlistItem, SetlistSnapshot, SetlistWorkspace, WorkspaceSet } from '../models/setlist-workspace.models';

export const uid = (prefix = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const cloneWorkspace = (value: SetlistWorkspace): SetlistWorkspace => JSON.parse(JSON.stringify(value)) as SetlistWorkspace;
export const setDuration = (set: WorkspaceSet, type?: SetlistItem['type']) => set.items.filter(i => !type || i.type === type).reduce((sum, i) => sum + i.durationSeconds, 0);
export const moveItem = (workspace: SetlistWorkspace, itemId: string, targetSetId: string, targetIndex: number) => {
  const next = cloneWorkspace(workspace); let moved: SetlistItem | undefined;
  for (const set of next.sets) { const index = set.items.findIndex(i => i.id === itemId); if (index >= 0) moved = set.items.splice(index, 1)[0]; }
  if (moved) next.sets.find(s => s.id === targetSetId)?.items.splice(targetIndex, 0, moved);
  return next;
};
export const createMedley = (set: WorkspaceSet, ids: string[], duration?: number) => {
  const next = structuredClone(set); const medleyId = uid('medley');
  next.items.filter(i => ids.includes(i.id)).forEach((item, index, all) => { item.medleyId = medleyId; item.segue = index < all.length - 1; });
  if (duration) { const selected = next.items.filter(i => ids.includes(i.id)); const ratio = duration / selected.reduce((n, i) => n + i.durationSeconds, 0); selected.forEach(i => i.durationSeconds = Math.round(i.durationSeconds * ratio)); }
  return next;
};
export const splitMedley = (set: WorkspaceSet, medleyId: string) => { const next = structuredClone(set); next.items.filter(i => i.medleyId === medleyId).forEach(i => { delete i.medleyId; i.segue = false; }); return next; };

export interface SetlistRepository { load(id: string): SetlistWorkspace | null; save(value: SetlistWorkspace): void; }
@Injectable({ providedIn: 'root' })
export class LocalSetlistRepository implements SetlistRepository {
  private key(id: string) { return `gigsaw:setlist-draft:${id}`; }
  load(id: string) {
    const raw = localStorage.getItem(this.key(id));
    if (!raw) return null;

    try {
      const draft = JSON.parse(raw) as Partial<SetlistWorkspace>;
      if (!draft || typeof draft.title !== 'string' || !Array.isArray(draft.sets)) {
        localStorage.removeItem(this.key(id));
        return null;
      }
      return draft as SetlistWorkspace;
    } catch {
      localStorage.removeItem(this.key(id));
      return null;
    }
  }
  save(value: SetlistWorkspace) { localStorage.setItem(this.key(value.id), JSON.stringify(value)); }
  remove(id: string) { localStorage.removeItem(this.key(id)); }
}
@Injectable({ providedIn: 'root' })
export class SetlistHistoryService {
  apply(current: SetlistWorkspace, proposal: MagicProposal): { workspace: SetlistWorkspace; snapshot: SetlistSnapshot } {
    return { workspace: { ...cloneWorkspace(current), sets: structuredClone(proposal.sets), updatedAt: new Date().toISOString() }, snapshot: { id: uid('snapshot'), label: 'Prima di Magic Set', workspace: cloneWorkspace(current), createdAt: new Date().toISOString() } };
  }
  restore(snapshot: SetlistSnapshot) { return cloneWorkspace(snapshot.workspace); }
}
