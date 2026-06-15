ssh -i "C:\Users\lucas\Desktop\MIAUUUUUUUU\ssh-key-2026-06-11.key" ubuntu@168.138.151.40

sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list >/dev/null
                            

~/.cloudflared/config.yml

tunnel: <ID-DO-TUNNEL-AQUI>
credentials-file: /root/.cloudflared/<ID-DO-TUNNEL>.json

ingress:
  # Frontend (Vite dev ou build estático)
  - hostname: casegprotege.seg.br
    service: http://localhost:5173

  # API Backend (Fastify)
  - hostname: api.casegprotege.seg.br
    service: http://localhost:3050
  
  # Fallback obrigatório
  - service: http_status:404