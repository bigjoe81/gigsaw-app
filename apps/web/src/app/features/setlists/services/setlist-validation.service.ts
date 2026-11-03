import { Injectable } from '@angular/core';
import { MagicConstraints, SetlistWorkspace, ValidationIssue } from '../models/setlist-workspace.models';
import { setDuration } from './setlist-workspace.service';
@Injectable({ providedIn: 'root' })
export class SetlistValidationService {
  validate(workspace: SetlistWorkspace, constraints?: MagicConstraints): ValidationIssue[] {
    const issues: ValidationIssue[] = []; const seen = new Set<number>();
    workspace.sets.forEach(set => {
      const delta = setDuration(set) - (set.targetSeconds ?? 0); if (set.targetSeconds && Math.abs(delta) > 300) issues.push({ id: `duration-${set.id}`, severity: 'warning', setId: set.id, message: `${set.name} è ${delta > 0 ? 'troppo lungo' : 'troppo corto'} di ${Math.round(Math.abs(delta) / 60)} min.` });
      set.items.forEach((item, index) => { if (item.song && seen.has(item.song.id)) issues.push({ id: `duplicate-${item.id}`, severity: 'warning', itemId: item.id, setId: set.id, message: `${item.title} compare più volte.` }); if (item.song) seen.add(item.song.id); if (item.type === 'pause' && !item.durationSeconds) issues.push({ id: `pause-${item.id}`, severity: 'error', itemId: item.id, message: 'Indica la durata della pausa.' }); const prev = set.items[index - 1]; if (prev?.concertKey && prev.concertKey === item.concertKey && set.items[index - 2]?.concertKey === item.concertKey) issues.push({ id: `key-${item.id}`, severity: 'suggestion', itemId: item.id, message: `Tre brani consecutivi in ${item.concertKey}.` }); });
    });
    constraints?.requiredSongIds.filter(id => !seen.has(id)).forEach(id => issues.push({ id: `required-${id}`, severity: 'error', message: `Brano obbligatorio #${id} mancante.` }));
    return issues;
  }
}
