// src/routes/pages.js
const express = require('express');
const pool = require('../db');

const router = express.Router();

// Helper: ensure value becomes a JS Date (treat strings without tz as UTC)
function toDateForceUTC(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'string' && !/Z|[+\-]\d{2}:\d{2}$/.test(val)) {
    return new Date(val + 'Z');
  }
  return new Date(val);
}

// Dashboard - GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT code, target_url, created_at, total_clicks, last_clicked_at
      FROM links
      ORDER BY created_at DESC
      `
    );

    const rawRows = result.rows || [];

    const links = rawRows.map(row => ({
      ...row,
      created_at: toDateForceUTC(row.created_at),
      last_clicked_at: toDateForceUTC(row.last_clicked_at)
    }));

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    res.render('dashboard', { links, baseUrl });
  } catch (err) {
    console.error('Error rendering dashboard', err);
    res.status(500).send('Internal server error.');
  }
});

// Stats page - GET /code/:code
router.get('/code/:code', async (req, res) => {
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
      return res.status(404).send('Link not found.');
    }

    const row = result.rows[0];
    const link = {
      ...row,
      created_at: toDateForceUTC(row.created_at),
      last_clicked_at: toDateForceUTC(row.last_clicked_at)
    };

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    res.render('stats', { link, baseUrl });
  } catch (err) {
    console.error('Error rendering stats page', err);
    res.status(500).send('Internal server error.');
  }
});

// Redirect - GET /:code
router.get('/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT id, target_url
      FROM links
      WHERE code = $1
      `,
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Short link not found.');
    }

    const link = result.rows[0];

    // Increment click count and set last_clicked_at to NOW() (UTC timestamptz)
    await pool.query(
      `
      UPDATE links
      SET total_clicks = total_clicks + 1, last_clicked_at = NOW()
      WHERE id = $1
      `,
      [link.id]
    );

    // 302 redirect
    res.redirect(link.target_url);
  } catch (err) {
    console.error('Error in redirect route', err);
    res.status(500).send('Internal server error.');
  }
});

module.exports = router;
