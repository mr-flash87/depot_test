# Assane | Tech-IA — usine à vidéos TikTok

Format : motion design « explainer à cartes + avatar », 1080×1920, 30–45 s, voix off ElevenLabs (voix « Hugo – Punchy French Creator », `3Tp5mYhT9wrfnry9pzvV`, modèle `eleven_v4`).

## Pipeline quotidien
1. Recherche d'une actu tech/IA récente (≤ 7 jours), vérifier `topics.md` → sujet ET catégorie différents des jours précédents.
2. Script FR 90–115 mots : hook (≤ 3 s) → explication → chiffre/fait marquant → question + « abonne-toi ».
3. Voix off : `creative_generate_speech` (1 seule prise), télécharger en `episodes/<date>/voice.mp3`.
4. Timings : `creative_transcribe_audio` (connect_from = nœud audio) → words.json → `python3 engine/prep_words.py raw.json episodes/<date>/words.json`.
5. Écrire `episodes/<date>/episode.json` (scènes calées sur les timings des mots), aperçu : `node engine/render.js episodes/<date> --preview 2,10,20`.
6. Rendu : `node engine/render.js episodes/<date>` → MP4 + `caption.txt` (légende + hashtags).
7. Ajouter la ligne dans `topics.md`, commit + push.
