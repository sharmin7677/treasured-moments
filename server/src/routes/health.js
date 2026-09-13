import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'The Friendship Vault API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;