"""Convert practices.raw.json (from extract_pdfs.py) into app/src/data/practices.generated.json.
Usage: python3 tools/build_practices.py <practices.raw.json> <out.json>"""
import sys, json, re
raw=json.load(open(sys.argv[1]))
MONTHS={'JAN':1,'FEB':2,'MAR':3,'APR':4,'MAY':5,'JUN':6,'JUL':7,'AUG':8,'SEP':9,'OCT':10,'NOV':11,'DEC':12}
def iso(d):
    m=re.match(r'([A-Za-z]+)\.?\s+(\d+),\s*(\d{4})',d.strip())
    return f"{m[3]}-{MONTHS[m[1][:3].upper()]:02d}-{int(m[2]):02d}" if m else None
def session(t):
    h=int(t.split(':')[0]); return ('school-day','School Day') if h in (11,12,1) else ('evening','Evening') if h in (6,7) else ('after-school','After School')
def norm(s): return s.strip()
out=[]
for p in raw:
    d=iso(p['date'])
    if not d or not p['periods']: continue
    rows=[]
    for q in p['periods']:
        lanes={k:norm(v) for k,v in q['lanes'].items()}
        span=q['span']
        if not span and len(lanes)==1:
            k=next(iter(lanes)); i=p['coaches'].index(k)
            if len(p['coaches'])//3 <= i < len(p['coaches'])-len(p['coaches'])//3: span=lanes[k]; lanes={}
        rows.append({'time':q['time'],'n':q['n'],'span':norm(span) if span else None,'lanes':lanes})
    flex=rows[0] if rows[0]['n']==0 else None
    body=rows[1:] if flex else rows
    blocks=[]
    for r in body:
        empty=not r['span'] and not r['lanes']
        if empty:
            if blocks: blocks[-1]['periods']+=1
            else: blocks.append({'start':r['time'],'periods':1,'_lead':True})
            continue
        if blocks and blocks[-1].get('_lead'):
            b=blocks.pop(); r=dict(r); start=b['start']; per=b['periods']
        else: start=r['time']; per=0
        if blocks and not r['span'] and blocks[-1].get('lanes')==r['lanes'] and not blocks[-1].get('span'):
            blocks[-1]['periods']+=1+per; continue
        blk={'start':start,'periods':1+per}
        if r['span']: blk['span']=r['span']
        else: blk['lanes']=r['lanes']
        blocks.append(blk)
    for b in blocks: b.pop('_lead',None)
    if flex: blocks.insert(0,{'start':flex['time'],'periods':1,'span':norm((flex['span'] or '').replace('FLEX','').replace(flex['time'],'').strip() or 'Warm-Up'),'flex':True})
    slug,label=session(blocks[0]['start'])
    notes=[n for n in p['notes'] if n.upper().strip(' :') not in ('NOTES','EOP TALK NOTES','MOTIONS') and not n.strip().isdigit()]
    coaches=[c for c in p['coaches'] if any(c in (b.get('lanes') or {}) for b in blocks)]
    out.append({'id':f'{d}-{slug}','imported':True,'opponent':'Pea Ridge' if d>='2026-09-28' else None,'date':d,'session':label,'dress':p['dress'].strip().title() if p['dress'].isupper() else p['dress'].strip(),
        'lift':p.get('lift') or None,'coaches':coaches or p['coaches'],'blocks':blocks,'notes':[norm(n) for n in notes]})

