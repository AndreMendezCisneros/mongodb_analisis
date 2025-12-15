"""
Servicio Flask para ejecutar análisis SATE-SR en Python
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from sate_analysis import ejecutar_analisis_sate
import os
import sys
import logging

# Configurar logging para Flask
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

app = Flask(__name__)
CORS(app)
app.logger.setLevel(logging.INFO)


@app.route('/health', methods=['GET'])
def health():
    """Endpoint de salud"""
    return jsonify({'status': 'ok', 'service': 'python-analysis'})


@app.route('/sate-analysis', methods=['POST'])
def sate_analysis():
    """Endpoint para ejecutar análisis SATE-SR"""
    try:
        data = request.get_json() or {}
        mongodb_uri = data.get('mongodb_uri') or os.getenv('MONGODB_URI')
        database_name = data.get('database_name') or os.getenv('MONGODB_DB_NAME', 'escuela_db')
        
        if not mongodb_uri:
            return jsonify({
                'success': False,
                'error': 'MONGODB_URI no proporcionada'
            }), 400
        
        # Ejecutar análisis
        app.logger.info('Iniciando análisis SATE-SR...')
        resultado = ejecutar_analisis_sate(mongodb_uri, database_name)
        
        # Log de factores de riesgo para debugging
        if 'factores_riesgo' in resultado:
            sentimiento = resultado['factores_riesgo'].get('sentimiento', {})
            app.logger.info(f'RESULTADO SENTIMIENTO: {sentimiento}')
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('PYTHON_SERVICE_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

