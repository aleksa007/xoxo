# Forced alignment of the script to the voice-over (pocketsphinx, offline).
# Usage: python align.py voice.raw(16k mono s16le) script.txt words.json
import json, re, sys
from pocketsphinx import Decoder, get_model_path
import os
raw_path, txt_path, out_path = sys.argv[1:4]
text = open(txt_path).read()
# keep display tokens, and a normalized version for the aligner
disp = text.split()
norm = [re.sub(r"[^a-z']", "", w.lower().replace("-", " ").split()[0]) if "-" not in w else w for w in disp]
words_for_align = []
for w in disp:
    for part in w.replace("-", " ").split():
        p = re.sub(r"[^a-z']", "", part.lower())
        if p: words_for_align.append(p)
d = Decoder(samprate=16000, loglevel="ERROR")
missing = [w for w in set(words_for_align) if d.lookup_word(w) is None]
print("missing from dict:", missing)
d.set_align_text(" ".join(words_for_align))
data = open(raw_path, "rb").read()
d.start_utt(); d.process_raw(data, full_utt=True); d.end_utt()
segs = [(s.word, s.start_frame / 100, (s.end_frame + 1) / 100) for s in d.seg()]
segs = [s for s in segs if s[0] not in ("<s>", "</s>", "<sil>", "(NULL)")]
print(len(segs), "aligned words of", len(words_for_align))
json.dump(segs, open(out_path, "w"), indent=0)
