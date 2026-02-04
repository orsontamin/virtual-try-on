import { test, expect } from '@playwright/test';

test.describe('Virtual Try-On Wizard', () => {
  
  test('User completes the design and try-on flow', async ({ page }) => {
    // Mock the Vertex AI API call to ensure success
    // Using a regex to be safe with the URL structure
    await page.route(/.*:predict.*/, async route => {
      console.log('Mocking API call to:', route.request().url());
      // Add a small delay to simulate network latency and show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const json = {
        predictions: [
          {
            // Simple white 1x1 pixel base64
            bytesBase64Encoded: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=' 
          }
        ]
      };
      await route.fulfill({ 
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(json) 
      });
    });

    // 1. Given I am on the home page (Step 1: Pick a Shirt)
    await page.goto('/');
    await expect(page.getByText('AI Virtual Try-On Wizard')).toBeVisible();
    await expect(page.getByText('Step 1 of 4')).toBeVisible();

    // 2. When I select a shirt
    await page.locator('button[title="Green Tee"]').click();
    
    // 3. And I click "Next: Customize"
    await page.getByText('Next: Customize').click();

    // 4. Then I should be on Step 2 (Design)
    await expect(page.getByText('Step 2 of 4')).toBeVisible();
    await expect(page.getByText('Add Sticker')).toBeVisible();

    // 5. And I add a sticker
    await page.locator('.grid > button').first().click();

    // 6. When I click "Next"
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // 7. Then I should be on Step 3 (Upload)
    await expect(page.getByText('Step 3 of 4')).toBeVisible();

    // 8. When I upload a dummy photo
    const buffer = Buffer.from('fake-image-content');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"]').first().click({ force: true }); 
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'human.png',
      mimeType: 'image/png',
      buffer: buffer,
    });

    // 9. Then I should see the "Try On Now" button enabled
    const tryOnBtn = page.getByText('Try On Now');
    await expect(tryOnBtn).toBeEnabled();

    // 10. When I click "Try On Now"
    await tryOnBtn.click();

    // 11. Then I should see the loading state (Step 4)
    await expect(page.getByText('Step 4 of 4')).toBeVisible();
    await expect(page.getByText('Generating your Virtual Try-On...')).toBeVisible();

    // 12. And eventually I should see the result
    // Increase timeout for the AI result
    await expect(page.getByAltText('Result'), { timeout: 20000 }).toBeVisible();
    await expect(page.getByText('AI Generated')).toBeVisible();

    // 13. When I click "Design Another"
    await page.getByText('Design Another').click();

    // 14. Then I should be back at Step 1
    await expect(page.getByText('Step 1 of 4')).toBeVisible();
  });
});
