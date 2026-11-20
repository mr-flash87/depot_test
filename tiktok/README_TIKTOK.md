# Assane | Tech-IA — usine à vidéos TikTok

Format : motion design « explainer à cartes + avatar » au style de la vidéo de référence (fond clair quadrillé, cartes blanches néo-brutalistes bordure + ombre noire, bleu #2350F0 / violet #7B61FF, police Montserrat, sous-titres en haut mot par mot, avatar détouré `assets/avatar_cutout.png` qui se déplace via `"avatar": {"x","h"}` par scène). 1080×1920, 30–45 s, voix off ElevenLabs (voix « Hugo – Punchy French Creator », `3Tp5mYhT9wrfnry9pzvV`, modèle `eleven_v4`).

Composants dispo dans `engine/template.html` : `.tag`, `.title` (`.xl`), `.card`, `.chat` (bulles `.bub`/`.rep`), `.item` (+ `.n` numéro), `.tile` (+ `.x`), `.cc` (carte bancaire), `.btn`, `.sticker`, `.warn`, `.think`, icônes `<i data-icon="cart|finger|card|robot|store|shield|gift|warn|bell|comment|money|globe">`. Animations : `data-at` (apparition, `data-anim` pop|slide|drop, `data-rot`), `data-type` (texte tapé), `data-on` (surbrillance), `data-strike` (barré). Ancien style sombre : `"template": "template_dark.html"`.

## Pipeline quotidien
1. Recherche d'une actu tech/IA récente (≤ 7 jours), vérifier `topics.md` → sujet ET catégorie différents des jours précédents.
2. Script FR 90–115 mots : hook (≤ 3 s) → explication → chiffre/fait marquant → question + « abonne-toi ».
3. Voix off : `creative_generate_speech` (1 seule prise), télécharger en `episodes/<date>/voice.mp3`.
4. Timings : `creative_transcribe_audio` (connect_from = nœud audio) → words.json → `python3 engine/prep_words.py raw.json episodes/<date>/words.json`.
5. Écrire `episodes/<date>/episode.json` (scènes calées sur les timings des mots), aperçu : `node engine/render.js episodes/<date> --preview 2,10,20`.
6. Rendu : `node engine/render.js episodes/<date>` → MP4 + `caption.txt` : légende courte + **exactement 5 hashtags** (limite TikTok), à recopier aussi dans la réponse à Assane.
7. Ajouter la ligne dans `topics.md`, commit + push.
