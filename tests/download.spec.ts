import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Expected hashes for downloaded GLTF files
const EXPECTED_HASHES = {
  'star.glb': 'a8c7f0847412c63234db81e87b8f406f94e6a6ef123b4a47838e7495695f0f55',
  'test-circle.glb': 'c55bd4c88a453f6b085639a63c910f453d4adf5bbc0d412b2aba63f0f2312b4d'
};

test('should download GLTF file when clicking Download file button', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  
  // Wait for the app to load - look for the download button
  await page.waitForSelector('button:has-text("Download file")', { timeout: 30000 });
  
  // Wait for the 3D scene to fully load
  await page.waitForTimeout(5000);
  
  // Set up download handling right before clicking
  const downloadPromise = page.waitForEvent('download');
  
  // Click the download button
  await page.click('button:has-text("Download file")');
  
  // Wait for download to start
  const download = await downloadPromise;
  
  // Verify the filename ends with .glb (default should be star.glb)
  expect(download.suggestedFilename()).toMatch(/\.glb$/);
  expect(download.suggestedFilename()).toBe('star.glb');
  
  // Save the file to verify it was downloaded
  const downloadsPath = path.join(process.cwd(), 'downloads');
  await fs.mkdir(downloadsPath, { recursive: true });
  const downloadPath = path.join(downloadsPath, download.suggestedFilename());
  
  await download.saveAs(downloadPath);
  
  // Verify the file exists and has content
  const stats = await fs.stat(downloadPath);
  expect(stats.size).toBeGreaterThan(0);
  
  // Calculate hash of the file
  const fileContent = await fs.readFile(downloadPath);
  const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
  
  // Verify the hash matches expected value
  expect(hash).toBe(EXPECTED_HASHES['star.glb']);
  
  // Clean up
  await fs.unlink(downloadPath);
});

test('should download GLTF file with custom filename when SVG is imported', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  
  // Wait for the app to load
  await page.waitForSelector('button:has-text("Download file")', { timeout: 10000 });
  
  // Create a simple SVG file for testing
  const testSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="none" stroke="black" stroke-width="2"/>
</svg>`;
  
  // Find and click the Import button
  await page.click('button:has-text("Import")');
  
  // Upload the SVG file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'test-circle.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(testSvg)
  });
  
  // Wait a bit for the file to be processed
  await page.waitForTimeout(1000);
  
  // Set up download handling right before clicking
  const downloadPromise = page.waitForEvent('download');
  
  // Click the download button
  await page.click('button:has-text("Download file")');
  
  // Wait for download to start
  const download = await downloadPromise;
  
  // Verify the filename matches the imported SVG name (with .glb extension)
  expect(download.suggestedFilename()).toBe('test-circle.glb');
  
  // Save the file to verify it was downloaded
  const downloadsPath = path.join(process.cwd(), 'downloads');
  await fs.mkdir(downloadsPath, { recursive: true });
  const downloadPath = path.join(downloadsPath, download.suggestedFilename());
  
  await download.saveAs(downloadPath);
  
  // Verify the file exists and has content
  const stats = await fs.stat(downloadPath);
  expect(stats.size).toBeGreaterThan(0);
  
  // Calculate hash of the file
  const fileContent = await fs.readFile(downloadPath);
  const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
  
  // Verify the hash matches expected value
  expect(hash).toBe(EXPECTED_HASHES['test-circle.glb']);
  
  // Clean up
  await fs.unlink(downloadPath);
});