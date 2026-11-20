# Format « Dialogue tech » (référence fournie le 2026-11-19, ~100 s, 576×1024)

## Mécanique
- Mini-sketch entre 2 personnages : le **naïf** (hoodie, fier de lui, fait une erreur) et l'**expert** (lunettes, blasé, corrige).
- Structure : erreur du naïf → punchline de l'expert → méthode en N « couches » numérotées → chute comique → question CTA.
- Barre de progression en haut : onglets `1 · DISCRÉTION | 2 · PORTE | 3 · SERRURE | 4 · COFFRE`, l'onglet actif passe en violet.
- Sous-titres en haut, centrés, mot par mot (mot prononcé en violet). Titres de section : « Couche 2 : la **porte blindée** ».
- Visuels : fond crème quadrillé, accent violet, fenêtres de navigateur/terminal mockées (code qui se tape, `GET /admin 404`), touches de clavier, compte à rebours « LAISSEZ-PASSER 1:58 », gros « 404 », téléphone 2FA, coffre-fort, croix « X X X X X » (5 essais).
- Personnages en stickers cartoon (contour blanc) avec plusieurs expressions (fier, blasé, pointe du doigt, gros plan agacé, embarrassé). Petit portrait de l'expert dans un coin pendant les explications.

## Voix off (reconstituée depuis les sous-titres)
NAÏF : Rilay, regarde ! J'ai sécurisé mon admin : je l'ai renommé « admin-secret-123 » !
EXPERT : … Assieds-toi. Les robots qui testent des milliers d'adresses, tu crois qu'ils vont s'arrêter au mot « secret » ?
NAÏF : Bah… j'ai aussi enlevé le lien du menu.
EXPERT : Cacher la porte, c'est pas la fermer à clé. Bon. Moi, j'ai quatre couches. Note.
Couche 1 : la discrétion. Aucun lien. Pour ouvrir l'admin, je tape une combinaison secrète au clavier. Mauvaise combinaison ? Rien. Pas un message. Même pas dans la console.
NAÏF : Je mets la combinaison dans mon JavaScript !
EXPERT : Ton JavaScript, n'importe qui le lit ! Clic droit, code source, terminé ! Le navigateur envoie juste les touches. C'est le serveur qui vérifie. Si c'est bon : laissez-passer de deux minutes. Sinon, la page de connexion n'existe même pas.
NAÏF : Ah ouais…
EXPERT : Couche 2 : la porte blindée. Le .htaccess bloque tout accès direct à l'admin. Et pour entrer : double authentification.
NAÏF : Mais c'est relou, le code sur le téléphone…
EXPERT : Moins relou que de tout perdre un lundi matin.
Couche 3 : la serrure. Chaque page admin vérifie côté serveur qui tu es. Cinq essais ratés ? Le serveur te fait patienter.
NAÏF : Tranquille, et mes clés sont bien rangées dans mon .env.
EXPERT : Couche 4 : le coffre-fort. Mes clés secrètes sont dans un coffre distant et chiffré, comme Infisical ou HashiCorp Vault. Pas dans un fichier qui traîne.
NAÏF : Euh… je peux t'envoyer mon projet pour que tu regardes ?
EXPERT : Envoie…
CTA : Et vous, vous protégez votre admin comment ?

## Adaptation pour Assane | Tech-IA
- Garder 2 voix ElevenLabs distinctes (une par personnage), même flow ; assembler les répliques bout à bout.
- Durée : viser 45–60 s (le format sketch a besoin d'un peu plus que 30 s).
- Sujet tech utile + « méthode en N étapes », jamais le même thème que la référence (sécurité d'admin déjà vu).

## Personnages (fournis par Assane le 2026-11-19)
- **Le naïf** : veste noire + t-shirt blanc → `assets/avatar_cutout.png` (photo source `assets/avatar.png`), coupé mi-cuisse : à placer en bas de l'écran.
- **L'expert** : chemise bleu marine + pantalon beige, doigt levé (« Note. ») → `assets/perso_bleu_cutout.png` (source `assets/perso_bleu.png`), en pied.
- Les deux personnages se répondent : celui qui parle est au premier plan (plus grand, net), l'autre se réduit/s'estompe sur le côté. Gros plan (zoom sur le visage) pour les punchlines.
- 2 voix ElevenLabs différentes (à choisir via creative_list_voices, fr, male, young) : naïf = voix enjouée/naïve, expert = voix posée/blasée. Garder les mêmes voix d'un épisode à l'autre une fois choisies (noter les voice_id ici).

## Implémentation (moteur)
- Gabarit : `"template": "template_dialogue.html"` (fond crème, violet #7C3AED, onglets d'étapes `steps:[{label,start}]`).
- `characters: {naif:{img,label}, expert:{img,label}}`, `lines:[{who,start,end,text}]` (celui qui parle a son étiquette + rebond), chaque scène a `cast:{naif:{x,h,o}, expert:{x,h,o}}` (interpolé). Mettre x≈1300 pour sortir un perso du cadre.
- Voix retenues : naïf = `qGwq3bbZd3aOEpsBcuc6` (David, accent ivoirien), expert = `mQS95w8LbLFsF6QihxDH` (Dave - Narrateur Pro). Modèle eleven_v4, 1 prise par réplique.
- Assemblage : une génération par réplique, puis script d'assemblage (trim silences, 0,28 s entre répliques, timings des mots par segments de parole) — voir episodes/2026-11-20 (lines.json, words.json).
- Attention aux chevauchements : avec 3 cartes `.item` + titre, garder l'expert ≤ 800 px de haut.
