require('dotenv').config();
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, adminOnly } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// ─────────────────────────────────────────
// GET /api/tasks
// Admin sees all tasks | Staff sees only their own
// ─────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN'
      ? {}
      : { assignedToId: req.user.id };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// GET /api/tasks/:id
// Get one task — staff can only see their own
// ─────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true }
        },
        verifiedBy: {
          select: { id: true, name: true }
        },
        notes: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        files: true
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role !== 'ADMIN' && task.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// POST /api/tasks
// Create a new task — admin only
// ─────────────────────────────────────────
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { title, description, assignedToId, dueDate, priority } = req.body;

    if (!title || !assignedToId || !dueDate) {
      return res.status(400).json({
        message: 'Title, assignedToId and dueDate are required'
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        assignedToId,
        createdById: req.user.id,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        status: 'TODO'
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// PATCH /api/tasks/:id/status
// Update task status — staff updates their own tasks
// Valid transitions: TODO → IN_PROGRESS → DONE
// ─────────────────────────────────────────
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Use: TODO, IN_PROGRESS, or DONE'
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: req.params.id }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role !== 'ADMIN' && task.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status,
        completedAt: status === 'DONE' ? new Date() : null
      }
    });

    res.json({
      message: 'Task status updated',
      task: updated
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// PATCH /api/tasks/:id/verify
// Verify a completed task — admin only
// Task must be DONE before it can be VERIFIED
// ─────────────────────────────────────────
router.patch('/:id/verify', verifyToken, adminOnly, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'DONE') {
      return res.status(400).json({
        message: 'Task must have status DONE before it can be verified'
      });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: req.user.id
      }
    });

    res.json({
      message: 'Task verified successfully',
      task: updated
    });
  } catch (error) {
    console.error('Verify task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// DELETE /api/tasks/:id
// Delete a task — admin only
// ─────────────────────────────────────────
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// POST /api/tasks/:id/notes
// Add a note to a task — both roles
// Staff can only add notes to their own tasks
// ─────────────────────────────────────────
router.post('/:id/notes', verifyToken, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    const task = await prisma.task.findUnique({
      where: { id: req.params.id }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role !== 'ADMIN' && task.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const note = await prisma.taskNote.create({
      data: {
        content,
        taskId: req.params.id,
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({
      message: 'Note added successfully',
      note
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// POST /api/tasks/:id/files
// File upload placeholder — Cloudinary coming later
// ─────────────────────────────────────────
router.post('/:id/files', verifyToken, async (req, res) => {
  res.status(501).json({
    message: 'File upload not yet implemented — coming in a later step'
  });
});

module.exports = router;