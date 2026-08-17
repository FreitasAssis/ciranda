// @ts-check
import { defineConfig, devices } from '@playwright/test';

const PORTA = 4173;
const ENDERECO = `http://localhost:${PORTA}`;

export default defineConfig({
  testDir: './testes',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: ENDERECO,
    trace: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // A Ciranda toca som sozinha depois do clique em "Iniciar
          // exibição". Sem isto o Chrome segura o autoplay no teste.
          args: ['--autoplay-policy=no-user-gesture-required']
        }
      }
    }
  ],

  webServer: {
    command: 'node testes/servidor.mjs',
    url: ENDERECO,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore'
  }
});
