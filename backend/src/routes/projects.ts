import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createProjectSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  projectType: z.enum(['ANDROID_NATIVE', 'FLUTTER', 'REACT_NATIVE', 'WEB_APP', 'HYBRID']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
});

const updateProjectSchema = createProjectSchema.partial();

// Get all projects with filters
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, clientId, projectType, priority, search } = req.query;
    
    const where: any = {};
    
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (projectType) where.projectType = projectType;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
          where: {
            status: 'ACTIVE',
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
        milestones: {
          select: {
            id: true,
            status: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate project metrics
    const projectsWithMetrics = projects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const upcomingMilestones = project.milestones
        .filter(m => m.status !== 'COMPLETED' && m.status !== 'APPROVED')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      return {
        ...project,
        metrics: {
          progress,
          totalTasks,
          completedTasks,
          teamSize: project.assignments.length,
          nextMilestone: upcomingMilestones[0] || null,
        },
      };
    });

    res.json({
      success: true,
      data: projectsWithMetrics,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
    });
  }
});

// Get single project with full details
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        assignments: {
          include: {
            user: true,
          },
        },
        sprints: {
          orderBy: {
            sprintNumber: 'desc',
          },
          take: 5,
        },
        tasks: {
          include: {
            assignedTo: true,
            reporter: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        milestones: {
          orderBy: {
            dueDate: 'asc',
          },
        },
        risks: {
          where: {
            status: {
              not: 'RESOLVED',
            },
          },
        },
        activities: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Calculate additional metrics
    const allTasks = await prisma.task.findMany({
      where: { projectId: id },
    });

    const tasksByStatus = allTasks.reduce((acc: any, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const burndownData = await calculateBurndown(id);
    const velocityData = await calculateVelocity(id);
    const budgetUtilization = project.budget && project.spentAmount
      ? (Number(project.spentAmount) / Number(project.budget)) * 100
      : 0;

    res.json({
      success: true,
      data: {
        ...project,
        metrics: {
          tasksByStatus,
          burndownData,
          velocityData,
          budgetUtilization,
          daysRemaining: project.endDate 
            ? Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project',
    });
  }
});

// Create new project
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  validateRequest(createProjectSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      
      // Generate project code
      const year = new Date().getFullYear();
      const lastProject = await prisma.project.findFirst({
        where: {
          code: {
            startsWith: `IRA-${year}`,
          },
        },
        orderBy: {
          code: 'desc',
        },
      });

      let projectNumber = 1;
      if (lastProject) {
        const lastNumber = parseInt(lastProject.code.split('-')[2]);
        projectNumber = lastNumber + 1;
      }

      const projectCode = `IRA-${year}-${projectNumber.toString().padStart(3, '0')}`;

      const project = await prisma.project.create({
        data: {
          ...data,
          code: projectCode,
          status: 'PLANNING',
        },
        include: {
          client: true,
        },
      });

      // Create initial activity log
      await prisma.activityLog.create({
        data: {
          projectId: project.id,
          userId: req.user.id,
          action: 'PROJECT_CREATED',
          entityType: 'project',
          entityId: project.id,
          details: {
            projectName: project.name,
            clientName: project.client.companyName,
          },
        },
      });

      // Send notification to team
      await notifyTeam({
        type: 'PROJECT_UPDATE',
        title: 'New Project Created',
        message: `A new project "${project.name}" has been created for ${project.client.companyName}`,
        projectId: project.id,
      });

      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create project',
      });
    }
  }
);

// Update project
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  validateRequest(updateProjectSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const project = await prisma.project.update({
        where: { id },
        data,
        include: {
          client: true,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          projectId: project.id,
          userId: req.user.id,
          action: 'PROJECT_UPDATED',
          entityType: 'project',
          entityId: project.id,
          details: {
            updates: data,
          },
        },
      });

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update project',
      });
    }
  }
);

// Get project dashboard data
router.get('/:id/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch comprehensive dashboard data
    const [
      project,
      taskStats,
      timeStats,
      sprintData,
      teamPerformance,
      upcomingDeadlines,
      recentActivities,
    ] = await Promise.all([
      prisma.project.findUnique({
        where: { id },
        include: {
          client: true,
          milestones: true,
        },
      }),
      getTaskStatistics(id),
      getTimeStatistics(id),
      getSprintData(id),
      getTeamPerformance(id),
      getUpcomingDeadlines(id),
      getRecentActivities(id),
    ]);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: {
        project,
        taskStats,
        timeStats,
        sprintData,
        teamPerformance,
        upcomingDeadlines,
        recentActivities,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
    });
  }
});

