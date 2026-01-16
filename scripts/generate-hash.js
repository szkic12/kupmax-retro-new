#!/usr/bin/env node
/**
 * KUPMAX Admin Password Hash Generator
 *
 * Uruchom: node scripts/generate-hash.js
 *
 * Wygeneruje hash dla Twojego hasła.
 * Hash wstaw do Vercel ENV, hasło zapisz w zeszycie.
 */

const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Funkcja hashująca (ta sama co w API)
function hashPassword(password, salt) {
  return crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');
}

console.log('\n🔐 KUPMAX Admin Password Hash Generator\n');
console.log('=' .repeat(50));

rl.question('Podaj hasło do zahashowania: ', (password) => {
  if (!password || password.length < 8) {
    console.log('\n❌ Hasło musi mieć minimum 8 znaków!\n');
    rl.close();
    return;
  }

  // Generuj losową sól
  const salt = crypto.randomBytes(16).toString('hex');

  // Hashuj hasło
  const hash = hashPassword(password, salt);

  // Połącz sól i hash (format: salt:hash)
  const fullHash = `${salt}:${hash}`;

  console.log('\n' + '=' .repeat(50));
  console.log('✅ HASH WYGENEROWANY!\n');
  console.log('📋 Skopiuj ten hash do Vercel ENV:');
  console.log('-'.repeat(50));
  console.log(fullHash);
  console.log('-'.repeat(50));
  console.log('\n📝 Zapisz w zeszycie:');
  console.log(`   Hasło: ${password}`);
  console.log(`   Hash: ${fullHash.substring(0, 20)}...`);
  console.log('\n⚠️  NIGDY nie zapisuj hasła w plikach projektu!');
  console.log('=' .repeat(50) + '\n');

  rl.close();
});
