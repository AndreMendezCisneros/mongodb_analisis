"""
SATE-SR v2.0: Sistema de Alerta Temprana Educativa San Ramón
Modelo Híbrido de Analítica Predictiva + Validación Estadística
Implementado en Python
"""

from typing import Dict, List, Any, Optional
from pymongo import MongoClient
from datetime import datetime
import re
import math
import logging
# Configurar codificación UTF-8 para Windows
import sys
import io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Configurar logging para que Flask muestre los mensajes
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Importaciones opcionales - si scikit-learn no está disponible, usar implementación manual
try:
    from sklearn.metrics import (
        precision_score, recall_score, f1_score, 
        roc_auc_score, confusion_matrix
    )
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    print("[INFO] scikit-learn no disponible, usando implementacion manual de metricas")

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    print("[INFO] numpy no disponible, usando implementacion manual")

# Importación opcional de pysentimiento para análisis de sentimiento avanzado
HAS_PYSENTIMIENTO = False
sentiment_analyzer = None
try:
    from pysentimiento import create_analyzer
    HAS_PYSENTIMIENTO = True
    print("[INFO] pysentimiento disponible, inicializando analizador de sentimientos...")
    try:
        sentiment_analyzer = create_analyzer(task="sentiment", lang="es")
        print("[OK] Analizador de sentimientos pysentimiento inicializado correctamente")
    except Exception as e:
        print(f"[ADVERTENCIA] Error inicializando pysentimiento: {e}")
        print("[INFO] Usando analizador manual de sentimientos como fallback")
        HAS_PYSENTIMIENTO = False
        sentiment_analyzer = None
except ImportError:
    print("[INFO] pysentimiento no disponible, usando analizador manual de sentimientos")
    print("[INFO] Para mejor precisión, instala: py -m pip install pysentimiento torch transformers")

MODEL_CONFIG = {
    "version": "2.0.0",
    "conversion_notas": {
        'C': 5,   # En Inicio
        'B': 13,  # En Proceso
        'A': 16,  # Logro Esperado
        'AD': 19  # Logro Destacado
    },
    "umbral_aprobacion": 12,
    "umbral_faltas_critico": 30,  # Porcentaje
    "pesos_penalizacion": {
        "asistencia": 1.0,
        "incidencias": 1.0,
        "sentimiento": 1.0,
        "familia": 1.0
    },
    "max_proyeccion_cambio": 4,
    "nota_escala": [5, 20]
}


def convertir_calificacion(valor: Any) -> Optional[int]:
    """Convierte calificación cualitativa a numérica"""
    if not valor or valor is None:
        return None
    
    val_upper = str(valor).strip().upper()
    return MODEL_CONFIG["conversion_notas"].get(val_upper)


def normalizar_dni(doc: Dict) -> Optional[str]:
    """Normaliza columnas DNI con diferentes nombres"""
    if 'DNI' in doc:
        return str(doc['DNI']).strip()
    if 'Nº' in doc:
        return str(doc['Nº']).strip()
    if 'dni' in doc:
        return str(doc['dni']).strip()
    return None


def normalizar_nombres(doc: Dict) -> str:
    """Normaliza columnas de nombres de estudiantes"""
    posibles_nombres = [
        'Apellidos_Nombres',
        'APELLIDOS_Y_NOMBRES',
        'ALUMNOS/AS',
        'Nombre y Apellido',
        'nombre_completo',
        'Apellidos Nombres',
        'NOMBRE_COMPLETO'
    ]
    
    for nombre_col in posibles_nombres:
        if nombre_col in doc and doc[nombre_col]:
            valor = str(doc[nombre_col]).strip()
            if valor:
                return valor
    
    # Buscar columnas que contengan 'apellido' o 'nombre'
    for key in doc.keys():
        key_lower = key.lower()
        if ('apellido' in key_lower or 'nombre' in key_lower) and \
           key.upper() != 'DNI' and key != 'Nº' and key != '_id':
            valor = str(doc[key]).strip()
            if valor:
                return valor
    
    return ''


