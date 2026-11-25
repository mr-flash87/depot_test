import json, subprocess, re, sys
lines = [
 ("naif","Frérot, je crois que mes employés me volent. Le stock sort… mais l'argent, je ne le vois pas."),
 ("expert","Tu es sûr de ça ?"),
 ("naif","Les clients viennent chercher un produit, et je découvre que je n'en ai plus. Et le mois dernier, le cahier des ventes a disparu ! Franchement, à ce rythme, je vais faire faillite."),
 ("expert","Avant d'accuser qui que ce soit, contrôle ta boutique. Moi, j'utilise Kaïs POS."),
 ("naif","C'est quoi, ça ?"),
 ("expert","Un logiciel de caisse et de stock. Un : chaque vente déduit le stock, avec une alerte avant la rupture. Deux : chaque caissier a son propre compte. Aucune vente sans auteur. Trois : chaque annulation est tracée, et tu vois tes bénéfices du jour."),
 ("naif","Plus besoin du cahier, alors !"),
 ("expert","Exactement. Et tu peux l'essayer gratuitement pendant sept jours. Le lien est à l'écran."),
]
GAP=0.28
def run(*a): return subprocess.run(a,capture_output=True,text=True)
segs=[]; t=0.25; parts=[]; words=[]; outlines=[]
for i,(who,txt) in enumerate(lines,1):
    src=f"lines/l{i}.mp3"; dst=f"lines/t{i}.wav"
    run("ffmpeg","-v","error","-y","-i",src,"-af","silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse","-ar","44100","-ac","1",dst)
    d=float(run("ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",dst).stdout)
    # internal speech segments to place words more accurately
    out=run("ffmpeg","-i",dst,"-af","silencedetect=noise=-38dB:d=0.18","-f","null","-").stderr
    st=[float(x) for x in re.findall(r"silence_start: ([\d.]+)",out)]; en=[float(x) for x in re.findall(r"silence_end: ([\d.]+)",out)]
    speech=[]; cur=0
    for a,b in zip(st,en): speech.append((cur,a)); cur=b
    speech.append((cur,d))
    toks=txt.split()
    # split tokens into groups at strong punctuation, map groups to speech segments in order
    groups=[[]]
    for tk in toks:
        groups[-1].append(tk)
        if re.search(r"[.!?:…,]$",tk): groups.append([])
    groups=[g for g in groups if g]
    # merge groups to match number of speech segments
    while len(groups)>len(speech) and len(groups)>1:
        k=min(range(len(groups)-1),key=lambda j:len(' '.join(groups[j]+groups[j+1])))
        groups[k:k+2]=[groups[k]+groups[k+1]]
    if len(groups)<len(speech):
        # merge shortest speech gaps
        while len(speech)>len(groups):
            k=min(range(len(speech)-1),key=lambda j:speech[j+1][0]-speech[j][1])
            speech[k:k+2]=[(speech[k][0],speech[k+1][1])]
    for g,(a,b) in zip(groups,speech):
        w=[len(x)+2 for x in g]; tot=sum(w); c=a
        for x,wx in zip(g,w):
            dur=(b-a)*wx/tot; words.append({"text":x,"start":round(t+c,3),"end":round(t+c+dur*0.92,3)}); c+=dur
    outlines.append({"who":who,"start":round(t,3),"end":round(t+d,3),"text":txt})
    parts.append(dst); t+=d+GAP
# concat with gaps
flt="".join(f"[{i}:a]apad=pad_dur={GAP}[a{i}];" for i in range(len(parts)))+"".join(f"[a{i}]" for i in range(len(parts)))+f"concat=n={len(parts)}:v=0:a=1[o]"
run("ffmpeg","-v","error","-y",*sum([["-i",p] for p in parts],[]),"-filter_complex","anullsrc=r=44100:cl=mono:d=0.25[s];"+flt.replace("[o]","[c]")+";[s][c]concat=n=2:v=0:a=1[o]","-map","[o]","-c:a","libmp3lame","-b:a","192k","voice.mp3")
json.dump(words,open("words.json","w"),ensure_ascii=False)
json.dump(outlines,open("lines.json","w"),ensure_ascii=False,indent=1)
print(json.dumps(outlines,ensure_ascii=False,indent=0)); print("total",t)
