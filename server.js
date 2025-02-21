const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const app = express();

// Middleware de logging
const requestLogger = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
};

// Middleware de validación
const validateSignatureRequest = (req, res, next) => {
    const { orderId, amount, currency } = req.body;
    
    if (!orderId || !amount || !currency) {
        return res.status(400).json({
            error: 'Faltan parámetros requeridos',
            details: {
                orderId: !orderId,
                amount: !amount,
                currency: !currency
            }
        });
    }
    
    // Validar formato de orderId
    if (!/^DEINOVA-\d+-[a-z0-9]+$/.test(orderId)) {
        return res.status(400).json({
            error: 'Formato de orderId inválido'
        });
    }
    
    // Validar amount
    if (!/^\d+$/.test(amount)) {
        return res.status(400).json({
            error: 'Formato de amount inválido'
        });
    }
    
    // Validar currency
    if (currency !== 'COP') {
        return res.status(400).json({
            error: 'Moneda no soportada'
        });
    }
    
    next();
};

app.use(requestLogger);
app.use(cors({
    origin: [
        'https://cardenascompany.io',
        'https://cardenascompany.io/apps/DaiNova/index.html'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const BOLD_API_KEY = 'RtLcOY8AfZGBRL1HWcc7QNnPbgrJ4S7vwdYlocpBsxM';
const BOLD_SECRET_KEY = 'NOBTBOWd2DBT44g84EBEQQ';

function generateSubscriptionSignature(params) {
    try {
        const { orderId, amount, currency } = params;
        const string = `${orderId}${amount}${currency}${BOLD_SECRET_KEY}`;
        
        return crypto
            .createHash('sha256')
            .update(string)
            .digest('hex');
    } catch (error) {
        console.error('Error generando firma:', error);
        throw new Error('Error interno generando firma');
    }
}

app.post('/generate-signature', validateSignatureRequest, (req, res) => {
    try {
        const {
            orderId,
            amount,
            currency,
            frequency = 'monthly',
            interval = 1,
            totalPayments = 0
        } = req.body;

        const signature = generateSubscriptionSignature({
            orderId,
            amount,
            currency
        });

        // Log de éxito
        console.log(`Firma generada exitosamente para orden: ${orderId}`);

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
        console.error('Error en /generate-signature:', error);
        res.status(500).json({
            error: 'Error al generar la firma',
            message: error.message
        });
    }
});

// Endpoint de health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});