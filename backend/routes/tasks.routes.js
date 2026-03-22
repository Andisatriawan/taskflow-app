require('dotenv').config();
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, adminOnly } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/tasks — admin sees all, staff sees own
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

// GET /api/tasks/:id — get one task
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
        notes: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
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

// POST /api/tasks — create task (admin only)
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

// PATCH /api/tasks/:id/status — update status (staff updates own)
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