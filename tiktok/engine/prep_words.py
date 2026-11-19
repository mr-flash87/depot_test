"""Clean an ElevenLabs Scribe words.json into caption words: drop [tags], merge lone punctuation."""
import json, sys
src, dst = sys.argv[1], sys.argv[2]
data = json.load(open(src))
words = data["words"] if isinstance(data, dict) else data
out = []
for w in words:
    if w.get("type", "word") != "word": continue
    t = w["text"].strip()
    if not t or (t.startswith("[") and t.endswith("]")): continue
    if t in "?!.,…:;" and out:
        out[-1]["text"] += " " + t if t in "?!:;" else t
        out[-1]["end"] = w["end"]; continue
    out.append({"text": t, "start": w["start"], "end": w["end"]})
json.dump(out, open(dst, "w"), ensure_ascii=False, indent=0)
print(len(out), "words")
