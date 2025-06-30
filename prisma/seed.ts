import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'bob@test.com' },
    update: {},
    create: {
      email: 'bob@test.com',
      name: 'Bob Johnson',
    },
  });

  // Create posts
  await prisma.post.upsert({
    where: { id: 'post1' },
    update: {},
    create: {
      id: 'post1',
      title: 'Getting Started with Next.js',
      content: 'Next.js is a powerful React framework...',
      published: true,
      authorId: user1.id,
    },
  });

  await prisma.post.upsert({
    where: { id: 'post2' },
    update: {},
    create: {
      id: 'post2',
      title: 'Understanding TanStack Query',
      content: 'TanStack Query is a powerful data fetching library...',
      published: true,
      authorId: user2.id,
    },
  });

  await prisma.post.upsert({
    where: { id: 'post3' },
    update: {},
    create: {
      id: 'post3',
      title: 'Draft Post About Prisma',
      content: 'This is a draft post about Prisma...',
      published: false,
      authorId: user1.id,
    },
  });

  await prisma.post.upsert({
    where: { id: 'post4' },
    update: {},
    create: {
      id: 'post4',
      title: 'Advanced TypeScript Tips',
      content: 'Here are some advanced TypeScript techniques...',
      published: true,
      authorId: user3.id,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
