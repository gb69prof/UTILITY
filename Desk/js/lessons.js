import { db, uid } from "./db.js";

export async function createLesson(name) {
  const now = Date.now();
  const lesson = { id: uid("lesson"), name: name.trim(), itemIds: [], createdAt: now, modifiedAt: now };
  await db.putLesson(lesson);
  return lesson;
}

export async function duplicateLesson(lesson) {
  const copy = { ...lesson, id: uid("lesson"), name: `${lesson.name} — copia`, createdAt: Date.now(), modifiedAt: Date.now(), itemIds: [...lesson.itemIds] };
  await db.putLesson(copy);
  return copy;
}

export async function addItemToLesson(lesson, itemId) {
  if (!lesson.itemIds.includes(itemId)) lesson.itemIds.push(itemId);
  lesson.modifiedAt = Date.now();
  await db.putLesson(lesson);
  return lesson;
}

export async function removeItemFromLesson(lesson, itemId) {
  lesson.itemIds = lesson.itemIds.filter(id => id !== itemId);
  lesson.modifiedAt = Date.now();
  await db.putLesson(lesson);
  return lesson;
}

export async function moveLessonItem(lesson, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= lesson.itemIds.length) return lesson;
  [lesson.itemIds[index], lesson.itemIds[target]] = [lesson.itemIds[target], lesson.itemIds[index]];
  lesson.modifiedAt = Date.now();
  await db.putLesson(lesson);
  return lesson;
}
