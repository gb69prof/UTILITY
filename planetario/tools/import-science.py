"""Import JPL originals and generate independent CSPICE reference states. Run with .tmp/science-tools."""
from pathlib import Path
import sys,json,re,math,hashlib
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'.tmp/science-tools'))
import spiceypy as sp
import numpy as np
raw=ROOT/'data/raw'; manifest=json.loads((ROOT/'data/acquisition.json').read_text(encoding='utf-8'))
if (ROOT/'data/ephemeris-acquisition.json').exists(): manifest += json.loads((ROOT/'data/ephemeris-acquisition.json').read_text(encoding='utf-8'))
sp.furnsh(str(raw/'pck00011.tpc'));sp.furnsh(str(raw/'gm_de440.tpc'))
R=math.pi/180; valid={'startTdbSeconds':-1296000,'endTdbSeconds':1296000}
epoch={'jd':2451545,'scale':'TDB'}; eps=84381.448/3600*R
B=np.array([[1,0,0],[0,math.cos(eps),math.sin(eps)],[0,-math.sin(eps),math.cos(eps)]])
sources=[]
for m in manifest:
 sources.append(dict(id=Path(m['file']).stem,title=Path(m['file']).name,institution='NASA JPL / NAIF',url=m['url'],publishedOrVersion=('PCK00011' if m['file'].endswith('pck00011.tpc') else 'DE440' if m['file'].endswith('gm_de440.tpc') else 'Horizons API response 1.2; '+('mar099' if 'mars-sun' in m['file'] else 'DE441')),accessedOn=m['accessedOn'][:10],locator=m['file'],artifactSha256=m['sha256']))
def provenance(sid,original,unit,changes=[],limits=[]):
 return dict(sourceIds=[sid],originalValue=str(original),originalUnit=unit,transformations=changes,status='derived' if changes else 'reported',review='reviewed',limitations=limits)
def q(value,unit,sid,original,originalunit,definition,changes=[]):
 return dict(value=float(value),unit=unit,definition=definition,uncertainty=None,provenance=provenance(sid,original,originalunit,changes))
orbits={}; numeric={}; imports={}
for name,target,center in [('emb-sun','emb','sun'),('mars-sun','mars','sun'),('moon-earth','moon','earth')]:
 doc=json.loads((raw/(name+'-elements.json')).read_text(encoding='utf-8'))['result']
 vals=[x.strip() for x in doc.split('$$SOE')[1].split('$$EOE')[0].strip().split(',')]
 mu=re.search(r'Keplerian GM\s*:\s*([\d.E+-]+)',doc)[1]; v=list(map(float,vals[2:-1])); sid=name+'-elements'
 def elem(index,unit,factor,originalunit,label):return q(v[index]*factor,unit,sid,vals[index+2],originalunit,label,[] if factor==1 else [f'multiply by {factor:.17g}'])
 o=dict(id=name,target=target,center=center,frame='ECLIPJ2000',epoch=epoch,valid=valid,convention='osculating-frozen-two-body',a=elem(9,'m',1000,'km','Semiasse maggiore osculatore a J2000'),e=elem(0,'1',1,'1','Eccentricità'),i=elem(2,'rad',R,'deg','Inclinazione'),ascendingNode=elem(3,'rad',R,'deg','Longitudine del nodo ascendente'),argumentOfPeriapsis=elem(4,'rad',R,'deg','Argomento del pericentro'),anomalyAtEpoch=dict(kind='mean',angle=elem(7,'rad',R,'deg','Anomalia media all’epoca')),mu=q(float(mu)*1e9,'m3/s2',sid,mu,'km3/s2','GM relativo della specifica risposta Horizons',['multiply by 1000000000']))
 orbits[name]=o;numeric[name]=[v[1],v[0],v[2]*R,v[3]*R,v[4]*R,v[7]*R,0,float(mu)]
 imports[name]={'meanMotionRadPerSecond':v[6]*R,'periodSeconds':v[11]}