# Hand corrections for days the auto-import gets wrong (merged multi-line cells). Still flagged "verify".
def lanes(*pairs): return dict(pairs)
FIX = {
 '2026-09-28-evening': {'notes': ["RVA's to the right: 4/5/6 Bears, Wheel, Aggies, Sun Devil, Longhorns, Smoke/Strike, Buffalo.", 'Coursey: have the Pea Ridge book.']},
 '2026-09-28-school-day': {'lift': '3x8 Bench, Squat', 'notes': ['Potts and Driscoll: period 3, work on Blade together.', 'Driscoll: on 3 Buzz, make sure they roll down on the outside shoulder and keep contain.']},
 '2026-09-29-evening': {'lift': '3x5 Bench, Squat, Hang Clean', 'notes': ['Coursey: have the Pea Ridge book.']},
 '2026-09-29-school-day': {'notes': ["RVA's to the right."]},
 '2026-10-01-evening': {
   'notes': ['Coursey: have the Siloam scout book.'],
   'blocks': [
    {'start':'6:55','periods':1,'span':'Warm-Up','flex':True},
    {'start':'7:00','periods':2,'span':'Game Day Routine'},
    {'start':'7:10','periods':2,'span':'Special Teams, 2 reps each (KO, KOR, Punt, Punt Return)'},
    {'start':'7:20','periods':2,'span':'Team D (O-line hold pads)'},
    {'start':'7:30','periods':1,'span':'Offense: 2-point plays at the 3 yard line'},
    {'start':'7:35','periods':2,'span':'Team O (defense hold pads). Going fast, Coach Dugger on sideline, signs only'},
    {'start':'7:45','periods':1,'span':'9th Grade End of Practice / Break'},
    {'start':'7:50','periods':1,'lanes':{'Dugger':'Team O','Barrett':"ABC's",'Coursey':"ABC's",'Potts':"ABC's",'Salsbury':'Steps'}},
    {'start':'7:55','periods':2,'lanes':{'Dugger':'Steps','Barrett':"ABC's",'Coursey':"ABC's",'Potts':"ABC's",'Salsbury':'Steps'}},
    {'start':'8:05','periods':1,'lanes':{'Dugger':'DLine','Barrett':'Safeties','Coursey':'LBs','Potts':'EDD Footwork','Salsbury':'DLine'}},
    {'start':'8:10','periods':1,'lanes':{'Dugger':'DLine','Barrett':'Safeties','Coursey':'LBs','Potts':'Block Shed','Salsbury':'DLine'}},
    {'start':'8:15','periods':1,'lanes':{'Dugger':'DLine','Barrett':'Safeties','Coursey':'LBs','Potts':'Vice','Salsbury':'DLine'}},
    {'start':'8:20','periods':1,'span':'End of Practice'},
    {'start':'8:25','periods':1,'span':'Go get bags ready for those who are going. Everyone else makes sure the locker room is spotless'}]},
 '2026-10-01-school-day': {
   'dress': None,
   'notes': ['End of practice talk: classroom, special teams, being attentive, travel, pregame meals, after-game scuffle.',
             'Game day: 3:45-3:55 eat; 3:55-4:00 weight room; 4:00-5:30 movie; 5:30-5:45 get dressed (no shoulder pads); 5:45-6:00 walk-thru; 6:10-6:55 pregame.',
             'Pregame walk-thru groups: 7 ABC\'s / 7 O-line, 7 Ind D / 7 D-line, 7 Team D, 7 Team O.'],
   'blocks': [
    {'start':'12:55','periods':1,'span':'Get travel bags and pants','flex':True},
    {'start':'1:00','periods':3,'span':'Pack travel bags and move to big room'},
    {'start':'1:15','periods':2,'span':'Walk-thru in indoor (just get lined up)'},
    {'start':'1:25','periods':2,'span':'EOP talk'},
    {'start':'1:35','periods':1,'span':'End of Practice'}]},
}
for o in out:
    for k,v in FIX.get(o['id'],{}).items(): o[k]=v
    if o['id'] in FIX and 'blocks' in FIX[o['id']]:
        o['coaches']=[c for c in o['coaches'] if any(c in (b.get('lanes') or {}) for b in o['blocks'])] or o['coaches']
json.dump(out,open(sys.argv[2],'w'),indent=1)
for o in out: print(o['id'],o['dress'],len(o['blocks']),o['coaches'])