// Helper functions
async function calculateBurndown(projectId: string) {
  // Implementation for burndown chart calculation
  const sprints = await prisma.sprint.findMany({
    where: { 
      projectId,
      status: { in: ['ACTIVE', 'COMPLETED'] },
    },
    include: {
      tasks: true,
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  return sprints.map(sprint => {
    const totalPoints = sprint.tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const completedPoints = sprint.tasks
      .filter(task => task.status === 'DONE')
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    
    return {
      sprintName: sprint.name,
      totalPoints,
      completedPoints,
      remainingPoints: totalPoints - completedPoints,
    };
  });
}

async function calculateVelocity(projectId: string) {
  // Implementation for velocity calculation
  const completedSprints = await prisma.sprint.findMany({
    where: {
      projectId,
      status: 'COMPLETED',
    },
    include: {
      tasks: {
        where: {
          status: 'DONE',
        },
      },
    },
    orderBy: {
      endDate: 'desc',
    },
    take: 5,
  });

  return completedSprints.map(sprint => ({
    sprintName: sprint.name,
    velocity: sprint.tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0),
  }));
}

async function getTaskStatistics(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
  });

  const stats = tasks.reduce((acc: any, task) => {
    acc.total++;
    acc.byStatus[task.status] = (acc.byStatus[task.status] || 0) + 1;
    acc.byType[task.taskType] = (acc.byType[task.taskType] || 0) + 1;
    acc.byPriority[task.priority] = (acc.byPriority[task.priority] || 0) + 1;
    
    if (task.status === 'BLOCKED') acc.blocked++;
    if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE') {
      acc.overdue++;
    }
    
    return acc;
  }, {
    total: 0,
    byStatus: {},
    byType: {},
    byPriority: {},
    blocked: 0,
    overdue: 0,
  });

  return stats;
}

async function getTimeStatistics(projectId: string) {
  const timeLogs = await prisma.timeLog.findMany({
    where: {
      task: {
        projectId,
      },
    },
    include: {
      user: true,
    },
  });

  const totalHours = timeLogs.reduce((sum, log) => sum + Number(log.hours), 0);
  const billableHours = timeLogs
    .filter(log => log.billable)
    .reduce((sum, log) => sum + Number(log.hours), 0);

  const hoursByUser = timeLogs.reduce((acc: any, log) => {
    const userName = log.user.name;
    acc[userName] = (acc[userName] || 0) + Number(log.hours);
    return acc;
  }, {});

  return {
    totalHours,
    billableHours,
    nonBillableHours: totalHours - billableHours,
    hoursByUser,
  };
}

async function getSprintData(projectId: string) {
  const currentSprint = await prisma.sprint.findFirst({
    where: {
      projectId,
      status: 'ACTIVE',
    },
    include: {
      tasks: {
        include: {
          assignedTo: true,
        },
      },
    },
  });

  if (!currentSprint) return null;

  const sprintProgress = {
    name: currentSprint.name,
    startDate: currentSprint.startDate,
    endDate: currentSprint.endDate,
    daysRemaining: Math.ceil(
      (new Date(currentSprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    ),
    tasks: {
      total: currentSprint.tasks.length,
      completed: currentSprint.tasks.filter(t => t.status === 'DONE').length,
      inProgress: currentSprint.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      todo: currentSprint.tasks.filter(t => t.status === 'TODO').length,
    },
    velocity: currentSprint.velocity,
  };

  return sprintProgress;
}

async function getTeamPerformance(projectId: string) {
  const assignments = await prisma.projectAssignment.findMany({
    where: {
      projectId,
      status: 'ACTIVE',
    },
    include: {
      user: {
        include: {
          tasksAssigned: {
            where: {
              projectId,
            },
          },
          timeLogs: {
            where: {
              task: {
                projectId,
              },
            },
          },
        },
      },
    },
  });

  const performance = assignments.map(assignment => {
    const tasks = assignment.user.tasksAssigned;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const totalHours = assignment.user.timeLogs.reduce((sum, log) => sum + Number(log.hours), 0);

    return {
      userId: assignment.user.id,
      userName: assignment.user.name,
      role: assignment.roleInProject,
      allocation: assignment.allocationPercentage,
      tasksCompleted: completedTasks,
      tasksInProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      totalHours,
      productivity: completedTasks > 0 ? totalHours / completedTasks : 0,
    };
  });

  return performance;
}

async function getUpcomingDeadlines(projectId: string) {
  const upcomingTasks = await prisma.task.findMany({
    where: {
      projectId,
      status: {
        not: 'DONE',
      },
      dueDate: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
      },
    },
    include: {
      assignedTo: true,
    },
    orderBy: {
      dueDate: 'asc',
    },
    take: 10,
  });

  const upcomingMilestones = await prisma.milestone.findMany({
    where: {
      projectId,
      status: {
        not: 'COMPLETED',
      },
      dueDate: {
        gte: new Date(),
        lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Next 14 days
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
    take: 5,
  });

  return {
    tasks: upcomingTasks,
    milestones: upcomingMilestones,
  };
}

async function getRecentActivities(projectId: string) {
  return prisma.activityLog.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });
}

async function notifyTeam(notification: any) {
  // Implementation for team notification
  // This would integrate with your notification system
  console.log('Sending notification:', notification);
}

export default router;