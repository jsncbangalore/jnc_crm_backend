const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Load .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Support command-line arguments:
// node create_user.js [companyCode] [employeeCode] [email] [password] [name]
const args = process.argv.slice(2);

const companyCode = (args[0] || process.env.BOOTSTRAP_COMPANY_CODE || 'JNC-SA-001').trim();
const employeeCode = (args[1] || process.env.BOOTSTRAP_USER_CODE || 'ADMIN01').trim().toUpperCase();
const email = (args[2] || process.env.BOOTSTRAP_USER_EMAIL || 'admin@jsnc.co.in').trim().toLowerCase();
const password = (args[3] || process.env.BOOTSTRAP_USER_PASSWORD || 'Admin@12345').trim();
const name = (args[4] || process.env.BOOTSTRAP_USER_NAME || 'Super Administrator').trim();
const companyName = (process.env.BOOTSTRAP_COMPANY_NAME || 'JS Communication').trim();

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🚀 JNC-CRM USER CREATION / SEED UTILITY');
  console.log('====================================================');
  console.log(`Company Code   : ${companyCode}`);
  console.log(`User ID / Code : ${employeeCode}`);
  console.log(`Email          : ${email}`);
  console.log(`Name           : ${name}`);
  console.log('====================================================\n');

  // 1. Ensure Tenant exists
  console.log(`1. Checking Tenant [${companyCode}]...`);
  let tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { code: { equals: companyCode, mode: 'insensitive' } },
        { slug: { equals: companyCode.toLowerCase(), mode: 'insensitive' } },
      ],
    },
  });

  if (!tenant) {
    console.log(`   Tenant not found. Creating tenant [${companyCode}] (${companyName})...`);
    tenant = await prisma.tenant.create({
      data: {
        code: companyCode.toUpperCase(),
        name: companyName,
        slug: companyCode.toLowerCase(),
        status: 'active',
        planTier: 'enterprise',
        maxUsers: 50,
        currency: 'INR',
      },
    });
    console.log(`   ✅ Tenant created: ${tenant.name} [ID: ${tenant.id}]`);
  } else {
    console.log(`   ✅ Found existing tenant: ${tenant.name} [ID: ${tenant.id}, status: ${tenant.status}]`);
    if (tenant.status !== 'active') {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'active' },
      });
      console.log(`   ✅ Activated tenant status.`);
    }
  }

  // 2. Hash Password
  console.log(`\n2. Hashing password...`);
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Upsert User
  console.log(`3. Upserting user [${email}] under tenant [${tenant.id}]...`);
  const existingUser = await prisma.user.findFirst({
    where: {
      tenantId: tenant.id,
      OR: [
        { email: { equals: email, mode: 'insensitive' } },
        { employeeCode: { equals: employeeCode, mode: 'insensitive' } },
      ],
    },
  });

  let user;
  if (existingUser) {
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        employeeCode,
        name,
        email,
        passwordHash,
        role: 'tenant_admin',
        isActive: true,
        mustResetPassword: false,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });
    console.log(`   ✅ Updated existing user record [ID: ${user.id}]`);
  } else {
    user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        employeeCode,
        name,
        email,
        passwordHash,
        role: 'tenant_admin',
        isActive: true,
        mustResetPassword: false,
      },
    });
    console.log(`   ✅ Created new user record [ID: ${user.id}]`);
  }

  console.log('\n====================================================');
  console.log('🎉 USER READY FOR LOGIN!');
  console.log('====================================================');
  console.log(`Company Code   : ${tenant.code}`);
  console.log(`User ID / Email: ${user.employeeCode}  or  ${user.email}`);
  console.log(`Password       : ${password}`);
  console.log(`Role           : ${user.role}`);
  console.log(`Active Status  : ${user.isActive ? 'Active' : 'Inactive'}`);
  console.log('====================================================\n');
}

main()
  .catch((err) => {
    console.error('\n❌ FAILED TO CREATE USER:');
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
