# Vídeo do Hero

Coloque aqui os arquivos gerados no Google Flow (ver `ROTEIRO_FLOW.md` na raiz):

- `hero.mp4` — vídeo dolly-in até o iPad (H.264, 1920×1080).
- `hero-poster.webp` — último frame (câmera parada).

Enquanto não existirem, a LP usa o fallback (`assets/img/hero-fallback.webp` + iPad em CSS).
Depois de adicionar `hero.mp4`, ajuste `CONFIG.ipad` em `main.js` para encaixar o overlay
(use `?calibrar` na URL). Se o scrub travar, re-encode com keyframe em todo frame (comando no roteiro).