def analizar_sentimiento_espanol(texto: Any) -> int:
    """
    Analiza sentimiento en español usando pysentimiento si está disponible,
    sino usa análisis manual basado en palabras clave.
    
    Retorna:
        1 = Sentimiento positivo o neutro (sin riesgo)
        0 = Sentimiento negativo (con riesgo)
    """
    if not texto or str(texto).strip() == '':
        return 1  # Ausencia = Positivo por defecto
    
    texto_limpio = str(texto).strip()
    
    # Casos especiales que son neutrales/positivos
    casos_neutros = [
        'nada', '.', '', 'ninguno', 'ninguna', 'n/a', 
        'sin comentarios', 'sin comentario', 'no hay', 
        'ningún', 'ninguna observación'
    ]
    if texto_limpio.lower() in casos_neutros:
        return 1  # Neutro = sin riesgo
    
    # Usar pysentimiento si está disponible (más preciso)
    if HAS_PYSENTIMIENTO and sentiment_analyzer is not None:
        try:
            resultado = sentiment_analyzer.predict(texto_limpio)
            sentimiento = resultado.output
            # pysentimiento retorna: 'POS', 'NEU', 'NEG'
            return 1 if sentimiento in ['POS', 'NEU'] else 0
        except Exception as e:
            logger.warning(f'Error usando pysentimiento, usando método manual: {e}')
            # Continuar con método manual si falla
    
    # Método manual (fallback o si pysentimiento no está disponible)
    texto_limpio_lower = texto_limpio.lower()
    
    # Palabras negativas comunes en español (expandida)
    # Palabras negativas FUERTES (peso 2) - indican claramente sentimiento negativo
    palabras_negativas_fuertes = [
        'no me gusta', 'no me gustó', 'odio', 'odiar', 'terrible', 'horrible',
        'aburrido', 'aburrida', 'aburran', 'aburren', 'monótona', 'monótono',
        'triste', 'tristeza', 'enojado', 'enojada', 'preocupado', 'preocupada',
        'cansado', 'cansada', 'estresado', 'estresada', 'molesto', 'molesta',
        'frustrado', 'frustrada', 'desanimado', 'desanimada', 'preocupante',
        'injusto', 'injusta', 'maltrato', 'violencia', 'peleas', 'pelea',
        'conflicto', 'conflictos', 'agresión', 'agresiones', 'miedo', 'temor',
        'ansiedad', 'nervioso', 'nerviosa', 'inseguro', 'insegura', 'solo', 'sola',
        'solitario', 'solitario', 'abandonado', 'abandonada', 'discriminar',
        'discriminación', 'bullying', 'acoso', 'burla', 'burlas', 'desfasados',
        'desfasadas', 'desactualizado', 'desactualizada'
    ]
    
    # Palabras negativas REGULARES (peso 1)
    palabras_negativas = [
        'mal', 'malo', 'mala', 'problema', 'problemas', 'difícil', 'dificil',
        'preocupación'
    ]
    
    # Palabras positivas comunes en español (expandida)
    palabras_positivas = [
        'bien', 'bueno', 'buena', 'excelente', 'genial', 'me gusta', 'me gustó',
        'feliz', 'contento', 'contenta', 'satisfecho', 'satisfecha', 'agradecido',
        'agradecida', 'perfecto', 'perfecta', 'maravilloso', 'maravillosa',
        'mejor', 'mejora', 'mejorado', 'mejorada', 'progreso', 'avance', 'avances',
        'apoyo', 'ayuda', 'compañerismo', 'amistad', 'respeto', 'tranquilo', 'tranquila',
        'motivado', 'motivada', 'entusiasmado', 'entusiasmada', 'orgulloso', 'orgullosa',
        'alegre', 'alegría', 'divertido', 'divertida', 'emocionado', 'emocionada',
        'esperanza', 'optimista', 'confianza', 'seguro', 'segura', 'cómodo', 'cómoda'
    ]
    
    # Contar ocurrencias (usar regex para palabras completas)
    # Palabras negativas fuertes tienen peso 2
    negativas_fuertes = sum(len(re.findall(rf'\b{re.escape(palabra)}\b', texto_limpio_lower)) 
                           for palabra in palabras_negativas_fuertes) * 2
    # Palabras negativas regulares tienen peso 1
    negativas_regulares = sum(len(re.findall(rf'\b{re.escape(palabra)}\b', texto_limpio_lower)) 
                             for palabra in palabras_negativas)
    
    negativas = negativas_fuertes + negativas_regulares
    positivas = sum(len(re.findall(rf'\b{re.escape(palabra)}\b', texto_limpio_lower)) 
                    for palabra in palabras_positivas)
    
    # Debug: si encontramos palabras negativas, loguear
    if negativas > 0:
        logger.debug(f'Texto analizado manualmente ({negativas} neg, {positivas} pos): {texto_limpio[:100]}')
    
    # Lógica mejorada:
    # 1. Si hay palabras negativas fuertes (peso 2), es más probable que sea negativo
    # 2. Si hay más palabras negativas que positivas (considerando pesos), es negativo
    # 3. Si hay al menos una palabra negativa fuerte y ninguna positiva, es negativo
    if negativas_fuertes > 0 and positivas == 0:
        return 0  # Claramente negativo (tiene palabras negativas fuertes y ninguna positiva)
    
    # Si hay palabras negativas fuertes, ser más estricto
    if negativas_fuertes > 0:
        # Si las negativas (con peso) superan a las positivas, es negativo
        if negativas > positivas:
            return 0
        # Si hay palabras negativas fuertes pero también positivas, considerar el contexto
        # Si hay más negativas fuertes que positivas, es negativo
        if negativas_fuertes / 2 > positivas:
            return 0
    
    # Lógica estándar: si hay más negativas que positivas, es negativo
    resultado = 0 if negativas > positivas else 1
    
    # Debug adicional para textos que deberían ser negativos pero no lo son
    if negativas > 0 and resultado == 1:
        logger.debug(f'ADVERTENCIA: Texto con {negativas} negativas pero marcado como positivo: {texto_limpio[:100]}')
    
    return resultado


