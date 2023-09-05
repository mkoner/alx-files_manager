import AppController from '../controllers/AppController';

const express = require('express');

const router = express.Router();

router.get('/status', (req, res) => AppController.getStatus(req, res));
router.get('/stats', (req, res) => AppController.getStats(req, res));

export default router;
