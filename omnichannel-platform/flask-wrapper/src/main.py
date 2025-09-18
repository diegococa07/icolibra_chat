#!/usr/bin/env python3
"""
Main entry point para Backend da Plataforma Omnichannel
"""

from app import app

if __name__ == '__main__':
    import os
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

