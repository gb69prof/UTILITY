import { db, uid } from './db.js';

const MAX_SIZE = 512 * 1024 * 1024;
const safeImage = value => typeof value === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(value);
const plain = value => value && typeof value === 'object' && !Array.isArray(value);
function assert(condition, message) { if (!condition) throw new Error(message); }
function encodeBlob(blob) { return new Promise((resolve,reject) => { const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Un file non è leggibile.'));r.readAsDataURL(blob); }); }
export async function exportDesk(name) {
  const items=await db.allItems(), settings=await db.getSettings(), lessons=await db.allLessons();
  const packed=[];
  for(const item of items) { const copy={...item};if(copy.blob){copy.fileData=await encodeBlob(copy.blob);delete copy.blob;}packed.push(copy); }
  const archive={format:'gbprof-desk',version:2,exportedAt:new Date().toISOString(),items:packed,lessons,settings};
  const blob=new Blob([JSON.stringify(archive)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${name.replace(/[\\/:*?"<>|]/g,'-').replace(/\.json$/i,'')}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export function validateArchive(data) {
  assert(plain(data)&&data.format==='gbprof-desk'&&data.version===2,'Il file non è una copia Desk compatibile.');
  assert(Array.isArray(data.items)&&Array.isArray(data.lessons)&&plain(data.settings),'Archivio incompleto.');
  assert(data.items.length<=50000&&data.lessons.length<=10000,'Archivio troppo grande.');
  const ids=new Set();
  for(const item of data.items) {
    assert(plain(item)&&typeof item.id==='string'&&item.id!=='root'&&!ids.has(item.id),'Identificatore materiale non valido o duplicato.'); ids.add(item.id);
    assert(['file','folder','url'].includes(item.type)&&typeof item.name==='string'&&item.name.trim().length>0&&item.name.length<=1000,'Materiale non valido.');
    assert(typeof item.parentId==='string','Cartella di origine mancante.');
    if(item.type==='url') { let url;try{url=new URL(item.url);}catch{}assert(url&&['http:','https:'].includes(url.protocol),'Collegamento web non valido.'); }
    if(item.type==='file')assert(typeof item.fileData==='string'&&/^data:[^,]*;base64,[A-Za-z0-9+/=\r\n]*$/.test(item.fileData),'Contenuto di un file mancante o corrotto.');
    if(item.cardImage)assert(safeImage(item.cardImage),'Immagine scheda non valida.');
    if(item.cardColor)assert(/^#[0-9a-f]{6}$/i.test(item.cardColor),'Colore non valido.');
  }
  const byId=new Map(data.items.map(i=>[i.id,i]));
  for(const item of data.items) { const seen=new Set([item.id]);let parent=item.parentId;while(parent!=='root'){assert(byId.get(parent)?.type==='folder'&&!seen.has(parent),'Gerarchia delle cartelle non valida.');seen.add(parent);parent=byId.get(parent).parentId;} }
  const lessonIds=new Set();
  for(const lesson of data.lessons) { assert(plain(lesson)&&typeof lesson.id==='string'&&!lessonIds.has(lesson.id)&&typeof lesson.name==='string'&&Array.isArray(lesson.itemIds)&&lesson.itemIds.every(id=>ids.has(id)),'Scrivania non valida.');lessonIds.add(lesson.id); }
  if(data.settings.boardsV2) {
    assert(plain(data.settings.boardsV2),'Disposizioni non valide.');
    for(const [key,board] of Object.entries(data.settings.boardsV2)) {
      assert(/^(folder:|lesson:|space:)/.test(key)&&plain(board)&&plain(board.positions)&&Array.isArray(board.links),'Disposizione non valida.');
      assert(Number.isFinite(board.size)&&board.size>=120&&board.size<=240,'Dimensione schede non valida.');
      assert(['navy','paper','slate','wood','blue','custom'].includes(board.background),'Sfondo non valido.');
      if(board.customBackground)assert(safeImage(board.customBackground),'Sfondo personalizzato non valido.');
      for(const p of Object.values(board.positions))assert(plain(p)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=20000&&p.y<=20000,'Posizione non valida.');
      for(const link of board.links)assert(plain(link)&&typeof link.from==='string'&&typeof link.to==='string'&&typeof link.label==='string'&&link.label.length<=80&&/^#[0-9a-f]{6}$/i.test(link.color),'Collegamento grafico non valido.');
    }
  }
  return data;
}
export async function importDesk(file) {
  assert(file.size<=MAX_SIZE,'Il backup supera 512 MB.');
  let data;try{data=JSON.parse(await file.text());}catch{throw new Error('Il file JSON non è leggibile.');}validateArchive(data);
  const map=new Map(data.items.map(i=>[i.id,uid(i.type)])), lessonMap=new Map(data.lessons.map(l=>[l.id,uid('lesson')]));
  const items=[];
  for(const raw of data.items) {
    const item={ id:map.get(raw.id),parentId:raw.parentId==='root'?'root':map.get(raw.parentId),type:raw.type,name:raw.name,url:raw.url,mime:raw.mime,starred:!!raw.starred,createdAt:raw.createdAt||Date.now(),modifiedAt:raw.modifiedAt||Date.now(),lastOpenedAt:raw.lastOpenedAt||0,viewState:raw.viewState,cardColor:raw.cardColor,cardImage:raw.cardImage };
    if(raw.type==='file') { const encoded=raw.fileData.slice(raw.fileData.indexOf(',')+1);let bytes;try{bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));}catch{throw new Error('Contenuto binario corrotto.');}item.blob=new Blob([bytes],{type:raw.mime||'application/octet-stream'});item.size=bytes.length; }
    items.push(item);
  }
  const lessons=data.lessons.map(l=>({id:lessonMap.get(l.id),name:l.name,itemIds:l.itemIds.map(id=>map.get(id)),createdAt:l.createdAt||Date.now(),modifiedAt:Date.now()}));
  const settings=await db.getSettings(), boards=structuredClone(settings.boardsV2||{});
  // A dedicated imported desktop retains its wallpaper and layout without displacing existing cards.
  const importedRoot=uid('folder');
  items.push({id:importedRoot,type:'folder',name:`Desk importato · ${new Date().toLocaleDateString('it-IT')}`,parentId:'root',createdAt:Date.now(),modifiedAt:Date.now()});
  for(const item of items)if(item.id!==importedRoot&&item.parentId==='root')item.parentId=importedRoot;
  for(const [key,raw] of Object.entries(data.settings.boardsV2||{})) {
    let newKey;
    if(key==='folder:root')newKey=`folder:${importedRoot}`;
    else if(key.startsWith('folder:')&&map.has(key.slice(7)))newKey=`folder:${map.get(key.slice(7))}`;
    else if(key.startsWith('lesson:')&&lessonMap.has(key.slice(7)))newKey=`lesson:${lessonMap.get(key.slice(7))}`;
    // Favorites/recent are local dynamic views; don't overwrite the recipient's arrangements.
    if(!newKey)continue;
    const board={...raw,positions:{},links:[]};
    for(const [id,p] of Object.entries(raw.positions))if(map.has(id))board.positions[map.get(id)]={x:p.x,y:p.y};
    board.links=raw.links.filter(l=>map.has(l.from)&&map.has(l.to)).map(l=>({...l,id:uid('link'),from:map.get(l.from),to:map.get(l.to)}));boards[newKey]=board;
  }
  await db.importBatch(items,lessons,{boardsV2:boards});
  return data.items.length;
}
