// routes/webhook.ts
import { Router } from 'express';
const router = Router();

router.post('/webhook', (req, res) => {
  const message = req.body.message;
  if (message?.text) {
    // reply or log
  }
  res.sendStatus(200);
});

export default router;
