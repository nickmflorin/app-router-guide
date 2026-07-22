// Dev-only deck store: slides and the content references placed on them. Stores
// only references (page + contentRef); slide content is resolved from the live
// document at dev/build time, never copied here.

import { prisma } from './db.mjs';
import { SlideLayout, assertLayout } from './deck-enums.mjs';

function itemToWire(i) {
  return {
    id: i.id,
    slideId: i.slideId,
    page: i.page,
    contentRef: i.contentRef,
    order: i.order,
    included: i.included,
  };
}

function slideToWire(s) {
  return {
    id: s.id,
    order: s.order,
    title: s.title ?? undefined,
    layout: s.layout,
    items: (s.items ?? []).map(itemToWire),
  };
}

export async function listDeck() {
  const slides = await prisma.slide.findMany({
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  });
  return slides.map(slideToWire);
}

export async function upsertSlide(s) {
  const data = {
    order: Number.isFinite(s.order) ? s.order : 0,
    title: s.title ?? null,
    layout: assertLayout(s.layout ?? SlideLayout.Free),
  };
  const row = await prisma.slide.upsert({
    where: { id: s.id },
    create: { id: s.id, ...data },
    update: data,
    include: { items: { orderBy: { order: 'asc' } } },
  });
  return slideToWire(row);
}

export async function upsertItem(i) {
  const data = {
    slideId: i.slideId,
    page: i.page,
    contentRef: i.contentRef,
    order: Number.isFinite(i.order) ? i.order : 0,
    included: i.included !== false,
  };
  const row = await prisma.slideItem.upsert({
    where: { id: i.id },
    create: { id: i.id, ...data },
    update: data,
  });
  return itemToWire(row);
}

export async function deleteSlide(id) {
  await prisma.slide.delete({ where: { id } }).catch(() => {});
}

export async function deleteItem(id) {
  await prisma.slideItem.delete({ where: { id } }).catch(() => {});
}
