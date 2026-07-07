
import chalk from 'chalk';

export function runStartupChecks() {
  console.log(chalk.bold.yellow('🚀 Running Kisan Alert Dashboard Startup Checks...'));

  let allKeysValid = true;

  // Check for Primary AI (Gemini)
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!geminiKey) {
    console.warn(
      chalk.yellow.bold('⚠️  Primary AI Warning:'),
      chalk.yellow('Gemini API key is not configured.')
    );
  } else {
     console.log(chalk.green('✅ Primary AI (Gemini) configured.'));
  }

  // Check for Fallback Providers
  const fallbackProviders = [
    { name: 'Groq', key: process.env.GROQ_API_KEY },
    { name: 'Mistral', key: process.env.MISTRAL_API_KEY },
    { name: 'HuggingFace', key: process.env.HUGGINGFACE_API_KEY },
  ];

  const availableFallbacks = fallbackProviders.filter(p => p.key);
  
  if (availableFallbacks.length === 0) {
    console.warn(
      chalk.yellow.bold('⚠️  Fallback AI Warning:'),
      chalk.yellow('No fallback AI providers (Groq, Mistral, HF) configured.')
    );
  } else {
    console.log(chalk.green(`✅ Fallback AI configured: ${availableFallbacks.map(p => p.name).join(', ')}`));
  }
  
  // Overall AI Status
  if (!geminiKey && availableFallbacks.length === 0) {
    console.log(chalk.red('❌ AI FEATURES DISABLED: No AI providers available. Check your .env file.'));
    allKeysValid = false;
  } else if (!geminiKey) {
    console.log(chalk.blue('ℹ️  Using fallback AI providers only.'));
  }

  // Check for Google Application Credentials (for Earth Engine)
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
     console.warn(
      chalk.yellow.bold('⚠️  Earth Engine Warning:'),
      chalk.yellow('GOOGLE_APPLICATION_CREDENTIALS_JSON is not configured.')
    );
    console.log(
      chalk.gray('   Satellite data processing via Google Earth Engine will not function.')
    );
    allKeysValid = false;
  } else {
     console.log(chalk.green('✅ Earth Engine (GEE) configured.'));
  }

  if (allKeysValid) {
    console.log(chalk.bold.green('🎉 All configurations are set up correctly!'));
  } else {
     console.log(chalk.bold.red('❌ Some configurations are missing. Please review the warnings above.'));
  }
}