def proyectar_nota_robusta(fila: Dict, config: Dict = MODEL_CONFIG) -> float:
    """Proyección robusta de nota con detección de outliers"""
    notas = [fila.get('NotaBim1', 5), fila.get('NotaBim2', 5), fila.get('NotaBim3', 5)]
    
    # Validar rango válido de notas
    nota_min, nota_max = config["nota_escala"]
    notas_validadas = [max(nota_min, min(nota_max, n)) for n in notas]
    
    # Detectar outliers con Z-score
    if HAS_NUMPY:
        media = np.mean(notas_validadas)
        desviacion = np.std(notas_validadas) if len(notas_validadas) > 1 else 1.0
    else:
        # Implementación manual sin numpy
        media = sum(notas_validadas) / len(notas_validadas)
        variance = sum((x - media) ** 2 for x in notas_validadas) / len(notas_validadas)
        desviacion = math.sqrt(variance) if variance > 0 else 1.0
    
    z_scores = [abs((n - media) / (desviacion if desviacion > 0 else 1)) for n in notas_validadas]
    tiene_outlier = any(z > 2 for z in z_scores)
    
    if tiene_outlier:
        # Si hay outlier, calcular cambio promedio simple
        cambio = (notas_validadas[2] - notas_validadas[0]) / 2
        proyeccion_b4 = notas_validadas[2] + cambio
    else:
        # Regresión lineal estándar: y = mx + b
        # x = [1, 2, 3], y = notas
        n = 3
        sum_x = 6  # 1 + 2 + 3
        sum_y = sum(notas_validadas)
        sum_xy = notas_validadas[0] * 1 + notas_validadas[1] * 2 + notas_validadas[2] * 3
        sum_x2 = 14  # 1² + 2² + 3²
        
        m = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
        b = (sum_y - m * sum_x) / n
        
        proyeccion_b4 = m * 4 + b
    
    # Límite: No puede cambiar más de ±4 puntos respecto a Bim3
    max_cambio = config["max_proyeccion_cambio"]
    proyeccion_b4 = max(
        notas_validadas[2] - max_cambio,
        min(notas_validadas[2] + max_cambio, proyeccion_b4)
    )
    
    # PENALIZACIÓN POR FACTORES DE RIESGO
    pesos = config["pesos_penalizacion"]
    castigo = (
        (1 - fila.get('Analisis_Asistencia', 1)) * pesos["asistencia"] +
        (1 - fila.get('Analisis_Incidencias', 1)) * pesos["incidencias"] +
        (1 - fila.get('Analisis_Sentimiento_Estudiante', 1)) * pesos["sentimiento"] +
        (1 - fila.get('Analisis_Situacion_Familiar', 1)) * pesos["familia"]
    )
    
    nota_final = proyeccion_b4 - castigo
    
    # Garantizar rango válido final
    return max(nota_min, min(nota_max, nota_final))


def clasificar_resultado(nota: float, umbral: float = MODEL_CONFIG["umbral_aprobacion"]) -> int:
    """Clasifica resultado: APRUEBA (1) vs DESAPRUEBA (0)"""
    return 1 if nota >= umbral else 0


def calcular_metricas(y_true: List[int], y_pred: List[int], y_scores: Optional[List[float]] = None) -> Dict:
    """
    Calcula métricas de validación del modelo
    
    Args:
        y_true: Valores reales (binarios: 0 o 1)
        y_pred: Predicciones binarias (0 o 1)
        y_scores: Scores continuos para calcular AUC-ROC (opcional, si no se proporciona usa y_pred)
                  Usar notas proyectadas como scores mejora significativamente el AUC-ROC
    """
    if len(y_true) == 0 or len(y_pred) == 0:
        return {
            "precision": 0.0,
            "recall": 0.0,
            "f1_score": 0.0,
            "auc_roc": 0.5,
            "matriz_confusion": {
                "verdaderos_positivos": 0,
                "falsos_positivos": 0,
                "verdaderos_negativos": 0,
                "falsos_negativos": 0
            }
        }
    
    # Calcular matriz de confusión manualmente
    tp = fp = tn = fn = 0
    for i in range(len(y_true)):
        if y_true[i] == 1 and y_pred[i] == 1:
            tp += 1
        elif y_true[i] == 0 and y_pred[i] == 1:
            fp += 1
        elif y_true[i] == 0 and y_pred[i] == 0:
            tn += 1
        elif y_true[i] == 1 and y_pred[i] == 0:
            fn += 1
    
    # Calcular métricas manualmente
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    
    # AUC-ROC: Usar scores continuos si están disponibles (MUCHO MÁS PRECISO)
    if y_scores is not None and len(y_scores) == len(y_true):
        # Usar scores continuos para un cálculo mucho más preciso del AUC-ROC
        if HAS_SKLEARN:
            try:
                auc_roc = roc_auc_score(y_true, y_scores)
                logger.info(f'AUC-ROC calculado con scores continuos (sklearn): {auc_roc:.4f}')
            except (ValueError, Exception) as e:
                logger.warning(f'Error calculando AUC-ROC con sklearn, usando método manual: {e}')
                auc_roc = calcular_auc_roc_manual_con_scores(y_true, y_scores)
        else:
            auc_roc = calcular_auc_roc_manual_con_scores(y_true, y_scores)
            logger.info(f'AUC-ROC calculado con scores continuos (manual): {auc_roc:.4f}')
    else:
        # Fallback: usar predicciones binarias (menos preciso, pero funciona)
        if HAS_SKLEARN:
            try:
                # sklearn puede calcular AUC-ROC con predicciones binarias, pero es menos preciso
                auc_roc = roc_auc_score(y_true, y_pred)
                logger.warning('AUC-ROC calculado con predicciones binarias (menos preciso). Usa y_scores para mejor precisión.')
            except ValueError:
                auc_roc = calcular_auc_roc_manual(y_true, y_pred)
        else:
            auc_roc = calcular_auc_roc_manual(y_true, y_pred)
    
    return {
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "auc_roc": float(auc_roc),
        "matriz_confusion": {
            "verdaderos_positivos": int(tp),
            "falsos_positivos": int(fp),
            "verdaderos_negativos": int(tn),
            "falsos_negativos": int(fn)
        }
    }


