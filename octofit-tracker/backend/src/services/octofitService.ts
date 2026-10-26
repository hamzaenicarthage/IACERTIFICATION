import { isValidObjectId, Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = 400;
  return error;
}

function notFound(message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = 404;
  return error;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Activity payload is required');
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: string;
    teamId?: string;
    type?: string;
    minutes?: number | string;
  };

  if (!userId || !teamId || !type || minutes === undefined || minutes === null) {
    throw badRequest('userId, teamId, type, and minutes are required');
  }

  if (!isValidObjectId(userId) || !isValidObjectId(teamId)) {
    throw badRequest('userId and teamId must be valid MongoDB ObjectIds');
  }

  const user = await User.findById(userId);
  const team = await Team.findById(teamId);

  if (!user || !team) {
    throw notFound('Referenced user or team was not found');
  }

  const normalizedType = String(type).trim();
  const parsedMinutes = Number(minutes);
  if (!normalizedType || !Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    throw badRequest('Activity minutes must be a positive number');
  }

  const activity = await Activity.create({
    user: new Types.ObjectId(userId),
    team: new Types.ObjectId(teamId),
    type: normalizedType,
    minutes: parsedMinutes,
    points: parsedMinutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Team payload is required');
  }

  const { name, mascot, members } = input as {
    name?: string;
    mascot?: string;
    members?: unknown[];
  };

  if (!name || !String(name).trim()) {
    throw badRequest('Team name is required');
  }

  const validMembers = Array.isArray(members)
    ? members
        .filter((member): member is string => typeof member === 'string' && isValidObjectId(member))
        .map((member) => new Types.ObjectId(member))
    : [];

  const team = await Team.create({
    name: String(name).trim(),
    mascot: mascot ? String(mascot).trim() : 'Team',
    members: validMembers,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: Number(entry.totalPoints || 0),
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = String(userEmail ?? '').trim();
  const user = await User.findOne({ email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }).lean();

  if (!user) {
    throw notFound('User not found');
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const focusCandidates = [
    user.fitnessGoal,
    ...recentActivities.map((activity) => activity.type).filter(Boolean),
  ].filter((value): value is string => Boolean(value));

  const candidateFocus = focusCandidates[0] ?? 'general';
  const workouts = await Workout.find().sort({ focus: 1, title: 1 }).lean();
  const relevant = workouts.filter((workout) => workout.focus === candidateFocus || workout.focus === user.fitnessGoal);
  const suggestions = (relevant.length ? relevant : workouts).slice(0, 3).map((workout, index) => ({
    ...workout,
    reason:
      index === 0
        ? `Matches your ${candidateFocus} goal and recent activity patterns.`
        : `Builds on your ${candidateFocus} focus with a ${workout.difficulty} session.`,
  }));

  return suggestions;
}

export { User };
