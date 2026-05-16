import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const defaultConfigs = [
  // General settings
  {
    group: "general",
    key: "site.name",
    value: "My Application",
    type: "string",
    label: "Site Name",
    description: "The name of your application",
    isSecret: false,
    sortOrder: 0,
  },
  {
    group: "general",
    key: "site.url",
    value: "http://localhost:3000",
    type: "string",
    label: "Site URL",
    description: "The base URL of your application",
    isSecret: false,
    sortOrder: 1,
  },
  {
    group: "general",
    key: "site.description",
    value: "",
    type: "string",
    label: "Site Description",
    description: "A brief description of your application",
    isSecret: false,
    sortOrder: 2,
  },

  // Auth settings
  {
    group: "auth",
    key: "registration.enabled",
    value: "true",
    type: "boolean",
    label: "Enable Registration",
    description: "Allow new users to register",
    isSecret: false,
    sortOrder: 0,
  },
  {
    group: "auth",
    key: "session.maxAge",
    value: "7",
    type: "number",
    label: "Session Max Age (days)",
    description: "Maximum session duration in days",
    isSecret: false,
    sortOrder: 1,
  },

  // SMTP settings
  {
    group: "smtp",
    key: "host",
    value: "",
    type: "string",
    label: "SMTP Host",
    description: "SMTP server hostname",
    isSecret: false,
    sortOrder: 0,
  },
  {
    group: "smtp",
    key: "port",
    value: "587",
    type: "number",
    label: "SMTP Port",
    description: "SMTP server port",
    isSecret: false,
    sortOrder: 1,
  },
  {
    group: "smtp",
    key: "user",
    value: "",
    type: "string",
    label: "SMTP Username",
    description: "SMTP authentication username",
    isSecret: false,
    sortOrder: 2,
  },
  {
    group: "smtp",
    key: "password",
    value: "",
    type: "string",
    label: "SMTP Password",
    description: "SMTP authentication password",
    isSecret: true,
    sortOrder: 3,
  },
  {
    group: "smtp",
    key: "from",
    value: "",
    type: "string",
    label: "From Email",
    description: "Email address used as sender",
    isSecret: false,
    sortOrder: 4,
  },
];

async function seed() {
  console.log("Seeding system configs...");

  for (const config of defaultConfigs) {
    await prisma.systemConfig.upsert({
      where: {
        group_key: {
          group: config.group,
          key: config.key,
        },
      },
      update: {},
      create: config,
    });
  }

  console.log(`Seeded ${defaultConfigs.length} default configurations.`);
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
