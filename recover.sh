#!/bin/bash

echo "🔄 Iniciando processo de recuperação profunda (Deep Recover)..."

# Solicita a senha do sudo no início para evitar falhas silenciosas
if ! sudo -n true 2>/dev/null; then
    echo "⚠️  Este script requer privilégios de administrador para resolver conflitos de AppArmor no Docker e timeouts de rede do Banco de Dados."
    echo "Por favor, digite sua senha:"
    sudo -v
fi

# 1. Matar processos "zumbis" do Docker na força bruta
echo "🛠️ Detectando contêineres travados no daemon (permission denied / timeouts)..."
# Usamos filter name para não afetar outros projetos docker rodando na máquina
PIDS=$(sudo docker ps -a --filter "name=simumes" -q | xargs -r sudo docker inspect --format '{{.State.Pid}}' 2>/dev/null)

if [ ! -z "$PIDS" ] && [ "$PIDS" != "0" ]; then
    echo "Matando PIDs dos contêineres travados: $PIDS"
    sudo kill -9 $PIDS 2>/dev/null || true
    sleep 2
else
    echo "Nenhum contêiner travado detectado na inspeção de processos."
fi

# 2. Forçar a remoção dos contêineres e recriar
echo "🐳 Recriando ecossistema e limpando redes do Docker Compose..."
cd "$(dirname "$0")" # Garante que estamos na raiz do projeto

# Remove containers antigos forçadamente (resolve os timeouts de rede corrompida)
sudo docker compose rm -fsv || true

# Sobe os containers novamente de forma limpa
docker compose up -d

# 3. Limpar cache e reinstalar frontend
echo "🧹 Limpando dependências em cache do frontend..."
cd frontend
rm -rf node_modules package-lock.json dist .vite
npm cache clean --force

echo "📦 Instalando dependências..."
npm install

echo "🚀 Iniciando ambiente de desenvolvimento..."
npm run dev