def calcular_auc_roc_manual_con_scores(y_true: List[int], y_scores: List[float]) -> float:
    """
    Calcula AUC-ROC manualmente usando scores continuos (MÁS PRECISO)
    
    Este método es mucho más preciso que usar predicciones binarias porque
    considera la "confianza" del modelo (nota proyectada) en lugar de solo
    la clasificación final (aprueba/desaprueba).
    """
    if len(y_true) == 0 or len(y_scores) == 0:
        return 0.5
    
    positivos_reales = sum(1 for y in y_true if y == 1)
    negativos_reales = sum(1 for y in y_true if y == 0)
    
    if positivos_reales == 0 or negativos_reales == 0:
        return 0.5
    
    # Crear pares (real, score)
    pares = [(y_true[i], y_scores[i]) for i in range(len(y_true))]
    
    # Contar pares correctamente ordenados
    pares_correctos = 0
    total_pares = 0
    
    for i in range(len(pares)):
        for j in range(i + 1, len(pares)):
            # Solo comparar pares donde las clases reales son diferentes
            if pares[i][0] != pares[j][0]:
                total_pares += 1
                # Verificar si el orden predicho es correcto
                # Si el positivo real tiene score mayor que el negativo real, está bien ordenado
                if ((pares[i][0] > pares[j][0] and pares[i][1] > pares[j][1]) or
                    (pares[i][0] < pares[j][0] and pares[i][1] < pares[j][1])):
                    pares_correctos += 1
                # Si tienen el mismo score, contar como medio correcto (tie)
                elif pares[i][1] == pares[j][1]:
                    pares_correctos += 0.5
    
    return pares_correctos / total_pares if total_pares > 0 else 0.5


def calcular_auc_roc_manual(y_true: List[int], y_pred: List[int]) -> float:
    """Calcula AUC-ROC manualmente usando el método de pares (con predicciones binarias)"""
    if len(y_true) == 0 or len(y_pred) == 0:
        return 0.5
    
    positivos_reales = sum(1 for y in y_true if y == 1)
    negativos_reales = sum(1 for y in y_true if y == 0)
    
    if positivos_reales == 0 or negativos_reales == 0:
        return 0.5
    
    # Crear pares (real, predicho)
    pares = [(y_true[i], y_pred[i]) for i in range(len(y_true))]
    
    # Contar pares correctamente ordenados
    pares_correctos = 0
    total_pares = 0
    
    for i in range(len(pares)):
        for j in range(i + 1, len(pares)):
            # Solo comparar pares donde las clases reales son diferentes
            if pares[i][0] != pares[j][0]:
                total_pares += 1
                # Verificar si el orden predicho es correcto
                if ((pares[i][0] > pares[j][0] and pares[i][1] >= pares[j][1]) or
                    (pares[i][0] < pares[j][0] and pares[i][1] <= pares[j][1])):
                    pares_correctos += 1
    
    return pares_correctos / total_pares if total_pares > 0 else 0.5


