const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Configuración de BOLD
const BOLD_API_KEY = '925nWXj_cTzt_VGyHGnWPvaDJhKzjdZUBfRtKB5X6OE';
const BOLD_SECRET_KEY = '4cNUMHXiKd4GL1DlBA9_pg';

// Función para generar fecha de expiración
function getExpirationDate() {
    // Obtener timestamp actual en nanosegundos
    const nowNanoseconds = BigInt(Date.now()) * BigInt(1_000_000);
    
    // Agregar 24 horas en nanosegundos
    const futureNanoseconds = nowNanoseconds + (BigInt(24) * BigInt(60) * BigInt(60) * BigInt(1_000_000_000));
    
    return futureNanoseconds.toString();
}

// Endpoint para generar firma de integridad
app.post('/generate-signature', (req, res) => {
    try {
        const { orderId, amount, currency } = req.body;

        // Validar parámetros requeridos
        if (!orderId || !amount || !currency) {
            return res.status(400).json({
                error: 'Faltan parámetros requeridos (orderId, amount, currency)'
            });
        }

        // Generar fecha de expiración
        const expirationDate = getExpirationDate();

        // Generar cadena para firma
        const string = `${orderId}${amount}${currency}${BOLD_SECRET_KEY}`;
        
        // Generar firma SHA256
        const signature = crypto
            .createHash('sha256')
            .update(string)
            .digest('hex');

        // Responder con datos necesarios
        res.json({
            success: true,
            signature,
            apiKey: BOLD_API_KEY,
            orderId,
            expirationDate
        });

    } catch (error) {
        console.error('Error generando firma:', error);
        res.status(500).json({
            error: 'Error al generar la firma'
        });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});