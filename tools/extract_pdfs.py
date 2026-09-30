"""Extract roster + practice grids from the coach's PDFs into JSON (uses word coordinates).
Usage: python3 tools/extract_pdfs.py <roster.pdf> <practice.pdf> <out_dir>"""
import sys, re, json, difflib, pymupdf
roster_pdf, practice_pdf, out = sys.argv[1:4]

# ---------- roster ----------
def rows(words, tol=3):
    out=[]
    for w in sorted(words, key=lambda w:(round(w[1]),w[0])):
        if out and abs(out[-1][0]-w[1])<=tol: out[-1][1].append(w)
        else: out.append([w[1],[w]])
    return [sorted(r[1], key=lambda w:w[0]) for r in out]

def parse_list(words):
    res=[]
    for r in rows(words):
        t=[w[4].strip() for w in r if w[4].strip()]
        if len(t)>=4 and t[0].isdigit() and t[-1] in ('8','9'):
            names=t[1:-1]
            res.append((int(t[0]), ' '.join(names[:-1]), names[-1], int(t[-1])))
    return res

doc=pymupdf.open(roster_pdf)
lists={}
for i,p in enumerate(doc):
    if i>=13: break
    ws=p.get_text('words'); mid=p.rect.width/2
    title=(p.get_text().split('\n')[0]).strip()
    for side,sel in (('L',lambda w:w[0]<mid),('R',lambda w:w[0]>=mid)):
        got=parse_list([w for w in ws if sel(w)])
        if got: lists[f'p{i+1}{side}']=got
signout=[]
for k in ('p10L','p10R','p11L','p12L','p12R','p13L'):
    signout+=lists.get(k,[])
norm=lambda a,b:(a.lower().strip()+' '+b.lower().strip())
players={}
for n,f,l,g in signout:
    players[norm(f,l)]={'first':f.strip(),'last':l.strip(),'grade':g,'number':n,'otherNumbers':[]}
# other lists: record differing numbers / names not in sign-out
unmatched={}
for k,v in lists.items():
    if k.startswith(('p10','p11','p12','p13')): continue
    for n,f,l,g in v:
        key=norm(f,l)
        if key in players:
            if n!=players[key]['number'] and n not in players[key]['otherNumbers']: players[key]['otherNumbers'].append(n)
        else:
            best=difflib.get_close_matches(key,list(players),n=1,cutoff=0.85)
            unmatched.setdefault(key,{'first':f,'last':l,'grade':g,'numbers':[],'closest':best[0] if best else None})['numbers'].append(n)
plist=[]
for i,(k,p) in enumerate(sorted(players.items(), key=lambda kv:(kv[1]['last'].lower(),kv[1]['first'].lower()))):
    p['id']=re.sub(r'[^a-z0-9]+','-',k).strip('-'); plist.append(p)
for u in unmatched.values(): u['numbers']=sorted(set(u['numbers']))
json.dump({'players':plist,'nearDuplicates':[u for u in unmatched.values() if u['closest']],'notOnSignOut':[u for u in unmatched.values() if not u['closest']]}, open(f'{out}/roster.json','w'), indent=1)
print('players',len(plist),'near-dupes',sum(1 for u in unmatched.values() if u['closest']),'not on sign-out',sum(1 for u in unmatched.values() if not u['closest']))

# ---------- practices ----------
TIME=re.compile(r'^\d{1,2}:\d{2}$')
pd=pymupdf.open(practice_pdf)
practices=[]
for pi,p in enumerate(pd):
    ws=p.get_text('words'); txt=p.get_text().split('\n')
    hdr=[w for w in ws if w[4]=='TIME']
    if not hdr: continue
    h=min(hdr,key=lambda w:w[0]); hy=h[1]
    heads=sorted([w for w in ws if abs(w[1]-hy)<3 and w[4] not in ('PER','TIME') and w[0]>h[2]+5 and w[0]<500+40 and w[4].isalpha()], key=lambda w:w[0])
    heads=[w for w in heads if w[0]<510]
    coaches=[w[4].title() for w in heads]; cx=[(w[0]+w[2])/2 for w in heads]
    bounds=[(cx[i]+cx[i+1])/2 for i in range(len(cx)-1)]
    col=lambda x:sum(1 for b in bounds if x>b)
    mid=(cx[0]+cx[-1])/2
    rp=[w for w in ws if w[4]=='PER' and abs(w[1]-hy)<3 and w[0]>h[0]+100]
    limit=(min(rp,key=lambda w:w[0])[0]-4) if rp else 505
    def field(label):
        for w in ws:
            if w[4].startswith(label):
                line=[x for x in ws if abs(x[1]-w[1])<3 and x[0]>w[0]]
                return ' '.join(x[4] for x in sorted(line,key=lambda x:x[0])).strip()
        return ''
    title=' '.join(t for t in txt[:2] if t and 'SITUATIONS' not in t)
    date=next((t.replace('DATE:','').strip() for t in txt if t.startswith('DATE:')),'')
    dress=next((t.replace('DRESS:','').strip() for t in txt if t.startswith('DRESS:')),'')
    periods=[]; notes=[]
    for r in rows([w for w in ws if w[1]>hy+4]):
        left=[w for w in r if w[0]<100]
        tl=[w[4] for w in left]
        cells=[w for w in r if 100<=w[0]<limit]
        if len(tl)>=2 and tl[0].isdigit() and TIME.match(tl[1]):
            groups={}
            for w in cells: groups.setdefault(col(w[0]),[]).append(w)
            lanes={coaches[c]:' '.join(x[4] for x in g) for c,g in groups.items() if ' '.join(x[4] for x in g).strip().lower() not in ('n/a',)}
            span=None
            cw=sorted(cells,key=lambda w:w[0])
            runs=[]
            for w in cw:
                if runs and w[0]-runs[-1][-1][2]<=14: runs[-1].append(w)
                else: runs.append([w])
            if len(runs)==1 and len(cw)>=1:
                g=runs[0]; c=(g[0][0]+g[-1][2])/2
                if abs(c-mid)<45 and len(groups)>1 or (abs(c-mid)<20): span=' '.join(x[4] for x in g); lanes={}
            periods.append({'n':int(tl[0]),'time':tl[1],'span':span,'lanes':lanes})
        elif len(tl)>=1 and tl[0]=='FLEX' and len(tl)>=2 and TIME.match(tl[1]):
            groups={}
            for w in cells: groups.setdefault(col(w[0]),[]).append(w)
            periods.append({'n':0,'time':tl[1],'span':' '.join(x[4] for x in sorted(cells,key=lambda x:x[0])),'lanes':{}})
        else:
            s=re.sub(r'\s+\d{1,2}$','',' '.join(w[4] for w in r if w[0]>=100 and w[0]<limit)).strip()
            if s.isdigit(): s=''
            if s.strip(): notes.append(s.strip())
    periods=[q for q in periods]
    # drop empty trailing rows
    periods=[q for q in periods if q['span'] or q['lanes'] or q['n']==0 or True]
    last=max((i for i,q in enumerate(periods) if q['span'] or q['lanes']),default=-1)
    periods=periods[:last+1]
    practices.append({'page':pi+1,'title':title,'date':date,'dress':dress,'coaches':coaches,'periods':periods,'notes':notes})
json.dump(practices, open(f'{out}/practices.raw.json','w'), indent=1)
for pr in practices: print(pr['page'],pr['title'],pr['date'],pr['dress'],len(pr['periods']),pr['coaches'])
