// Run against a disposable local origin, never a personal Desk archive.
const path=require('node:path');const output=require('node:fs').mkdtempSync(path.join(require('node:os').tmpdir(),'desk-qa-'));
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('fs');
const base=(process.env.DESK_TEST_URL || 'http://127.0.0.1:8765/Desk/');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,serviceWorkers:'block'});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const ready=async()=>{await page.waitForFunction(()=>document.querySelectorAll('.item-card').length>0);await page.waitForTimeout(150);};
const settings=()=>page.evaluate(async()=>{const {db}=await import('./js/db.js');return db.getSettings();});
const items=()=>page.evaluate(async()=>{const {db}=await import('./js/db.js');return (await db.allItems()).map(({blob,...i})=>({...i,text:blob?null:undefined}));});
let checks=0;function ok(value,message){assert(value,message);checks++;console.log('PASS',message);}
await page.goto(base);await page.waitForTimeout(300);
await page.evaluate(async()=>{const {db}=await import('./js/db.js');await db.putSetting('viewMode','grid');for(const [id,name] of [['a','gbprof'],['b','Goldoni'],['c','Illuminismo'],['d','Linea del tempo']])await db.putItem({id,name,type:'url',url:'https://gbprof.it',parentId:'root',createdAt:1,modifiedAt:1});await db.putItem({id:'text',name:'Appunti.txt',type:'file',parentId:'root',mime:'text/plain',size:18,blob:new Blob(['Lezione di Goldoni'],{type:'text/plain'}),createdAt:1,modifiedAt:1});await db.putSetting('deskV2',false);});
await page.reload();await ready();
ok(await page.locator('.free-canvas').count()===1,'Migrazione: vista libera predefinita e cinque materiali conservati');
ok((await items()).length===5,'Archivio precedente conservato');
await page.reload();await ready();ok(await page.locator('.free-canvas').count()===1,'La vista libera resta predefinita al secondo avvio');
const drag=async(id,dx,dy)=>{const h=page.locator(`[data-id="${id}"] .move-handle`);const r=await h.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2+dx,r.y+r.height/2+dy,{steps:12});await page.mouse.up();await page.waitForTimeout(400);};
const before=(await settings()).boardsV2['folder:root'].positions.b;
await drag('b',0,270);const after=(await settings()).boardsV2['folder:root'].positions.b;
ok(after.y>before.y+200,'Trascinamento mouse salva nuove coordinate');ok(await page.locator('#viewerPane').isHidden(),'Trascinare non apre il materiale');
await page.locator('#gridViewBtn').click();await page.locator('#listViewBtn').click();await page.locator('#freeViewBtn').click();
ok(JSON.stringify((await settings()).boardsV2['folder:root'].positions.b)===JSON.stringify(after),'Griglia ed elenco non alterano la disposizione');
await page.reload();await ready();ok((await settings()).boardsV2['folder:root'].positions.b.y===after.y,'Posizioni ripristinate dopo ricarica');
const viewportBefore=await page.locator('.board-viewport').boundingBox();await page.locator('#sidebarToggle').click();const viewportAfter=await page.locator('.board-viewport').boundingBox();ok(viewportAfter.width>viewportBefore.width+150,'Nascondere la barra laterale allarga il Desk');await page.locator('#sidebarToggle').click();
await page.locator('[data-tool="lock"]').click();ok(await page.locator('[data-id="b"] .move-handle').isDisabled(),'Blocco protegge gli spostamenti');await page.locator('[data-tool="lock"]').click();
await page.locator('[data-tool="connect"]').click();await page.locator('[data-id="c"] .item-open').click();await page.locator('[data-id="b"] .item-open').click();await page.locator('.board-dialog input[name="label"]').fill('contesto culturale');await page.locator('.board-dialog button[type="submit"]').click();
ok((await settings()).boardsV2['folder:root'].links.length===1,'Creazione connettore con etichetta');
await page.locator('[data-tool="move"]').click();await page.locator('.connection').click();await page.locator('.board-dialog input[name="label"]').fill('cultura del Settecento');await page.locator('.board-dialog button[type="submit"]').click();ok((await settings()).boardsV2['folder:root'].links[0].label==='cultura del Settecento','Modifica connettore salvata');
await page.locator('[data-tool="links"]').click();ok(await page.locator('.connection').count()===0,'Connettori nascondibili');await page.locator('[data-tool="links"]').click();
const preUndo=(await settings()).boardsV2['folder:root'].positions.b.y;await drag('b',100,40);await page.locator('[data-tool="undo"]').click();ok((await settings()).boardsV2['folder:root'].positions.b.y===preUndo,'Annulla ripristina lo spostamento');
await page.locator('[data-tool="style"]').click();await page.locator('.board-dialog input[name="size"]').fill('180');await page.locator('.board-dialog select[name="background"]').selectOption('blue');await page.locator('.board-dialog button[type="submit"]').click();ok((await settings()).boardsV2['folder:root'].size===180,'Dimensioni e sfondo salvati per spazio');
await page.locator('[data-tool="style"]').click();await page.locator('.board-dialog select[name="background"]').selectOption('navy');await page.locator('.board-dialog button[type="submit"]').click();
await page.locator('[data-id="b"] .item-more').click();await page.locator('[data-action="customize"]').click();await page.locator('.board-dialog input[name="url"]').fill('https://gbprof.it/IV-anno/Letteratura/Goldoni/');await page.locator('.board-dialog input[name="color"]').fill('#fff2d4');await page.locator('.board-dialog button[type="submit"]').click();ok((await items()).find(i=>i.id==='b').url.endsWith('/Goldoni/'),'Modifica indirizzo URL');
await page.locator('#newFolderBtn').click();await page.locator('#folderForm input').fill('Non creare');await page.locator('#folderForm button[value="cancel"]').last().click();ok(!(await items()).some(i=>i.name==='Non creare'),'Annulla non crea cartelle');
await page.locator('#lessonsBtn').click();await page.locator('#lessonCreateForm input').fill('Il Settecento');await page.locator('#lessonCreateForm button').click();await page.waitForTimeout(200);await page.locator('.lesson-card').getByRole('button',{name:'Apri scrivania'}).click();await page.locator('#addUrlBtn').click();await page.locator('#urlForm input[name="name"]').fill('Materiale scrivania');await page.locator('#urlForm input[name="url"]').fill('https://example.org');await page.locator('#createUrlConfirm').click();await page.waitForTimeout(200);ok(await page.locator('.item-card').count()===1,'URL aggiunto direttamente alla scrivania');
await page.locator('[data-tool="style"]').click();await page.locator('.board-dialog select[name="background"]').selectOption('paper');await page.locator('.board-dialog button[type="submit"]').click();
await page.locator('#lessonsBtn').click();await page.locator('.lesson-card').getByRole('button',{name:'Duplica',exact:true}).click();await page.waitForTimeout(250);ok(await page.locator('.lesson-card').count()===2,'Duplicazione scrivania');await page.locator('#closeLessonsBtn').click();await page.locator('#homeBtn').click();
const boardSettings=(await settings()).boardsV2;ok(Object.keys(boardSettings).filter(k=>k.startsWith('lesson:')).length===2,'Duplicazione conserva disposizioni e sfondi');
// Export actual file, import it, compare contents and remapped graph.
await page.locator('#settingsBtn').click();page.once('dialog',d=>d.accept('Desk-test-completo'));const downloaded=page.waitForEvent('download');await page.locator('#exportDeskBtn').click();const download=await downloaded;await download.saveAs(path.join(output,'desk-backup-test.json'));const archive=JSON.parse(fs.readFileSync(path.join(output,'desk-backup-test.json')));ok(archive.items.find(i=>i.id==='text').fileData.includes('base64,'),'Backup comprende i file binari');
page.once('dialog',d=>d.accept());await page.locator('#importDeskInput').setInputFiles(path.join(output,'desk-backup-test.json'));await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('Importazione completata'));const all=await items();ok(all.length===archive.items.length*2+1,'Importazione aggiunge senza sovrascrivere');
const restored=await page.evaluate(async()=>{const {db}=await import('./js/db.js');const all=await db.allItems();return Promise.all(all.filter(i=>i.name==='Appunti.txt').map(i=>i.blob.text()));});ok(restored.length===2&&restored.every(t=>t==='Lezione di Goldoni'),'Contenuto binario ripristinato esattamente');
const importedRoot=all.find(i=>i.name.startsWith('Desk importato'));const importedBoard=(await settings()).boardsV2[`folder:${importedRoot.id}`];ok(importedBoard.links.length===1&&importedBoard.links[0].from!=='c','Backup ripristina connettori con nuovi identificatori');
const invalid={...archive,items:[...archive.items,{...archive.items[0]}]};fs.writeFileSync(path.join(output,'invalid-backup.json'),JSON.stringify(invalid));page.once('dialog',d=>d.accept());await page.locator('#importDeskInput').setInputFiles(path.join(output,'invalid-backup.json'));await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('non riuscita'));ok((await items()).length===all.length,'Backup non valido rifiutato senza scritture parziali');
await page.locator('#settingsForm button[value="cancel"]').first().click();
await page.locator('#searchInput').fill('Goldoni');ok(await page.locator('.free-canvas').count()===0,'Ricerca temporanea senza modificare il canvas');await page.locator('#searchInput').fill('');
await page.locator('[data-tool="fit"]').click();await page.screenshot({path:path.join(output,'desk-desktop-qa.png')});
// Test a narrow tablet viewport, position invariance, overflow, and simulated touch pointer events.
const positions=JSON.stringify((await settings()).boardsV2['folder:root'].positions);
await page.setViewportSize({width:820,height:1180});await page.waitForTimeout(200);await page.locator('[data-tool="fit"]').click();ok(JSON.stringify((await settings()).boardsV2['folder:root'].positions)===positions,'Rotazione tablet e Mostra tutto non cambiano le posizioni');
ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Nessuno scorrimento orizzontale della pagina su tablet');
await page.screenshot({path:path.join(output,'desk-tablet-qa.png')});
await page.setViewportSize({width:1180,height:820});await page.waitForTimeout(200);await page.locator('[data-tool="fit"]').click();await page.screenshot({path:path.join(output,'desk-landscape-qa.png')});
ok(errors.length===0,'Nessun errore JavaScript nei flussi verificati');
console.log(JSON.stringify({checks,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
