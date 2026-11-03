import { Song } from '../../../core/models/band-resources.models';
import { MagicConstraints, SetlistWorkspace } from '../models/setlist-workspace.models';
import { MagicSetService } from './magic-set.service';
import { createMedley, moveItem, moveItemBefore, setDuration, SetlistHistoryService, splitMedley } from './setlist-workspace.service';
import { SetlistValidationService } from './setlist-validation.service';

describe('setlist workspace domain', () => {
  const song = (id:number,title=`Song ${id}`):Song => ({id,title,duration:180,key:'C',status:'active'});
  const workspace: SetlistWorkspace = { id:'1',title:'Live',updatedAt:'now',sets:[{id:'a',name:'A',items:[{id:'i1',type:'song',title:'One',song:song(1),durationSeconds:180}]},{id:'b',name:'B',items:[]}]};
  it('calcola le durate e sposta tra set senza mutare l’originale',()=>{expect(setDuration(workspace.sets[0])).toBe(180);const moved=moveItem(workspace,'i1','b',0);expect(moved.sets[1].items[0].id).toBe('i1');expect(workspace.sets[0].items.length).toBe(1);});
  it('crea e separa un medley',()=>{const set={id:'a',name:'A',items:[workspace.sets[0].items[0],{id:'i2',type:'song' as const,title:'Two',song:song(2),durationSeconds:180}]};const joined=createMedley(set,['i1','i2'],300);expect(joined.items.every(i=>!!i.medleyId)).toBeTrue();expect(setDuration(joined)).toBe(300);expect(splitMedley(joined,joined.items[0].medleyId!).items.some(i=>i.medleyId)).toBeFalse();});
  it('valida durata, duplicati, tonalità e obbligatori',()=>{const value=structuredClone(workspace);value.sets[0].targetSeconds=900;value.sets[0].items.push({...value.sets[0].items[0],id:'dup'});const issues=new SetlistValidationService().validate(value,{requiredSongIds:[99]} as MagicConstraints);expect(issues.some(i=>i.severity==='error')).toBeTrue();expect(issues.some(i=>i.id.startsWith('duplicate'))).toBeTrue();});
  it('mantiene gli elementi bloccati durante la rigenerazione',()=>{const constraints={setCount:1,setSeconds:900,excludedSongIds:[],requiredSongIds:[],encoreSongIds:[],consecutiveGroups:[],separatedPairs:[],mandatoryMedleys:[]} as unknown as MagicConstraints;const service=new MagicSetService();const first=service.generate([song(1),song(2)],constraints,'');first.sets[0].items[0].locked=true;const again=service.generate([song(1),song(2)],constraints,'',first);expect(again.sets[0].items.some(i=>i.id===first.sets[0].items[0].id)).toBeTrue();});
  it('applica e annulla una proposta tramite snapshot',()=>{const service=new SetlistHistoryService();const applied=service.apply(workspace,{id:'p',prompt:'',sets:[{id:'new',name:'New',items:[]}],respected:[],unmet:[],reasons:[],createdAt:'now'});expect(applied.workspace.sets[0].id).toBe('new');expect(service.restore(applied.snapshot)).toEqual(workspace);});
  it('inserisce prima della riga scelta in entrambe le direzioni', () => {
    const value = structuredClone(workspace);
    value.sets[0].items = [1, 2, 3, 4].map(id => ({ id: `i${id}`, type: 'song', title: `Song ${id}`, song: song(id), durationSeconds: 180 }));
    const down = moveItemBefore(value, 'i1', 'a', 'i4');
    expect(down.sets[0].items.map(i => i.id)).toEqual(['i2', 'i3', 'i1', 'i4']);
    const up = moveItemBefore(down, 'i4', 'a', 'i2');
    expect(up.sets[0].items.map(i => i.id)).toEqual(['i4', 'i2', 'i3', 'i1']);
    expect(value.sets[0].items[0].id).toBe('i1');
  });
  it('sposta il medley intero e non divide il gruppo di destinazione', () => {
    const value = structuredClone(workspace);
    value.sets[0].items = [1, 2, 3, 4].map(id => ({ id: `i${id}`, type: 'song', title: `Song ${id}`, song: song(id), durationSeconds: 180, medleyId: id <= 2 ? 'm1' : 'm2' }));
    const moved = moveItemBefore(value, 'i4', 'a', 'i2');
    expect(moved.sets[0].items.map(i => i.id)).toEqual(['i3', 'i4', 'i1', 'i2']);
    const transferred = moveItemBefore(value, 'i2', 'b');
    expect(transferred.sets[0].items.map(i => i.id)).toEqual(['i3', 'i4']);
    expect(transferred.sets[1].items.map(i => i.id)).toEqual(['i1', 'i2']);
  });
  it('non perde elementi con una destinazione inesistente', () => {
    expect(moveItem(workspace, 'i1', 'missing', 0)).toEqual(workspace);
  });
  it('serializza e ripristina senza perdita',()=>expect(JSON.parse(JSON.stringify(workspace))).toEqual(workspace));
});
