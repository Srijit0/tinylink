// src/routes/apiLinks.js
const express = require('express');
const pool = require('../db');
const { isValidCode, isValidUrl, generateRandomCode } = require('../validators');

const router = express.Router();

// Helper: find unique random code
async function generateUniqueCode() {
  while (true) {
    const candidate = generateRandomCode(6);
    const result = await pool.query('SELECT 1 FROM links WHERE code = $1', [candidate]);
    if (result.rowCount === 0) {
      return candidate;
    }
  }
}

// POST /api/links - Create link (409 if code exists)
router.post('/links', async (req, res) => {
  try {
    const { targetUrl, code: customCode } = req.body;

    if (!targetUrl || !isValidUrl(targetUrl)) {
      return res.status(400).json({ error: 'Invalid or missing targetUrl. Must be http or https URL.' });
    }

    let code = customCode;

    if (code) {
      if (!isValidCode(code)) {
        return res.status(400).json({ error: 'Invalid code. Must match [A-Za-z0-9]{6,8}.' });
      }
    } else {
      code = await generateUniqueCode();
    }

    const insertQuery = `
      INSERT INTO links (code, target_url)
      VALUES ($1, $2)
      RETURNING code, target_url, created_at, total_clicks, last_clicked_at
    `;

    try {
      const result = await pool.query(insertQuery, [code, targetUrl]);
      const link = result.rows[0];
      return res.status(201).json(link);
    } catch (err) {
      // Unique constraint violation
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Code already exists.' });
      }
      console.error('Error inserting link', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  } catch (err) {
    console.error('Error in POST /api/links', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/links - List all links
router.get('/links', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT code, target_url, created_at, total_clicks, last_clicked_at
      FROM links
      ORDER BY created_at DESC
      `
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error in GET /api/links', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/links/:code - Stats for one code
router.get('/links/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT code, target_url, created_at, total_clicks, last_clicked_at
      FROM links
      WHERE code = $1
      `,
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Link not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in GET /api/links/:code', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/links/:code - Delete link
router.delete('/links/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query('DELETE FROM links WHERE code = $1', [code]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Link not found.' });
    }

    // Deleted successfully; redirect must now 404 in redirect route
    return res.status(204).send();
  } catch (err) {
    console.error('Error in DELETE /api/links/:code', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
