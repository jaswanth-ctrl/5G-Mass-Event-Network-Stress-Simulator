const express = require('express');
const router = express.Router();
const { getSliceStatus } = require('../engines/sliceManager');

router.get('/status', (req, res) => {
  res.json(getSliceStatus());
});

module.exports = router;
