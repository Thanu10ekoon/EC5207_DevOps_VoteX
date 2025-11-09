import express from 'express';
import bcrypt from 'bcrypt';

export default function createPollRoutes(pool) {
  const router = express.Router();

  // Create poll
  router.post('/', async (req, res) => {
    const { title, description, isPublic, pollPassword, options } = req.body;
    const userId = req.user.sub;

  if (!title || !options || options.length < 2) {
    return res.status(400).json({ message: 'Title and at least 2 options required' });
  }

  try {
    let hashedPassword = null;
    if (!isPublic && pollPassword) {
      hashedPassword = await bcrypt.hash(pollPassword, 10);
    }

    const [result] = await pool.execute(
      'INSERT INTO polls (title, description, is_public, poll_password, created_by) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', isPublic, hashedPassword, userId]
    );

    const pollId = result.insertId;

    for (const option of options) {
      await pool.execute(
        'INSERT INTO poll_options (poll_id, option_text) VALUES (?, ?)',
        [pollId, option]
      );
    }

    res.status(201).json({ message: 'Poll created', pollId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all public polls + user's own polls
router.get('/', async (req, res) => {
  const userId = req.user.sub;

  try {
    const [polls] = await pool.execute(
      `SELECT p.*, u.email as creator_email,
        (SELECT COUNT(*) FROM votes WHERE poll_id = p.id) as total_votes
       FROM polls p
       JOIN users u ON p.created_by = u.id
       WHERE p.is_public = 1 OR p.created_by = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(polls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single poll details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;

  try {
    const [polls] = await pool.execute(
      `SELECT p.*, u.email as creator_email
       FROM polls p
       JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (polls.length === 0) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const poll = polls[0];

    if (!poll.is_public && poll.created_by !== userId) {
      return res.status(403).json({ message: 'Private poll - password required', requiresPassword: true });
    }

    const [options] = await pool.execute(
      'SELECT * FROM poll_options WHERE poll_id = ?',
      [id]
    );

    const [votes] = await pool.execute(
      'SELECT option_id FROM votes WHERE poll_id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      ...poll,
      options,
      hasVoted: votes.length > 0,
      userVote: votes.length > 0 ? votes[0].option_id : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify private poll password
router.post('/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    const [polls] = await pool.execute(
      'SELECT poll_password FROM polls WHERE id = ? AND is_public = 0',
      [id]
    );

    if (polls.length === 0) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const isValid = await bcrypt.compare(password, polls[0].poll_password);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.json({ message: 'Password verified', verified: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on poll
router.post('/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { optionId, password } = req.body;
  const userId = req.user.sub;

  try {
    const [polls] = await pool.execute(
      'SELECT * FROM polls WHERE id = ?',
      [id]
    );

    if (polls.length === 0) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const poll = polls[0];

    if (!poll.is_public) {
      if (!password) {
        return res.status(401).json({ message: 'Password required' });
      }
      const isValid = await bcrypt.compare(password, poll.poll_password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }
    }

    const [existing] = await pool.execute(
      'SELECT * FROM votes WHERE poll_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already voted on this poll' });
    }

    const [options] = await pool.execute(
      'SELECT * FROM poll_options WHERE id = ? AND poll_id = ?',
      [optionId, id]
    );

    if (options.length === 0) {
      return res.status(400).json({ message: 'Invalid option' });
    }

    await pool.execute(
      'INSERT INTO votes (poll_id, user_id, option_id) VALUES (?, ?, ?)',
      [id, userId, optionId]
    );

    await pool.execute(
      'UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = ?',
      [optionId]
    );

    res.json({ message: 'Vote recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete poll (creator only)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;

  try {
    const [polls] = await pool.execute(
      'SELECT created_by FROM polls WHERE id = ?',
      [id]
    );

    if (polls.length === 0) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (polls[0].created_by !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.execute('DELETE FROM polls WHERE id = ?', [id]);
    res.json({ message: 'Poll deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

  return router;
}
