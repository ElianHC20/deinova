const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors({
    origin: [
        'https://cardenascompany.io',
        'https://cardenascompany.io/apps/DaiNova/index.html'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configuración de BOLD
const BOLD_API_KEY = '925nWXj_cTzt_VGyHGnWPvaDJhKzjdZUBfRtKB5X6OE';
const BOLD_SECRET_KEY = '4cNUMHXiKd4GL1DlBA9_pg';

// Función para generar firma de suscripción - Versión original que funcionaba
function generateSubscriptionSignature(params) {
    const {
        orderId,
        amount,
        currency,
        frequency = 'monthly',
        interval = 1,
        totalPayments = 0
    } = params;

    // Volvemos al formato original que funcionaba
    const string = `${orderId}${amount}${currency}${BOLD_SECRET_KEY}`;
    
    return crypto
        .createHash('sha256')
        .update(string)
        .digest('hex');
}

// Endpoint para generar firma de integridad para suscripción
app.post('/generate-signature', (req, res) => {
    try {
        const {
            orderId,
            amount,
            currency,
            frequency = 'monthly',
            interval = 1,
            totalPayments = 0
        } = req.body;

        // Validar parámetros requeridos
        if (!orderId || !amount || !currency) {
            return res.status(400).json({
                error: 'Faltan parámetros requeridos (orderId, amount, currency)'
            });
        }

        // Generar firma para suscripción
        const signature = generateSubscriptionSignature({
            orderId,
            amount,
            currency
        });

        // Responder con datos necesarios para suscripción
        res.json({
            success: true,
            signature,
            apiKey: BOLD_API_KEY,
            orderId,
            subscriptionDetails: {
                frequency,
                interval,
                totalPayments
            }
        });
    } catch (error) {
        console.error('Error generando firma de suscripción:', error);
        res.status(500).json({
            error: 'Error al generar la firma para suscripción'
        });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});