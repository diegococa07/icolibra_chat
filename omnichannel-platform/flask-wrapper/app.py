#!/usr/bin/env python3
"""
Flask Wrapper para Backend Node.js da Plataforma Omnichannel
Este wrapper permite implantar o backend Node.js usando o sistema Flask do Manus
"""

import os
import subprocess
import signal
import sys
from flask import Flask, request, Response
import requests
import threading
import time

app = Flask(__name__)

# Configurações
NODE_PORT = 3003
NODE_PROCESS = None

def start_node_server():
    """Inicia o servidor Node.js"""
    global NODE_PROCESS
    try:
        # Mudar para o diretório do projeto Node.js
        os.chdir('/home/ubuntu/omnichannel-platform')
        
        # Definir variáveis de ambiente
        env = os.environ.copy()
        env['PORT'] = str(NODE_PORT)
        env['NODE_ENV'] = 'production'
        
        # Iniciar servidor Node.js
        NODE_PROCESS = subprocess.Popen([
            'npx', 'ts-node', '--transpile-only', 'src/index.ts'
        ], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        print(f"✅ Servidor Node.js iniciado na porta {NODE_PORT}")
        return True
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor Node.js: {e}")
        return False

def stop_node_server():
    """Para o servidor Node.js"""
    global NODE_PROCESS
    if NODE_PROCESS:
        NODE_PROCESS.terminate()
        NODE_PROCESS.wait()
        print("🛑 Servidor Node.js parado")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def proxy(path):
    """Proxy todas as requisições para o servidor Node.js"""
    try:
        # URL do servidor Node.js
        url = f'http://localhost:{NODE_PORT}/{path}'
        
        # Preparar headers
        headers = dict(request.headers)
        headers.pop('Host', None)  # Remove host header para evitar conflitos
        
        # Preparar dados da requisição
        data = request.get_data()
        params = request.args
        
        # Fazer requisição para o servidor Node.js
        response = requests.request(
            method=request.method,
            url=url,
            headers=headers,
            data=data,
            params=params,
            allow_redirects=False,
            timeout=30
        )
        
        # Preparar resposta
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [(name, value) for (name, value) in response.headers.items()
                  if name.lower() not in excluded_headers]
        
        return Response(response.content, response.status_code, headers)
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro no proxy: {e}")
        return {"error": "Backend Node.js não disponível"}, 503
    except Exception as e:
        print(f"❌ Erro interno: {e}")
        return {"error": "Erro interno do servidor"}, 500

@app.route('/health')
def health():
    """Health check do wrapper Flask"""
    try:
        # Testar se o servidor Node.js está respondendo
        response = requests.get(f'http://localhost:{NODE_PORT}/health', timeout=5)
        if response.status_code == 200:
            return {"status": "healthy", "backend": "online"}, 200
        else:
            return {"status": "unhealthy", "backend": "error"}, 503
    except:
        return {"status": "unhealthy", "backend": "offline"}, 503

def signal_handler(sig, frame):
    """Handler para sinais de sistema"""
    print('🛑 Parando serviços...')
    stop_node_server()
    sys.exit(0)

if __name__ == '__main__':
    # Registrar handler para sinais
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("🚀 Iniciando Plataforma Omnichannel...")
    
    # Iniciar servidor Node.js
    if start_node_server():
        # Aguardar servidor Node.js inicializar
        time.sleep(5)
        
        # Iniciar wrapper Flask
        port = int(os.environ.get('PORT', 5000))
        print(f"🌐 Wrapper Flask iniciado na porta {port}")
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        print("❌ Falha ao iniciar servidor Node.js")
        sys.exit(1)