bodies={};angles={};gm={key:sp.bodvrd(key.upper(),'GM',1)[1][0] for key in ['sun','earth','moon','mars']}
# Reconcile Mars with the actual target-499 osculating dynamical GM, not system-barycenter GM.
mars_effective=orbits['mars-sun']['mu']['value']/1e9-gm['sun']
reconcile={'mars_DE440_center_GM_km3s2':gm['mars'],'mars_effective_Horizons499_minus_Sun_km3s2':mars_effective,'difference_km3s2':mars_effective-gm['mars'],'policy':'Use exact response Keplerian GM for conics; body Mars GM is explicitly derived from that response minus DE440 solar GM. No use of BODY4_GM. Precision limited by subtraction of printed response.'}
gm['mars']=mars_effective
for id,naif,name,eng in [('sun',10,'Sole','Sun'),('earth',399,'Terra','Earth'),('moon',301,'Luna','Moon'),('mars',499,'Marte','Mars')]:
 matrix=sp.pxform('IAU_'+id.upper(),'J2000',0);pole=matrix[:,2]
 ra=math.atan2(pole[1],pole[0])%(2*math.pi);dec=math.asin(pole[2]);u=np.array([-math.sin(ra),math.cos(ra),0]);v=np.cross(pole,u)
 w=math.atan2(np.dot(matrix[:,0],v),np.dot(matrix[:,0],u))%(2*math.pi)
 speed=sp.bodvrd(id.upper(),'PM',3)[1][1]*R/86400
 angles[id]=[ra,dec,w,speed]
 if id=='sun':normal=np.array([0,0,1])
 else:
  o=orbits[{'earth':'emb-sun','moon':'moon-earth','mars':'mars-sun'}[id]];inc=o['i']['value'];node=o['ascendingNode']['value'];normal=np.array([math.sin(node)*math.sin(inc),-math.cos(node)*math.sin(inc),math.cos(inc)])
 obliq=math.acos(np.clip(np.dot(B@pole,normal),-1,1));radii=sp.bodvrd(id.upper(),'RADII',3)[1];mean=(float(radii[0]) if min(radii)==max(radii) else math.cbrt(float(np.prod(radii))))*1000
 def pq(value,unit,label):return q(value,unit,'pck00011',value,unit,label,['CSPICE pxform evaluated at ET=0 including periodic terms; extracted active body-frame columns'] )
 rotation=dict(kind='fixed-pole-uniform-spin',epoch=epoch,poleFrame='J2000-equatorial',poleRa=pq(ra,'rad','Ascensione retta polo a t0'),poleDec=pq(dec,'rad','Declinazione polo a t0'),primeMeridianAtEpoch=pq(w,'rad','Meridiano primo a t0'),spinRate=pq(speed,'rad/s','Velocità secolare PCK'),siderealPeriod=pq(2*math.pi/abs(speed),'s','Periodo 2π/|ω|'),direction='positive-about-pole',obliquityAtEpoch=pq(obliq,'rad','Obliquità derivata rispetto alla normale dichiarata'),obliquityReference={'sun':'ecliptic-north','earth':'emb-sun-normal','moon':'moon-earth-normal','mars':'mars-sun-normal'}[id],provenance=provenance('pck00011','IAU full orientation at ET=0','rad',['SpiceyPy 8.2.0 / CSPICE N0067 initialization; fixed pole and secular spin thereafter'],['No Earth UT1/polar motion, accurate lunar libration or solar differential rotation']))
 physical=dict(mass=None,gm=q(gm[id]*1e9,'m3/s2','mars-sun-elements' if id=='mars' else 'gm_de440',gm[id],'km3/s2','GM dinamico del centro del corpo',['multiply by 1e9']+(['Horizons relative GM minus DE440 Sun; see reconciliation.json'] if id=='mars' else [])),meanRadius=q(mean,'m','pck00011',list(radii),'km','Raggio della sfera di volume equivalente all’ellissoide PCK',['1000 * (a*b*c)^(1/3)']),equatorialRadius=q(max(radii[:2])*1000,'m','pck00011',max(radii[:2]),'km','Raggio equatoriale PCK',['multiply by 1000']),polarRadius=q(radii[2]*1000,'m','pck00011',radii[2],'km','Raggio polare PCK',['multiply by 1000']),gravity=None,density=None,temperatures=[],composition=[])
 motion=dict(kind='origin',center='sun') if id=='sun' else dict(kind='kepler',orbitId='mars-sun') if id=='mars' else dict(kind='earth-moon-member',member=id,barycenterOrbitId='emb-sun',relativeOrbitId='moon-earth')
 bodies[id]=dict(schemaVersion='1.0',recordStatus='reviewed',id=id,name=name,internationalName=eng,kind='star' if id=='sun' else 'satellite' if id=='moon' else 'planet',centralBody=None if id=='sun' else 'earth' if id=='moon' else 'sun',naifId=naif,physical=physical,motion=motion,rotation=rotation,missingReasons={'/physical/'+x:'Non acquisito: non necessario alla Fase 5; nessun valore inventato' for x in ['mass','gravity','density','temperatures','composition']})
data=dict(schemaVersion='1.0',version='j2000-de441-mar099-pck11-v1',valid=valid,sources=sources,bodies=bodies,nodes={'emb':dict(id='emb',naifId=3,members=['earth','moon'])},orbits=orbits,constants={},validationReport={'status':'unvalidated','reportId':None})
def save(path,data): (ROOT/path).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
save('data/dataset.json',data);save('data/import-checks.json',imports);save('data/gm-reconciliation.json',reconcile)
refs={}; times=[-1296000+10800*i for i in range(241)]
for key in ['emb-sun','earth-sun','moon-sun','mars-sun','moon-earth']:
 doc=json.loads((raw/(key+'-vectors.json')).read_text(encoding='utf-8'))['result'];rows=[]
 for line in doc.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines():
  v=line.split(','); rows.append({'t':(float(v[0])-2451545)*86400,'state':[float(x)*1000 for x in v[2:8]]})
 assert len(rows)==241;refs[key]=rows
rotationrefs={id:[] for id in bodies}
for t in times:
 for id in bodies:
  quat=sp.m2q(B@sp.pxform('IAU_'+id.upper(),'J2000',t));rotationrefs[id].append({'t':t,'q':[float(x) for x in [*quat[1:],quat[0]]]})
conicrefs={key:[{'t':t,'state':(sp.conics(np.array(params),t)*1000).tolist()} for t in times] for key,params in numeric.items()}
save('data/reference.json',{'tool':f'SpiceyPy {sp.__version__}, {sp.tkvrsn("TOOLKIT")}','horizons':refs,'orientations':rotationrefs,'conics':conicrefs})
print('Imported 4 bodies, 3 conics, 5 × 241 Horizons states, 4 × 241 PCK orientations')
print('GM reconciliation:',reconcile)
