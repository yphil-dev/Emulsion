# Bienvenue à la bêta d’Emulsion 🚀

Bonjour à toute l'équipe !

Vous êtes officielement invité à tester Emulsion, mon dernier projet heu, extra-curicullaire. Si ça vous dit, suivez les étapes ci-dessous.

## Rejoindre le dépôt
Je vous ai envoyé une invitation GitHub – vérifiez votre email ou votre boîte de notifications GitHub: https://github.com/notifications et cliquez sur "Voir l’invitation" pour l'accepter.

##  Guide de la bêta

### Contexte
Emulsion

- Unifie tous vos émulateurs dans une interface unique
- Permet de sélectionner précisément l'image / cover art de chaque jeu parmi un grand choix de backends.

Et ces deux points le démarquent de ses concurrents (Retropie / Emulation station et Launch Box / Batocera, oui, c'est tout pour le moment AFAIK) qui sont (tous) des mastodontes / usines à gaz qui

- Gèrent les émulateurs (Emulsion ne fait *pas* ça) dans une liste *finie* de ce qu'ils ont pu intégrer, et un coup ça marche un coup ça marche pas (ce dernier point est surtout marketing - ça veut dire mensonger - car honnètement c'est plutôt stable) ;
- Controlent la config / calibration du game controller (et l'oublient régulièrement) - Emulsion ne fait *pas* ça ;
- Si ils gèrent le DL des images (dans Retropie c'est externe / bizzare, ou alors interne avec un seul backend, read on) le font en mode "unattended" et donc ne permetttent pas une sélection précise de l'image, sans parler du choix des sources, qui est toujours le même ie [dreamcast: tel backend: tel image pour tel jeu] et pas de possibilité d'interaction / choix précis de l'image parmi plusieurs. Emulsion ne fait *pas* comme ça.

Téléchargez la dernière version ici : https://github.com/yphil-gh/emulsion/releases/latest

### Points clés à tester
Merci de tester les *builds*.

- Installation (ça s'installe ?) / Lancement (ça se lance ?) particulièrement la version Windows, que je n'ai testé que sous Wine et donc presque pas testé car je suis pas allé jusqu'à installer des *émulateurs* dans *Wine* (Wine Is Not an Emulator) 🤪 je suis donc très curieux (et un peu anxieux) de retours d'expérience sous Windows ;
- Gamepad. Point critique (je n'ai testé qu'avec un (wireless) Dualshock4 et un (wired, old and defective) Dualshock2, both chinese knockoffs) mais je fais confiance à l'API Chromium (raison N°2 pour laquelle Emulsion est en Electron) pour gérer tout ça sans PB. Still, merci de m'indiquer votre type de manette ;
- Chargement des images – affichage des images, placeholder "No cover found", etc. Particulièrement dans de mauvaises conditions Internet ;
- Clés API des backends - est-ce que ça marche sans ? - est-ce que ça marche avec ?
- Lancement des émulateurs – chemin correct, arguments (`--fullscreen`, etc.) ;
- Killage de l'émulateur / jeu avec Ctrl+Shift+K ;
- Stabilité & erreurs – plantages, erreurs dans la console (c'est un chromium, donc Ctrl+Shift+I marche mais oups j'ai oublié elle est disabled pour les packages, je vais la remettre le temps de la beta) ;
- Interface & navigation – réactivité, changement de thème ;
- Intuitivité : Est-ce facile à piger ? Est-on perdu sans doc sans rien ? Ce point est bien sur très important, donc montrez donc ça à vos enfants et (test ultime) à vos parents.
- Control: tout doit marcher avec
  - Gamepad
  - Keyboard
  - Mouse - attention, délicat. tout est sur le même plan, uniquement séparé par du z-index. Cliquez partout, et ça VA merder. Spécifiquement, ça va lancer des trucs alors qu'on voulait pas. Merci de noter et reporter de qui se passe, la gestoin de la souris est crutiale, well, je sais même pas pkoi je dis ça.
- Rapport coolitude / annoyance général ;
- Anything, really. Look & feel: Est-ce que le logo va bien, est-ce mes thèmes sont tout nazes (moi je m'en fous des thèmes, ça marche pour moi) etc.

### Points spécifiques
- Enablez / Disablez des plateformes. Ça a été assez délicat à blinder, et même actuellement je ne suis pas satisfait de la "solution": les index des plateformes sont en dur.
- Actuellement les (file) extensions possibles pour chaque machine / plateforme sont hard-codées, donc les mêmes pour l'émulateur de cette plateforme. C'est un point assez sensible (et c pas documenté par exemple pour X-Box ça ne marche qu'avec des .xiso.iso avec le seul émulateur dispo actuellement, bref), dont je réfléchis encore à la meilleure façon de le régler, si vous avez des idées merci.
- Checker l'usage mémoire aussi, et aussi regarder si Emulsion quitte proprement et ne laisse pas de saletés.

### Comment installer ce qui faut
J'ai écrit un "guide" (hum) des émulateurs dans le wiki, ah mais zut il est dans GitLab le wiki... Hum. Je vais voir ça ; bon finalement pas de Wiki pour le moment (il faut être dans un plan payant pour créer un Wiki dans un private repo GH). Donc j'ai misa ça dans le README ; donc ; l'idée est de

- Installer un ou +sieurs émulateurs
- Télécharger quelques jeux
- Configurer au moins une plateforme / machine (j'arrrive pas à me décider pour un terme, ça craint c'est encore un truc pour lequel j'ai besoin d'aide: les choses sont-elles bien nommées ?)
- Lancer au moins un jeu

Vimm's lair (ah et CDRomance aussi apparemment) vient de ré-ouvir - c'est pas moi qui vous l'ai dit - et permet de DL des jeux pour la plupart des plateformes - et les jeux PCEngine, SMS, NES, Megadrive ou même Saturn sont très légers - pour tester.

Phew, je reconnais que c'est un *pretty involving* beta test, donc ça va durer un moment pour vous premettre de mettre votre vie en pause afin de travailler pour moi gratos ;)

Merci (non, sérieusement) pour votre aide et bon Week-End ! 🎉