def ejecutar_analisis_sate(mongodb_uri: str, database_name: str) -> Dict:
    """
    Función principal: Ejecuta el análisis SATE-SR completo
    """
    print('[INFO] Iniciando analisis SATE-SR v2.0 (Python)...')
    
    # Conectar a MongoDB
    client = MongoClient(mongodb_uri)
    db = client[database_name]
    
    try:
        # ============================================
        # FASE ETL: EXTRACCIÓN Y TRANSFORMACIÓN
        # ============================================
        
        # 1. ASISTENCIAS
        print('[1/6] Procesando datos de Asistencia...')
        col_asistencias = db['asistencia']
        docs_asistencias = list(col_asistencias.find({}).sort('_id', 1))
        
        asistencia_map = {}
        for doc in docs_asistencias:
            dni = normalizar_dni(doc)
            nombres = normalizar_nombres(doc)
            if not dni or not dni.strip():
                continue
            
            # Identificar columnas de días
            fixed_cols = ['DNI', 'Apellidos_Nombres', 'APELLIDOS_Y_NOMBRES', 
                         'ALUMNOS/AS', 'SECCIÓN', 'GRADO', 'Seccion', 'Grado', '_id']
            day_cols = [k for k in doc.keys() if k not in fixed_cols and k != 'dni' and k != 'Nº']
            
            # Calcular asistencias y faltas
            asistencias = sum(1 for col in day_cols if doc.get(col) == 1)
            faltas = sum(1 for col in day_cols if doc.get(col) in [0, 2])
            
            key = f"{dni}_{nombres}"
            if key not in asistencia_map:
                asistencia_map[key] = {
                    'DNI': dni,
                    'Apellidos_Nombres': nombres,
                    'Seccion': doc.get('SECCIÓN') or doc.get('Seccion', ''),
                    'Grado': doc.get('GRADO') or doc.get('Grado', ''),
                    'cantidad_asistencias': 0,
                    'cantidad_faltas': 0
                }
            
            asistencia_map[key]['cantidad_asistencias'] += asistencias
            asistencia_map[key]['cantidad_faltas'] += faltas
        
        df_asistencias_final = []
        for reg in asistencia_map.values():
            total_dias = reg['cantidad_asistencias'] + reg['cantidad_faltas']
            porcentaje_faltas = (reg['cantidad_faltas'] / total_dias * 100) if total_dias > 0 else 0
            umbral_faltas = MODEL_CONFIG["umbral_faltas_critico"]
            
            df_asistencias_final.append({
                'DNI': reg['DNI'],
                'Apellidos_Nombres': reg['Apellidos_Nombres'],
                'Seccion': reg['Seccion'],
                'Grado': reg['Grado'],
                'Analisis_Asistencia': 0 if porcentaje_faltas >= umbral_faltas else 1
            })
        
        print(f'   [OK] Asistencias procesadas: {len(df_asistencias_final)} registros')
        
        # 2. NÓMINA (Situación Familiar)
        print('[2/6] Procesando datos de Nómina...')
        col_nomina = db['nomina']
        docs_nomina = list(col_nomina.find({}).sort('_id', 1))
        
        df_nomina_final = []
        for doc in docs_nomina:
            dni = normalizar_dni(doc)
            nombres = normalizar_nombres(doc)
            if not dni:
                continue
            
            analisis_padre_vive = 1 if str(doc.get('padre_vive', '')).strip().upper() == 'SI' else -1
            analisis_madre_vive = 1 if str(doc.get('madre_vive', '')).strip().upper() == 'SI' else -1
            analisis_trabaja_estudiante = -1 if str(doc.get('trabaja_estudiante', '')).strip().upper() == 'SI' else 1
            analisis_tipo_discapacidad = 1 if not doc.get('tipo_discapacidad') or str(doc.get('tipo_discapacidad', '')).strip() == '' else -2
            
            situacion_mat = str(doc.get('situacion_matricula', '')).strip().upper()
            analisis_situacion_matricula = 0
            if situacion_mat == 'P':
                analisis_situacion_matricula = 1
            elif situacion_mat == 'PG':
                analisis_situacion_matricula = -1
            
            puntaje_total = (analisis_padre_vive + analisis_madre_vive + 
                           analisis_trabaja_estudiante + analisis_tipo_discapacidad + 
                           analisis_situacion_matricula)
            
            df_nomina_final.append({
                'DNI': dni,
                'Apellidos_Nombres': nombres,
                'Genero': doc.get('sexo', ''),
                'Analisis_Situacion_Familiar': 1 if puntaje_total >= 4 else 0
            })
        
        print(f'   [OK] Nomina procesada: {len(df_nomina_final)} registros')
        
        # 3, 4, 5. BIMESTRES
        def procesar_bimestre(numero_bim: int, nombre_coleccion: str) -> List[Dict]:
            print(f'[{numero_bim + 2}/6] Procesando Bimestre {numero_bim}...')
            col_bim = db[nombre_coleccion]
            docs_bim = list(col_bim.find({}).sort('_id', 1))
            
            resultados = []
            for doc in docs_bim:
                dni = normalizar_dni(doc)
                nombres = normalizar_nombres(doc)
                if not dni or not dni.strip():
                    continue
                
                nota_numerica = convertir_calificacion(doc.get('PROMEDIO_APRENDIZAJE_AUTONOMO'))
                
                resultados.append({
                    'DNI': dni,
                    'Apellidos_Nombres': nombres,
                    f'NotaBim{numero_bim}': nota_numerica if nota_numerica else 5
                })
            
            return resultados
        
        df_bim1_final = procesar_bimestre(1, 'primer_bimestre')
        df_bim2_final = procesar_bimestre(2, 'segundo_bimestre')
        df_bim3_final = procesar_bimestre(3, 'tercer_bimestre')
        
        # 6. INCIDENTES
        print('[6/6] Procesando datos de Incidencias...')
        col_incidente = db['incidente']
        docs_incidente = list(col_incidente.find({}))
        
        incidente_map = {}
        for doc in docs_incidente:
            nombre = doc.get('Nombre y Apellido') or normalizar_nombres(doc)
            if not nombre:
                continue
            
            tipo_falta = str(doc.get('Tipo de Falta', '')).strip()
            es_leve = tipo_falta.lower() == 'leve'
            
            if nombre not in incidente_map:
                incidente_map[nombre] = {'Analisis_Incidencias': 1 if es_leve else 0}
            else:
                if not es_leve:
                    incidente_map[nombre]['Analisis_Incidencias'] = 0
        
        df_incidente_grouped = [
            {'Apellidos_Nombres': nombre, **datos}
            for nombre, datos in incidente_map.items()
        ]
        
        print(f'   [OK] Incidentes procesados: {len(df_incidente_grouped)} registros')
        
        # 7. ENCUESTA (Análisis de Sentimiento)
        print('[INFO] Analizando sentimientos de estudiantes...')
        col_encuesta = db['encuesta']
        docs_encuesta = list(col_encuesta.find({}).sort('_id', 1))
        
        # Debug: verificar campos disponibles en el primer documento
        if docs_encuesta:
            primer_doc = docs_encuesta[0]
            campos_disponibles = list(primer_doc.keys())
            logger.info(f'CAMPOS DISPONIBLES EN ENCUESTA: {campos_disponibles}')
            # Buscar campo que contenga "sentimiento" o "sugerencia"
            campos_sentimiento = [k for k in campos_disponibles if 'sentimiento' in k.lower() or 'sugerencia' in k.lower()]
            logger.info(f'CAMPOS RELACIONADOS CON SENTIMIENTO: {campos_sentimiento}')
        
        encuesta_map = {}
        sentimientos_positivos = 0
        sentimientos_negativos = 0
        textos_vacios = 0
        textos_ejemplo_negativos = []  # Para debugging
        textos_ejemplo_todos = []  # Para ver todos los textos
        
        for doc in docs_encuesta:
            dni = normalizar_dni(doc)
            if not dni:
                continue
            
            if dni not in encuesta_map:
                # Intentar diferentes nombres de campo
                texto_sentimiento = (doc.get('sugerencia_sentimientos') or 
                                    doc.get('sugerencia_sentimiento') or 
                                    doc.get('sentimiento') or 
                                    doc.get('sugerencia') or
                                    doc.get('comentario') or
                                    doc.get('texto'))
                
                if not texto_sentimiento or str(texto_sentimiento).strip() == '':
                    textos_vacios += 1
                    # Si no hay texto, marcar como neutro (sin riesgo)
                    sentimiento = 1
                else:
                    texto_str = str(texto_sentimiento).strip()
                    sentimiento = analizar_sentimiento_espanol(texto_str)
                    
                    # Guardar algunos ejemplos para debugging
                    if len(textos_ejemplo_todos) < 10:
                        textos_ejemplo_todos.append((dni, texto_str[:150], sentimiento))
                    
                    # Debug: guardar algunos ejemplos de textos que deberían ser negativos
                    if sentimiento == 0 and len(textos_ejemplo_negativos) < 5:
                        textos_ejemplo_negativos.append((dni, texto_str[:100]))  # Primeros 100 caracteres
                
                if sentimiento == 1:
                    sentimientos_positivos += 1
                else:
                    sentimientos_negativos += 1
                
                encuesta_map[dni] = {
                    'DNI': dni,
                    'Analisis_Sentimiento_Estudiante': sentimiento
                }
        
        df_encuesta_final = list(encuesta_map.values())
        print(f'   [OK] Encuesta procesada: {len(docs_encuesta)} respuestas analizadas')
        print(f'   [INFO] Sentimientos: {sentimientos_positivos} positivos, {sentimientos_negativos} negativos, {textos_vacios} vacíos')
        logger.info(f'SENTIMIENTOS ANALIZADOS: {sentimientos_positivos} positivos, {sentimientos_negativos} negativos, {textos_vacios} vacíos')
        
        # Debug: mostrar algunos textos de ejemplo
        if textos_ejemplo_negativos:
            logger.info(f'EJEMPLOS DE TEXTOS NEGATIVOS ENCONTRADOS: {textos_ejemplo_negativos}')
        else:
            logger.info(f'NO SE ENCONTRARON TEXTOS NEGATIVOS')
        
        # Mostrar ejemplos de textos procesados
        logger.info(f'EJEMPLOS DE TEXTOS PROCESADOS (primeros 10): {textos_ejemplo_todos}')
        
        sys.stdout.flush()  # Forzar escritura inmediata
        
        # ============================================
        # INTEGRACIÓN DE DATOS (Merge)
        # ============================================
        print('[INFO] Integrando datos de todas las fuentes...')
        
        estudiantes_map = {}
        
        # Agregar datos de nómina (base)
        for reg in df_nomina_final:
            estudiantes_map[reg['DNI']] = reg.copy()
        
        # Merge con asistencias
        for reg in df_asistencias_final:
            if not reg.get('DNI'):
                continue
            dni = reg['DNI']
            estudiante = estudiantes_map.get(dni, {'DNI': dni, 'Apellidos_Nombres': reg.get('Apellidos_Nombres', '')})
            estudiante.update({
                'Apellidos_Nombres': reg.get('Apellidos_Nombres') or estudiante.get('Apellidos_Nombres', ''),
                'Seccion': reg.get('Seccion') or estudiante.get('Seccion', ''),
                'Grado': reg.get('Grado') or estudiante.get('Grado', ''),
                'Analisis_Asistencia': reg.get('Analisis_Asistencia', 1)
            })
            estudiantes_map[dni] = estudiante
        
        # Merge con bimestres
        for idx, df_bim in enumerate([df_bim1_final, df_bim2_final, df_bim3_final], 1):
            for reg in df_bim:
                if not reg.get('DNI'):
                    continue
                dni = reg['DNI']
                estudiante = estudiantes_map.get(dni, {'DNI': dni, 'Apellidos_Nombres': reg.get('Apellidos_Nombres', '')})
                estudiante.update({
                    'Apellidos_Nombres': reg.get('Apellidos_Nombres') or estudiante.get('Apellidos_Nombres', ''),
                    f'NotaBim{idx}': reg.get(f'NotaBim{idx}', 5)
                })
                estudiantes_map[dni] = estudiante
        
        # Merge con incidentes (por nombre)
        nombre_to_dni = {est['Apellidos_Nombres']: dni for dni, est in estudiantes_map.items()}
        for reg in df_incidente_grouped:
            dni = nombre_to_dni.get(reg.get('Apellidos_Nombres'))
            if dni:
                estudiante = estudiantes_map[dni]
                estudiante['Analisis_Incidencias'] = reg.get('Analisis_Incidencias', 1)
                estudiantes_map[dni] = estudiante
        
        # Merge con sentimientos
        # Crear un set de DNIs que tienen datos de encuesta
        dnis_con_encuesta = set()
        
        for reg in df_encuesta_final:
            dni = reg.get('DNI')
            if dni and dni in estudiantes_map:
                estudiante = estudiantes_map[dni]
                estudiante['Analisis_Sentimiento_Estudiante'] = reg.get('Analisis_Sentimiento_Estudiante', 1)
                estudiantes_map[dni] = estudiante
                dnis_con_encuesta.add(dni)
        
        # Para estudiantes sin datos de encuesta, marcar como desconocido (neutral)
        # Usaremos 1 (sin riesgo) solo si realmente tienen datos positivos
        # Si no tienen datos, deberíamos marcarlos de manera diferente o usar un valor neutral
        # Por ahora, mantenemos 1 pero agregamos un log para debugging
        estudiantes_sin_encuesta = len(estudiantes_map) - len(dnis_con_encuesta)
        if estudiantes_sin_encuesta > 0:
            print(f'   [ADVERTENCIA] {estudiantes_sin_encuesta} estudiantes sin datos de encuesta (marcados como sin riesgo por defecto)')
        
        # Convertir a lista y aplicar valores por defecto
        df_final = []
        for dni, est in estudiantes_map.items():
            if not dni or not str(dni).strip():
                continue
            
            df_final.append({
                'DNI': str(dni).strip(),
                'Apellidos_Nombres': est.get('Apellidos_Nombres', ''),
                'Genero': est.get('Genero', ''),
                'Seccion': est.get('Seccion', ''),
                'Grado': est.get('Grado', ''),
                'NotaBim1': est.get('NotaBim1', 5),
                'NotaBim2': est.get('NotaBim2', 5),
                'NotaBim3': est.get('NotaBim3', 5),
                'Analisis_Asistencia': est.get('Analisis_Asistencia', 1),
                'Analisis_Incidencias': est.get('Analisis_Incidencias', 1),
                'Analisis_Sentimiento_Estudiante': est.get('Analisis_Sentimiento_Estudiante', 1),
                'Analisis_Situacion_Familiar': est.get('Analisis_Situacion_Familiar', 1)
            })
        
        # Eliminar duplicados por DNI
        dni_set = set()
        df_final = [est for est in df_final if est['DNI'] not in dni_set and not dni_set.add(est['DNI'])]
        
        print(f'[OK] Tabla integrada: {len(df_final)} estudiantes unicos')
        
        if len(df_final) == 0:
            raise ValueError('No se encontraron estudiantes para analizar.')
        
        # ============================================
        # MODELO PREDICTIVO
        # ============================================
        print('[INFO] Ejecutando predicciones...')
        
        for est in df_final:
            est['Nota_Proyectada_B4'] = proyectar_nota_robusta(est)
            est['Prediccion_Final_Binaria'] = clasificar_resultado(est['Nota_Proyectada_B4'])
            est['Estado'] = '[OK] APRUEBA' if est['Prediccion_Final_Binaria'] == 1 else '[X] DESAPRUEBA'
        
        print('[OK] Predicciones completadas')
        
        # ============================================
        # VALIDACIÓN DEL MODELO (Temporal - más realista)
        # ============================================
        print('[INFO] Validando modelo con validación temporal...')
        print('[INFO] Usando Bim1 y Bim2 para predecir Bim3, y validando con Bim3 real')
        
        # Validación temporal: usar Bim1 y Bim2 para predecir Bim3
        # Esto es más realista porque simula predecir el futuro
        y_true_temporal = []
        y_pred_temporal = []
        y_scores_temporal = []  # Scores continuos para calcular AUC-ROC con mayor precisión
        
        for est in df_final:
            # Solo validar estudiantes que tienen al menos Bim1 y Bim2
            if est.get('NotaBim1') and est.get('NotaBim2') and est.get('NotaBim3'):
                # Realidad: clasificar Bim3 real
                realidad_bim3 = clasificar_resultado(est['NotaBim3'])
                
                # Predicción: usar solo Bim1 y Bim2 para predecir Bim3
                # Simular proyección usando solo los primeros dos bimestres
                notas_para_validacion = [est.get('NotaBim1', 5), est.get('NotaBim2', 5)]
                nota_min, nota_max = MODEL_CONFIG["nota_escala"]
                notas_validadas = [max(nota_min, min(nota_max, n)) for n in notas_para_validacion]
                
                # Regresión lineal simple con solo 2 puntos
                if len(notas_validadas) == 2:
                    # Proyección simple: continuar la tendencia
                    cambio = notas_validadas[1] - notas_validadas[0]
                    proyeccion_bim3 = notas_validadas[1] + cambio
                    
                    # Aplicar límite de cambio máximo
                    max_cambio = MODEL_CONFIG["max_proyeccion_cambio"]
                    proyeccion_bim3 = max(
                        notas_validadas[1] - max_cambio,
                        min(notas_validadas[1] + max_cambio, proyeccion_bim3)
                    )
                    
                    # Aplicar penalización por factores de riesgo (igual que en el modelo real)
                    pesos = MODEL_CONFIG["pesos_penalizacion"]
                    castigo = (
                        (1 - est.get('Analisis_Asistencia', 1)) * pesos["asistencia"] +
                        (1 - est.get('Analisis_Incidencias', 1)) * pesos["incidencias"] +
                        (1 - est.get('Analisis_Sentimiento_Estudiante', 1)) * pesos["sentimiento"] +
                        (1 - est.get('Analisis_Situacion_Familiar', 1)) * pesos["familia"]
                    )
                    
                    nota_final_validacion = max(nota_min, min(nota_max, proyeccion_bim3 - castigo))
                    prediccion_bim3 = clasificar_resultado(nota_final_validacion)
                    
                    y_true_temporal.append(realidad_bim3)
                    y_pred_temporal.append(prediccion_bim3)
                    y_scores_temporal.append(nota_final_validacion)  # Guardar score continuo para AUC-ROC
        
        # Calcular métricas con validación temporal usando scores continuos (MEJORA SIGNIFICATIVA)
        if len(y_true_temporal) > 0:
            print(f'[INFO] Validación temporal: {len(y_true_temporal)} estudiantes con datos completos')
            print(f'[INFO] Calculando AUC-ROC con scores continuos (notas proyectadas) para mayor precisión...')
            metricas = calcular_metricas(y_true_temporal, y_pred_temporal, y_scores_temporal)
            
            # Log de métricas temporales para debugging
            logger.info(f'VALIDACION TEMPORAL - AUC-ROC: {metricas["auc_roc"]:.4f} (usando scores continuos)')
            logger.info(f'VALIDACION TEMPORAL - Precision: {metricas["precision"]:.4f}, Recall: {metricas["recall"]:.4f}')
            print(f'[OK] AUC-ROC mejorado usando scores continuos: {metricas["auc_roc"]:.4f}')
        else:
            print('[ADVERTENCIA] No hay suficientes datos para validación temporal, usando validación estándar')
            # Fallback: validación estándar usando notas proyectadas como scores
            y_true = []
            y_pred = []
            y_scores = []
            for est in df_final:
                realidad_bim3 = clasificar_resultado(est.get('NotaBim3', 5))
                y_true.append(realidad_bim3)
                y_pred.append(est['Prediccion_Final_Binaria'])
                y_scores.append(est['Nota_Proyectada_B4'])  # Usar nota proyectada como score
            
            print('[INFO] Calculando AUC-ROC con scores continuos (notas proyectadas) para mayor precisión...')
            metricas = calcular_metricas(y_true, y_pred, y_scores)
            logger.info(f'VALIDACION ESTANDAR - AUC-ROC: {metricas["auc_roc"]:.4f} (usando scores continuos)')
        
        # ============================================
        # PREPARAR RESULTADOS FINALES
        # ============================================
        
        # Ordenar por Sección y Apellidos
        df_final.sort(key=lambda x: (x.get('Seccion', ''), x.get('Apellidos_Nombres', '')))
        
        total_estudiantes = len(df_final)
        aprueba_count = sum(1 for e in df_final if e['Prediccion_Final_Binaria'] == 1)
        desaprueba_count = total_estudiantes - aprueba_count
        promedio_nota_proyectada = sum(e['Nota_Proyectada_B4'] for e in df_final) / total_estudiantes
        
        # Factores de riesgo
        # Debug: contar sentimientos antes de agregar a factores_riesgo
        sentimientos_sin_riesgo = sum(1 for e in df_final if e.get('Analisis_Sentimiento_Estudiante', 1) == 1)
        sentimientos_con_riesgo = sum(1 for e in df_final if e.get('Analisis_Sentimiento_Estudiante', 1) == 0)
        print(f'[DEBUG] Factores de riesgo - Sentimientos: {sentimientos_sin_riesgo} sin riesgo, {sentimientos_con_riesgo} con riesgo')
        logger.info(f'FACTORES DE RIESGO - SENTIMIENTOS: {sentimientos_sin_riesgo} sin riesgo, {sentimientos_con_riesgo} con riesgo')
        sys.stdout.flush()  # Forzar escritura inmediata
        
        # Debug adicional: verificar algunos valores reales
        ejemplos_sentimiento = [(e.get('DNI'), e.get('Analisis_Sentimiento_Estudiante')) for e in df_final[:10]]
        logger.info(f'EJEMPLOS SENTIMIENTO (primeros 10): {ejemplos_sentimiento}')
        
        factores_riesgo = {
            'asistencia': {
                'sin_riesgo': sum(1 for e in df_final if e['Analisis_Asistencia'] == 1),
                'con_riesgo': sum(1 for e in df_final if e['Analisis_Asistencia'] == 0)
            },
            'incidencias': {
                'sin_riesgo': sum(1 for e in df_final if e['Analisis_Incidencias'] == 1),
                'con_riesgo': sum(1 for e in df_final if e['Analisis_Incidencias'] == 0)
            },
            'sentimiento': {
                'sin_riesgo': sentimientos_sin_riesgo,
                'con_riesgo': sentimientos_con_riesgo
            },
            'situacion_familiar': {
                'sin_riesgo': sum(1 for e in df_final if e['Analisis_Situacion_Familiar'] == 1),
                'con_riesgo': sum(1 for e in df_final if e['Analisis_Situacion_Familiar'] == 0)
            }
        }
        
        resultado = {
            'success': True,
            'version': MODEL_CONFIG['version'],
            'fecha_analisis': datetime.now().isoformat(),
            'total_estudiantes': total_estudiantes,
            'metricas': {
                'aprueba': aprueba_count,
                'desaprueba': desaprueba_count,
                'porcentaje_aprueba': (aprueba_count / total_estudiantes) * 100,
                'porcentaje_desaprueba': (desaprueba_count / total_estudiantes) * 100,
                'promedio_nota_proyectada': promedio_nota_proyectada,
                **metricas
            },
            'factores_riesgo': factores_riesgo,
            'resultados': [
                {
                    'DNI': est['DNI'],
                    'Apellidos_Nombres': est['Apellidos_Nombres'],
                    'Genero': est['Genero'],
                    'Seccion': est['Seccion'],
                    'Grado': est['Grado'],
                    'NotaBim1': est['NotaBim1'],
                    'NotaBim2': est['NotaBim2'],
                    'NotaBim3': est['NotaBim3'],
                    'Analisis_Asistencia': est['Analisis_Asistencia'],
                    'Analisis_Incidencias': est['Analisis_Incidencias'],
                    'Analisis_Sentimiento_Estudiante': est['Analisis_Sentimiento_Estudiante'],
                    'Analisis_Situacion_Familiar': est['Analisis_Situacion_Familiar'],
                    'Nota_Proyectada_B4': round(est['Nota_Proyectada_B4'], 2),
                    'Prediccion_Final_Binaria': est['Prediccion_Final_Binaria'],
                    'Estado': est['Estado']
                }
                for est in df_final
            ]
        }
        
        print('[OK] Analisis SATE-SR completado exitosamente')
        return resultado
        
    finally:
        client.close()

