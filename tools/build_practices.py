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
json.dump(out,open(sys.argv[2],'w'),indent=1)
for o in out: print(o['id'],o['dress'],len(o['blocks']),o['coaches'])
