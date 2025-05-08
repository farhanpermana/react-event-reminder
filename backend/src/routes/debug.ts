// routes/debug.ts
import express from 'express';
import telegramService from '../services/telegram.service';

const router = express.Router();

router.post('/send-test', async (req, res) => {
  const { username, message } = req.body;

  try {
    const result = await telegramService.sendReminderToSpecificUser(username, message);
    res.json({ success: true, result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

export default router;
