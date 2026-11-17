const express = require('express');
const router = express.Router();
const { getV2XState } = require('../engines/v2xEngine');

router.get('/state', (req, res) => {
  res.json(getV2XState());
});

module.exports = router;
